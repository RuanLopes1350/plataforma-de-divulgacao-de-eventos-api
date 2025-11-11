// src/middlewares/AdminMiddleware.js
import { CustomError, HttpStatusCodes } from '../utils/helpers/index.js';

// Middleware para verificar se o usuário autenticado é um administrador.
// IMPORTANTE: Este middleware DEVE ser usado APÓS o AuthMiddleware,
const AdminMiddleware = (req, res, next) => {
    try {
        // Verifica se o usuário está autenticado (req.user deve existir)
        if (!req.user) {
            throw new CustomError({
                statusCode: HttpStatusCodes.UNAUTHORIZED.code,
                errorType: 'unauthorized',
                field: 'authentication',
                details: [{ path: 'user', message: 'Usuário não autenticado.' }],
                customMessage: 'Você precisa estar autenticado para acessar este recurso.'
            });
        }

        // Verifica se o usuário é admin
        if (req.user.admin !== true) {
            throw new CustomError({
                statusCode: HttpStatusCodes.FORBIDDEN.code,
                errorType: 'forbidden',
                field: 'authorization',
                details: [{ path: 'admin', message: 'Acesso negado. Apenas administradores podem realizar esta ação.' }],
                customMessage: 'Acesso negado. Você não tem permissão para realizar esta ação.'
            });
        }

        // Usuário é admin, pode prosseguir
        next();
    } catch (error) {
        return next(error);
    }
};

export default AdminMiddleware;
