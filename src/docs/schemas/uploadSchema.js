import { deepCopy, generateExample } from '../utils/schemaGenerate.js';

// Schema para uma única mídia (nova estrutura)
const MidiaSchema = {
  type: "object",
  properties: {
    _id: {
      type: "string",
      description: "ID único da mídia",
      example: "507f1f77bcf86cd799439012"
    },
    midiTipo: {
      type: "string",
      enum: ["imagem", "video"],
      description: "Tipo da mídia determinado automaticamente pelo mimetype",
      example: "imagem"
    },
    midiLink: {
      type: "string",
      description: "URL pública da mídia no MinIO",
      example: "http://localhost:9000/eventos/507f1f77bcf86cd799439012-foto.jpg"
    }
  },
  required: ["_id", "midiTipo", "midiLink"]
};

// Schema para resultado individual de upload
const ResultadoUploadSchema = {
  type: "object",
  properties: {
    arquivo: {
      type: "string",
      description: "Nome original do arquivo",
      example: "foto.jpg"
    },
    status: {
      type: "string",
      enum: ["sucesso", "erro"],
      description: "Status do processamento do arquivo",
      example: "sucesso"
    },
    url: {
      type: "string",
      description: "URL pública da mídia (apenas para sucessos)",
      example: "http://localhost:9000/eventos/507f1f77bcf86cd799439012-foto.jpg"
    },
    tipo: {
      type: "string",
      enum: ["imagem", "video"],
      description: "Tipo da mídia (apenas para sucessos)",
      example: "imagem"
    },
    erro: {
      type: "string",
      description: "Mensagem de erro (apenas para erros)",
      example: "O arquivo enviado não é uma mídia válida."
    }
  },
  required: ["arquivo", "status"]
};

// Schema de resposta para upload múltiplo
const MultipleUploadResponse = {
  type: "object",
  properties: {
    statusCode: {
      type: "number",
      description: "Código de status HTTP",
      example: 200
    },
    message: {
      type: "string",
      description: "Mensagem de resposta",
      example: "3 de 3 arquivo(s) adicionado(s) com sucesso."
    },
    data: {
      type: "object",
      properties: {
        evento: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              description: "ID do evento",
              example: "60b5f8c8d8f8f8f8f8f8f8"
            },
            midia: {
              type: "array",
              items: MidiaSchema,
              description: "Array de mídias do evento atualizado"
            }
          }
        },
        resultados: {
          type: "array",
          items: ResultadoUploadSchema,
          description: "Relatório detalhado de cada arquivo processado"
        },
        totalProcessados: {
          type: "number",
          description: "Total de arquivos processados",
          example: 3
        },
        totalSucesso: {
          type: "number", 
          description: "Total de arquivos processados com sucesso",
          example: 3
        },
        totalErros: {
          type: "number",
          description: "Total de arquivos que falharam",
          example: 0
        }
      }
    }
  }
};

// Schema de resposta para deletar mídia
const DeleteMidiaResponse = {
  type: "object",
  properties: {
    statusCode: {
      type: "number",
      description: "Código de status HTTP",
      example: 200
    },
    message: {
      type: "string",
      description: "Mensagem de confirmação",
      example: "Mídia '60b5f8c8d8f8f8f8f8f8f8fa' deletada com sucesso."
    },
    data: {
      type: "object",
      properties: {
        _id: {
          type: "string",
          description: "ID do evento",
          example: "60b5f8c8d8f8f8f8f8f8f8"
        },
        titulo: {
          type: "string",
          description: "Título do evento",
          example: "Evento Exemplo"
        },
        midia: {
          type: "array",
          items: MidiaSchema,
          description: "Array de mídias restantes no evento"
        }
      }
    }
  }
};

const uploadSchemas = {
  MidiaSchema,
  ResultadoUploadSchema,
  MultipleUploadResponse,
  DeleteMidiaResponse
};

// Geração de examples dinâmicos
const generateUploadExamples = () => {
  const examples = {};
  
  // Gera exemplos para cada schema
  Object.keys(uploadSchemas).forEach(schemaName => {
    examples[schemaName] = generateExample(uploadSchemas[schemaName]);
  });
  
  return examples;
};

// Criação de cópias profundas para evitar mutações
const createDeepCopies = () => {
  const deepCopies = {};
  
  Object.keys(uploadSchemas).forEach(schemaName => {
    deepCopies[schemaName] = deepCopy(uploadSchemas[schemaName]);
  });
  
  return deepCopies;
};

// Exportação principal
export default uploadSchemas;

// Exportações adicionais para uso em outros módulos
export { 
  generateUploadExamples, 
  createDeepCopies,
  MidiaSchema,
  ResultadoUploadSchema,
  MultipleUploadResponse,
  DeleteMidiaResponse
};
