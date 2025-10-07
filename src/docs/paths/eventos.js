// src/docs/paths/eventos.js

import swaggerCommonResponses from "../schemas/swaggerCommonResponses.js";

const eventosPath = {
  "/eventos": {
    "post": {
      "tags": ["Eventos"],
      "summary": "Cadastrar novo evento",
      "description": `**ROTA PROTEGIDA** - Cria um novo evento básico sem mídias. Para adicionar mídias, use as rotas de upload específicas após criar o evento.
      
      **Regras de Negócio:**
      - Usuário deve estar autenticado
      - Evento é automaticamente vinculado ao organizador autenticado
      - Status inicial é sempre 'inativo'
      - Mídias devem ser adicionadas separadamente após criação
      - Tags devem ser array de strings (mínimo 1 tag)
      - dataEvento deve ser no formato ISO 8601
      
      **Fluxo Recomendado:**
      1. Criar evento (esta rota)
      2. Adicionar mídias com POST /eventos/{id}/midia/{tipo}
      
      **IMPORTANTE - Tags:**
      - Tags é campo OBRIGATÓRIO - mínimo 1 tag necessária
      - Deve ser enviado como array de strings: ["tecnologia", "inovação", "palestras"]`,
      "security": [
        {
          "bearerAuth": []
        }
      ],
      "requestBody": {
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/EventoCadastro"
            }
          }
        }
      },
      "responses": {
        "201": {
          "description": "Evento criado com sucesso",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/EventoCadastroResponse"
              },
              "examples": {
                "sucesso": {
                  "value": {
                    "statusCode": 201,
                    "message": "Evento criado com sucesso",
                    "data": {
                      "_id": "60b5f8c8d8f8f8f8f8f8f8",
                      "titulo": "Workshop de Node.js",
                      "descricao": "Aprenda Node.js do zero ao avançado",
                      "dataEvento": "2024-01-15T10:00:00.000Z",
                      "local": "Centro de Convenções",
                      "linkInscricao": "https://exemplo.com/inscricao",
                      "categoria": "Tecnologia",
                      "tags": ["tecnologia", "workshop", "nodejs"],
                      "organizador": {
                        "_id": "60b5f8c8d8f8f8f8f8f8f8f9",
                        "nome": "João Silva"
                      },
                      "status": "inativo",
                      "midiaVideo": [],
                      "midiaCapa": [],
                      "midiaCarrossel": [],
                      "permissoes": [],
                      "createdAt": "2024-01-01T12:00:00.000Z",
                      "updatedAt": "2024-01-01T12:00:00.000Z"
                    }
                  }
                }
              }
            }
          }
        },
        "400": {
          "description": "Erro de validação",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              },
              "examples": {
                "validacao": {
                  "value": {
                    "statusCode": 400,
                    "error": "Erro de validação",
                    "message": "Dados inválidos fornecidos",
                    "details": [
                      {
                        "field": "titulo",
                        "message": "Título é obrigatório"
                      }
                    ]
                  }
                }
              }
            }
          }
        },
        "401": {
          "description": "Usuário não autorizado",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              },
              "examples": {
                "nao_autorizado": {
                  "value": {
                    "statusCode": 401,
                    "error": "Não autorizado",
                    "message": "Usuário não possui permissão para acessar este recurso",
                    "details": []
                  }
                }
              }
            }
          }
        },
        "500": {
          "description": "Erro interno do servidor",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              },
              "examples": {
                "erro_interno": {
                  "value": {
                    "statusCode": 500,
                    "error": "Erro interno",
                    "message": "Ocorreu um erro inesperado no servidor",
                    "details": []
                  }
                }
              }
            }
          }
        }
      }
    },
    "get": {
      "tags": ["Eventos"],
      "summary": "Listar eventos",
      "description": `**ROTA PÚBLICA** - Lista eventos com paginação e filtros opcionais.
      
      **Regras:**
      - Sem autenticação: apenas eventos ativos
      - Com autenticação: eventos próprios + compartilhados
      - Paginação: 10 itens/página (máx. 100)
      
      **Filtros Disponíveis:**
      - titulo, local, categoria, tags, status, dataInicio/dataFim`,
      "parameters": [
        {
          "name": "titulo",
          "in": "query",
          "description": "Busca parcial no título",
          "required": false,
          "schema": {
            "type": "string"
          }
        },
        {
          "name": "local",
          "in": "query",
          "description": "Busca parcial no local",
          "required": false,
          "schema": {
            "type": "string"
          }
        },
        {
          "name": "categoria",
          "in": "query",
          "description": "Busca parcial na categoria",
          "required": false,
          "schema": {
            "type": "string"
          }
        },
        {
          "name": "status",
          "in": "query",
          "description": "Status do evento: 0=inativo, 1=ativo",
          "required": false,
          "schema": {
            "oneOf": [
              {
                "type": "string",
                "enum": ["0", "1"]
              },
              {
                "type": "array",
                "items": {
                  "type": "string",
                  "enum": ["0", "1"]
                }
              }
            ]
          }
        },
        {
          "name": "tags",
          "in": "query",
          "description": "Busca em tags",
          "required": false,
          "schema": {
            "type": "string"
          }
        },
        {
          "name": "dataInicio",
          "in": "query",
          "description": "Data de início para filtro de intervalo",
          "required": false,
          "schema": {
            "type": "string",
            "format": "date-time"
          }
        },
        {
          "name": "dataFim",
          "in": "query",
          "description": "Data de fim para filtro de intervalo",
          "required": false,
          "schema": {
            "type": "string",
            "format": "date-time"
          }
        },
        {
          "name": "page",
          "in": "query",
          "description": "Número da página para paginação (padrão: 1)",
          "required": false,
          "schema": {
            "type": "integer",
            "minimum": 1,
            "default": 1
          }
        },
        {
          "name": "limite",
          "in": "query",
          "description": "Limite de itens por página (padrão: 10, máximo: 100)",
          "required": false,
          "schema": {
            "type": "integer",
            "minimum": 1,
            "maximum": 100,
            "default": 10
          }
        }
      ],
      "responses": {
        "200": {
          "description": "Lista de eventos recuperada com sucesso",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/EventosListaResponse"
              },
              "examples": {
                "sucesso": {
                  "value": {
                    "error": false,
                    "code": 200,
                    "message": "Eventos recuperados com sucesso",
                    "data": {
                      "eventos": [
                        {
                          "_id": "60b5f8c8d8f8f8f8f8f8f8",
                          "titulo": "Workshop de Node.js",
                          "descricao": "Aprenda Node.js do zero ao avançado",
                          "dataInicio": "2024-01-15T10:00:00.000Z",
                          "dataTermino": "2024-01-15T18:00:00.000Z",
                          "local": "Centro de Convenções",
                          "categoria": "Tecnologia",
                          "status": "ativo",
                          "organizador": {
                            "_id": "60b5f8c8d8f8f8f8f8f8f8f9",
                            "nome": "João Silva"
                          },
                          "midiaCapa": [
                            {
                              "_id": "60b5f8c8d8f8f8f8f8f8f8fa",
                              "url": "/uploads/eventos/60b5f8c8d8f8f8f8f8f8f8/capa.jpg"
                            }
                          ]
                        }
                      ],
                      "pagination": {
                        "currentPage": 1,
                        "totalPages": 5,
                        "totalItems": 47,
                        "itemsPerPage": 10
                      }
                    }
                  }
                },
                "slideshow": {
                  "summary": "Exemplo para slideshow do totem (eventos passados)",
                  "description": "Use ?tipo=historico&apenasVisiveis=true para obter eventos passados com mídias",
                  "value": {
                    "error": false,
                    "code": 200,
                    "message": "Eventos recuperados com sucesso",
                    "data": {
                      "eventos": [
                        {
                          "_id": "60b5f8c8d8f8f8f8f8f8f8",
                          "titulo": "Feira de Ciências 2024",
                          "descricao": "Evento de exibição de projetos científicos",
                          "dataInicio": "2024-12-10T08:00:00.000Z",
                          "dataTermino": "2024-12-10T17:00:00.000Z",
                          "local": "Auditório Central",
                          "categoria": "Educação",
                          "status": "ativo",
                          "midiaCapa": [
                            {
                              "_id": "60b5f8c8d8f8f8f8f8f8f8fa",
                              "url": "/uploads/eventos/60b5f8c8d8f8f8f8f8f8f8/feira_ciencias_capa.jpg",
                              "filename": "feira_ciencias_capa.jpg"
                            }
                          ]
                        }
                      ],
                      "pagination": {
                        "currentPage": 1,
                        "totalPages": 3,
                        "totalItems": 25,
                        "itemsPerPage": 10
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "401": {
          "description": "Usuário não autorizado",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              },
              "examples": {
                "nao_autorizado": {
                  "value": {
                    "statusCode": 401,
                    "error": "Não autorizado",
                    "message": "Usuário não possui permissão para acessar este recurso",
                    "details": []
                  }
                }
              }
            }
          }
        },
        "500": {
          "description": "Erro interno do servidor",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              },
              "examples": {
                "erro_interno": {
                  "value": {
                    "statusCode": 500,
                    "error": "Erro interno",
                    "message": "Ocorreu um erro inesperado no servidor",
                    "details": []
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  "/eventos/{id}": {
    "get": {
      "tags": ["Eventos"],
      "summary": "Obter evento por ID",
      "description": `**ROTA PÚBLICA** - Recupera um evento específico pelo seu ID.
      
      **Regras de Negócio:**
      - Rota pública (não requer autenticação para totem)
      - ID deve ser um ObjectId válido do MongoDB (24 caracteres hexadecimais)
      - Retorna dados completos do evento incluindo mídias
      - Com autenticação: acesso a eventos próprios e compartilhados
      - Sem autenticação: apenas eventos públicos/ativos`,
      "parameters": [
        {
          "name": "id",
          "in": "path",
          "required": true,
          "description": "ID do evento",
          "schema": {
            "type": "string",
            "pattern": "^[0-9a-fA-F]{24}$"
          }
        }
      ],
      "responses": {
        "200": {
          "description": "Evento encontrado com sucesso",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/EventoDetalheResponse"
              }
            }
          }
        },
        "400": {
          "description": "ID inválido",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              }
            }
          }
        },
        "401": {
          "description": "Usuário não autorizado",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              }
            }
          }
        },
        "404": {
          "description": "Evento não encontrado",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              }
            }
          }
        },
        "500": {
          "description": "Erro interno do servidor",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              }
            }
          }
        }
      }
    },
    "patch": {
      "tags": ["Eventos"],
      "summary": "Atualizar evento",
      "description": `**ROTA PROTEGIDA** - Permite atualizar parcialmente os dados de um evento existente.
      
      **Regras de Negócio:**
      - Requer autenticação (token JWT)
      - Apenas o organizador original pode atualizar
      - Usuários com permissão compartilhada também podem editar
      - Atualização parcial (apenas campos fornecidos são alterados)
      - Não é possível alterar o organizador
      - ID deve ser válido e evento deve existir`,
      "security": [
        {
          "bearerAuth": []
        }
      ],
      "parameters": [
        {
          "name": "id",
          "in": "path",
          "required": true,
          "description": "ID do evento",
          "schema": {
            "type": "string",
            "pattern": "^[0-9a-fA-F]{24}$"
          }
        }
      ],
      "requestBody": {
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/EventoAtualizacao"
            }
          }
        }
      },
      "responses": {
        "200": {
          "description": "Evento atualizado com sucesso",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/EventoDetalheResponse"
              }
            }
          }
        },
        "400": {
          "description": "Erro de validação",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              }
            }
          }
        },
        "401": {
          "description": "Usuário não autorizado",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              }
            }
          }
        },
        "403": {
          "description": "Acesso negado",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              }
            }
          }
        },
        "404": {
          "description": "Evento não encontrado",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              }
            }
          }
        },
        "500": {
          "description": "Erro interno do servidor",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              }
            }
          }
        }
      }
    },
    "delete": {
      "tags": ["Eventos"],
      "summary": "Deletar evento",
      "description": `**ROTA PROTEGIDA** - Remove um evento permanentemente do sistema. Operação irreversível que inclui exclusão de todas as mídias associadas.
      
      **Regras de Negócio:**
      - Usuário deve estar autenticado
      - Apenas o organizador do evento pode deletar
      - Operação é irreversível
      - Todas as mídias associadas são removidas do servidor
      - Registros de upload são removidos do banco de dados
      - Evento não pode ser recuperado após exclusão`,
      "security": [
        {
          "bearerAuth": []
        }
      ],
      "parameters": [
        {
          "name": "id",
          "in": "path",
          "required": true,
          "description": "ID do evento",
          "schema": {
            "type": "string",
            "pattern": "^[0-9a-fA-F]{24}$"
          }
        }
      ],
      "responses": {
        "200": {
          "description": "Evento deletado com sucesso",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/SuccessResponse"
              },
              "examples": {
                "sucesso": {
                  "value": {
                    "statusCode": 200,
                    "message": "Evento deletado com sucesso",
                    "data": {
                      "message": "Evento removido com sucesso",
                      "data": null
                    }
                  }
                }
              }
            }
          }
        },
        "401": {
          "description": "Usuário não autorizado",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              },
              "examples": {
                "nao_autorizado": {
                  "value": {
                    "statusCode": 401,
                    "error": "Não autorizado",
                    "message": "Usuário não possui permissão para acessar este recurso",
                    "details": []
                  }
                }
              }
            }
          }
        },
        "403": {
          "description": "Acesso negado",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              },
              "examples": {
                "acesso_negado": {
                  "value": {
                    "statusCode": 403,
                    "error": "Acesso negado",
                    "message": "Você não tem permissão para realizar esta ação",
                    "details": []
                  }
                }
              }
            }
          }
        },
        "404": {
          "description": "Evento não encontrado",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              },
              "examples": {
                "evento_nao_encontrado": {
                  "value": {
                    "statusCode": 404,
                    "error": "Recurso não encontrado",
                    "message": "Recurso não encontrado em Evento.",
                    "details": []
                  }
                }
              }
            }
          }
        },
        "500": {
          "description": "Erro interno do servidor",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              },
              "examples": {
                "erro_interno": {
                  "value": {
                    "statusCode": 500,
                    "error": "Erro interno",
                    "message": "Ocorreu um erro inesperado no servidor",
                    "details": []
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  "/eventos/{id}/qrcode": {
    "get": {
      "tags": ["Eventos"],
      "summary": "Gerar QR Code do evento",
      "description": `**ROTA PÚBLICA** - Gera um QR Code contendo o link de inscrição do evento para facilitar o acesso dos participantes.
      
      **Regras de Negócio:**
      - Rota pública (não requer autenticação para permitir acesso amplo ao QR Code)
      - QR Code pode ser gerado para qualquer evento público
      - Evento deve possuir link de inscrição válido
      - QR Code é gerado no formato PNG em base64
      - QR Code aponta para o link de inscrição do evento
      - ID do evento deve ser um ObjectId válido`,
      "parameters": [
        {
          "name": "id",
          "in": "path",
          "required": true,
          "description": "ID do evento",
          "schema": {
            "type": "string",
            "pattern": "^[0-9a-fA-F]{24}$"
          }
        }
      ],
      "responses": {
        "200": {
          "description": "QR Code gerado com sucesso",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/QRCodeResponse"
              },
              "examples": {
                "sucesso": {
                  "value": {
                    "statusCode": 200,
                    "message": "QR Code gerado com sucesso.",
                    "data": {
                      "evento": "60b5f8c8d8f8f8f8f8f8f8f8",
                      "linkInscricao": "https://exemplo.com/inscricao",
                      "qrcode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAjklEQVR4nO3BAQEAAACCIP+vbkhAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP8NzwGkFAAAAAElFTkSuQmCC"
                    }
                  }
                }
              }
            }
          }
        },
        "400": {
          "description": "ID inválido ou ausente",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              },
              "examples": {
                "id_obrigatorio": {
                  "value": {
                    "statusCode": 400,
                    "error": "Erro de validação",
                    "message": "ID do evento é obrigatório para gerar o QR Code.",
                    "details": []
                  }
                }
              }
            }
          }
        },
        "401": {
          "description": "Usuário não autorizado",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              },
              "examples": {
                "nao_autorizado": {
                  "value": {
                    "statusCode": 401,
                    "error": "Não autorizado",
                    "message": "Usuário não possui permissão para acessar este recurso",
                    "details": []
                  }
                }
              }
            }
          }
        },
        "404": {
          "description": "Evento não encontrado",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              },
              "examples": {
                "evento_nao_encontrado": {
                  "value": {
                    "statusCode": 404,
                    "error": "Recurso não encontrado",
                    "message": "Recurso não encontrado em Evento.",
                    "details": []
                  }
                }
              }
            }
          }
        },
        "500": {
          "description": "Erro interno do servidor",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              },
              "examples": {
                "erro_interno": {
                  "value": {
                    "statusCode": 500,
                    "error": "Erro interno",
                    "message": "Ocorreu um erro inesperado no servidor",
                    "details": []
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  "/eventos/{id}/compartilhar": {
    "post": {
      "tags": ["Eventos"],
      "summary": "Compartilhar permissão de evento",
      "description": `**ROTA PROTEGIDA** - Compartilha permissão de edição de um evento com outro usuário via email. Permite colaboração na gestão do evento.
      
      **Regras de Negócio:**
      - Usuário deve estar autenticado
      - Apenas o organizador do evento pode compartilhar permissões
      - Email do usuário colaborador deve ser válido (conter @)
      - Permissão padrão é 'editar' se não especificada
      - Data de expiração deve ser futura
      - Permissão permite que o usuário colaborador edite o evento
      - Colaborador não pode alterar o organizador original
      - Permissão expira automaticamente na data especificada`,
      "security": [
        {
          "bearerAuth": []
        }
      ],
      "parameters": [
        {
          "name": "id",
          "in": "path",
          "required": true,
          "description": "ID do evento",
          "schema": {
            "type": "string",
            "pattern": "^[0-9a-fA-F]{24}$"
          }
        }
      ],
      "requestBody": {
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/EventoCompartilhamento"
            }
          }
        }
      },
      "responses": {
        "200": {
          "description": "Permissão compartilhada com sucesso",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/SuccessResponse"
              },
              "examples": {
                "sucesso": {
                  "value": {
                    "statusCode": 200,
                    "message": "Permissão compartilhada com sucesso!",
                    "data": {
                      "evento": "60b5f8c8d8f8f8f8f8f8f8",
                      "email": "usuario@exemplo.com",
                      "permissao": "editar",
                      "expiraEm": "2024-02-01T00:00:00.000Z"
                    }
                  }
                }
              }
            }
          }
        },
        "400": {
          "description": "Dados inválidos",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              },
              "examples": {
                "email_invalido": {
                  "value": {
                    "statusCode": 400,
                    "error": "Erro de validação",
                    "message": "Email válido é obrigatório.",
                    "details": []
                  }
                },
                "data_invalida": {
                  "value": {
                    "statusCode": 400,
                    "error": "Erro de validação",
                    "message": "Data de expiração deve ser futura.",
                    "details": []
                  }
                },
                "compartilhar_consigo_mesmo": {
                  "value": {
                    "statusCode": 400,
                    "error": "Erro de validação",
                    "message": "Você não pode compartilhar o evento consigo mesmo.",
                    "details": []
                  }
                },
                "usuario_nao_encontrado": {
                  "value": {
                    "statusCode": 404,
                    "error": "Recurso não encontrado",
                    "message": "Usuário com email usuario@exemplo.com não encontrado.",
                    "details": []
                  }
                },
                "permissao_existente": {
                  "value": {
                    "statusCode": 409,
                    "error": "Conflito de recurso",
                    "message": "Usuário usuario@exemplo.com já possui permissão ativa para este evento.",
                    "details": []
                  }
                }
              }
            }
          }
        },
        "401": {
          "description": "Usuário não autorizado",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              },
              "examples": {
                "nao_autorizado": {
                  "value": {
                    "statusCode": 401,
                    "error": "Não autorizado",
                    "message": "Usuário não possui permissão para acessar este recurso",
                    "details": []
                  }
                }
              }
            }
          }
        },
        "403": {
          "description": "Acesso negado",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              },
              "examples": {
                "acesso_negado": {
                  "value": {
                    "statusCode": 403,
                    "error": "Acesso negado",
                    "message": "Você não tem permissão para realizar esta ação",
                    "details": []
                  }
                }
              }
            }
          }
        },
        "404": {
          "description": "Evento não encontrado",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              },
              "examples": {
                "evento_nao_encontrado": {
                  "value": {
                    "statusCode": 404,
                    "error": "Recurso não encontrado",
                    "message": "Recurso não encontrado em Evento.",
                    "details": []
                  }
                }
              }
            }
          }
        },
        "500": {
          "description": "Erro interno do servidor",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              },
              "examples": {
                "erro_interno": {
                  "value": {
                    "statusCode": 500,
                    "error": "Erro interno",
                    "message": "Ocorreu um erro inesperado no servidor",
                    "details": []
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};

export default eventosPath;
