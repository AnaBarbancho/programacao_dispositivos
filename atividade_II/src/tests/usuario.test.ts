import { Usuario, NivelAcesso } from "../entities/Usuario";

describe("Entidade Usuario", () => {
  it("deve criar um usuário com username, senha e nível de acesso", () => {
    const user = new Usuario();
    user.username = "ana";
    user.senhaHash = "hash123";
    user.secret2FA = "secret";
    user.nivelAcesso = NivelAcesso.ADMINISTRATIVO;

    expect(user.username).toBe("ana");
    expect(user.senhaHash).toBe("hash123");
    expect(user.secret2FA).toBe("secret");
    expect(user.nivelAcesso).toBe(NivelAcesso.ADMINISTRATIVO);
  });
});
