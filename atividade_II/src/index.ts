import "reflect-metadata";
import express, { Request, Response } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { authenticator } from "otplib";
import path from "path";
import { AppDataSource } from "./data-source";
import { Usuario, NivelAcesso } from "./entities/Usuario";
import { Tarefa } from "./entities/Tarefas";

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Servir frontend
app.use("/static", express.static(path.join(__dirname, "../static")));
app.get("/", (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, "../static/index.html"));
});

// Conectar ao banco
AppDataSource.initialize()
    .then(() => console.log("Banco de dados conectado!"))
    .catch(console.error);

const JWT_SECRET = "segredo_super_secreto";

// ========================
// Middleware de autenticação
// ========================
function autenticarToken(req: any, res: any, next: any) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// ========================
// Middleware de autorização por nível
// ========================
function autorizarNivel(...niveisPermitidos: NivelAcesso[]) {
    return (req: any, res: Response, next: Function) => {
        const nivelUsuario = req.user?.nivelAcesso;
        if (!niveisPermitidos.includes(nivelUsuario)) {
            return res.status(403).json({ msg: "Acesso negado: permissão insuficiente" });
        }
        next();
    };
}

// ========================
// Rotas de usuário
// ========================
app.post("/registro", async (req: Request, res: Response) => {
    const { username, senha, nivelAcesso } = req.body;
    const repo = AppDataSource.getRepository(Usuario);

    if (await repo.findOne({ where: { username } })) {
        return res.status(400).json({ msg: "Usuário já existe" });
    }

    const secret2FA = authenticator.generateSecret();
    const usuario = repo.create({
        username,
        senhaHash: await bcrypt.hash(senha, 10),
        secret2FA,
        nivelAcesso: nivelAcesso || NivelAcesso.VISUALIZACAO
    });
    await repo.save(usuario);

    res.json({ msg: "Usuário criado com sucesso", secret2FA });
});

app.post("/login", async (req: Request, res: Response) => {
    const { username, senha, token2FA } = req.body;
    const repo = AppDataSource.getRepository(Usuario);
    const user = await repo.findOne({ where: { username } });

    if (!user || !(await bcrypt.compare(senha, user.senhaHash))) {
        return res.status(401).json({ msg: "Usuário ou senha inválidos" });
    }

    if (!authenticator.check(token2FA, user.secret2FA)) {
        return res.status(401).json({ msg: "Token 2FA inválido" });
    }

    const tokenJWT = jwt.sign(
        {
            id: user.id,
            username: user.username,
            nivelAcesso: user.nivelAcesso,
        },
        JWT_SECRET,
        { expiresIn: "1h" }
    );

    res.json({ token: tokenJWT });
});

// ========================
// Rotas de tarefas (com autorização por nível)
// ========================

app.get("/tarefas", autenticarToken, async (req: any, res: Response) => {
    const repo = AppDataSource.getRepository(Tarefa);
    const tarefas = await repo.find({ where: { usuario: { id: req.user.id } } });
    res.json(tarefas);
});

app.post(
    "/tarefas",
    autenticarToken,
    autorizarNivel(NivelAcesso.ADMINISTRATIVO, NivelAcesso.GERENCIAL),
    async (req: any, res: Response) => {
        const { titulo, descricao, status } = req.body; // <-- agora inclui status
        const usuarioRepo = AppDataSource.getRepository(Usuario);
        const tarefaRepo = AppDataSource.getRepository(Tarefa);

        const usuario = await usuarioRepo.findOne({ where: { id: req.user.id } });
        if (!usuario) return res.status(400).json({ msg: "Usuário não encontrado" });

        const tarefa = tarefaRepo.create({
            titulo,
            descricao,
            status: status || "pendente", // <-- default se não informado
            usuario
        });

        await tarefaRepo.save(tarefa);
        res.json(tarefa);
    }
);


app.put(
    "/tarefas/:id",
    autenticarToken,
    autorizarNivel(NivelAcesso.ADMINISTRATIVO, NivelAcesso.GERENCIAL),
    async (req: any, res: Response) => {
        const id = parseInt(req.params.id);
        const { titulo, descricao, status } = req.body; // <-- pegamos status também

        const tarefaRepo = AppDataSource.getRepository(Tarefa);
        const tarefa = await tarefaRepo.findOne({
            where: { id, usuario: { id: req.user.id } },
        });

        if (!tarefa) {
            return res.status(404).json({ msg: "Tarefa não encontrada" });
        }

        // Atualiza apenas os campos enviados
        if (titulo !== undefined) tarefa.titulo = titulo;
        if (descricao !== undefined) tarefa.descricao = descricao;
        if (status !== undefined) {
            if (!["pendente", "andamento", "concluida"].includes(status)) {
                return res.status(400).json({ msg: "Status inválido" });
            }
            tarefa.status = status;
        }

        await tarefaRepo.save(tarefa);
        res.json(tarefa);
    }
);


app.delete(
    "/tarefas/:id",
    autenticarToken,
    autorizarNivel(NivelAcesso.ADMINISTRATIVO),
    async (req: any, res: Response) => {
        const id = parseInt(req.params.id);
        const tarefaRepo = AppDataSource.getRepository(Tarefa);
        const tarefa = await tarefaRepo.findOne({ where: { id, usuario: { id: req.user.id } } });
        if (!tarefa) return res.status(404).json({ msg: "Tarefa não encontrada" });

        await tarefaRepo.remove(tarefa);
        res.json({ msg: "Tarefa deletada com sucesso." });
    }
);

// ========================
// Rodar servidor
// ========================
const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
