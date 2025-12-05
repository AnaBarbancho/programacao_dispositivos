import { Router, Response } from "express";
import { ServiceFactory } from "../patterns/factory/ServiceFactory";
import { authFacade, AuthRequest } from "../patterns/facade/AuthFacade";
import { NivelAcesso } from "../entities/Usuario";

const router = Router();
// Usando Factory Pattern para criar o service
const tarefaService = ServiceFactory.createTarefaService();

// GET /tarefas - Listar tarefas
// Visualização e Administrativo veem todas as tarefas
// Gerencial vê apenas suas próprias tarefas
// Usando Facade Pattern para autenticação
router.get("/tarefas", authFacade.authenticate(), async (req: AuthRequest, res: Response) => {
    try {
        const nivelAcesso = req.user!.nivelAcesso;
        const userId = req.user!.id;
        
        // Log para debug
        console.log("Nível de acesso recebido:", nivelAcesso);
        console.log("Tipo:", typeof nivelAcesso);
        console.log("Valor do enum VISUALIZACAO:", NivelAcesso.VISUALIZACAO);
        console.log("Valor do enum ADMINISTRATIVO:", NivelAcesso.ADMINISTRATIVO);
        
        // Normalizar nível de acesso para comparação (pode vir como string do JWT)
        const nivelStr = String(nivelAcesso).toLowerCase();
    const isVisualizacao = nivelStr === "visualizacao" || nivelAcesso === NivelAcesso.VISUALIZACAO;
    const isAdministrativo = nivelStr === "administrativo" || nivelAcesso === NivelAcesso.ADMINISTRATIVO;
    const isGerencial = nivelStr === "gerencial" || nivelAcesso === NivelAcesso.GERENCIAL;
        
        console.log("isVisualizacao:", isVisualizacao);
        console.log("isAdministrativo:", isAdministrativo);
        
        // Visualização, Gerencial e Administrativo veem todas as tarefas
        if (isVisualizacao || isAdministrativo || isGerencial) {
            console.log("Listando todas as tarefas...");
            const tarefas = await tarefaService.listarTodasTarefas();
            console.log(`Total de tarefas encontradas: ${tarefas.length}`);
            return res.json(tarefas);
        }
        
        // Gerencial vê apenas suas próprias tarefas
        console.log("Listando tarefas do usuário:", userId);
        const tarefas = await tarefaService.listarTarefasPorUsuario(userId);
        console.log(`Total de tarefas do usuário: ${tarefas.length}`);
        return res.json(tarefas);
    } catch (error: any) {
        console.error("Erro ao listar tarefas:", error);
        res.status(500).json({ msg: error.message });
    }
});

// POST /tarefas - Criar tarefa (gerencial ou administrativo)
// Usando Facade Pattern para autenticação e autorização
router.post(
    "/tarefas",
    ...authFacade.requireAuth(NivelAcesso.ADMINISTRATIVO, NivelAcesso.GERENCIAL),
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
// Usando Facade Pattern para autenticação e autorização
router.put(
    "/tarefas/:id",
    ...authFacade.requireAuth(NivelAcesso.ADMINISTRATIVO, NivelAcesso.GERENCIAL),
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
// Usando Facade Pattern para autenticação e autorização
router.delete(
    "/tarefas/:id",
    ...authFacade.requireAuth(NivelAcesso.ADMINISTRATIVO),
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


