import { Router, Response } from "express";
import { TarefaService } from "../services/TarefaService";
import { autenticarToken, autorizarNivel, AuthRequest } from "../middleware/auth";
import { NivelAcesso } from "../entities/Usuario";

const router = Router();
const tarefaService = new TarefaService();

// GET /tarefas - Listar tarefas do usuário
router.get("/tarefas", autenticarToken, async (req: AuthRequest, res: Response) => {
    try {
        const tarefas = await tarefaService.listarTarefasPorUsuario(req.user!.id);
        res.json(tarefas);
    } catch (error: any) {
        res.status(500).json({ msg: error.message });
    }
});

// POST /tarefas - Criar tarefa (gerencial ou administrativo)
router.post(
    "/tarefas",
    autenticarToken,
    autorizarNivel(NivelAcesso.ADMINISTRATIVO, NivelAcesso.GERENCIAL),
    async (req: AuthRequest, res: Response) => {
        try {
            const tarefa = await tarefaService.criarTarefa(req.user!.id, req.body);
            res.status(201).json(tarefa);
        } catch (error: any) {
            res.status(400).json({ msg: error.message });
        }
    }
);

// PUT /tarefas/:id - Atualizar tarefa (gerencial ou administrativo)
router.put(
    "/tarefas/:id",
    autenticarToken,
    autorizarNivel(NivelAcesso.ADMINISTRATIVO, NivelAcesso.GERENCIAL),
    async (req: AuthRequest, res: Response) => {
        try {
            const id = parseInt(req.params.id);
            const tarefa = await tarefaService.atualizarTarefa(id, req.user!.id, req.body);
            res.json(tarefa);
        } catch (error: any) {
            if (error.message === "Tarefa não encontrada") {
                return res.status(404).json({ msg: error.message });
            }
            res.status(400).json({ msg: error.message });
        }
    }
);

// DELETE /tarefas/:id - Deletar tarefa (apenas administrativo)
router.delete(
    "/tarefas/:id",
    autenticarToken,
    autorizarNivel(NivelAcesso.ADMINISTRATIVO),
    async (req: AuthRequest, res: Response) => {
        try {
            const id = parseInt(req.params.id);
            await tarefaService.deletarTarefa(id, req.user!.id);
            res.json({ msg: "Tarefa deletada com sucesso" });
        } catch (error: any) {
            if (error.message === "Tarefa não encontrada") {
                return res.status(404).json({ msg: error.message });
            }
            res.status(500).json({ msg: error.message });
        }
    }
);

export default router;

