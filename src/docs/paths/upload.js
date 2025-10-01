// src/docs/paths/upload.js

import swaggerCommonResponses from "../schemas/swaggerCommonResponses.js";

const uploadPaths = {
  "/eventos/{id}/midias": {
    "post": {
      "tags": ["Upload de Mídias"],
      "summary": "Adicionar múltiplas mídias ao evento",
      "description": `Adiciona uma ou múltiplas mídias ao evento. O tipo é determinado automaticamente pelo mimetype do arquivo.
      
      **Regras de Negócio:**
      - Usuário deve estar autenticado
      - Apenas organizador ou colaborador com permissão pode adicionar mídias
      - Tipos aceitos: imagens (jpg, jpeg, png, webp) e vídeos (mp4)
      - Tamanho máximo: 200MB por arquivo
      - Arquivos são salvos no MinIO com URL pública
      - Processamento individual: se um arquivo falhar, os outros continuam
      - Retorna relatório detalhado com status de cada arquivo
      - Arquivos são salvos com nome único para evitar conflitos`,
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
      "requestBody": {
        "content": {
          "multipart/form-data": {
            "schema": {
              "type": "object",
              "properties": {
                "files": {
                  "type": "array",
                  "items": {
                    "type": "string",
                    "format": "binary"
                  },
                  "description": "Múltiplos arquivos de mídia (imagens ou vídeos). Campo obrigatório."
                }
              },
              "required": ["files"]
            }
          }
        }
      },
      "responses": {
        "200": {
          "description": "Mídias processadas (com ou sem erros)",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/MultipleUploadResponse"
              },
              "examples": {
                "upload_sucesso_total": {
                  "summary": "Todos os arquivos processados com sucesso",
                  "value": {
                    "statusCode": 200,
                    "message": "3 de 3 arquivo(s) adicionado(s) com sucesso.",
                    "data": {
                      "evento": {
                        "_id": "60b5f8c8d8f8f8f8f8f8f8",
                        "midia": [
                          {
                            "_id": "60b5f8c8d8f8f8f8f8f8f8fa",
                            "midiTipo": "imagem",
                            "midiLink": "http://localhost:9000/eventos/60b5f8c8d8f8f8f8f8f8f8-foto1.jpg"
                          },
                          {
                            "_id": "60b5f8c8d8f8f8f8f8f8f8fb",
                            "midiTipo": "imagem", 
                            "midiLink": "http://localhost:9000/eventos/60b5f8c8d8f8f8f8f8f8f8-foto2.jpg"
                          },
                          {
                            "_id": "60b5f8c8d8f8f8f8f8f8f8fc",
                            "midiTipo": "video",
                            "midiLink": "http://localhost:9000/eventos/60b5f8c8d8f8f8f8f8f8f8-video.mp4"
                          }
                        ]
                      },
                      "resultados": [
                        {
                          "arquivo": "foto1.jpg",
                          "status": "sucesso",
                          "url": "http://localhost:9000/eventos/60b5f8c8d8f8f8f8f8f8f8-foto1.jpg",
                          "tipo": "imagem"
                        },
                        {
                          "arquivo": "foto2.jpg", 
                          "status": "sucesso",
                          "url": "http://localhost:9000/eventos/60b5f8c8d8f8f8f8f8f8f8-foto2.jpg",
                          "tipo": "imagem"
                        },
                        {
                          "arquivo": "video.mp4",
                          "status": "sucesso", 
                          "url": "http://localhost:9000/eventos/60b5f8c8d8f8f8f8f8f8f8-video.mp4",
                          "tipo": "video"
                        }
                      ],
                      "totalProcessados": 3,
                      "totalSucesso": 3,
                      "totalErros": 0
                    }
                  }
                },
                "upload_parcial": {
                  "summary": "Alguns arquivos falharam",
                  "value": {
                    "statusCode": 200,
                    "message": "2 de 3 arquivo(s) adicionado(s) com sucesso.",
                    "data": {
                      "evento": {
                        "_id": "60b5f8c8d8f8f8f8f8f8f8",
                        "midia": [
                          {
                            "_id": "60b5f8c8d8f8f8f8f8f8f8fa",
                            "midiTipo": "imagem",
                            "midiLink": "http://localhost:9000/eventos/60b5f8c8d8f8f8f8f8f8f8-foto1.jpg"
                          },
                          {
                            "_id": "60b5f8c8d8f8f8f8f8f8f8fb",
                            "midiTipo": "video",
                            "midiLink": "http://localhost:9000/eventos/60b5f8c8d8f8f8f8f8f8f8-video.mp4"
                          }
                        ]
                      },
                      "resultados": [
                        {
                          "arquivo": "foto1.jpg",
                          "status": "sucesso",
                          "url": "http://localhost:9000/eventos/60b5f8c8d8f8f8f8f8f8f8-foto1.jpg",
                          "tipo": "imagem"
                        },
                        {
                          "arquivo": "corrupto.txt",
                          "status": "erro",
                          "erro": "O arquivo enviado não é uma mídia válida. Por favor, envie um arquivo de imagem (JPEG, PNG, WebP) ou vídeo (MP4)."
                        },
                        {
                          "arquivo": "video.mp4",
                          "status": "sucesso",
                          "url": "http://localhost:9000/eventos/60b5f8c8d8f8f8f8f8f8f8-video.mp4",
                          "tipo": "video"
                        }
                      ],
                      "totalProcessados": 3,
                      "totalSucesso": 2,
                      "totalErros": 1
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
                "nenhum_arquivo": {
                  "summary": "Nenhum arquivo enviado",
                  "value": {
                    "statusCode": 400,
                    "error": "Erro de validação",
                    "message": "Nenhum arquivo enviado. Por favor, inclua pelo menos um arquivo.",
                    "field": "arquivos"
                  }
                },
                "arquivo_invalido": {
                  "summary": "Arquivo com formato inválido",
                  "value": {
                    "statusCode": 400,
                    "error": "Erro de validação",
                    "message": "Arquivo inválido: O arquivo enviado não é uma mídia válida. Por favor, envie um arquivo de imagem (JPEG, PNG, WebP) ou vídeo (MP4).",
                    "field": "arquivo.txt"
                  }
                },
                "arquivo_muito_grande": {
                  "summary": "Arquivo excede tamanho máximo",
                  "value": {
                    "statusCode": 400,
                    "error": "Erro de validação", 
                    "message": "Arquivo inválido: O arquivo não pode ser maior que 200MB.",
                    "field": "video_grande.mp4"
                  }
                },
                "nenhum_sucesso": {
                  "summary": "Nenhum arquivo foi processado com sucesso",
                  "value": {
                    "statusCode": 400,
                    "error": "Erro de validação",
                    "message": "Nenhum arquivo foi processado com sucesso."
                  }
                }
              }
            }
          }
        },
        "401": swaggerCommonResponses[401](),
        "403": swaggerCommonResponses[403](),
        "404": swaggerCommonResponses[404](),
        "500": swaggerCommonResponses[500]()
      }
    }
  },

  "/eventos/{eventoId}/midia/{midiaId}": {
    "delete": {
      "tags": ["Upload de Mídias"],
      "summary": "Deletar mídia específica do evento",
      "description": `Remove uma mídia específica do evento e exclui o arquivo físico do MinIO.
      
      **Regras de Negócio:**
      - Usuário deve estar autenticado
      - Apenas organizador ou colaborador com permissão pode deletar mídias
      - Remove o registro do banco de dados
      - Exclui o arquivo físico do MinIO
      - Retorna o evento atualizado
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
                "midia_deletada": {
                  "summary": "Mídia deletada com sucesso",
                  "value": {
                    "statusCode": 200,
                    "message": "Mídia '60b5f8c8d8f8f8f8f8f8f8fa' deletada com sucesso.",
                    "data": {
                      "_id": "60b5f8c8d8f8f8f8f8f8f8",
                      "titulo": "Evento Exemplo",
                      "midia": [
                        {
                          "_id": "60b5f8c8d8f8f8f8f8f8f8fb",
                          "midiTipo": "video",
                          "midiLink": "http://localhost:9000/eventos/60b5f8c8d8f8f8f8f8f8f8-video.mp4"
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
                "id_invalido": {
                  "summary": "ID do evento ou mídia inválido",
                  "value": {
                    "statusCode": 400,
                    "error": "Erro de validação",
                    "message": "ID inválido fornecido",
                    "details": []
                  }
                }
              }
            }
          }
        },
        "401": swaggerCommonResponses[401](),
        "403": swaggerCommonResponses[403](),
        "404": {
          "description": "Evento ou mídia não encontrada",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              },
              "examples": {
                "evento_nao_encontrado": {
                  "summary": "Evento não encontrado",
                  "value": {
                    "statusCode": 404,
                    "error": "Não encontrado",
                    "message": "Evento não encontrado."
                  }
                },
                "midia_nao_encontrada": {
                  "summary": "Mídia não encontrada no evento",
                  "value": {
                    "statusCode": 404,
                    "error": "Não encontrado",
                    "message": "Mídia não encontrada no evento"
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

export default uploadPaths;