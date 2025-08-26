// src/docs/paths/upload.js

import swaggerCommonResponses from "../schemas/swaggerCommonResponses.js";

const uploadPath = {
  "/eventos/{id}/midia/{tipo}": {
    "post": {
      "tags": ["Upload de Mídias"],
      "summary": "Adicionar mídia ao evento",
      "description": `Adiciona uma ou múltiplas mídias ao evento conforme o tipo especificado.
      
      **Regras de Negócio:**
      - Usuário deve estar autenticado
      - Apenas organizador ou colaborador com permissão pode adicionar mídias
      - Tipo 'capa': aceita apenas um arquivo de imagem (1280x720px)
      - Tipo 'video': aceita apenas um arquivo de vídeo (dimensões fixas 1280x720px)
      - Tipo 'carrossel': aceita múltiplos arquivos de imagem (1280x720px cada)
      - Validação de formato: imagens (jpg, jpeg, png) e vídeos (mp4)
      - Validação rigorosa de dimensões: exatamente 1280x720px para todos os tipos
      - Falha em uma mídia do carrossel cancela todo o upload
      - Arquivos são salvos com nome único para evitar conflitos
      - Limpeza automática de arquivos em caso de erro`,
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
          "description": "ID do evento (ObjectId válido)",
          "schema": {
            "type": "string",
            "pattern": "^[0-9a-fA-F]{24}$"
          }
        },
        {
          "name": "tipo",
          "in": "path",
          "required": true,
          "description": "Tipo de mídia a ser adicionada",
          "schema": {
            "type": "string",
            "enum": ["capa", "video", "carrossel"]
          }
        }
      ],
      "requestBody": {
        "content": {
          "multipart/form-data": {
            "schema": {
              "type": "object",
              "properties": {
                "file": {
                  "type": "string",
                  "format": "binary",
                  "description": "Arquivo único para capa ou vídeo. Obrigatório quando tipo é 'capa' ou 'video'."
                },
                "files": {
                  "type": "array",
                  "items": {
                    "type": "string",
                    "format": "binary"
                  },
                  "description": "Múltiplos arquivos para carrossel. Obrigatório quando tipo é 'carrossel'."
                }
              }
            }
          }
        }
      },
      "responses": {
        "201": {
          "description": "Mídia(s) adicionada(s) com sucesso",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/UploadResponse"
              },
              "examples": {
                "midia_capa": {
                  "summary": "Upload de capa bem-sucedido",
                  "value": {
                    "statusCode": 201,
                    "message": "Mídia (capa) salva com sucesso.",
                    "data": {
                      "_id": "60b5f8c8d8f8f8f8f8f8f8",
                      "midiaCapa": [
                        {
                          "_id": "60b5f8c8d8f8f8f8f8f8f8fa",
                          "url": "/uploads/capa/1673432100000-capa.jpg",
                          "tamanhoMb": 2.45,
                          "altura": 720,
                          "largura": 1280
                        }
                      ]
                    }
                  }
                },
                "midia_video": {
                  "summary": "Upload de vídeo bem-sucedido",
                  "value": {
                    "statusCode": 201,
                    "message": "Mídia (video) salva com sucesso.",
                    "data": {
                      "_id": "60b5f8c8d8f8f8f8f8f8f8",
                      "midiaVideo": [
                        {
                          "_id": "60b5f8c8d8f8f8f8f8f8f8fa",
                          "url": "/uploads/video/1673432100000-video.mp4",
                          "tamanhoMb": 25.8,
                          "altura": 720,
                          "largura": 1280
                        }
                      ]
                    }
                  }
                },
                "multiplas_midias_carrossel": {
                  "summary": "Upload de múltiplas imagens do carrossel",
                  "value": {
                    "statusCode": 201,
                    "message": "3 arquivo(s) de carrossel salvos com sucesso.",
                    "data": {
                      "_id": "60b5f8c8d8f8f8f8f8f8f8",
                      "midiaCarrossel": [
                        {
                          "_id": "60b5f8c8d8f8f8f8f8f8f8fa",
                          "url": "/uploads/carrossel/1673432100000-img1.jpg",
                          "tamanhoMb": 1.85,
                          "altura": 720,
                          "largura": 1280
                        },
                        {
                          "_id": "60b5f8c8d8f8f8f8f8f8f8fb",
                          "url": "/uploads/carrossel/1673432100000-img2.jpg",
                          "tamanhoMb": 2.12,
                          "altura": 720,
                          "largura": 1280
                        },
                        {
                          "_id": "60b5f8c8d8f8f8f8f8f8f8fc",
                          "url": "/uploads/carrossel/1673432100000-img3.jpg",
                          "tamanhoMb": 1.95,
                          "altura": 720,
                          "largura": 1280
                        }
                      ]
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
                "arquivo_ausente_capa": {
                  "summary": "Arquivo não enviado para capa",
                  "value": {
                    "statusCode": 400,
                    "error": "Erro de validação",
                    "message": "Arquivo(s) de mídia não enviado(s). Use o campo 'file' para o tipo 'capa'.",
                    "details": []
                  }
                },
                "arquivo_ausente_carrossel": {
                  "summary": "Arquivos não enviados para carrossel",
                  "value": {
                    "statusCode": 400,
                    "error": "Erro de validação",
                    "message": "Arquivo(s) de mídia não enviado(s). Use o campo 'files' para o tipo 'carrossel'.",
                    "details": []
                  }
                },
                "dimensoes_invalidas": {
                  "summary": "Dimensões inválidas da imagem",
                  "value": {
                    "statusCode": 400,
                    "error": "Erro de validação",
                    "message": "Dimensões inválidas. Esperado: 1280x720px, recebido: 1920x1080px.",
                    "details": []
                  }
                },
                "dimensoes_invalidas_carrossel": {
                  "summary": "Dimensões inválidas em arquivo do carrossel",
                  "value": {
                    "statusCode": 400,
                    "error": "Erro de validação",
                    "message": "Dimensões inválidas no arquivo \"imagem.jpg\". Esperado: 1280x720px, recebido: 1920x1080px.",
                    "details": []
                  }
                },
                "arquivo_corrompido": {
                  "summary": "Arquivo corrompido ou inválido",
                  "value": {
                    "statusCode": 400,
                    "error": "Erro de validação",
                    "message": "Arquivo \"imagem.jpg\" está corrompido ou não é uma imagem válida.",
                    "details": []
                  }
                },
                "evento_id_invalido": {
                  "summary": "ID do evento inválido",
                  "value": {
                    "statusCode": 400,
                    "error": "Erro de validação",
                    "message": "ID do evento inválido. Deve ser um ObjectId válido.",
                    "details": []
                  }
                }
              }
            }
          }
        },
        "401": swaggerCommonResponses[401](),
        "403": {
          "description": "Acesso negado",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              },
              "examples": {
                "sem_permissao": {
                  "summary": "Usuário sem permissão para adicionar mídia",
                  "value": {
                    "statusCode": 403,
                    "error": "Acesso negado",
                    "message": "Usuário não tem permissão para adicionar mídia a este evento.",
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
                  "summary": "Evento não existe",
                  "value": {
                    "statusCode": 404,
                    "error": "Recurso não encontrado",
                    "message": "Evento não encontrado.",
                    "details": []
                  }
                }
              }
            }
          }
        },
        "413": {
          "description": "Arquivo muito grande",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              },
              "examples": {
                "arquivo_grande": {
                  "summary": "Arquivo excede limite de tamanho",
                  "value": {
                    "statusCode": 413,
                    "error": "Arquivo muito grande",
                    "message": "O arquivo excede o tamanho máximo permitido (10MB para imagens, 50MB para vídeos).",
                    "details": []
                  }
                }
              }
            }
          }
        },
        "500": swaggerCommonResponses[500]()
      }
    }
  },
  "/eventos/{id}/midias": {
    "get": {
      "tags": ["Upload de Mídias"],
      "summary": "Listar todas as mídias do evento",
      "description": `Retorna todas as mídias associadas ao evento organizadas por tipo (capa, video e carrossel).
      
      **Regras de Negócio:**
      - Usuário deve estar autenticado
      - Retorna arrays separados por tipo de mídia
      - Cada mídia inclui informações completas (url, tamanhoMb, altura, largura)
      - URLs são relativas ao servidor da aplicação
      - Ordem das mídias no carrossel é preservada
      - Retorna arrays vazios se não houver mídias`,
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
          "description": "ID do evento (ObjectId válido)",
          "schema": {
            "type": "string",
            "pattern": "^[0-9a-fA-F]{24}$"
          }
        }
      ],
      "responses": {
        "200": {
          "description": "Mídias do evento retornadas com sucesso",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/MidiasEventoResponse"
              },
              "examples": {
                "com_todas_midias": {
                  "summary": "Evento com todas as mídias",
                  "value": {
                    "statusCode": 200,
                    "message": "Mídias do evento retornadas com sucesso.",
                    "data": {
                      "capa": [
                        {
                          "_id": "60b5f8c8d8f8f8f8f8f8f8fa",
                          "url": "/uploads/capa/1673432100000-capa.jpg",
                          "tamanhoMb": 2.45,
                          "altura": 720,
                          "largura": 1280
                        }
                      ],
                      "carrossel": [
                        {
                          "_id": "60b5f8c8d8f8f8f8f8f8f8fb",
                          "url": "/uploads/carrossel/1673432100000-img1.jpg",
                          "tamanhoMb": 1.85,
                          "altura": 720,
                          "largura": 1280
                        },
                        {
                          "_id": "60b5f8c8d8f8f8f8f8f8f8fc",
                          "url": "/uploads/carrossel/1673432100000-img2.jpg",
                          "tamanhoMb": 2.12,
                          "altura": 720,
                          "largura": 1280
                        }
                      ],
                      "video": [
                        {
                          "_id": "60b5f8c8d8f8f8f8f8f8f8fd",
                          "url": "/uploads/video/1673432100000-video.mp4",
                          "tamanhoMb": 25.8,
                          "altura": 720,
                          "largura": 1280
                        }
                      ]
                    }
                  }
                },
                "sem_midias": {
                  "summary": "Evento sem mídias",
                  "value": {
                    "statusCode": 200,
                    "message": "Mídias do evento retornadas com sucesso.",
                    "data": {
                      "capa": [],
                      "carrossel": [],
                      "video": []
                    }
                  }
                }
              }
            }
          }
        },
        "400": {
          "description": "ID do evento inválido",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              },
              "examples": {
                "evento_id_invalido": {
                  "summary": "ID do evento inválido",
                  "value": {
                    "statusCode": 400,
                    "error": "Erro de validação",
                    "message": "ID do evento inválido. Deve ser um ObjectId válido.",
                    "details": []
                  }
                }
              }
            }
          }
        },
        "401": swaggerCommonResponses[401](),
        "404": {
          "description": "Evento não encontrado",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              },
              "examples": {
                "evento_nao_encontrado": {
                  "summary": "Evento não existe",
                  "value": {
                    "statusCode": 404,
                    "error": "Recurso não encontrado",
                    "message": "Evento não encontrado.",
                    "details": []
                  }
                }
              }
            }
          }
        },
        "500": swaggerCommonResponses[500]()
      }
    }
  },
  "/eventos/{id}/midia/capa": {
    "get": {
      "tags": ["Upload de Mídias"],
      "summary": "Obter imagem de capa do evento",
      "description": "**ROTA PÚBLICA** - Retorna o arquivo binário da imagem de capa do evento. O Content-Type é definido automaticamente baseado na extensão do arquivo (jpg, jpeg, png). Esta rota não requer autenticação para permitir acesso público às imagens.",
      "parameters": [
        {
          "name": "id",
          "in": "path",
          "required": true,
          "description": "ID do evento (ObjectId válido)",
          "schema": {
            "type": "string",
            "pattern": "^[0-9a-fA-F]{24}$"
          }
        }
      ],
      "responses": {
        "200": {
          "description": "Imagem de capa retornada com sucesso",
          "headers": {
            "Content-Type": {
              "description": "Tipo de conteúdo da imagem",
              "schema": {
                "type": "string",
                "enum": ["image/jpeg", "image/png", "image/jpg"]
              }
            }
          },
          "content": {
            "image/jpeg": {
              "schema": {
                "type": "string",
                "format": "binary",
                "description": "Arquivo binário da imagem JPEG - Para visualizar, abra a URL diretamente no navegador"
              },
              "example": "Conteúdo binário da imagem. Para visualizar a imagem completa, faça a requisição através do navegador ou cliente HTTP e abra a resposta como imagem."
            },
            "image/png": {
              "schema": {
                "type": "string",
                "format": "binary",
                "description": "Arquivo binário da imagem PNG - Para visualizar, abra a URL diretamente no navegador"
              },
              "example": "Conteúdo binário da imagem. Para visualizar a imagem completa, faça a requisição através do navegador ou cliente HTTP e abra a resposta como imagem."
            },
            "image/jpg": {
              "schema": {
                "type": "string",
                "format": "binary",
                "description": "Arquivo binário da imagem JPG - Para visualizar, abra a URL diretamente no navegador"
              },
              "example": "Conteúdo binário da imagem. Para visualizar a imagem completa, faça a requisição através do navegador ou cliente HTTP e abra a resposta como imagem."
            }
          }
        },
        "404": {
          "description": "Capa não encontrada",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              },
              "examples": {
                "capa_nao_encontrada": {
                  "summary": "Evento não possui capa",
                  "value": {
                    "statusCode": 404,
                    "error": "Recurso não encontrado",
                    "message": "Capa do evento não encontrada.",
                    "details": []
                  }
                },
                "arquivo_capa_nao_encontrado": {
                  "summary": "Arquivo de capa não encontrado no servidor",
                  "value": {
                    "statusCode": 404,
                    "error": "Recurso não encontrado",
                    "message": "Arquivo de capa não encontrado no servidor.",
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
  "/eventos/{id}/midia/video": {
    "get": {
      "tags": ["Upload de Mídias"],
      "summary": "Obter vídeo do evento",
      "description": `**ROTA PÚBLICA** - Retorna o arquivo binário do vídeo do evento.
      
      **Regras de Negócio:**
      - Rota pública (não requer autenticação) 
      - Retorna o arquivo binário diretamente (não JSON)
      - Content-Type é definido automaticamente baseado na extensão do arquivo
      - Suporta formatos: mp4
      - Erro 404 se não houver vídeo ou arquivo não existir fisicamente`,
      "parameters": [
        {
          "name": "id",
          "in": "path",
          "required": true,
          "description": "ID do evento (ObjectId válido)",
          "schema": {
            "type": "string",
            "pattern": "^[0-9a-fA-F]{24}$"
          }
        }
      ],
      "responses": {
        "200": {
          "description": "Vídeo retornado com sucesso",
          "headers": {
            "Content-Type": {
              "description": "Tipo de conteúdo do vídeo",
              "schema": {
                "type": "string",
                "enum": ["video/mp4", "video/avi", "video/mov"]
              }
            }
          },
          "content": {
            "video/mp4": {
              "schema": {
                "type": "string",
                "format": "binary",
                "description": "Arquivo binário do vídeo MP4 - Para visualizar, abra a URL diretamente no navegador"
              },
              "example": "Conteúdo binário do vídeo. Para reproduzir o vídeo completo, faça a requisição através do navegador ou cliente HTTP e abra a resposta como vídeo."
            },
            "video/avi": {
              "schema": {
                "type": "string",
                "format": "binary",
                "description": "Arquivo binário do vídeo AVI - Para visualizar, abra a URL diretamente no navegador"
              },
              "example": "Conteúdo binário do vídeo. Para reproduzir o vídeo completo, faça a requisição através do navegador ou cliente HTTP e abra a resposta como vídeo."
            },
            "video/mov": {
              "schema": {
                "type": "string",
                "format": "binary",
                "description": "Arquivo binário do vídeo MOV - Para visualizar, abra a URL diretamente no navegador"
              },
              "example": "Conteúdo binário do vídeo. Para reproduzir o vídeo completo, faça a requisição através do navegador ou cliente HTTP e abra a resposta como vídeo."
            }
          }
        },
        "404": {
          "description": "Vídeo não encontrado",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              },
              "examples": {
                "video_nao_encontrado": {
                  "summary": "Evento não possui vídeo",
                  "value": {
                    "statusCode": 404,
                    "error": "Recurso não encontrado",
                    "message": "Vídeo do evento não encontrado.",
                    "details": []
                  }
                },
                "arquivo_nao_encontrado": {
                  "summary": "Arquivo físico não existe",
                  "value": {
                    "statusCode": 404,
                    "error": "Recurso não encontrado",
                    "message": "Arquivo de vídeo não encontrado no servidor.",
                    "details": []
                  }
                },
                "evento_nao_encontrado": {
                  "summary": "Evento não existe",
                  "value": {
                    "statusCode": 404,
                    "error": "Recurso não encontrado",
                    "message": "Evento não encontrado.",
                    "details": []
                  }
                }
              }
            }
          }
        },
        "500": swaggerCommonResponses[500]()
      }
    }
  },
  "/eventos/{id}/midia/carrossel/{index}": {
    "get": {
      "tags": ["Upload de Mídias"],
      "summary": "Obter imagem específica do carrossel",
      "description": `**ROTA PÚBLICA** - Retorna o arquivo binário de uma imagem específica do carrossel baseada no índice.
      
      **Regras de Negócio:**
      - Rota pública (não requer autenticação)
      - Retorna o arquivo binário diretamente (não JSON)
      - Content-Type é definido automaticamente baseado na extensão do arquivo
      - Suporta formatos: jpg, jpeg, png
      - Índice baseado em 0 (primeira imagem = índice 0)
      - Erro 404 se não houver carrossel, índice inválido ou arquivo não existir fisicamente`,
      "parameters": [
        {
          "name": "id",
          "in": "path",
          "required": true,
          "description": "ID do evento (ObjectId válido)",
          "schema": {
            "type": "string",
            "pattern": "^[0-9a-fA-F]{24}$"
          }
        },
        {
          "name": "index",
          "in": "path",
          "required": true,
          "description": "Índice da imagem no carrossel (baseado em 0)",
          "schema": {
            "type": "integer",
            "minimum": 0
          }
        }
      ],
      "responses": {
        "200": {
          "description": "Imagem do carrossel retornada com sucesso",
          "headers": {
            "Content-Type": {
              "description": "Tipo de conteúdo da imagem",
              "schema": {
                "type": "string",
                "enum": ["image/jpeg", "image/png", "image/jpg"]
              }
            }
          },
          "content": {
            "image/jpeg": {
              "schema": {
                "type": "string",
                "format": "binary",
                "description": "Arquivo binário da imagem JPEG do carrossel - Para visualizar, abra a URL diretamente no navegador"
              },
              "example": "Conteúdo binário da imagem do carrossel. Para visualizar a imagem completa, faça a requisição através do navegador ou cliente HTTP e abra a resposta como imagem."
            },
            "image/png": {
              "schema": {
                "type": "string",
                "format": "binary",
                "description": "Arquivo binário da imagem PNG do carrossel - Para visualizar, abra a URL diretamente no navegador"
              },
              "example": "Conteúdo binário da imagem do carrossel. Para visualizar a imagem completa, faça a requisição através do navegador ou cliente HTTP e abra a resposta como imagem."
            },
            "image/jpg": {
              "schema": {
                "type": "string",
                "format": "binary",
                "description": "Arquivo binário da imagem JPG do carrossel - Para visualizar, abra a URL diretamente no navegador"
              },
              "example": "Conteúdo binário da imagem do carrossel. Para visualizar a imagem completa, faça a requisição através do navegador ou cliente HTTP e abra a resposta como imagem."
            }
          }
        },
        "400": {
          "description": "ID do evento inválido",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              },
              "examples": {
                "evento_id_invalido": {
                  "summary": "ID do evento inválido",
                  "value": {
                    "statusCode": 400,
                    "error": "Erro de validação",
                    "message": "ID do evento inválido. Deve ser um ObjectId válido.",
                    "details": []
                  }
                }
              }
            }
          }
        },
        "404": {
          "description": "Carrossel ou imagem não encontrada",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              },
              "examples": {
                "carrossel_nao_encontrado": {
                  "summary": "Evento não possui carrossel",
                  "value": {
                    "statusCode": 404,
                    "error": "Recurso não encontrado",
                    "message": "Carrossel do evento não encontrado.",
                    "details": []
                  }
                },
                "indice_invalido": {
                  "summary": "Índice fora do range",
                  "value": {
                    "statusCode": 404,
                    "error": "Recurso não encontrado",
                    "message": "Índice 5 não encontrado. O carrossel possui 3 imagem(ns).",
                    "details": []
                  }
                },
                "arquivo_nao_encontrado": {
                  "summary": "Arquivo físico não existe",
                  "value": {
                    "statusCode": 404,
                    "error": "Recurso não encontrado",
                    "message": "Arquivo de carrossel não encontrado no servidor.",
                    "details": []
                  }
                },
                "evento_nao_encontrado": {
                  "summary": "Evento não existe",
                  "value": {
                    "statusCode": 404,
                    "error": "Recurso não encontrado",
                    "message": "Evento não encontrado.",
                    "details": []
                  }
                }
              }
            }
          }
        },
        "500": swaggerCommonResponses[500]()
      }
    }
  },
  "/eventos/{eventoId}/midia/{tipo}/{midiaId}": {
    "delete": {
      "tags": ["Upload de Mídias"],
      "summary": "Deletar mídia específica do evento",
      "description": `Remove uma mídia específica do evento e exclui o arquivo físico do servidor.
      
      **Regras de Negócio:**
      - Usuário deve estar autenticado
      - Apenas organizador ou colaborador com permissão pode deletar mídias
      - Remove o registro do banco de dados
      - Exclui o arquivo físico do servidor
      - Retorna os dados da mídia deletada
      - Operação irreversível`,
      "security": [
        {
          "bearerAuth": []
        }
      ],
      "parameters": [
        {
          "name": "eventoId",
          "in": "path",
          "required": true,
          "description": "ID do evento (ObjectId válido)",
          "schema": {
            "type": "string",
            "pattern": "^[0-9a-fA-F]{24}$"
          }
        },
        {
          "name": "tipo",
          "in": "path",
          "required": true,
          "description": "Tipo da mídia a ser deletada",
          "schema": {
            "type": "string",
            "enum": ["capa", "video", "carrossel"]
          }
        },
        {
          "name": "midiaId",
          "in": "path",
          "required": true,
          "description": "ID da mídia a ser deletada (ObjectId válido)",
          "schema": {
            "type": "string",
            "pattern": "^[0-9a-fA-F]{24}$"
          }
        }
      ],
      "responses": {
        "200": {
          "description": "Mídia deletada com sucesso",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/DeleteMidiaResponse"
              },
              "examples": {
                "capa_deletada": {
                  "summary": "Capa deletada com sucesso",
                  "value": {
                    "statusCode": 200,
                    "message": "Midia 'capa' do evento deletada com sucesso.",
                    "data": {
                      "_id": "60b5f8c8d8f8f8f8f8f8f8fa",
                      "url": "/uploads/capa/1673432100000-capa.jpg",
                      "tamanhoMb": 2.45,
                      "altura": 720,
                      "largura": 1280
                    }
                  }
                },
                "video_deletado": {
                  "summary": "Vídeo deletado com sucesso",
                  "value": {
                    "statusCode": 200,
                    "message": "Midia 'video' do evento deletada com sucesso.",
                    "data": {
                      "_id": "60b5f8c8d8f8f8f8f8f8f8fa",
                      "url": "/uploads/video/1673432100000-video.mp4",
                      "tamanhoMb": 25.8,
                      "altura": 720,
                      "largura": 1280
                    }
                  }
                },
                "carrossel_deletado": {
                  "summary": "Imagem do carrossel deletada com sucesso",
                  "value": {
                    "statusCode": 200,
                    "message": "Midia 'carrossel' do evento deletada com sucesso.",
                    "data": {
                      "_id": "60b5f8c8d8f8f8f8f8f8f8fa",
                      "url": "/uploads/carrossel/1673432100000-img1.jpg",
                      "tamanhoMb": 1.85,
                      "altura": 720,
                      "largura": 1280
                    }
                  }
                }
              }
            }
          }
        },
        "400": {
          "description": "Parâmetros inválidos",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              },
              "examples": {
                "evento_id_invalido": {
                  "summary": "ID do evento inválido",
                  "value": {
                    "statusCode": 400,
                    "error": "Erro de validação",
                    "message": "ID do evento inválido. Deve ser um ObjectId válido.",
                    "details": []
                  }
                },
                "midia_id_invalido": {
                  "summary": "ID da mídia inválido",
                  "value": {
                    "statusCode": 400,
                    "error": "Erro de validação",
                    "message": "ID da mídia inválido. Deve ser um ObjectId válido.",
                    "details": []
                  }
                }
              }
            }
          }
        },
        "401": swaggerCommonResponses[401](),
        "403": {
          "description": "Acesso negado",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              },
              "examples": {
                "sem_permissao": {
                  "summary": "Usuário sem permissão para deletar mídia",
                  "value": {
                    "statusCode": 403,
                    "error": "Acesso negado",
                    "message": "Usuário não tem permissão para deletar mídia deste evento.",
                    "details": []
                  }
                }
              }
            }
          }
        },
        "404": {
          "description": "Recurso não encontrado",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              },
              "examples": {
                "evento_nao_encontrado": {
                  "summary": "Evento não existe",
                  "value": {
                    "statusCode": 404,
                    "error": "Recurso não encontrado",
                    "message": "Evento não encontrado.",
                    "details": []
                  }
                },
                "midia_nao_encontrada": {
                  "summary": "Mídia não encontrada",
                  "value": {
                    "statusCode": 404,
                    "error": "Recurso não encontrado",
                    "message": "Mídia não encontrada no evento.",
                    "details": []
                  }
                }
              }
            }
          }
        },
        "500": swaggerCommonResponses[500]()
      }
    }
  }
};

export default uploadPath;
