import "reflect-metadata";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { autenticarToken, autorizarNivel, AuthRequest } from "../../middleware/auth";
import { NivelAcesso } from "../../entities/Usuario";
import { JWT_SECRET } from "../../config/jwt";

describe("Middleware de Autenticação", () => {
    let mockRequest: Partial<AuthRequest>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction;

    beforeEach(() => {
        mockRequest = {
            headers: {}
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            sendStatus: jest.fn().mockReturnThis()
        };
        nextFunction = jest.fn();
    });

    describe("autenticarToken", () => {
        it("deve permitir acesso com token válido", () => {
            const token = jwt.sign(
                { id: 1, username: "test", nivelAcesso: NivelAcesso.ADMINISTRATIVO },
                JWT_SECRET
            );

            mockRequest.headers = {
                authorization: `Bearer ${token}`
            };

            autenticarToken(
                mockRequest as AuthRequest,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).toHaveBeenCalled();
            expect(mockRequest.user).toBeDefined();
            expect(mockRequest.user?.id).toBe(1);
        });

        it("deve negar acesso sem token", () => {
            mockRequest.headers = {};

            autenticarToken(
                mockRequest as AuthRequest,
                mockResponse as Response,
                nextFunction
            );

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(nextFunction).not.toHaveBeenCalled();
        });

        it("deve negar acesso com token inválido", () => {
            mockRequest.headers = {
                authorization: "Bearer token_invalido"
            };

            autenticarToken(
                mockRequest as AuthRequest,
                mockResponse as Response,
                nextFunction
            );

            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(nextFunction).not.toHaveBeenCalled();
        });
    });

    describe("autorizarNivel", () => {
        it("deve permitir acesso para nível autorizado", () => {
            const token = jwt.sign(
                { id: 1, username: "test", nivelAcesso: NivelAcesso.ADMINISTRATIVO },
                JWT_SECRET
            );

            mockRequest.headers = {
                authorization: `Bearer ${token}`
            };
            mockRequest.user = {
                id: 1,
                username: "test",
                nivelAcesso: NivelAcesso.ADMINISTRATIVO
            };

            const middleware = autorizarNivel(NivelAcesso.ADMINISTRATIVO);
            middleware(
                mockRequest as AuthRequest,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).toHaveBeenCalled();
        });

        it("deve negar acesso para nível não autorizado", () => {
            mockRequest.user = {
                id: 1,
                username: "test",
                nivelAcesso: NivelAcesso.VISUALIZACAO
            };

            const middleware = autorizarNivel(NivelAcesso.ADMINISTRATIVO);
            middleware(
                mockRequest as AuthRequest,
                mockResponse as Response,
                nextFunction
            );

            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(nextFunction).not.toHaveBeenCalled();
        });

        it("deve permitir acesso para múltiplos níveis autorizados", () => {
            mockRequest.user = {
                id: 1,
                username: "test",
                nivelAcesso: NivelAcesso.GERENCIAL
            };

            const middleware = autorizarNivel(
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
});


