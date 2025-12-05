const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "TaskManager API",
    version: "1.0.0",
    description: "API do TaskManager (JWT + 2FA)"
  },
  servers: [
    { url: "http://localhost:3000", description: "Local server" }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    }
  },
  security: [{ bearerAuth: [] }],
  paths: {
    "/login": {
      post: {
        summary: "Login",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  username: { type: "string" },
                  senha: { type: "string" },
                  token2FA: { type: "string" }
                },
                required: ["username", "senha", "token2FA"]
              }
            }
          }
        },
        responses: {
          "200": { description: "JWT token returned" },
          "401": { description: "Unauthorized" }
        }
      }
    },
    "/registro": {
      post: {
        summary: "Criar usuário (apenas admin)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  username: { type: "string" },
                  senha: { type: "string" },
                  nivelAcesso: { type: "string", enum: ["visualizacao","gerencial","administrativo"] }
                },
                required: ["username","senha"]
              }
            }
          }
        },
        responses: { "201": { description: "Usuário criado" }, "400": { description: "Erro" }, "401": { description: "Unauthorized" } }
      }
    },
    "/usuarios": {
      get: {
        summary: "Listar todos os usuários (apenas admin)",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Lista de usuários" }, "403": { description: "Forbidden" } }
      },
      post: {
        summary: "Criar usuário (apenas admin)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object" }
            }
          }
        },
        responses: { "201": { description: "Criado" }, "400": { description: "Erro" } }
      }
    },
    "/tarefas": {
      get: {
        summary: "Listar tarefas (autenticado)",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Lista de tarefas" }, "401": { description: "Unauthorized" } }
      },
      post: {
        summary: "Criar tarefa (gerencial/admin)",
        security: [{ bearerAuth: [] }],
        requestBody: { required: true },
        responses: { "201": { description: "Criado" }, "403": { description: "Forbidden" } }
      }
    }
  }
};

export default swaggerDocument;
