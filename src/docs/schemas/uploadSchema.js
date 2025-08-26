import { deepCopy, generateExample } from '../utils/schemaGenerate.js';

// Schema para uma única mídia
const MidiaSchema = {
  type: "object",
  properties: {
    _id: {
      type: "string",
      description: "ID único da mídia",
      example: "507f1f77bcf86cd799439012"
    },
    url: {
      type: "string",
      description: "URL relativa da mídia no servidor",
      example: "/uploads/capa/1673432100000-capa.jpg"
    },
    tamanhoMb: {
      type: "number",
      description: "Tamanho do arquivo em MB",
      example: 2.45
    },
    altura: {
      type: "number",
      description: "Altura da mídia em pixels",
      example: 720
    },
    largura: {
      type: "number",
      description: "Largura da mídia em pixels",
      example: 1280
    }
  },
  required: ["_id", "url", "tamanhoMb", "altura", "largura"]
};

// Definição original do uploadSchemas
const uploadSchemas = {
  UploadResponse: {
    type: "object",
    properties: {
      _id: {
        type: "string",
        description: "ID do evento",
        example: "507f1f77bcf86cd799439011"
      },
      midiaCapa: {
        type: "array",
        items: MidiaSchema,
        description: "Array de mídias de capa (máximo 1)",
        example: [
          {
            "_id": "507f1f77bcf86cd799439012",
            "url": "/uploads/capa/1673432100000-capa.jpg",
            "tamanhoMb": 2.45,
            "altura": 720,
            "largura": 1280
          }
        ]
      },
      midiaVideo: {
        type: "array",
        items: MidiaSchema,
        description: "Array de mídias de vídeo (máximo 1)",
        example: [
          {
            "_id": "507f1f77bcf86cd799439013",
            "url": "/uploads/video/1673432100000-video.mp4",
            "tamanhoMb": 25.8,
            "altura": 720,
            "largura": 1280
          }
        ]
      },
      midiaCarrossel: {
        type: "array",
        items: MidiaSchema,
        description: "Array de mídias do carrossel (múltiplas)",
        example: [
          {
            "_id": "507f1f77bcf86cd799439014",
            "url": "/uploads/carrossel/1673432100000-img1.jpg",
            "tamanhoMb": 1.85,
            "altura": 720,
            "largura": 1280
          },
          {
            "_id": "507f1f77bcf86cd799439015",
            "url": "/uploads/carrossel/1673432100000-img2.jpg",
            "tamanhoMb": 2.12,
            "altura": 720,
            "largura": 1280
          }
        ]
      }
    },
    required: ["_id"]
  },
  
  MidiasEventoResponse: {
    type: "object",
    properties: {
      capa: {
        type: "array",
        items: MidiaSchema,
        description: "Array de mídias de capa",
        example: [
          {
            "_id": "507f1f77bcf86cd799439012",
            "url": "/uploads/capa/1673432100000-capa.jpg",
            "tamanhoMb": 2.45,
            "altura": 720,
            "largura": 1280
          }
        ]
      },
      carrossel: {
        type: "array",
        items: MidiaSchema,
        description: "Array de mídias do carrossel",
        example: [
          {
            "_id": "507f1f77bcf86cd799439014",
            "url": "/uploads/carrossel/1673432100000-img1.jpg",
            "tamanhoMb": 1.85,
            "altura": 720,
            "largura": 1280
          },
          {
            "_id": "507f1f77bcf86cd799439015",
            "url": "/uploads/carrossel/1673432100000-img2.jpg",
            "tamanhoMb": 2.12,
            "altura": 720,
            "largura": 1280
          }
        ]
      },
      video: {
        type: "array",
        items: MidiaSchema,
        description: "Array de mídias de vídeo",
        example: [
          {
            "_id": "507f1f77bcf86cd799439013",
            "url": "/uploads/video/1673432100000-video.mp4",
            "tamanhoMb": 25.8,
            "altura": 720,
            "largura": 1280
          }
        ]
      }
    },
    required: ["capa", "carrossel", "video"]
  },
  
  DeleteMidiaResponse: {
    type: "object",
    allOf: [
      MidiaSchema,
      {
        description: "Dados da mídia deletada"
      }
    ]
  },
  
  MidiaCapaResponse: {
    type: "object",
    properties: {
      midiaCapa: {
        type: "array",
        items: MidiaSchema,
        description: "Array de mídias de capa do evento",
        example: [
          {
            "_id": "507f1f77bcf86cd799439012",
            "url": "/uploads/capa/1673432100000-capa.jpg",
            "tamanhoMb": 2.45,
            "altura": 720,
            "largura": 1280
          }
        ]
      }
    },
    required: ["midiaCapa"]
  },
  
  MidiaVideoResponse: {
    type: "object",
    properties: {
      midiaVideo: {
        type: "array",
        items: MidiaSchema,
        description: "Array de mídias de vídeo do evento",
        example: [
          {
            "_id": "507f1f77bcf86cd799439013",
            "url": "/uploads/video/1673432100000-video.mp4",
            "tamanhoMb": 25.8,
            "altura": 720,
            "largura": 1280
          }
        ]
      }
    },
    required: ["midiaVideo"]
  },
  
  MidiaCarrosselResponse: {
    type: "object",
    properties: {
      midiaCarrossel: {
        type: "array",
        items: MidiaSchema,
        description: "Array de mídias do carrossel do evento",
        example: [
          {
            "_id": "507f1f77bcf86cd799439014",
            "url": "/uploads/carrossel/1673432100000-img1.jpg",
            "tamanhoMb": 1.85,
            "altura": 720,
            "largura": 1280
          },
          {
            "_id": "507f1f77bcf86cd799439015",
            "url": "/uploads/carrossel/1673432100000-img2.jpg",
            "tamanhoMb": 2.12,
            "altura": 720,
            "largura": 1280
          }
        ]
      }
    },
    required: ["midiaCarrossel"]
  }
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
  MidiaSchema
};
