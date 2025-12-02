import "reflect-metadata";
import express, { Request, Response } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";
import { AppDataSource } from "./data-source";
import usuarioRoutes from "./routes/usuarioRoutes";
import tarefaRoutes from "./routes/tarefaRoutes";

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

// ========================
// Rotas da API
// ========================
app.use("/", usuarioRoutes);
app.use("/", tarefaRoutes);

// ========================
// Rodar servidor
// ========================
const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
