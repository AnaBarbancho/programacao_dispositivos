import { Tarefa } from "../entities/Tarefas";
import { Usuario, NivelAcesso } from "../entities/Usuario";

describe("Entidade Tarefa", () => {
  it("deve criar uma tarefa vinculada a um usuário", () => {
    const user = new Usuario();
    user.username = "ana";
    user.senhaHash = "hash123";
    user.secret2FA = "secret";
    user.nivelAcesso = NivelAcesso.VISUALIZACAO;

    const tarefa = new Tarefa();
    tarefa.titulo = "Estudar Node.js";
    tarefa.descricao = "Aprender TDD e TypeORM";
    tarefa.status = "pendente";
    tarefa.usuario = user;

    expect(tarefa.titulo).toBe("Estudar Node.js");
    expect(tarefa.descricao).toBe("Aprender TDD e TypeORM");
    expect(tarefa.status).toBe("pendente");
    expect(tarefa.usuario).toBe(user);
    expect(tarefa.usuario.username).toBe("ana");
  });
});
