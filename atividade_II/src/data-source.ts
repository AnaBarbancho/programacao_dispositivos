import "reflect-metadata";
import { DataSource } from "typeorm";
import { Usuario } from "./entities/Usuario";
import { Tarefa } from "./entities/Tarefas";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "postgres",
    password: "123",
    database: "tarefas_db",
    synchronize: true, // cria as tabelas automaticamente
    logging: false,
    entities: [Usuario, Tarefa],
    migrations: [],
    subscribers: [],
});
