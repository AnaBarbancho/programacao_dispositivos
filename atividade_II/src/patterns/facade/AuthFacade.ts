import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { NivelAcesso } from "../../entities/Usuario";
import { JWT_SECRET, JWT_EXPIRES_IN } from "../../config/jwt";
import { UsuarioService } from "../../services/UsuarioService";
import { ServiceFactory } from "../factory/ServiceFactory";

export interface AuthRequest extends Request {
    user?: {
        id: number;
        username: string;
        nivelAcesso: NivelAcesso;
    };
}

/**
 * Facade Pattern (Estrutural)
 * 
 * Fornece uma interface simplificada e unificada para o sistema complexo
 * de autenticação e autorização, escondendo a complexidade subjacente.
 * 
 * Problema resolvido:
 * - Simplifica o uso de autenticação/autorização nas rotas
 * - Centraliza a lógica de geração e validação de tokens
 * - Reduz acoplamento entre rotas e detalhes de implementação
 * - Facilita manutenção e evolução do sistema de auth
 */
export class AuthFacade {
    private usuarioService: UsuarioService;

    constructor() {
        this.usuarioService = ServiceFactory.createUsuarioService();
    }

    /**
     * Gera um token JWT para o usuário autenticado
     */
    generateToken(userId: number, username: string, nivelAcesso: NivelAcesso): string {
        return jwt.sign(
            { id: userId, username, nivelAcesso },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );
    }

    /**
     * Valida um token JWT e extrai as informações do usuário
     */
    validateToken(token: string): { id: number; username: string; nivelAcesso: NivelAcesso } | null {
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as any;
            return {
                id: decoded.id,
                username: decoded.username,
                nivelAcesso: decoded.nivelAcesso
            };
        } catch (error) {
            return null;
        }
    }

    /**
     * Middleware de autenticação simplificado
     * Verifica se o token é válido e anexa o usuário à requisição
     */
    authenticate(): (req: AuthRequest, res: Response, next: NextFunction) => void {
        return (req: AuthRequest, res: Response, next: NextFunction) => {
            const authHeader = req.headers["authorization"];
            const token = authHeader && authHeader.split(" ")[1];

            if (!token) {
                return res.status(401).json({ msg: "Token não fornecido" });
            }

            const user = this.validateToken(token);
            if (!user) {
                return res.status(403).json({ msg: "Token inválido ou expirado" });
            }

            req.user = user;
            next();
        };
    }

    /**
     * Middleware de autorização simplificado
     * Verifica se o usuário tem o nível de acesso necessário
     */
    authorize(...allowedLevels: NivelAcesso[]): (req: AuthRequest, res: Response, next: NextFunction) => void {
        return (req: AuthRequest, res: Response, next: NextFunction) => {
            const userLevel = req.user?.nivelAcesso;

            if (!userLevel || !allowedLevels.includes(userLevel)) {
                return res.status(403).json({ msg: "Acesso negado: permissão insuficiente" });
            }

            next();
        };
    }

    /**
     * Método combinado: autentica e autoriza em uma única chamada
     * Facilita ainda mais o uso nas rotas
     */
    requireAuth(...allowedLevels: NivelAcesso[]): Array<(req: AuthRequest, res: Response, next: NextFunction) => void> {
        return [
            this.authenticate(),
            this.authorize(...allowedLevels)
        ];
    }

    /**
     * Autentica um usuário com username, senha e token 2FA
     * Retorna o token JWT se autenticação for bem-sucedida
     */
    async login(username: string, senha: string, token2FA: string): Promise<string> {
        const usuario = await this.usuarioService.autenticarUsuario(username, senha, token2FA);
        return this.generateToken(usuario.id, usuario.username, usuario.nivelAcesso);
    }
}

// Instância singleton da facade para uso nas rotas
export const authFacade = new AuthFacade();

