import "reflect-metadata";
import { DataSource } from "typeorm";
import { AuthFacade } from "../../../patterns/facade/AuthFacade";
import { NivelAcesso } from "../../../entities/Usuario";
import { JWT_SECRET } from "../../../config/jwt";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../../../patterns/facade/AuthFacade";
import { ServiceFactory } from "../../../patterns/factory/ServiceFactory";
import { UsuarioService } from "../../../services/UsuarioService";
import { Usuario } from "../../../entities/Usuario";
import { Tarefa } from "../../../entities/Tarefas";
import bcrypt from "bcrypt";
import { authenticator } from "otplib";

// DataSource de teste
const TestDataSource = new DataSource({
    type: "sqlite",
    database: ":memory:",
    synchronize: true,
    dropSchema: true,
    logging: false,
    entities: [Usuario, Tarefa],
});

describe("AuthFacade - TDD Tests", () => {
    let authFacade: AuthFacade;
    let usuarioService: UsuarioService;
    let testUserId: number;
    let testSecret2FA: string;

    beforeAll(async () => {
        await TestDataSource.initialize();
        ServiceFactory.setDataSource(TestDataSource);
        
        authFacade = new AuthFacade();
        usuarioService = ServiceFactory.createUsuarioService();

        // Criar usuário de teste
        const { usuario, secret2FA } = await usuarioService.criarUsuario({
            username: "testuser",
            senha: "senha123"
        });
        testUserId = usuario.id;
        testSecret2FA = secret2FA;
    });

    afterAll(async () => {
        await TestDataSource.destroy();
        ServiceFactory.resetDataSource();
    });

    describe("generateToken", () => {
        it("deve gerar um token JWT válido", () => {
            const token = authFacade.generateToken(
                testUserId,
                "testuser",
                NivelAcesso.ADMINISTRATIVO
            );

            expect(token).toBeDefined();
            expect(typeof token).toBe("string");
            
            // Verificar se o token é válido
            const decoded = jwt.verify(token, JWT_SECRET) as any;
            expect(decoded.id).toBe(testUserId);
            expect(decoded.username).toBe("testuser");
            expect(decoded.nivelAcesso).toBe(NivelAcesso.ADMINISTRATIVO);
        });
    });

    describe("validateToken", () => {
        it("deve validar um token JWT válido e retornar dados do usuário", () => {
            const token = jwt.sign(
                { id: testUserId, username: "testuser", nivelAcesso: NivelAcesso.ADMINISTRATIVO },
                JWT_SECRET
            );

            const user = authFacade.validateToken(token);

            expect(user).not.toBeNull();
            expect(user?.id).toBe(testUserId);
            expect(user?.username).toBe("testuser");
            expect(user?.nivelAcesso).toBe(NivelAcesso.ADMINISTRATIVO);
        });

        it("deve retornar null para token inválido", () => {
            const invalidToken = "token.invalido.aqui";

            const user = authFacade.validateToken(invalidToken);

            expect(user).toBeNull();
        });

        it("deve retornar null para token expirado", () => {
            const expiredToken = jwt.sign(
                { id: testUserId, username: "testuser", nivelAcesso: NivelAcesso.ADMINISTRATIVO },
                JWT_SECRET,
                { expiresIn: "-1h" }
            );

            const user = authFacade.validateToken(expiredToken);

            expect(user).toBeNull();
        });
    });

    describe("authenticate middleware", () => {
        it("deve permitir acesso com token válido", () => {
            const token = authFacade.generateToken(
                testUserId,
                "testuser",
                NivelAcesso.ADMINISTRATIVO
            );

            const mockRequest: Partial<AuthRequest> = {
                headers: {
                    authorization: `Bearer ${token}`
                }
            };

            const mockResponse: Partial<Response> = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn().mockReturnThis()
            };

            const nextFunction: NextFunction = jest.fn();

            const middleware = authFacade.authenticate();
            middleware(
                mockRequest as AuthRequest,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).toHaveBeenCalled();
            expect(mockRequest.user).toBeDefined();
            expect(mockRequest.user?.id).toBe(testUserId);
        });

        it("deve negar acesso sem token", () => {
            const mockRequest: Partial<AuthRequest> = {
                headers: {}
            };

            const mockResponse: Partial<Response> = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn().mockReturnThis()
            };

            const nextFunction: NextFunction = jest.fn();

            const middleware = authFacade.authenticate();
            middleware(
                mockRequest as AuthRequest,
                mockResponse as Response,
                nextFunction
            );

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(nextFunction).not.toHaveBeenCalled();
        });

        it("deve negar acesso com token inválido", () => {
            const mockRequest: Partial<AuthRequest> = {
                headers: {
                    authorization: "Bearer token.invalido"
                }
            };

            const mockResponse: Partial<Response> = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn().mockReturnThis()
            };

            const nextFunction: NextFunction = jest.fn();

            const middleware = authFacade.authenticate();
            middleware(
                mockRequest as AuthRequest,
                mockResponse as Response,
                nextFunction
            );

            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(nextFunction).not.toHaveBeenCalled();
        });
    });

    describe("authorize middleware", () => {
        it("deve permitir acesso para nível autorizado", () => {
            const mockRequest: Partial<AuthRequest> = {
                user: {
                    id: testUserId,
                    username: "testuser",
                    nivelAcesso: NivelAcesso.ADMINISTRATIVO
                }
            };

            const mockResponse: Partial<Response> = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn().mockReturnThis()
            };

            const nextFunction: NextFunction = jest.fn();

            const middleware = authFacade.authorize(NivelAcesso.ADMINISTRATIVO);
            middleware(
                mockRequest as AuthRequest,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).toHaveBeenCalled();
        });

        it("deve negar acesso para nível não autorizado", () => {
            const mockRequest: Partial<AuthRequest> = {
                user: {
                    id: testUserId,
                    username: "testuser",
                    nivelAcesso: NivelAcesso.VISUALIZACAO
                }
            };

            const mockResponse: Partial<Response> = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn().mockReturnThis()
            };

            const nextFunction: NextFunction = jest.fn();

            const middleware = authFacade.authorize(NivelAcesso.ADMINISTRATIVO);
            middleware(
                mockRequest as AuthRequest,
                mockResponse as Response,
                nextFunction
            );

            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(nextFunction).not.toHaveBeenCalled();
        });

        it("deve permitir acesso para múltiplos níveis autorizados", () => {
            const mockRequest: Partial<AuthRequest> = {
                user: {
                    id: testUserId,
                    username: "testuser",
                    nivelAcesso: NivelAcesso.GERENCIAL
                }
            };

            const mockResponse: Partial<Response> = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn().mockReturnThis()
            };

            const nextFunction: NextFunction = jest.fn();

            const middleware = authFacade.authorize(
                NivelAcesso.ADMINISTRATIVO,
                NivelAcesso.GERENCIAL
            );
            middleware(
                mockRequest as AuthRequest,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).toHaveBeenCalled();
        });
    });

    describe("requireAuth", () => {
        it("deve retornar array com middleware de autenticação e autorização", () => {
            const middlewares = authFacade.requireAuth(NivelAcesso.ADMINISTRATIVO);

            expect(Array.isArray(middlewares)).toBe(true);
            expect(middlewares).toHaveLength(2);
        });
    });

    describe("login", () => {
        it("deve autenticar usuário e retornar token JWT", async () => {
            const token2FA = authenticator.generate(testSecret2FA);

            const token = await authFacade.login(
                "testuser",
                "senha123",
                token2FA
            );

            expect(token).toBeDefined();
            expect(typeof token).toBe("string");

            // Verificar se o token é válido
            const decoded = jwt.verify(token, JWT_SECRET) as any;
            expect(decoded.id).toBe(testUserId);
            expect(decoded.username).toBe("testuser");
        });

        it("deve lançar erro com credenciais inválidas", async () => {
            const token2FA = authenticator.generate(testSecret2FA);

            await expect(
                authFacade.login("testuser", "senhaErrada", token2FA)
            ).rejects.toThrow();
        });

        it("deve lançar erro com token 2FA inválido", async () => {
            await expect(
                authFacade.login("testuser", "senha123", "123456")
            ).rejects.toThrow();
        });
    });
});

