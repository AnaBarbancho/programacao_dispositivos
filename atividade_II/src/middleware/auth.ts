import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { NivelAcesso } from "../entities/Usuario";

const JWT_SECRET = process.env.JWT_SECRET || "segredo_super_secreto";

export interface AuthRequest extends Request {
    user?: {
        id: number;
        username: string;
        nivelAcesso: NivelAcesso;
    };
}

export function autenticarToken(req: AuthRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    
    if (!token) {
        return res.status(401).json({ msg: "Token não fornecido" });
    }

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) {
            return res.status(403).json({ msg: "Token inválido ou expirado" });
        }
        req.user = user;
        next();
    });
}

export function autorizarNivel(...niveisPermitidos: NivelAcesso[]) {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        const nivelUsuario = req.user?.nivelAcesso;
        if (!nivelUsuario || !niveisPermitidos.includes(nivelUsuario)) {
            return res.status(403).json({ msg: "Acesso negado: permissão insuficiente" });
        }
        next();
    };
}


