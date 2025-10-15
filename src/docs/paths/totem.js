// src/docs/paths/totem.js

import swaggerCommonResponses from "../schemas/swaggerCommonResponses.js";

const totemPath = {
  "/totem/eventos": {
    "get": {
      "tags": ["Totem"],
      "summary": "Listar eventos para exibição no totem",
      "description": `**ROTA PÚBLICA** - Retorna eventos ativos que devem ser exibidos no totem no momento atual, considerando configurações de exibição como período do dia, dia da semana e intervalo de datas.
      
      **Caso de Uso:**
      - Exibição automática de eventos em telas/totems de divulgação
      - Sistema de slideshow inteligente baseado em configurações temporais
      - Divulgação dinâmica de eventos para público geral
      
      **Função de Negócio:**
      - Permitir que sistemas de totem obtenham automaticamente eventos relevantes para o momento atual
      - Não requer autenticação (rota pública para totems)
      - Sistema determina automaticamente dia da semana e período (manhã/tarde/noite)
      - Filtragem inteligente baseada em múltiplos critérios temporais
      
      **Regras de Negócio Aplicadas:**
      - **Status:** Apenas eventos com status 'ativo' (1)
      - **Período de Exibição:** Evento deve estar dentro do intervalo \`exibInicio\` e \`exibFim\`
      - **Dia da Semana:** Sistema verifica se o dia atual está no campo \`exibDia\` do evento
      - **Período do Dia:** Sistema verifica configuração específica:
        - Manhã (6h-12h): verifica campo \`exibManha\`
        - Tarde (12h-18h): verifica campo \`exibTarde\`
        - Noite (18h-6h): verifica campo \`exibNoite\`
      - **Mídias:** Evento deve ter pelo menos uma mídia cadastrada
      - **Ordenação:** Eventos são retornados ordenados por \`dataInicio\` (crescente)
      
      **Lógica Automática do Sistema:**
      1. Detecta data/hora atual do servidor
      2. Determina dia da semana (domingo, segunda, terça, etc.)
      3. Determina período do dia (manhã, tarde ou noite)
      4. Filtra eventos que atendem TODOS os critérios acima
      5. Retorna apenas campos necessários para exibição no totem
      
      **Campos Retornados:**
      - \`titulo\`: Título do evento
      - \`descricao\`: Descrição do evento
      - \`local\`: Local onde ocorrerá
      - \`dataInicio\`: Data/hora de início
      - \`dataFim\`: Data/hora de término
      - \`midia\`: Array com mídias (imagens/vídeos) para exibição
      - \`cor\`: Cor personalizada (opcional)
      - \`animacao\`: Configurações de animação (opcional)
      
      **Exemplo de Uso:**
      - Totem faz requisição a cada 5-10 minutos para atualizar slideshow
      - Sistema retorna apenas eventos que devem ser exibidos agora
      - Totem exibe as mídias em rotação (slideshow)
      
      **Observações Importantes:**
      - Rota não aceita parâmetros (tudo é automático)
      - Retorno vazio indica que não há eventos para exibir no momento
      - Ideal para sistemas de exibição automática sem intervenção manual
      - Configurações temporais são definidas no cadastro do evento`,
      "responses": {
        "200": {
          "description": "Lista de eventos para totem recuperada com sucesso",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "error": {
                    "type": "boolean",
                    "example": false
                  },
                  "code": {
                    "type": "integer",
                    "example": 200
                  },
                  "message": {
                    "type": "string",
                    "example": "Requisição bem-sucedida"
                  },
                  "data": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "_id": {
                          "type": "string",
                          "description": "ID único do evento",
                          "example": "60b5f8c8d8f8f8f8f8f8f8f8"
                        },
                        "titulo": {
                          "type": "string",
                          "description": "Título do evento",
                          "example": "Workshop de Node.js"
                        },
                        "descricao": {
                          "type": "string",
                          "description": "Descrição detalhada do evento",
                          "example": "Aprenda Node.js do zero ao avançado"
                        },
                        "local": {
                          "type": "string",
                          "description": "Local onde o evento ocorrerá",
                          "example": "Centro de Convenções - Sala 101"
                        },
                        "dataInicio": {
                          "type": "string",
                          "format": "date-time",
                          "description": "Data e hora de início do evento",
                          "example": "2024-01-15T10:00:00.000Z"
                        },
                        "dataFim": {
                          "type": "string",
                          "format": "date-time",
                          "description": "Data e hora de término do evento",
                          "example": "2024-01-15T18:00:00.000Z"
                        },
                        "midia": {
                          "type": "array",
                          "description": "Array com mídias (imagens/vídeos) do evento",
                          "items": {
                            "type": "object",
                            "properties": {
                              "_id": {
                                "type": "string",
                                "example": "60b5f8c8d8f8f8f8f8f8f8fa"
                              },
                              "url": {
                                "type": "string",
                                "description": "URL da mídia",
                                "example": "/uploads/eventos/60b5f8c8d8f8f8f8f8f8f8/imagem.jpg"
                              },
                              "tipo": {
                                "type": "string",
                                "description": "Tipo de mídia",
                                "enum": ["imagem", "video"],
                                "example": "imagem"
                              },
                              "filename": {
                                "type": "string",
                                "description": "Nome do arquivo",
                                "example": "imagem.jpg"
                              }
                            }
                          }
                        },
                        "cor": {
                          "type": "string",
                          "description": "Cor personalizada em hexadecimal (opcional)",
                          "example": "#FF5733",
                          "nullable": true
                        },
                        "animacao": {
                          "type": "string",
                          "description": "Tipo de animação para exibição (opcional)",
                          "example": "fade",
                          "nullable": true
                        }
                      }
                    }
                  },
                  "errors": {
                    "type": "array",
                    "example": []
                  }
                }
              },
              "examples": {
                "eventos_disponiveis": {
                  "summary": "Eventos disponíveis para exibição",
                  "description": "Exemplo de resposta com eventos que devem ser exibidos no totem no momento da requisição",
                  "value": {
                    "error": false,
                    "code": 200,
                    "message": "Requisição bem-sucedida",
                    "data": [
                      {
                        "_id": "60b5f8c8d8f8f8f8f8f8f8f8",
                        "titulo": "Workshop de Node.js",
                        "descricao": "Aprenda Node.js do zero ao avançado com instrutor certificado",
                        "local": "Centro de Convenções - Sala 101",
                        "dataInicio": "2024-01-15T14:00:00.000Z",
                        "dataFim": "2024-01-15T18:00:00.000Z",
                        "midia": [
                          {
                            "_id": "60b5f8c8d8f8f8f8f8f8f8fa",
                            "url": "/uploads/eventos/60b5f8c8d8f8f8f8f8f8f8/workshop_nodejs.jpg",
                            "tipo": "imagem",
                            "filename": "workshop_nodejs.jpg"
                          },
                          {
                            "_id": "60b5f8c8d8f8f8f8f8f8f8fb",
                            "url": "/uploads/eventos/60b5f8c8d8f8f8f8f8f8f8/nodejs_promo.mp4",
                            "tipo": "video",
                            "filename": "nodejs_promo.mp4"
                          }
                        ],
                        "cor": "#68D391",
                        "animacao": "fade"
                      },
                      {
                        "_id": "60b5f8c8d8f8f8f8f8f8f8f9",
                        "titulo": "Feira de Ciências 2024",
                        "descricao": "Exposição anual de projetos científicos e tecnológicos",
                        "local": "Auditório Central",
                        "dataInicio": "2024-01-15T08:00:00.000Z",
                        "dataFim": "2024-01-15T17:00:00.000Z",
                        "midia": [
                          {
                            "_id": "60b5f8c8d8f8f8f8f8f8f8fc",
                            "url": "/uploads/eventos/60b5f8c8d8f8f8f8f8f8f9/feira_ciencias.jpg",
                            "tipo": "imagem",
                            "filename": "feira_ciencias.jpg"
                          }
                        ],
                        "cor": "#4299E1",
                        "animacao": "slide"
                      }
                    ],
                    "errors": []
                  }
                },
                "nenhum_evento": {
                  "summary": "Nenhum evento disponível",
                  "description": "Resposta quando não há eventos que atendem os critérios de exibição no momento",
                  "value": {
                    "error": false,
                    "code": 200,
                    "message": "Requisição bem-sucedida",
                    "data": [],
                    "errors": []
                  }
                },
                "periodo_manha": {
                  "summary": "Eventos do período da manhã",
                  "description": "Exemplo de eventos retornados durante o período da manhã (6h-12h)",
                  "value": {
                    "error": false,
                    "code": 200,
                    "message": "Requisição bem-sucedida",
                    "data": [
                      {
                        "_id": "60b5f8c8d8f8f8f8f8f8f8f7",
                        "titulo": "Palestra Motivacional",
                        "descricao": "Palestra sobre desenvolvimento pessoal e profissional",
                        "local": "Sala de Conferências A",
                        "dataInicio": "2024-01-15T09:00:00.000Z",
                        "dataFim": "2024-01-15T11:00:00.000Z",
                        "midia": [
                          {
                            "_id": "60b5f8c8d8f8f8f8f8f8f8fd",
                            "url": "/uploads/eventos/60b5f8c8d8f8f8f8f8f8f7/palestra_capa.jpg",
                            "tipo": "imagem",
                            "filename": "palestra_capa.jpg"
                          }
                        ],
                        "cor": "#F6AD55",
                        "animacao": "zoom"
                      }
                    ],
                    "errors": []
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
                    "error": true,
                    "code": 500,
                    "message": "Erro interno",
                    "data": null,
                    "errors": [
                      {
                        "message": "Ocorreu um erro inesperado ao buscar eventos para o totem"
                      }
                    ]
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

export default totemPath;
