// src/docs/swaggerCommonResponses.js

import HttpStatusCodes from "../../utils/helpers/HttpStatusCodes.js";

const swaggerCommonResponses = {};

// Percorre todas as chaves do HttpStatusCodes e cria dinamicamente
// um método para cada status code, seguindo a estrutura real do CommonResponse.
Object.keys(HttpStatusCodes).forEach((statusKey) => {
    const { code, message } = HttpStatusCodes[statusKey];

    swaggerCommonResponses[code] = (schemaRef = null, description = message) => ({
        description,
        content: {
            "application/json": {
                schema: {
                    type: "object",
                    properties: {
                        error: { 
                            type: "boolean", 
                            example: code >= 400 
                        },
                        code: { 
                            type: "integer", 
                            example: code 
                        },
                        message: { 
                            type: "string", 
                            example: message 
                        },
                        data: schemaRef
                            ? { $ref: schemaRef }
                            : (code >= 400 ? { type: "object", nullable: true, example: null } : { type: "object", example: {} }),
                        errors: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    message: { type: "string" },
                                    field: { type: "string" },
                                    code: { type: "string" }
                                }
                            },
                            example: code >= 400 ? [{ message }] : [],
                        },
                    },
                },
            },
        },
    });
});

export default swaggerCommonResponses;
