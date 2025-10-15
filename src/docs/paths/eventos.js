// src/docs/paths/eventos.js

import swaggerCommonResponses from "../schemas/swaggerCommonResponses.js";

const eventosPath = {
  "/eventos": {
    "post": {
      "tags": ["Eventos"],
      "summary": "Cadastrar novo evento",
      "description": `**ROTA PROTEGIDA** - Cria um novo evento com todas as suas configurações de exibição para o totem.
      
      **Regras de Negócio:**
      - Usuário deve estar autenticado
      - Evento é automaticamente vinculado ao organizador autenticado
      - Status padrão é 'inativo' (0) se não especificado
      - Mídias podem ser enviadas no cadastro ou adicionadas posteriormente
      - Tags devem ser array de strings (obrigatório)
      - Datas devem ser no formato ISO 8601
      - Configurações de exibição (exibDia, exibManha, exibTarde, exibNoite, exibInicio, exibFim) são obrigatórias
      
      **Campos Obrigatórios:**
      - titulo, descricao, local (strings)
      - dataInicio, dataFim (datas do evento)
      - exibInicio, exibFim (período de exibição no totem)
      - exibDia (dias da semana: "segunda,terca,quarta,quinta,sexta,sabado,domingo")
      - exibManha, exibTarde, exibNoite (booleanos - período do dia)
      - categoria (string do enum)
      - tags (array de strings)
      
      **IMPORTANTE - Configurações de Exibição:**
      - exibDia: Define em quais dias da semana o evento aparecerá no totem
      - exibManha/Tarde/Noite: Define em quais períodos do dia o evento será exibido
      - exibInicio/exibFim: Define o período total em que o evento estará visível no totem`,
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
                      "dataInicio": "2025-08-15T10:00:00.000Z",
                      "dataFim": "2025-08-15T18:00:00.000Z",
                      "local": "Centro de Convenções",
                      "exibDia": "segunda,terca,quarta,quinta,sexta",
                      "exibManha": true,
                      "exibTarde": true,
                      "exibNoite": false,
                      "exibInicio": "2025-08-10T00:00:00.000Z",
                      "exibFim": "2025-08-20T23:59:59.000Z",
                      "link": "https://exemplo.com/inscricao",
                      "categoria": "workshop",
                      "tags": ["tecnologia", "workshop", "nodejs"],
                      "cor": 0,
                      "animacao": 0,
                      "organizador": {
                        "_id": "60b5f8c8d8f8f8f8f8f8f8f9",
                        "nome": "João Silva"
                      },
                      "status": 0,
                      "midia": [],
                      "permissoes": [],
                      "createdAt": "2025-08-01T12:00:00.000Z",
                      "updatedAt": "2025-08-01T12:00:00.000Z"
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
      - Ordenação padrão: mais recentes primeiro (-createdAt)
      
      **Filtros Disponíveis:**
      - titulo, local, categoria, tags, status, dataInicio/dataFim
      
      **Ordenação:**
      - createdAt: Mais antigos primeiro
      - -createdAt: Mais recentes primeiro (padrão)
      - dataInicio: Eventos mais próximos primeiro
      - -dataInicio: Eventos mais distantes primeiro`,
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
        },
        {
          "name": "ordenarPor",
          "in": "query",
          "description": "Campo para ordenação dos resultados. Use '-' no início para ordem decrescente (padrão: -createdAt)",
          "required": false,
          "schema": {
            "type": "string",
            "enum": ["createdAt", "-createdAt", "dataInicio", "-dataInicio"],
            "default": "-createdAt"
          },
          "examples": {
            "maisRecentes": {
              "value": "-createdAt",
              "summary": "Mais recentes primeiro (padrão)"
            },
            "maisAntigos": {
              "value": "createdAt",
              "summary": "Mais antigos primeiro"
            },
            "proximosEventos": {
              "value": "dataInicio",
              "summary": "Eventos mais próximos primeiro"
            },
            "eventosDistantes": {
              "value": "-dataInicio",
              "summary": "Eventos mais distantes primeiro"
            }
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
                },
                "ordenacaoRecentes": {
                  "summary": "Eventos ordenados por data de criação (mais recentes primeiro)",
                  "description": "Use ?ordenarPor=-createdAt para obter eventos mais recentes primeiro (padrão)",
                  "value": {
                    "error": false,
                    "code": 200,
                    "message": "Eventos recuperados com sucesso",
                    "data": {
                      "eventos": [
                        {
                          "_id": "60b5f8c8d8f8f8f8f8f8f8",
                          "titulo": "Workshop de IA - 2025",
                          "descricao": "Último evento cadastrado",
                          "dataInicio": "2025-11-15T10:00:00.000Z",
                          "dataFim": "2025-11-15T18:00:00.000Z",
                          "eventoCriadoEm": "2025-10-15T12:00:00.000Z",
                          "local": "Sala 101",
                          "categoria": "Tecnologia",
                          "status": 1
                        },
                        {
                          "_id": "60b5f8c8d8f8f8f8f8f8f7",
                          "titulo": "Palestra sobre Blockchain",
                          "descricao": "Penúltimo evento cadastrado",
                          "dataInicio": "2025-11-10T14:00:00.000Z",
                          "dataFim": "2025-11-10T16:00:00.000Z",
                          "eventoCriadoEm": "2025-10-14T10:00:00.000Z",
                          "local": "Auditório",
                          "categoria": "Tecnologia",
                          "status": 1
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
                "ordenacaoProximosEventos": {
                  "summary": "Eventos ordenados por data de início (próximos primeiro)",
                  "description": "Use ?ordenarPor=dataInicio para obter eventos que acontecerão em breve",
                  "value": {
                    "error": false,
                    "code": 200,
                    "message": "Eventos recuperados com sucesso",
                    "data": {
                      "eventos": [
                        {
                          "_id": "60b5f8c8d8f8f8f8f8f8f9",
                          "titulo": "Evento Amanhã",
                          "descricao": "Evento que acontecerá em breve",
                          "dataInicio": "2025-10-16T09:00:00.000Z",
                          "dataFim": "2025-10-16T17:00:00.000Z",
                          "eventoCriadoEm": "2025-09-10T10:00:00.000Z",
                          "local": "Campus Principal",
                          "categoria": "Educação",
                          "status": 1
                        },
                        {
                          "_id": "60b5f8c8d8f8f8f8f8f8f8",
                          "titulo": "Workshop de IA - 2025",
                          "descricao": "Evento em novembro",
                          "dataInicio": "2025-11-15T10:00:00.000Z",
                          "dataFim": "2025-11-15T18:00:00.000Z",
                          "eventoCriadoEm": "2025-10-15T12:00:00.000Z",
                          "local": "Sala 101",
                          "categoria": "Tecnologia",
                          "status": 1
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
