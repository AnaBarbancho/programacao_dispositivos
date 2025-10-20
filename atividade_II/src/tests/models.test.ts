import { TarefaCreate, Tarefa as TarefaModel } from "../models";

describe("Testes de models", () => {
    it("deve criar uma tarefa seguindo interface TarefaCreate", () => {
        const tarefaData: TarefaCreate = {
            titulo: "Testar models",
            descricao: "Testando interface",
            concluida: false,
        };

        const tarefa: TarefaModel = {
            id: 1,
            ...tarefaData,
        };

        expect(tarefa.id).toBe(1);
        expect(tarefa.titulo).toBe("Testar models");
        expect(tarefa.descricao).toBe("Testando interface");
        expect(tarefa.concluida).toBe(false);
    });
});
