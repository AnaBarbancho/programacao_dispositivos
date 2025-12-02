import { Router, Response } from "express";
import { ServiceFactory } from "../patterns/factory/ServiceFactory";
import { authFacade, AuthRequest } from "../patterns/facade/AuthFacade";
import { ValidatorFactory } from "../patterns/strategy/ValidationStrategy";
import { NivelAcesso } from "../entities/Usuario";

const router = Router();
// Usando Factory Pattern para criar o service
const usuarioService = ServiceFactory.createUsuarioService();

// POST /registro - Criar usuário (público)
router.post("/registro", async (req, res: Response) => {
    try {
        // Usando Strategy Pattern para validação
        const usernameValidator = ValidatorFactory.createUsernameValidator();
        const passwordValidator = ValidatorFactory.createPasswordValidator();

        const usernameValidation = usernameValidator.validate(req.body.username);
        if (!usernameValidation.isValid) {
            return res.status(400).json({ msg: usernameValidation.error });
        }

        const passwordValidation = passwordValidator.validate(req.body.senha);
        if (!passwordValidation.isValid) {
            return res.status(400).json({ msg: passwordValidation.error });
        }

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

        // Usando Strategy Pattern para validação do token 2FA
        const token2FAValidator = ValidatorFactory.createToken2FAValidator();
        const tokenValidation = token2FAValidator.validate(token2FA);
        if (!tokenValidation.isValid) {
            return res.status(400).json({ msg: tokenValidation.error });
        }

        // Usando Facade Pattern para simplificar autenticação
        const token = await authFacade.login(username, senha, token2FA);
        res.json({ token });
    } catch (error: any) {
        res.status(401).json({ msg: error.message });
    }
});

// GET /usuarios - Listar todos os usuários (apenas admin)
// Usando Facade Pattern para autenticação e autorização
router.get(
    "/usuarios",
    ...authFacade.requireAuth(NivelAcesso.ADMINISTRATIVO),
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
// Usando Facade Pattern para autenticação
router.get(
    "/usuarios/:id",
    authFacade.authenticate(),
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
// Usando Facade Pattern para autenticação
router.put(
    "/usuarios/:id",
    authFacade.authenticate(),
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
// Usando Facade Pattern para autenticação e autorização
router.delete(
    "/usuarios/:id",
    ...authFacade.requireAuth(NivelAcesso.ADMINISTRATIVO),
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


