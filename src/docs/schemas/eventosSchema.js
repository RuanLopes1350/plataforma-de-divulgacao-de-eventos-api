import { deepCopy, generateExample } from '../utils/schemaGenerate.js';

// Definição original do eventosSchemas
const eventosSchemas = {
  EventoPost: {
    type: "object",
    properties: {
      titulo: {
        type: "string",
        description: "Título do evento",
        example: "Semana de Tecnologia 2025"
      },
      descricao: {
        type: "string",
        description: "Descrição do evento",
        example: "Evento de tecnologia com palestras e workshops"
      },
      local: {
        type: "string",
        description: "Local do evento",
        example: "Centro de Convenções"
      },
      dataInicio: {
        type: "string",
        format: "date-time",
        description: "Data e hora de início do evento",
        example: "2025-08-15T10:00:00.000Z"
      },
      dataFim: {
        type: "string",
        format: "date-time",
        description: "Data e hora de fim do evento",
        example: "2025-08-15T18:00:00.000Z"
      },
      exibDia: {
        type: "string",
        description: "Dias da semana em que o evento será exibido (separados por vírgula)",
        example: "segunda,terca,quarta,quinta,sexta",
        enum: ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo,segunda", "segunda,terca", "terca,quarta", "quarta,quinta", "quinta,sexta", "sexta,sabado", "sabado,domingo", "segunda,terca,quarta", "terca,quarta,quinta", "quarta,quinta,sexta", "quinta,sexta,sabado", "segunda,terca,quarta,quinta,sexta", "segunda,terca,quarta,quinta,sexta,sabado", "domingo,segunda,terca,quarta,quinta,sexta,sabado"]
      },
      exibManha: {
        type: "boolean",
        description: "Se o evento será exibido pela manhã",
        example: true
      },
      exibTarde: {
        type: "boolean",
        description: "Se o evento será exibido pela tarde",
        example: true
      },
      exibNoite: {
        type: "boolean",
        description: "Se o evento será exibido pela noite",
        example: false
      },
      exibInicio: {
        type: "string",
        format: "date-time",
        description: "Data e hora de início da exibição do evento no totem",
        example: "2025-08-10T00:00:00.000Z"
      },
      exibFim: {
        type: "string",
        format: "date-time",
        description: "Data e hora de fim da exibição do evento no totem",
        example: "2025-08-20T23:59:59.000Z"
      },
      link: {
        type: "string",
        description: "Link para inscrição ou mais informações do evento",
        example: "https://exemplo.com/inscricao"
      },
      categoria: {
        type: "string",
        enum: [
          "academico", "palestra", "workshop", "seminario", "congresso", "minicurso",
          "cultural", "esportivo", "social", "cientifico", "extensao", "pesquisa",
          "feira", "mostra", "competicao", "formatura", "vestibular", "enem",
          "institucional", "outros"
        ],
        description: "Categoria do evento",
        example: "palestra"
      },
      tags: {
        type: "array",
        items: {
          type: "string"
        },
        description: "Tags do evento (array de strings obrigatório)",
        example: ["tecnologia", "inovação", "palestras"]
      },
      cor: {
        type: "integer",
        minimum: 0,
        description: "Código numérico da cor do evento (padrão: 0)",
        example: 3,
        default: 0
      },
      animacao: {
        type: "integer",
        minimum: 0,
        description: "Código numérico da animação do evento (padrão: 0)",
        example: 1,
        default: 0
      },
      status: {
        type: "integer",
        enum: [0, 1],
        description: "Status do evento (0 = inativo, 1 = ativo) (padrão: 0)",
        example: 1,
        default: 0
      },
      midia: {
        type: "array",
        items: {
          type: "object",
          properties: {
            midiTipo: {
              type: "string",
              description: "Tipo da mídia (capa, video, carrossel)",
              example: "capa",
              enum: ["capa", "video", "carrossel"]
            },
            midiLink: {
              type: "string",
              description: "Link/caminho da mídia",
              example: "/uploads/eventos/507f1f77bcf86cd799439011/capa.jpg"
            }
          },
          required: ["midiTipo", "midiLink"]
        },
        description: "Mídias do evento (array de objetos)",
        example: []
      }
    },
    required: ["titulo", "descricao", "local", "dataInicio", "dataFim", "exibDia", "exibManha", "exibTarde", "exibNoite", "exibInicio", "exibFim", "categoria", "tags"]
  },
  EventoDetalhes: {
    type: "object",
    properties: {
      _id: {
        type: "string",
        description: "ID único do evento",
        example: "507f1f77bcf86cd799439011"
      },
      titulo: {
        type: "string",
        description: "Título do evento",
        example: "Semana de Tecnologia 2025"
      },
      descricao: {
        type: "string",
        description: "Descrição do evento",
        example: "Evento de tecnologia com palestras e workshops"
      },
      local: {
        type: "string",
        description: "Local do evento",
        example: "Centro de Convenções"
      },
      dataInicio: {
        type: "string",
        format: "date-time",
        description: "Data e hora de início do evento",
        example: "2025-08-15T10:00:00.000Z"
      },
      dataFim: {
        type: "string",
        format: "date-time",
        description: "Data e hora de fim do evento",
        example: "2025-08-15T18:00:00.000Z"
      },
      exibDia: {
        type: "string",
        description: "Dias da semana em que o evento será exibido (separados por vírgula)",
        example: "segunda,terca,quarta,quinta,sexta"
      },
      exibManha: {
        type: "boolean",
        description: "Se o evento será exibido pela manhã",
        example: true
      },
      exibTarde: {
        type: "boolean",
        description: "Se o evento será exibido pela tarde",
        example: true
      },
      exibNoite: {
        type: "boolean",
        description: "Se o evento será exibido pela noite",
        example: false
      },
      exibInicio: {
        type: "string",
        format: "date-time",
        description: "Data e hora de início da exibição do evento no totem",
        example: "2025-08-10T00:00:00.000Z"
      },
      exibFim: {
        type: "string",
        format: "date-time",
        description: "Data e hora de fim da exibição do evento no totem",
        example: "2025-08-20T23:59:59.000Z"
      },
      organizador: {
        type: "object",
        properties: {
          _id: {
            type: "string",
            description: "ID do organizador",
            example: "507f1f77bcf86cd799439011"
          },
          nome: {
            type: "string",
            description: "Nome do organizador",
            example: "João Silva"
          }
        }
      },
      link: {
        type: "string",
        description: "Link para inscrição ou mais informações do evento",
        example: "https://exemplo.com/inscricao"
      },
      categoria: {
        type: "string",
        enum: [
          "academico", "palestra", "workshop", "seminario", "congresso", "minicurso",
          "cultural", "esportivo", "social", "cientifico", "extensao", "pesquisa",
          "feira", "mostra", "competicao", "formatura", "vestibular", "enem",
          "institucional", "outros"
        ],
        description: "Categoria do evento",
        example: "palestra"
      },
      tags: {
        type: "array",
        items: {
          type: "string"
        },
        description: "Tags do evento",
        example: ["tecnologia", "inovação", "palestras"]
      },
      cor: {
        type: "integer",
        minimum: 0,
        description: "Código numérico da cor do evento",
        example: 3
      },
      animacao: {
        type: "integer",
        minimum: 0,
        description: "Código numérico da animação do evento",
        example: 1
      },
      status: {
        type: "integer",
        enum: [0, 1],
        description: "Status do evento (0 = inativo, 1 = ativo)",
        example: 1
      },
      midia: {
        type: "array",
        items: {
          type: "object",
          properties: {
            midiTipo: {
              type: "string",
              description: "Tipo da mídia (capa, video, carrossel)",
              example: "capa",
              enum: ["capa", "video", "carrossel"]
            },
            midiLink: {
              type: "string",
              description: "Link/caminho da mídia",
              example: "/uploads/eventos/507f1f77bcf86cd799439011/capa.jpg"
            }
          }
        },
        description: "Mídias do evento",
        example: []
      },
      permissoes: {
        type: "array",
        items: {
          type: "object",
          properties: {
            usuario: {
              type: "string",
              description: "ID do usuário com permissão",
              example: "507f1f77bcf86cd799439011"
            },
            permissao: {
              type: "string",
              enum: ["editar"],
              description: "Tipo de permissão",
              example: "editar"
            },
            expiraEm: {
              type: "string",
              format: "date-time",
              description: "Data de expiração da permissão",
              example: "2025-12-31T23:59:59.000Z"
            }
          }
        },
        description: "Permissões do evento",
        example: []
      },
      createdAt: {
        type: "string",
        format: "date-time",
        description: "Data de criação do evento",
        example: "2025-07-08T21:35:10.742Z"
      },
      updatedAt: {
        type: "string",
        format: "date-time",
        description: "Data de última atualização",
        example: "2025-07-08T21:35:10.742Z"
      }
    }
  },
  EventoUpdate: {
    type: "object",
    properties: {
      titulo: {
        type: "string",
        description: "Título do evento",
        example: "Semana de Tecnologia 2025 - Atualizado"
      },
      descricao: {
        type: "string",
        description: "Descrição do evento",
        example: "Evento de tecnologia com palestras e workshops atualizadas"
      },
      local: {
        type: "string",
        description: "Local do evento",
        example: "Centro de Convenções - Novo Local"
      },
      dataInicio: {
        type: "string",
        format: "date-time",
        description: "Data e hora de início do evento",
        example: "2025-08-20T14:00:00.000Z"
      },
      dataFim: {
        type: "string",
        format: "date-time",
        description: "Data e hora de fim do evento",
        example: "2025-08-20T18:00:00.000Z"
      },
      exibDia: {
        type: "string",
        description: "Dias da semana em que o evento será exibido (separados por vírgula)",
        example: "segunda,terca,quarta,quinta,sexta,sabado"
      },
      exibManha: {
        type: "boolean",
        description: "Se o evento será exibido pela manhã",
        example: true
      },
      exibTarde: {
        type: "boolean",
        description: "Se o evento será exibido pela tarde",
        example: true
      },
      exibNoite: {
        type: "boolean",
        description: "Se o evento será exibido pela noite",
        example: true
      },
      exibInicio: {
        type: "string",
        format: "date-time",
        description: "Data e hora de início da exibição do evento no totem",
        example: "2025-08-15T00:00:00.000Z"
      },
      exibFim: {
        type: "string",
        format: "date-time",
        description: "Data e hora de fim da exibição do evento no totem",
        example: "2025-08-25T23:59:59.000Z"
      },
      link: {
        type: "string",
        description: "Link para inscrição ou mais informações do evento",
        example: "https://exemplo.com/nova-inscricao"
      },
      categoria: {
        type: "string",
        enum: [
          "academico", "palestra", "workshop", "seminario", "congresso", "minicurso",
          "cultural", "esportivo", "social", "cientifico", "extensao", "pesquisa",
          "feira", "mostra", "competicao", "formatura", "vestibular", "enem",
          "institucional", "outros"
        ],
        description: "Categoria do evento",
        example: "workshop"
      },
      tags: {
        type: "array",
        items: {
          type: "string"
        },
        description: "Tags do evento",
        example: ["tecnologia", "inovação", "workshops"]
      },
      cor: {
        type: "integer",
        minimum: 0,
        description: "Código numérico da cor do evento",
        example: 5
      },
      animacao: {
        type: "integer",
        minimum: 0,
        description: "Código numérico da animação do evento",
        example: 2
      },
      status: {
        type: "integer",
        enum: [0, 1],
        description: "Status do evento (0 = inativo, 1 = ativo)",
        example: 1
      },
      midia: {
        type: "array",
        items: {
          type: "object",
          properties: {
            midiTipo: {
              type: "string",
              description: "Tipo da mídia (capa, video, carrossel)",
              example: "capa",
              enum: ["capa", "video", "carrossel"]
            },
            midiLink: {
              type: "string",
              description: "Link/caminho da mídia",
              example: "/uploads/eventos/507f1f77bcf86cd799439011/nova-capa.jpg"
            }
          },
          required: ["midiTipo", "midiLink"]
        },
        description: "Mídias do evento",
        example: []
      }
    }
  },
  EventoStatusUpdate: {
    type: "object",
    properties: {
      status: {
        type: "integer",
        enum: [0, 1],
        description: "Novo status do evento (0 = inativo, 1 = ativo)",
        example: 1
      }
    },
    required: ["status"]
  },
  EventoCompartilhamento: {
    type: "object",
    properties: {
      email: {
        type: "string",
        format: "email",
        description: "Email do usuário para compartilhar permissão",
        example: "usuario@exemplo.com"
      }
    },
    required: ["email"]
  },
  // Schemas adicionais necessários para resolver os erros do Swagger
  EventoCadastro: {
    "$ref": "#/components/schemas/EventoPost"
  },

  EventoCadastroResponse: {
    "$ref": "#/components/schemas/EventoDetalhes"
  },
  EventoDetalheResponse: {
    type: "object",
    properties: {
      error: {
        type: "boolean",
        example: false
      },
      code: {
        type: "integer",
        example: 200
      },
      message: {
        type: "string",
        example: "Evento recuperado com sucesso"
      },
      data: {
        "$ref": "#/components/schemas/EventoDetalhes"
      },
      errors: {
        type: "array",
        example: []
      }
    }
  },
  EventosListaResponse: {
    type: "object",
    properties: {
      error: {
        type: "boolean",
        example: false
      },
      code: {
        type: "integer", 
        example: 200
      },
      message: {
        type: "string",
        example: "Eventos recuperados com sucesso"
      },
      data: {
        type: "object",
        properties: {
          eventos: {
            type: "array",
            items: {
              "$ref": "#/components/schemas/EventoDetalhes"
            }
          },
          pagination: {
            type: "object",
            properties: {
              currentPage: {
                type: "integer",
                example: 1
              },
              totalPages: {
                type: "integer",
                example: 5
              },
              totalItems: {
                type: "integer",
                example: 47
              },
              itemsPerPage: {
                type: "integer",
                example: 10
              }
            }
          }
        }
      },
      errors: {
        type: "array",
        example: []
      }
    }
  },
  QRCodeResponse: {
    type: "object",
    properties: {
      error: {
        type: "boolean",
        example: false
      },
      code: {
        type: "integer",
        example: 200
      },
      message: {
        type: "string", 
        example: "QR Code gerado com sucesso"
      },
      data: {
        type: "object",
        properties: {
          eventoId: {
            type: "string",
            example: "60b5f8c8d8f8f8f8f8f8f8"
          },
          link: {
            type: "string",
            example: "https://exemplo.com/inscricao"
          },
          qrcode: {
            type: "string",
            description: "QR Code em formato base64",
            example: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6e..."
          }
        }
      },
      errors: {
        type: "array",
        example: []
      }
    }
  },
  EventoAtualizacao: {
    "$ref": "#/components/schemas/EventoUpdate"
  },
  EventoStatusAtualizacao: {
    "$ref": "#/components/schemas/EventoStatusUpdate"
  },
  SuccessResponse: {
    type: "object",
    properties: {
      error: {
        type: "boolean",
        example: false
      },
      code: {
        type: "integer",
        example: 200
      },
      message: {
        type: "string",
        example: "Operação realizada com sucesso"
      },
      data: {
        type: "object"
      },
      errors: {
        type: "array",
        example: []
      }
    }
  },
  ErrorResponse: {
    type: "object",
    properties: {
      error: {
        type: "boolean",
        example: true
      },
      code: {
        type: "integer",
        example: 400
      },
      message: {
        type: "string",
        example: "Erro de validação"
      },
      data: {
        type: "object",
        nullable: true,
        example: null
      },
      errors: {
        type: "array",
        items: {
          type: "object",
          properties: {
            field: {
              type: "string"
            },
            message: {
              type: "string"
            }
          }
        },
        example: [
          {
            "field": "titulo",
            "message": "Título é obrigatório"
          }
        ]
      }
    }
  }
};

const addExamples = async () => {
  for (const key of Object.keys(eventosSchemas)) {
    const schema = eventosSchemas[key];
    if (schema.properties) {
      for (const [propKey, propertySchema] of Object.entries(schema.properties)) {
        if (!propertySchema.example) {
          propertySchema.example = await generateExample(propertySchema, propKey);
        }
      }
    }
    if (!schema.example) {
      schema.example = await generateExample(schema);
    }
  }
};

await addExamples();

export default eventosSchemas;
