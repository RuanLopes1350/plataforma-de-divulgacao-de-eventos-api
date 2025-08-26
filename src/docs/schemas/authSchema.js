import { deepCopy, generateExample } from '../utils/schemaGenerate.js';

// Definição original do authSchemas
const authSchemas = {
  RespostaRecuperaSenha: {
    type: "object",
    properties: {
      message: {
        type: "string",
        description: "Mensagem indicando o status da recuperação de senha",
        example: "Solicitação de recuperação de senha recebida. Um e-mail foi enviado com instruções."
      }
    },
  },
  RequisicaoRecuperaSenha: {
    type: "object",
    properties: {
      email: {
        type: "string",
        format: "email",
        description: "Endereço de email do usuário para recuperação de senha",
        example: "usuario@exemplo.com"
      }
    },
    required: ["email"]
  },
  loginPost: {
    type: "object",
    properties: {
      email: { 
        type: "string", 
        format: "email",
        description: "Email do usuário",
        example: "devMaster@gmail.com"
      },
      senha: { 
        type: "string", 
        description: "Senha do usuário",
        example: "ABab@123456"
      }
    },
    required: ["email", "senha"]
  },
  signupPost: {
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
      }
    },
    required: ["nome", "email", "senha"]
  },
  signupPostDetalhes: {
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
  UsuarioRespostaLogin: {
    type: "object",
    properties: {
      user: {
        type: "object",
        properties: {
          accesstoken: {
            type: "string",
            description: "Token de acesso JWT",
            example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
          },
          refreshtoken: {
            type: "string",
            description: "Token de atualização JWT",
            example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
          },
          _id: {
            type: "string",
            description: "ID único do usuário",
            example: "507f1f77bcf86cd799439011"
          },
          nome: {
            type: "string",
            description: "Nome do usuário",
            example: "Luis Felipe Lopes"
          },
          email: {
            type: "string",
            format: "email",
            description: "Email do usuário",
            example: "devMaster@gmail.com"
          },
          status: {
            type: "string",
            enum: ["ativo", "inativo"],
            description: "Status do usuário",
            example: "ativo"
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            description: "Data de última atualização",
            example: "2025-07-08T21:53:34.709Z"
          }
        }
      }
    }
  },
  RespostaRefresh: {
    type: "object",
    properties: {
      user: {
        type: "object",
        properties: {
          accesstoken: {
            type: "string",
            description: "Novo token de acesso JWT",
            example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
          },
          refreshtoken: {
            type: "string",
            description: "Token de atualização JWT",
            example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
          },
          _id: {
            type: "string",
            description: "ID único do usuário",
            example: "678ef123456789abcdef1234"
          },
          nome: {
            type: "string",
            description: "Nome completo do usuário",
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
            description: "Status do usuário",
            example: "ativo"
          },
          createdAt: {
            type: "string",
            format: "date-time",
            description: "Data de criação",
            example: "2025-07-08T21:32:36.184Z"
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            description: "Data de última atualização",
            example: "2025-07-08T21:53:34.709Z"
          }
        }
      }
    }
  }
};

const addExamples = async () => {
  for (const key of Object.keys(authSchemas)) {
    const schema = authSchemas[key];
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

export default authSchemas;
