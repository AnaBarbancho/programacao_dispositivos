import "reflect-metadata";
import { DataSource } from "typeorm";
import { Usuario, NivelAcesso } from "../entities/Usuario";
import { Tarefa } from "../entities/Tarefas";

// Criar DataSource de teste em memória
const TestDataSource = new DataSource({
    type: "sqlite",
    database: ":memory:",
    synchronize: true,
    dropSchema: true,
    logging: false,
    entities: [Usuario, Tarefa],
});

beforeAll(async () => {
    await TestDataSource.initialize();
});

afterAll(async () => {
    await TestDataSource.destroy();
});

describe("Testes com DataSource em memória", () => {
    it("deve criar um usuário no banco em memória", async () => {
        const repoUsuario = TestDataSource.getRepository(Usuario);

        const user = repoUsuario.create({
            username: "ana",
            senhaHash: "hash123",
            secret2FA: "secret",
            nivelAcesso: NivelAcesso.ADMINISTRATIVO,
        });

        await repoUsuario.save(user);

        const saved = await repoUsuario.findOneBy({ username: "ana" });
        expect(saved).toBeDefined();
        expect(saved?.username).toBe("ana");
    });

    it("deve criar uma tarefa vinculada a um usuário", async () => {
        const repoUsuario = TestDataSource.getRepository(Usuario);
        const repoTarefa = TestDataSource.getRepository(Tarefa);

        const user = await repoUsuario.findOneBy({ username: "ana" });
        const tarefa = repoTarefa.create({
            titulo: "Estudar Node.js",
            descricao: "Aprender TDD e SQLite em memória",
            status: "pendente",
            usuario: user!,
        });

        await repoTarefa.save(tarefa);

        const savedTarefa = await repoTarefa.findOne({
            where: { titulo: "Estudar Node.js" },
            relations: ["usuario"],
        });

        expect(savedTarefa).toBeDefined();
        expect(savedTarefa?.usuario.username).toBe("ana");
    });
});
