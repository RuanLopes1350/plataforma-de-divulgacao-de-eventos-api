// src/middlewares/AuthMiddleware.js
import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import AuthenticationError from '../utils/errors/AuthenticationError.js';
import TokenExpiredError from '../utils/errors/TokenExpiredError.js';
import { CustomError } from '../utils/helpers/index.js';
import AuthService from '../services/AuthService.js';

class AuthMiddleware {
  constructor() {
    this.service = new AuthService();
    // Garante que o 'this' do método se mantenha ao usá-lo como callback
    this.handle = this.handle.bind(this);
  }

  /**
   * Extrai o token e devolve { token, secret }
   * - Authorization: Bearer <token>          → JWT_SECRET_ACCESS_TOKEN
   * - body.token                             → JWT_SECRET_ACCESS_TOKEN
   * - query.token                            → JWT_SECRET_PASSWORD_RECOVERY
   */
  _getTokenAndSecret(req, requisicaoTotem = false) {
    // 1. Header Authorization ───────────────────────────────
    const authHeader = req.headers?.authorization ?? null;
    if(authHeader) {
      // Permite “Bearer <token>” ou apenas o token cru
      const parts = authHeader.split(' ');
      const token = parts.length === 2 ? parts[1] : parts[0];
      return { 
        token,
        secret: process.env.JWT_SECRET_ACCESS_TOKEN
      };
    }
    
    // 2. Query String (para recuperação de senha) ────────────────
    if(req.query?.token) {
      return {
        token: req.query.token,
        secret: process.env.JWT_SECRET_PASSWORD_RECOVERY
      }
    }

    // 3. Autenticação opcional, retorna null se não encontrar nada (Somente rotas GET de eventos - lógica pensada para o totem) ────────────────
    if (requisicaoTotem) {
      return null;
    }
    
    // 4. Nas rotas onde a autenticação é obrigatória, se nada for encontrado, lança erro ────────────────
    throw new AuthenticationError("Token não informado!");
  }

  // Função auxiliar para enriquecer os dados do usuário na requisição para uso em outras partes da aplicação
  async _userData(req, userId) {
    const usuario = await this.service.repository.listarPorId(userId);
    
    if (usuario) {
      req.user = {
        _id: usuario._id.toString(),
        nome: usuario.nome,
        email: usuario.email,
      };
      req.user_id = userId;
      return true;
    }
    
    return false;
  }

  async handle(req, res, next) {
    try {
      const isGetEventMethod = req.method === 'GET' && req.path.startsWith('/eventos');

      // Se for um GET do totem para eventos, não requer autenticação
      if(isGetEventMethod) {
        // Tenta obter token opcional (não lança erro se não existir)
        const tokenAndSecret = this._getTokenAndSecret(req, true);
        
        if(tokenAndSecret) {
          try {
            const { token, secret } = tokenAndSecret;
            const decoded = await promisify(jwt.verify)(token, secret);

            if(decoded?.id) {
              const tokenData = await this.service.carregatokens(decoded.id);

              if (!tokenData?.data?.accesstoken) {
                req.user = null;
                req.user_id = null;
                return next();
              }              // Se o token for válido, enriquece os dados do usuário
              await this._userData(req, decoded.id);
            }
          } catch (err) {
            // Token inválido em GET público é ignorado e segue pois a requisição é liberada para o totem
          }
        }
        return next();
      }
      
      // Para todas as outras rotas, requer autenticação obrigatória
      const { token, secret } = this._getTokenAndSecret(req);

      // Verifica e decodifica o token
      const decoded = await promisify(jwt.verify)(token, secret);
      
      // Se falhou a verificação, jwt.verify já lança JsonWebTokenError / TokenExpiredError
      // porém incluímos este “if” por segurança contra valores falsy   
      if (!decoded) {
        throw new TokenExpiredError("Token JWT expirado, tente novamente.");
      }

      /**
       * Caso seja um token de acesso normal, verificamos se o refresh token
       * continua válido no banco. Se for um token de recuperação de senha,
       * essa checagem não é necessária.
       */

      if(secret === process.env.JWT_SECRET_ACCESS_TOKEN) {
        // Verifica se o refreshtoken está presente no banco de dados e se é válido
        const tokenData = await this.service.carregatokens(decoded.id);

        if (!tokenData?.data?.refreshtoken) {
          throw new CustomError({
            statusCode: 401,
            errorType: 'unauthorized',
            field: 'Token',
            details: [],
            customMessage: 'Refresh token inválido, autentique novamente!'
          });
        }
      }      
      
      // Token válido → enriquece os dados do usuário
      const usuario = await this._userData(req, decoded.id);

      if (!usuario) {
        throw new CustomError({
          statusCode: 401,
          errorType: 'unauthorized',
          field: 'Token',
          details: [],
          customMessage: 'Usuário não encontrado!'
        });
      }
      
      next();

    } catch (err) {
      if (err.name === 'JsonWebTokenError') {
        return next(new AuthenticationError('Token JWT inválido!'));
      }
      if (err.name === 'TokenExpiredError') {
        return next(new TokenExpiredError('Token JWT expirado, faça login novamente.'));
      }
      // Outros erros seguem para o errorHandler global
      return next(err);
    }
  }
}

// Exportar apenas a função middleware já vinculada
export default new AuthMiddleware().handle;