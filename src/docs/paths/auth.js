import authSchemas from "../schemas/authSchema.js";
import swaggerCommonResponses from "../schemas/swaggerCommonResponses.js";
import usuariosSchemas from "../schemas/usuariosSchema.js";

const authRoutes = {
    "/login": {
        post: {
            tags: ["Auth"],
            summary: "Autentica usuário e emite tokens JWT",
            description: `
            + Caso de uso: Autenticação de usuários e emissão de tokens JWT.

            + Função de Negócio
                - Permitir que os usuários (ou sistemas externos) entrem no sistema e obtenham acesso às funcionalidades internas.
                + Recebe credenciais (email e senha) no corpo da requisição.
                    - Se as credenciais estiverem corretas e o usuário for ativo:
                    - Gera um **accessToken** (expiração: 15 minutos; algoritmo: HS256).
                    - Gera um **refreshToken** (expiração: 7 dias) e o armazena em lista de tokens válidos.
                    - Retorna um objeto contendo { accessToken, refreshToken, user }.
            
            + Regras de Negócio Envolvidas:
                - Aplica rate-limit e contagem de tentativas falhas para prevenir brute-force.
                - Se o usuário estiver bloqueado ou inativo, retorna 401 Unauthorized.
                - Auditoria de login deve registrar sucesso/fracasso sem expor senha.

            + Resultado Esperado:
                - Retorno dos tokens de acesso e refresh (se aplicável).
                - Dados básicos do usuário, como nome, status (ativo/inativo) e outras informações relevantes ao contexto de negócio.
      `,
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { "$ref": "#/components/schemas/loginPost" }
                    }
                }
            },
            responses: {
                200: swaggerCommonResponses[200]("#/components/schemas/UsuarioRespostaLogin"),
                400: swaggerCommonResponses[400](),    // Requisição malformada
                401: swaggerCommonResponses[401](),    // Credenciais inválidas
                422: swaggerCommonResponses[422](),    // Erro de validação de dados
                498: swaggerCommonResponses[498](),    // Token expirado
                500: swaggerCommonResponses[500]()     // Erro interno
            }
        }
    },

    "/recover": {
        post: {
            tags: ["Auth"],
            summary: "Solicita envio de e-mail para recuperação de senha",
            description: `
            + Caso de uso: Iniciar fluxo de redefinição de senha via e-mail.
            
            + Função de Negócio:
                - Permitir ao usuário solicitar link seguro para redefinição de senha.
                + Recebe { email } no corpo da requisição.
                    - Gera um token de redefinição com validade de 1 hora.
                    - Envia e-mail com link para redefinição de senha.
                    - Retorna 200 OK sem diferenciar se o e-mail existe (para segurança).
            
            + Regras de Negócio Adicionais:
                - Template de e-mail deve usar URL configurável (frontend/backoffice).
                - Registrar tentativa de recuperação (timestamp, IP).
                - Se envio de e-mail falhar, retorna 500 Internal Server Error.
            
            + Resultado Esperado:
                - Retorno 200 OK com mensagem de sucesso: E-mail enviado com link de redefinição de senha.
      `,
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { "$ref": "#/components/schemas/RequisicaoRecuperaSenha" }
                    }
                }
            },
            responses: {
                200: swaggerCommonResponses[200]("#/components/schemas/RespostaRecuperaSenha"),
                400: swaggerCommonResponses[400](),
                422: swaggerCommonResponses[422](),    // Erro de validação
                500: swaggerCommonResponses[500]()
            }
        }
    },

    "/signup": {
        post: {
            tags: ["Auth"],
            summary: "Registra novo usuário no sistema",
            description: `
            + Caso de uso: Criação própria conta no sistema.
            
            + Função de Negócio:
                - Permitir que novos usuários se registrem, criando uma conta com dados básicos.
                + Recebe no corpo da requisição:
                    - Objeto conforme schema **signupPost**, contendo campos como nome, email, senha, etc.

            + Regras de Negócio:
                - Validação de campos obrigatórios (nome, email e senha).  
                - Verificação de unicidade para campos únicos (email).  
                - Definição de status inicial como 'ativo' de acordo com o fluxo de cadastro.  
                - Em caso de duplicidade ou erro de validação, retorna erro apropriado.

            + Resultado Esperado:
                - HTTP 201 Created com corpo conforme **signupPostDetalhes**, contendo todos os dados do usuário criado.            
        `,
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { "$ref": "#/components/schemas/signupPost" }
                    }
                }
            },
            responses: {
                201: swaggerCommonResponses[201]("#/components/schemas/signupPostDetalhes"),
                400: swaggerCommonResponses[400](),
                422: swaggerCommonResponses[422](),    // Erro de validação
                409: swaggerCommonResponses[409](),    // Conflito (email já existe)
                500: swaggerCommonResponses[500]()
            }
        }
    },

    "/logout": {
        post: {
            tags: ["Auth"],
            summary: "Encerra sessão e invalida access token",
            description: `
            + Caso de uso: Logout de usuário e revogação de token de acesso.
            
            + Função de Negócio:
                - Permitir ao usuário encerrar a sessão corrente e impedir o uso futuro do mesmo token.

            + Recebe o accessToken via:
                - Header Authorization: Bearer <token> (preferencial)
                - Body: { "accesstoken": "<token>" } (alternativo)
            
            + Fluxo:
                - Valida accessToken e revoga ao excluir da base de dados, impedindo usos futuros.
                - Invalida sessão corrente.
                - Endpoint idempotente: se já revogado, continua retornando 200 OK.

            + Resultado Esperado:
                - HTTP 200 OK com mensagem de sucesso do logout.
      `,
            security: [{ bearerAuth: [] }],
            requestBody: {
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                accesstoken: {
                                    type: "string",
                                    description: "Token de acesso a ser revogado (opcional, pode vir do header Authorization)",
                                    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                200: swaggerCommonResponses[200](),
                400: swaggerCommonResponses[400](),
                401: swaggerCommonResponses[401](),
                498: swaggerCommonResponses[498](),
                500: swaggerCommonResponses[500]()
            }
        }
    },

    "/refresh": {
        post: {
            tags: ["Auth"],
            summary: "Gera novo access token usando refresh token",
            description: `
            + Caso de uso: Renovação de access token através do refresh token.
            
            + Função de Negócio:
                - Permitir renovação automática de sessão sem necessidade de novo login.
                + Recebe refresh token válido no corpo da requisição.
                    - Valida o refresh token.
                    - Gera novo access token com nova expiração.
                    - Retorna novo access token mantendo o refresh token.

            + Regras de Negócio:
                - Refresh token deve estar válido e não expirado.
                - Usuário deve estar ativo no sistema.
                - Access token anterior é invalidado.

            + Resultado Esperado:
                - HTTP 200 OK com novo access token.
      `,
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                refresh_token: {
                                    type: "string",
                                    description: "Token de refresh JWT válido",
                                    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                                }
                            },
                            required: ["refresh_token"]
                        }
                    }
                }
            },
            responses: {
                200: swaggerCommonResponses[200]("#/components/schemas/RespostaRefresh"),
                400: swaggerCommonResponses[400](),
                401: swaggerCommonResponses[401](),
                498: swaggerCommonResponses[498](),
                500: swaggerCommonResponses[500]()
            }
        }
    },

    "/password/reset/token": {
        patch: {
            tags: ["Auth"],
            summary: "Atualiza a senha do usuário usando token de recuperação",
            description: `
            + Caso de uso: Permite que o usuário atualize sua senha usando token de recuperação.
            
            + Função de Negócio:
                - Recebe o token de recuperação de senha (via query parameter).
                - Valida o token e permite a atualização da senha.
                + Recebe:
                    - token: na URL como query parameter (?token=...).
                    - senha: nova senha no corpo da requisição.

            + Regras de Negócio:
                - Verificar se o token é válido e não expirado.
                - Token deve ter sido gerado através da rota /recover.
                - Senha deve atender aos critérios de segurança.
                - Após atualização, token é invalidado.

            + Resultado Esperado:
                - HTTP 200 OK com mensagem de sucesso.
      `,
            parameters: [
                {
                    name: "token",
                    in: "query",
                    required: true,
                    schema: {
                        type: "string"
                    },
                    description: "Token de recuperação de senha"
                }
            ],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                senha: {
                                    type: "string",
                                    description: "Nova senha do usuário",
                                    example: "MinhaNovaSenh@123"
                                }
                            },
                            required: ["senha"]
                        }
                    }
                }
            },
            responses: {
                200: {
                    description: "Senha atualizada com sucesso",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    error: { type: "boolean", example: false },
                                    code: { type: "integer", example: 200 },
                                    message: { 
                                        type: "string", 
                                        example: "Senha atualizada com sucesso." 
                                    },
                                    data: { type: "object", nullable: true, example: null },
                                    errors: { type: "array", example: [] }
                                }
                            }
                        }
                    }
                },
                400: swaggerCommonResponses[400](),
                401: swaggerCommonResponses[401](),
                498: swaggerCommonResponses[498](),
                500: swaggerCommonResponses[500]()
            }
        }
    }
};

export default authRoutes;
