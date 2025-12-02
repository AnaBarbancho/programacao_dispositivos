import { Router, Response } from "express";
import jwt from "jsonwebtoken";
import { UsuarioService } from "../services/UsuarioService";
import { autenticarToken, autorizarNivel, AuthRequest } from "../middleware/auth";
import { NivelAcesso } from "../entities/Usuario";
import { JWT_SECRET, JWT_EXPIRES_IN } from "../config/jwt";

const router = Router();
const usuarioService = new UsuarioService();

// POST /registro - Criar usuário (público)
router.post("/registro", async (req, res: Response) => {
    try {
        const { usuario, secret2FA } = await usuarioService.criarUsuario(req.body);
        res.status(201).json({ msg: "Usuário criado com sucesso", usuario, secret2FA });
    } catch (error: any) {
        res.status(400).json({ msg: error.message });
    }
});

// POST /login - Autenticar usuário (público)
router.post("/login", async (req, res: Response) => {
    try {
        const { username, senha, token2FA } = req.body;
        const usuario = await usuarioService.autenticarUsuario(username, senha, token2FA);

        const tokenJWT = jwt.sign(
            {
                id: usuario.id,
                username: usuario.username,
                nivelAcesso: usuario.nivelAcesso,
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.json({ token: tokenJWT });
    } catch (error: any) {
        res.status(401).json({ msg: error.message });
    }
});

// GET /usuarios - Listar todos os usuários (apenas admin)
router.get(
    "/usuarios",
    autenticarToken,
    autorizarNivel(NivelAcesso.ADMINISTRATIVO),
    async (req: AuthRequest, res: Response) => {
        try {
            const usuarios = await usuarioService.listarUsuarios();
            res.json(usuarios);
        } catch (error: any) {
            res.status(500).json({ msg: error.message });
        }
    }
);

// GET /usuarios/:id - Buscar usuário por ID (apenas admin ou próprio usuário)
router.get(
    "/usuarios/:id",
    autenticarToken,
    async (req: AuthRequest, res: Response) => {
        try {
            const id = parseInt(req.params.id);
            const usuarioId = req.user!.id;
            const nivelAcesso = req.user!.nivelAcesso;

            // Usuário pode ver seu próprio perfil, admin pode ver qualquer perfil
            if (id !== usuarioId && nivelAcesso !== NivelAcesso.ADMINISTRATIVO) {
                return res.status(403).json({ msg: "Acesso negado" });
            }

            const usuario = await usuarioService.buscarUsuarioPorId(id);
            if (!usuario) {
                return res.status(404).json({ msg: "Usuário não encontrado" });
            }

            res.json(usuario);
        } catch (error: any) {
            res.status(500).json({ msg: error.message });
        }
    }
);

// PUT /usuarios/:id - Atualizar usuário (apenas admin ou próprio usuário)
router.put(
    "/usuarios/:id",
    autenticarToken,
    async (req: AuthRequest, res: Response) => {
        try {
            const id = parseInt(req.params.id);
            const usuarioId = req.user!.id;
            const nivelAcesso = req.user!.nivelAcesso;

            // Usuário pode atualizar seu próprio perfil, admin pode atualizar qualquer perfil
            if (id !== usuarioId && nivelAcesso !== NivelAcesso.ADMINISTRATIVO) {
                return res.status(403).json({ msg: "Acesso negado" });
            }

            // Usuário comum não pode alterar seu próprio nível de acesso
            if (id === usuarioId && req.body.nivelAcesso && nivelAcesso !== NivelAcesso.ADMINISTRATIVO) {
                return res.status(403).json({ msg: "Você não pode alterar seu próprio nível de acesso" });
            }

            const usuario = await usuarioService.atualizarUsuario(id, req.body);
            res.json(usuario);
        } catch (error: any) {
            if (error.message === "Usuário não encontrado") {
                return res.status(404).json({ msg: error.message });
            }
            res.status(400).json({ msg: error.message });
        }
    }
);

// DELETE /usuarios/:id - Deletar usuário (apenas admin)
router.delete(
    "/usuarios/:id",
    autenticarToken,
    autorizarNivel(NivelAcesso.ADMINISTRATIVO),
    async (req: AuthRequest, res: Response) => {
        try {
            const id = parseInt(req.params.id);
            await usuarioService.deletarUsuario(id);
            res.json({ msg: "Usuário deletado com sucesso" });
        } catch (error: any) {
            if (error.message === "Usuário não encontrado") {
                return res.status(404).json({ msg: error.message });
            }
            res.status(500).json({ msg: error.message });
        }
    }
);

export default router;

