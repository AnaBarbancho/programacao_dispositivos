import "reflect-metadata";
import request from "supertest";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { DataSource } from "typeorm";
import { Usuario, NivelAcesso } from "../../entities/Usuario";
import { Tarefa } from "../../entities/Tarefas";
import { AppDataSource } from "../../data-source";
import { authenticator } from "otplib";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../../config/jwt";
import bcrypt from "bcrypt";

// DataSource de teste
const TestDataSource = new DataSource({
    type: "sqlite",
    database: ":memory:",
    synchronize: true,
    dropSchema: true,
    logging: false,
    entities: [Usuario, Tarefa],
});

// Inicializar AppDataSource com TestDataSource para os testes
let app: express.Application;
let usuarioRoutes: any;
let tarefaRoutes: any;

describe("API Integration Tests", () => {
    let adminToken: string;
    let gerencialToken: string;
    let visualizacaoToken: string;
    let adminId: number;
    let gerencialId: number;
    let visualizacaoId: number;
    let adminSecret2FA: string;
    let gerencialSecret2FA: string;
    let visualizacaoSecret2FA: string;

    beforeAll(async () => {
        // Inicializar TestDataSource
        await TestDataSource.initialize();

        // Substituir AppDataSource para usar TestDataSource
        // Precisamos fazer isso antes de importar as rotas
        const originalGetRepository = AppDataSource.getRepository.bind(AppDataSource);
        (AppDataSource as any).isInitialized = true;
        (AppDataSource as any).getRepository = function(entity: any) {
            return TestDataSource.getRepository(entity);
        };
        (AppDataSource as any).manager = TestDataSource.manager;

        // Importar rotas após configurar o DataSource
        usuarioRoutes = (await import("../../routes/usuarioRoutes")).default;
        tarefaRoutes = (await import("../../routes/tarefaRoutes")).default;

        // Criar app de teste
        app = express();
        app.use(cors());
        app.use(bodyParser.json());
        app.use("/", usuarioRoutes);
        app.use("/", tarefaRoutes);

        // Criar usuários de teste com senhas reais
        const adminRepo = TestDataSource.getRepository(Usuario);
        const gerencialRepo = TestDataSource.getRepository(Usuario);
        const visualizacaoRepo = TestDataSource.getRepository(Usuario);

        // Admin
        adminSecret2FA = authenticator.generateSecret();
        const adminHash = await bcrypt.hash("admin123", 10);
        const admin = adminRepo.create({
            username: "admin",
            senhaHash: adminHash,
            secret2FA: adminSecret2FA,
            nivelAcesso: NivelAcesso.ADMINISTRATIVO
        });
        const savedAdmin = await adminRepo.save(admin);
        adminId = savedAdmin.id;
        adminToken = jwt.sign(
            { id: adminId, username: "admin", nivelAcesso: NivelAcesso.ADMINISTRATIVO },
            JWT_SECRET
        );

        // Gerencial
        gerencialSecret2FA = authenticator.generateSecret();
        const gerencialHash = await bcrypt.hash("gerencial123", 10);
        const gerencial = gerencialRepo.create({
            username: "gerencial",
            senhaHash: gerencialHash,
            secret2FA: gerencialSecret2FA,
            nivelAcesso: NivelAcesso.GERENCIAL
        });
        const savedGerencial = await gerencialRepo.save(gerencial);
        gerencialId = savedGerencial.id;
        gerencialToken = jwt.sign(
            { id: gerencialId, username: "gerencial", nivelAcesso: NivelAcesso.GERENCIAL },
            JWT_SECRET
        );

        // Visualização
        visualizacaoSecret2FA = authenticator.generateSecret();
        const visualizacaoHash = await bcrypt.hash("visualizacao123", 10);
        const visualizacao = visualizacaoRepo.create({
            username: "visualizacao",
            senhaHash: visualizacaoHash,
            secret2FA: visualizacaoSecret2FA,
            nivelAcesso: NivelAcesso.VISUALIZACAO
        });
        const savedVisualizacao = await visualizacaoRepo.save(visualizacao);
        visualizacaoId = savedVisualizacao.id;
        visualizacaoToken = jwt.sign(
            { id: visualizacaoId, username: "visualizacao", nivelAcesso: NivelAcesso.VISUALIZACAO },
            JWT_SECRET
        );
    });

    afterAll(async () => {
        await TestDataSource.destroy();
    });

    describe("POST /registro", () => {
        it("deve criar um novo usuário", async () => {
            const response = await request(app)
                .post("/registro")
                .send({
                    username: "novousuario",
                    senha: "senha123",
                    nivelAcesso: "visualizacao"
                });

            expect(response.status).toBe(201);
            expect(response.body.usuario.username).toBe("novousuario");
            expect(response.body.secret2FA).toBeDefined();
        });

        it("deve retornar erro se usuário já existe", async () => {
            await request(app)
                .post("/registro")
                .send({
                    username: "usuarioexistente",
                    senha: "senha123"
                });

            const response = await request(app)
                .post("/registro")
                .send({
                    username: "usuarioexistente",
                    senha: "senha123"
                });

            expect(response.status).toBe(400);
            expect(response.body.msg).toBe("Usuário já existe");
        });
    });

    describe("GET /usuarios", () => {
        it("deve listar usuários para admin", async () => {
            const response = await request(app)
                .get("/usuarios")
                .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        it("deve negar acesso para não-admin", async () => {
            const response = await request(app)
                .get("/usuarios")
                .set("Authorization", `Bearer ${gerencialToken}`);

            expect(response.status).toBe(403);
        });
    });

    describe("GET /usuarios/:id", () => {
        it("deve buscar usuário por ID para admin", async () => {
            const response = await request(app)
                .get(`/usuarios/${adminId}`)
                .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.id).toBe(adminId);
        });

        it("deve permitir usuário ver seu próprio perfil", async () => {
            const response = await request(app)
                .get(`/usuarios/${gerencialId}`)
                .set("Authorization", `Bearer ${gerencialToken}`);

            expect(response.status).toBe(200);
        });

        it("deve negar acesso para ver outro usuário", async () => {
            const response = await request(app)
                .get(`/usuarios/${adminId}`)
                .set("Authorization", `Bearer ${gerencialToken}`);

            expect(response.status).toBe(403);
        });
    });

    describe("PUT /usuarios/:id", () => {
        it("deve atualizar usuário para admin", async () => {
            const response = await request(app)
                .put(`/usuarios/${gerencialId}`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                    username: "gerencial_atualizado"
                });

            expect(response.status).toBe(200);
            expect(response.body.username).toBe("gerencial_atualizado");
        });

        it("deve permitir usuário atualizar seu próprio perfil", async () => {
            const response = await request(app)
                .put(`/usuarios/${gerencialId}`)
                .set("Authorization", `Bearer ${gerencialToken}`)
                .send({
                    username: "meu_novo_username"
                });

            expect(response.status).toBe(200);
        });
    });

    describe("DELETE /usuarios/:id", () => {
        it("deve deletar usuário para admin", async () => {
            // Criar usuário temporário
            const tempUser = TestDataSource.getRepository(Usuario).create({
                username: "temp_user",
                senhaHash: "hash",
                secret2FA: "secret",
                nivelAcesso: NivelAcesso.VISUALIZACAO
            });
            const saved = await TestDataSource.getRepository(Usuario).save(tempUser);

            const response = await request(app)
                .delete(`/usuarios/${saved.id}`)
                .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
        });

        it("deve negar acesso para não-admin", async () => {
            const response = await request(app)
                .delete(`/usuarios/${visualizacaoId}`)
                .set("Authorization", `Bearer ${gerencialToken}`);

            expect(response.status).toBe(403);
        });
    });

    describe("GET /tarefas", () => {
        it("deve listar tarefas do usuário autenticado", async () => {
            const response = await request(app)
                .get("/tarefas")
                .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        it("deve negar acesso sem token", async () => {
            const response = await request(app)
                .get("/tarefas");

            expect(response.status).toBe(401);
        });
    });

    describe("POST /tarefas", () => {
        it("deve criar tarefa para gerencial", async () => {
            const response = await request(app)
                .post("/tarefas")
                .set("Authorization", `Bearer ${gerencialToken}`)
                .send({
                    titulo: "Nova tarefa",
                    descricao: "Descrição",
                    status: "pendente"
                });

            expect(response.status).toBe(201);
            expect(response.body.titulo).toBe("Nova tarefa");
        });

        it("deve negar criação para visualização", async () => {
            const response = await request(app)
                .post("/tarefas")
                .set("Authorization", `Bearer ${visualizacaoToken}`)
                .send({
                    titulo: "Tarefa"
                });

            expect(response.status).toBe(403);
        });
    });

    describe("PUT /tarefas/:id", () => {
        it("deve atualizar tarefa para gerencial", async () => {
            // Criar tarefa primeiro
            const tarefa = TestDataSource.getRepository(Tarefa).create({
                titulo: "Tarefa teste",
                status: "pendente",
                usuario: { id: gerencialId } as Usuario
            });
            const saved = await TestDataSource.getRepository(Tarefa).save(tarefa);

            const response = await request(app)
                .put(`/tarefas/${saved.id}`)
                .set("Authorization", `Bearer ${gerencialToken}`)
                .send({
                    titulo: "Tarefa atualizada"
                });

            expect(response.status).toBe(200);
            expect(response.body.titulo).toBe("Tarefa atualizada");
        });
    });

    describe("DELETE /tarefas/:id", () => {
        it("deve deletar tarefa para admin", async () => {
            // Criar tarefa primeiro
            const tarefa = TestDataSource.getRepository(Tarefa).create({
                titulo: "Tarefa para deletar",
                status: "pendente",
                usuario: { id: adminId } as Usuario
            });
            const saved = await TestDataSource.getRepository(Tarefa).save(tarefa);

            const response = await request(app)
                .delete(`/tarefas/${saved.id}`)
                .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
        });

        it("deve negar deleção para gerencial", async () => {
            // Criar tarefa primeiro
            const tarefa = TestDataSource.getRepository(Tarefa).create({
                titulo: "Tarefa",
                status: "pendente",
                usuario: { id: gerencialId } as Usuario
            });
            const saved = await TestDataSource.getRepository(Tarefa).save(tarefa);

            const response = await request(app)
                .delete(`/tarefas/${saved.id}`)
                .set("Authorization", `Bearer ${gerencialToken}`);

            expect(response.status).toBe(403);
        });
    });
});

