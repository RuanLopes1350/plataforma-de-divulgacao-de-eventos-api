import usuariosSchemas from "../schemas/usuariosSchema.js";
import swaggerCommonResponses from "../schemas/swaggerCommonResponses.js";

const usuariosRoutes = {
    "/usuarios": {
        post: {
            tags: ["Usuários"],
            summary: "Cria um novo usuário",
            description: `
            + Caso de uso: Criação de usuário por administrador (Caso no futuro haja implementação de administrador master).
        
            + Função de Negócio:
                - Permitir ao front-end, criar novos usuários no sistema.
                + Recebe no corpo da requisição:
                    - Objeto conforme schema **UsuarioPost**, contendo campos como nome, email, senha, etc.
        
            + Regras de Negócio:
                - Validação de campos obrigatórios (nome, email, senha).
                - Verificação de unicidade para o email.
                - Senha é criptografada antes do armazenamento.
                - Status inicial é definido como 'ativo'.
                - Senha é removida da resposta por segurança.
            
            + Resultado Esperado:
                - HTTP 201 Created com corpo conforme **UsuarioDetalhes**, contendo dados do usuário criado (sem senha).`,
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { "$ref": "#/components/schemas/UsuarioPost" }
                    }
                }
            },
            responses: {
                201: {
                    description: "Usuário criado com sucesso",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    error: { type: "boolean", example: false },
                                    code: { type: "integer", example: 201 },
                                    message: { type: "string", example: "Recurso criado com sucesso" },
                                    data: { "$ref": "#/components/schemas/UsuarioDetalhes" },
                                    errors: { type: "array", example: [] }
                                }
                            }
                        }
                    }
                },
                400: {
                    description: "Erro de validação",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    error: { type: "boolean", example: true },
                                    code: { type: "integer", example: 400 },
                                    message: { type: "string", example: "Requisição com sintaxe incorreta" },
                                    data: { type: "object", nullable: true, example: null },
                                    errors: {
                                        type: "array",
                                        example: [{ message: "Email já está em uso." }]
                                    }
                                }
                            },
                            examples: {
                                email_ja_existe: {
                                    summary: "Email já em uso",
                                    value: {
                                        error: true,
                                        code: 400,
                                        message: "Requisição com sintaxe incorreta",
                                        data: null,
                                        errors: [{ message: "Email já está em uso." }]
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        get: {
            tags: ["Usuários"],
            summary: "Lista todos os usuários",
            description: `
        + Caso de uso: Listagem de usuários para gerenciamento e consulta.
        
        + Função de Negócio:
            - Permitir ao front-end, obter uma lista de usuários cadastrados.
            + Não possui parâmetros específicos, retorna todos os usuários ativos.

        + Regras de Negócio:
            - Apenas usuários autenticados podem acessar esta rota.
            - Senhas são removidas da resposta por segurança.
            - Retorna dados básicos dos usuários (ID, nome, email, status).
        
        + Resultado Esperado:
            - HTTP 200 OK com lista de usuários conforme **UsuarioDetalhes**.
        `,
            security: [{ bearerAuth: [] }],
            responses: {
                200: {
                    description: "Lista de usuários obtida com sucesso",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    error: { type: "boolean", example: false },
                                    code: { type: "integer", example: 200 },
                                    message: { type: "string", example: "Requisição bem-sucedida" },
                                    data: {
                                        type: "array",
                                        items: { "$ref": "#/components/schemas/UsuarioDetalhes" }
                                    },
                                    errors: { type: "array", example: [] }
                                }
                            }
                        }
                    }
                },
                401: swaggerCommonResponses[401](),
                498: swaggerCommonResponses[498](),
                500: swaggerCommonResponses[500]()
            }
        },
        401: swaggerCommonResponses[401](),
        498: swaggerCommonResponses[498](),
        500: swaggerCommonResponses[500]()
    },
    "/usuarios/{id}": {
        get: {
            tags: ["Usuários"],
            summary: "Obtém detalhes de um usuário",
            description: `
            + Caso de uso: Consulta de detalhes de usuário específico.
            
            + Função de Negócio:
                - Permitir ao front-end obter todas as informações de um usuário cadastrado.
                + Recebe como path parameter:
                    - **id**: identificador do usuário (MongoDB ObjectId).

            + Regras de Negócio:
                - Validação do formato do ID.
                - Verificar existência do usuário.
                - Senha é removida da resposta por segurança.
                - Checar permissões do solicitante para visualizar dados.

            + Resultado Esperado:
                - HTTP 200 OK com corpo conforme **UsuarioDetalhes**, contendo dados completos do usuário.
        `,
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: "id",
                    in: "path",
                    required: true,
                    schema: { type: "string" },
                    description: "ID único do usuário"
                }
            ],
            responses: {
                200: {
                    description: "Detalhes do usuário obtidos com sucesso",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    error: { type: "boolean", example: false },
                                    code: { type: "integer", example: 200 },
                                    message: { type: "string", example: "Requisição bem-sucedida" },
                                    data: { "$ref": "#/components/schemas/UsuarioDetalhes" },
                                    errors: { type: "array", example: [] }
                                }
                            }
                        }
                    }
                },
                400: swaggerCommonResponses[400](),
                401: swaggerCommonResponses[401](),
                404: {
                    description: "Usuário não encontrado",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    error: { type: "boolean", example: true },
                                    code: { type: "integer", example: 404 },
                                    message: { type: "string", example: "Não encontrado" },
                                    data: { type: "object", nullable: true, example: null },
                                    errors: {
                                        type: "array",
                                        example: [{ message: "Usuário não encontrado." }]
                                    }
                                }
                            },
                            examples: {
                                usuario_nao_encontrado: {
                                    summary: "Usuário não encontrado",
                                    value: {
                                        error: true,
                                        code: 404,
                                        message: "Não encontrado",
                                        data: null,
                                        errors: [{ message: "Usuário não encontrado." }]
                                    }
                                }
                            }
                        }
                    }
                },
                498: swaggerCommonResponses[498](),
                500: swaggerCommonResponses[500]()
            }
        },
        patch: {
            tags: ["Usuários"],
            summary: "Atualiza um usuário (PATCH)",
            description: `
            + Caso de uso: Atualização parcial de dados do usuário.
            
            + Função de Negócio:
                - Permitir modificar os campos desejados de um usuário.
                + Recebe:
                    - **id** no path.  
                    - No corpo, objeto conforme **UsuarioPutPatch** com os campos a alterar.

            + Regras de Negócio:
                - Garantir unicidade de campos como email.
                - Email não pode ser alterado (é proibido).
                - Senha não pode ser alterada por esta rota.
                - Aplicar imediatamente alterações críticas (ex.: desativação inibe login).
                - Senha é removida da resposta por segurança.

            + Resultado Esperado:
                - HTTP 200 OK com corpo conforme **UsuarioDetalhes**, refletindo as alterações.
        `,
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: "id",
                    in: "path",
                    required: true,
                    schema: { type: "string" },
                    description: "ID único do usuário"
                }
            ],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { "$ref": "#/components/schemas/UsuarioPutPatch" }
                    }
                }
            },
            responses: {
                200: {
                    description: "Usuário atualizado com sucesso",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    error: { type: "boolean", example: false },
                                    code: { type: "integer", example: 200 },
                                    message: { type: "string", example: "Usuário atualizado com sucesso." },
                                    data: { "$ref": "#/components/schemas/UsuarioDetalhes" },
                                    errors: { type: "array", example: [] }
                                }
                            }
                        }
                    }
                },
                400: swaggerCommonResponses[400](),
                401: swaggerCommonResponses[401](),
                404: {
                    description: "Usuário não encontrado",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    error: { type: "boolean", example: true },
                                    code: { type: "integer", example: 404 },
                                    message: { type: "string", example: "Não encontrado" },
                                    data: { type: "object", nullable: true, example: null },
                                    errors: {
                                        type: "array",
                                        example: [{ message: "Recurso não encontrado em Usuario." }]
                                    }
                                }
                            },
                            examples: {
                                usuario_nao_encontrado: {
                                    summary: "Usuário não encontrado para atualização",
                                    value: {
                                        error: true,
                                        code: 404,
                                        message: "Não encontrado",
                                        data: null,
                                        errors: [{ message: "Recurso não encontrado em Usuario." }]
                                    }
                                }
                            }
                        }
                    }
                },
                498: swaggerCommonResponses[498](),
                500: swaggerCommonResponses[500]()
            }
        }
    },
    "/usuarios/{id}/status": {
        patch: {
            tags: ["Usuários"],
            summary: "Atualiza o status de um usuário",
            description: `
            + Caso de uso: Ativação/desativação de usuário.
            
            + Função de Negócio:
                - Permitir alterar o status de um usuário e também para caso de "exclusão" de usuário(ativo/inativo).
                + Recebe:
                    - **id** no path.
                    - **status** no corpo da requisição.

            + Regras de Negócio:
                - Apenas valores 'ativo' ou 'inativo' são permitidos.
                - Usuário inativo não pode fazer login.
                - Mudança de status é registrada no sistema.
                - Ao usuário "excluir" (inativar), não remove do banco, apenas altera o status.

            + Resultado Esperado:
                - HTTP 200 OK com mensagem de confirmação da mudança de status.
        `,
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: "id",
                    in: "path",
                    required: true,
                    schema: { type: "string" },
                    description: "ID único do usuário"
                }
            ],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { "$ref": "#/components/schemas/UsuarioStatusUpdate" }
                    }
                }
            },
            responses: {
                200: {
                    description: "Status do usuário atualizado com sucesso",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    error: { type: "boolean", example: false },
                                    code: { type: "integer", example: 200 },
                                    message: { type: "string", example: "Status do usuário atualizado para inativo." },
                                    data: { "$ref": "#/components/schemas/UsuarioDetalhes" },
                                    errors: { type: "array", example: [] }
                                }
                            },
                            examples: {
                                status_ativado: {
                                    summary: "Status atualizado para ativo",
                                    value: {
                                        error: false,
                                        code: 200,
                                        message: "Status do usuário atualizado para ativo.",
                                        data: {
                                            _id: "507f1f77bcf86cd799439011",
                                            nome: "João Silva",
                                            email: "joao@exemplo.com",
                                            status: "ativo",
                                            createdAt: "2025-07-08T21:32:36.184Z",
                                            updatedAt: "2025-07-08T21:32:36.184Z"
                                        },
                                        errors: []
                                    }
                                },
                                status_desativado: {
                                    summary: "Status atualizado para inativo",
                                    value: {
                                        error: false,
                                        code: 200,
                                        message: "Status do usuário atualizado para inativo.",
                                        data: {
                                            _id: "507f1f77bcf86cd799439011",
                                            nome: "João Silva",
                                            email: "joao@exemplo.com",
                                            status: "inativo",
                                            createdAt: "2025-07-08T21:32:36.184Z",
                                            updatedAt: "2025-07-08T21:32:36.184Z"
                                        },
                                        errors: []
                                    }
                                }
                            }
                        }
                    }
                },
                400: {
                    description: "Erro de validação",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    error: { type: "boolean", example: true },
                                    code: { type: "integer", example: 400 },
                                    message: { type: "string", example: "Requisição com sintaxe incorreta" },
                                    data: { type: "object", nullable: true, example: null },
                                    errors: {
                                        type: "array",
                                        example: [{ message: "Status inválido. Use \"ativo\" ou \"inativo\"." }]
                                    }
                                }
                            },
                            examples: {
                                status_invalido: {
                                    summary: "Status inválido",
                                    value: {
                                        error: true,
                                        code: 400,
                                        message: "Requisição com sintaxe incorreta",
                                        data: null,
                                        errors: [{ message: "Status inválido. Use \"ativo\" ou \"inativo\"." }]
                                    }
                                }
                            }
                        }
                    }
                },
                401: swaggerCommonResponses[401](),
                404: {
                    description: "Usuário não encontrado",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    error: { type: "boolean", example: true },
                                    code: { type: "integer", example: 404 },
                                    message: { type: "string", example: "Não encontrado" },
                                    data: { type: "object", nullable: true, example: null },
                                    errors: {
                                        type: "array",
                                        example: [{ message: "Recurso não encontrado em Usuario." }]
                                    }
                                }
                            },
                            examples: {
                                usuario_nao_encontrado: {
                                    summary: "Usuário não encontrado para alteração de status",
                                    value: {
                                        error: true,
                                        code: 404,
                                        message: "Não encontrado",
                                        data: null,
                                        errors: [{ message: "Recurso não encontrado em Usuario." }]
                                    }
                                }
                            }
                        }
                    }
                },
                498: swaggerCommonResponses[498](),
                500: swaggerCommonResponses[500]()
            }
        }
    }
};

export default usuariosRoutes;
