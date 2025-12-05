import "reflect-metadata";
import { DataSource } from "typeorm";
import { TarefaService } from "../../services/TarefaService";
import { UsuarioService } from "../../services/UsuarioService";
import { Usuario, NivelAcesso } from "../../entities/Usuario";
import { Tarefa } from "../../entities/Tarefas";

const TestDataSource = new DataSource({
    type: "sqlite",
    database: ":memory:",
    synchronize: true,
    dropSchema: true,
    logging: false,
    entities: [Usuario, Tarefa],
});

describe("TarefaService", () => {
    let tarefaService: TarefaService;
    let usuarioService: UsuarioService;
    let usuarioId: number;

    beforeAll(async () => {
        await TestDataSource.initialize();
        tarefaService = new TarefaService(TestDataSource);
        usuarioService = new UsuarioService(TestDataSource);
    });

    afterAll(async () => {
        await TestDataSource.destroy();
    });

    beforeEach(async () => {
        await TestDataSource.getRepository(Usuario).clear();
        await TestDataSource.getRepository(Tarefa).clear();

        const { usuario } = await usuarioService.criarUsuario({
            username: "testuser",
            senha: "senha123"
        });
        usuarioId = usuario.id;
    });

    describe("criarTarefa", () => {
        it("deve criar uma nova tarefa", async () => {
            const dto = {
                titulo: "Nova tarefa",
                descricao: "Descrição da tarefa",
                status: "pendente" as const
            };

            const tarefa = await tarefaService.criarTarefa(usuarioId, dto);

            expect(tarefa.titulo).toBe("Nova tarefa");
            expect(tarefa.descricao).toBe("Descrição da tarefa");
            expect(tarefa.status).toBe("pendente");
            expect(tarefa.usuario.id).toBe(usuarioId);
        });

        it("deve usar status padrão se não fornecido", async () => {
            const dto = {
                titulo: "Tarefa sem status"
            };

            const tarefa = await tarefaService.criarTarefa(usuarioId, dto);

            expect(tarefa.status).toBe("pendente");
        });

        it("deve lançar erro se usuário não existe", async () => {
            const dto = {
                titulo: "Tarefa"
            };

            await expect(tarefaService.criarTarefa(999, dto)).rejects.toThrow(
                "Usuário não encontrado"
            );
        });
    });

    describe("listarTarefasPorUsuario", () => {
        it("deve listar tarefas do usuário", async () => {
            await tarefaService.criarTarefa(usuarioId, { titulo: "Tarefa 1" });
            await tarefaService.criarTarefa(usuarioId, { titulo: "Tarefa 2" });

            const tarefas = await tarefaService.listarTarefasPorUsuario(usuarioId);

            expect(tarefas).toHaveLength(2);
        });

        it("deve retornar array vazio se usuário não tem tarefas", async () => {
            const tarefas = await tarefaService.listarTarefasPorUsuario(usuarioId);

            expect(tarefas).toHaveLength(0);
        });
    });

    describe("atualizarTarefa", () => {
        it("deve atualizar título da tarefa", async () => {
            const tarefa = await tarefaService.criarTarefa(usuarioId, {
                titulo: "Tarefa original"
            });

            const atualizada = await tarefaService.atualizarTarefa(tarefa.id, usuarioId, {
                titulo: "Tarefa atualizada"
            });

            expect(atualizada.titulo).toBe("Tarefa atualizada");
        });

        it("deve atualizar status da tarefa", async () => {
            const tarefa = await tarefaService.criarTarefa(usuarioId, {
                titulo: "Tarefa",
                status: "pendente"
            });

            const atualizada = await tarefaService.atualizarTarefa(tarefa.id, usuarioId, {
                status: "concluida"
            });

            expect(atualizada.status).toBe("concluida");
        });

        it("deve lançar erro se status inválido", async () => {
            const tarefa = await tarefaService.criarTarefa(usuarioId, {
                titulo: "Tarefa"
            });

            await expect(
                tarefaService.atualizarTarefa(tarefa.id, usuarioId, {
                    status: "status_invalido" as any
                })
            ).rejects.toThrow("Status inválido");
        });

        it("deve lançar erro se tarefa não existe", async () => {
            await expect(
                tarefaService.atualizarTarefa(999, usuarioId, { titulo: "Novo título" })
            ).rejects.toThrow("Tarefa não encontrada");
        });
    });

    describe("deletarTarefa", () => {
        it("deve deletar tarefa", async () => {
            const tarefa = await tarefaService.criarTarefa(usuarioId, {
                titulo: "Tarefa para deletar"
            });

            await tarefaService.deletarTarefa(tarefa.id, usuarioId);

            const encontrada = await tarefaService.buscarTarefaPorId(tarefa.id, usuarioId);
            expect(encontrada).toBeNull();
        });

        it("deve lançar erro se tarefa não existe", async () => {
            await expect(tarefaService.deletarTarefa(999, usuarioId)).rejects.toThrow(
                "Tarefa não encontrada"
            );
        });
    });

    // TDD: Novo recurso - Filtrar tarefas por status
    // RED: Escrevendo o teste ANTES da implementação
    describe("listarTarefasPorUsuarioEStatus - TDD", () => {
        it("deve filtrar tarefas por status 'pendente'", async () => {
            // Criar tarefas com diferentes status
            await tarefaService.criarTarefa(usuarioId, {
                titulo: "Tarefa pendente 1",
                status: "pendente"
            });
            await tarefaService.criarTarefa(usuarioId, {
                titulo: "Tarefa em andamento",
                status: "andamento"
            });
            await tarefaService.criarTarefa(usuarioId, {
                titulo: "Tarefa pendente 2",
                status: "pendente"
            });

            // Filtrar por status pendente
            const tarefasPendentes = await tarefaService.listarTarefasPorUsuarioEStatus(
                usuarioId,
                "pendente"
            );

            expect(tarefasPendentes).toHaveLength(2);
            tarefasPendentes.forEach(tarefa => {
                expect(tarefa.status).toBe("pendente");
            });
        });

        it("deve filtrar tarefas por status 'concluida'", async () => {
            await tarefaService.criarTarefa(usuarioId, {
                titulo: "Tarefa concluída 1",
                status: "concluida"
            });
            await tarefaService.criarTarefa(usuarioId, {
                titulo: "Tarefa pendente",
                status: "pendente"
            });
            await tarefaService.criarTarefa(usuarioId, {
                titulo: "Tarefa concluída 2",
                status: "concluida"
            });

            const tarefasConcluidas = await tarefaService.listarTarefasPorUsuarioEStatus(
                usuarioId,
                "concluida"
            );

            expect(tarefasConcluidas).toHaveLength(2);
            tarefasConcluidas.forEach(tarefa => {
                expect(tarefa.status).toBe("concluida");
            });
        });

        it("deve filtrar tarefas por status 'andamento'", async () => {
            await tarefaService.criarTarefa(usuarioId, {
                titulo: "Tarefa em andamento",
                status: "andamento"
            });

            const tarefasAndamento = await tarefaService.listarTarefasPorUsuarioEStatus(
                usuarioId,
                "andamento"
            );

            expect(tarefasAndamento).toHaveLength(1);
            expect(tarefasAndamento[0].status).toBe("andamento");
        });

        it("deve retornar array vazio quando não há tarefas com o status especificado", async () => {
            await tarefaService.criarTarefa(usuarioId, {
                titulo: "Tarefa pendente",
                status: "pendente"
            });

            const tarefasConcluidas = await tarefaService.listarTarefasPorUsuarioEStatus(
                usuarioId,
                "concluida"
            );

            expect(tarefasConcluidas).toHaveLength(0);
        });

        it("deve retornar apenas tarefas do usuário especificado", async () => {
            // Criar outro usuário
            const { usuario: outroUsuario } = await usuarioService.criarUsuario({
                username: "outrouser",
                senha: "senha123"
            });

            // Criar tarefas para cada usuário
            await tarefaService.criarTarefa(usuarioId, {
                titulo: "Minha tarefa",
                status: "pendente"
            });
            await tarefaService.criarTarefa(outroUsuario.id, {
                titulo: "Tarefa de outro usuário",
                status: "pendente"
            });

            // Filtrar tarefas do primeiro usuário
            const tarefas = await tarefaService.listarTarefasPorUsuarioEStatus(
                usuarioId,
                "pendente"
            );

            expect(tarefas).toHaveLength(1);
            expect(tarefas[0].titulo).toBe("Minha tarefa");
        });
    });

    // TDD: Novo recurso - Listar todas as tarefas
    // RED: Escrevendo o teste ANTES da implementação
    describe("listarTodasTarefas - TDD", () => {
        it("deve listar todas as tarefas de todos os usuários", async () => {
            // Criar outro usuário
            const { usuario: outroUsuario } = await usuarioService.criarUsuario({
                username: "outrouser",
                senha: "senha123"
            });

            // Criar tarefas para diferentes usuários
            await tarefaService.criarTarefa(usuarioId, {
                titulo: "Tarefa do usuário 1",
                status: "pendente"
            });
            await tarefaService.criarTarefa(usuarioId, {
                titulo: "Outra tarefa do usuário 1",
                status: "andamento"
            });
            await tarefaService.criarTarefa(outroUsuario.id, {
                titulo: "Tarefa do usuário 2",
                status: "concluida"
            });

            // Listar todas as tarefas
            const todasTarefas = await tarefaService.listarTodasTarefas();

            expect(todasTarefas.length).toBeGreaterThanOrEqual(3);
            // Verificar que contém tarefas de ambos os usuários
            const titulos = todasTarefas.map(t => t.titulo);
            expect(titulos).toContain("Tarefa do usuário 1");
            expect(titulos).toContain("Outra tarefa do usuário 1");
            expect(titulos).toContain("Tarefa do usuário 2");
        });

        it("deve retornar array vazio quando não há tarefas", async () => {
            const todasTarefas = await tarefaService.listarTodasTarefas();
            expect(todasTarefas).toHaveLength(0);
        });
    });
});

