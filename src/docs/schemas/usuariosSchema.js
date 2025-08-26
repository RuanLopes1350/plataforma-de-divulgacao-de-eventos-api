import { deepCopy, generateExample } from '../utils/schemaGenerate.js';

// Definição original do usuariosSchemas
const usuariosSchemas = {
  UsuarioPost: {
    type: "object",
    properties: {
      nome: {
        type: "string",
        description: "Nome do usuário",
        example: "João Silva"
      },
      email: {
        type: "string",
        format: "email",
        description: "Email do usuário",
        example: "joao@exemplo.com"
      },
      senha: {
        type: "string",
        description: "Senha do usuário",
        example: "MinhaSenh@123"
      },
      status: {
        type: "string",
        enum: ["ativo", "inativo"],
        description: "Status do usuário",
        example: "ativo"
      }
    },
    required: ["nome", "email", "senha"]
  },
  UsuarioDetalhes: {
    type: "object",
    properties: {
      _id: {
        type: "string",
        description: "ID único do usuário",
        example: "507f1f77bcf86cd799439011"
      },
      nome: {
        type: "string",
        description: "Nome do usuário",
        example: "João Silva"
      },
      email: {
        type: "string",
        format: "email",
        description: "Email do usuário",
        example: "joao@exemplo.com"
      },
      status: {
        type: "string",
        enum: ["ativo", "inativo"],
        description: "Status do usuário",
        example: "ativo"
      },
      createdAt: {
        type: "string",
        format: "date-time",
        description: "Data de criação do usuário",
        example: "2025-07-08T21:32:36.184Z"
      },
      updatedAt: {
        type: "string",
        format: "date-time",
        description: "Data de última atualização do usuário",
        example: "2025-07-08T21:32:36.184Z"
      }
    }
  },
  UsuarioPutPatch: {
    type: "object",
    properties: {
      nome: {
        type: "string",
        description: "Nome do usuário",
        example: "João Silva Atualizado"
      },
      status: {
        type: "string",
        enum: ["ativo", "inativo"],
        description: "Status do usuário",
        example: "ativo"
      }
    }
  },
  UsuarioStatusUpdate: {
    type: "object",
    properties: {
      status: {
        type: "string",
        enum: ["ativo", "inativo"],
        description: "Novo status do usuário",
        example: "inativo"
      }
    },
    required: ["status"]
  }
};

const addExamples = async () => {
  for (const key of Object.keys(usuariosSchemas)) {
    const schema = usuariosSchemas[key];
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

export default usuariosSchemas;
