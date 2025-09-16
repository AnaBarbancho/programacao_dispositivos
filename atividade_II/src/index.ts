import "reflect-metadata";
import express, { Request, Response } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import bcrypt from "bcrypt";         
import jwt from "jsonwebtoken";
import { authenticator } from "otplib"; // substitui pyotp
import path from "path";
import { AppDataSource } from "./data-source";
import { Usuario } from "./entities/Usuario";
import { Tarefa } from "./entities/Tarefas";
import "reflect-metadata";


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

// Middleware para autenticar JWT
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

// Rotas de usuário
app.post("/registro", async (req: Request, res: Response) => {
    const { username, senha } = req.body;
    const repo = AppDataSource.getRepository(Usuario);

    if (await repo.findOne({ where: { username } })) {
        return res.status(400).json({ msg: "Usuário já existe" });
    }

    const secret2FA = authenticator.generateSecret(); // gera segredo 2FA
    const usuario = repo.create({
        username,
        senhaHash: await bcrypt.hash(senha, 10),
        secret2FA,
    });
    await repo.save(usuario);

    res.json({ msg: "Usuário criado", secret2FA });
});

app.post("/login", async (req: Request, res: Response) => {
    const { username, senha, token2FA } = req.body;
    const repo = AppDataSource.getRepository(Usuario);
    const user = await repo.findOne({ where: { username } });

    if (!user) return res.status(401).json({ msg: "Usuário ou senha inválidos" });
    if (!(await bcrypt.compare(senha, user.senhaHash))) {
        return res.status(401).json({ msg: "Usuário ou senha inválidos" });
    }

    if (!authenticator.check(token2FA, user.secret2FA)) {
        return res.status(401).json({ msg: "Token 2FA inválido" });
    }

    const tokenJWT = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: "1h" });
    res.json({ token: tokenJWT });
});

// Rotas de tarefas (protegidas)
app.get("/tarefas", autenticarToken, async (req: any, res: Response) => {
    const repo = AppDataSource.getRepository(Tarefa);
    const tarefas = await repo.find({ where: { usuario: { id: req.user.id } } });
    res.json(tarefas);
});

app.post("/tarefas", autenticarToken, async (req: any, res: Response) => {
    const { titulo, descricao } = req.body;
    const usuarioRepo = AppDataSource.getRepository(Usuario);
    const tarefaRepo = AppDataSource.getRepository(Tarefa);
    const usuario = await usuarioRepo.findOne({ where: { id: req.user.id } });
    if (!usuario) return res.status(400).json({ msg: "Usuário não encontrado" });

    const tarefa = tarefaRepo.create({ titulo, descricao, usuario });
    await tarefaRepo.save(tarefa);
    res.json(tarefa);
});

app.put("/tarefas/:id", autenticarToken, async (req: any, res: Response) => {
    const id = parseInt(req.params.id);
    const tarefaRepo = AppDataSource.getRepository(Tarefa);
    const tarefa = await tarefaRepo.findOne({ where: { id, usuario: { id: req.user.id } } });
    if (!tarefa) return res.status(404).json({ msg: "Tarefa não encontrada" });

    tarefaRepo.merge(tarefa, req.body);
    await tarefaRepo.save(tarefa);
    res.json(tarefa);
});

app.delete("/tarefas/:id", autenticarToken, async (req: any, res: Response) => {
    const id = parseInt(req.params.id);
    const tarefaRepo = AppDataSource.getRepository(Tarefa);
    const tarefa = await tarefaRepo.findOne({ where: { id, usuario: { id: req.user.id } } });
    if (!tarefa) return res.status(404).json({ msg: "Tarefa não encontrada" });

    await tarefaRepo.remove(tarefa);
    res.json({ msg: "Tarefa deletada com sucesso." });
});

// Rodar servidor
const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
