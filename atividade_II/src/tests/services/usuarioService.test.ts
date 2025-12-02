import "reflect-metadata";
import { DataSource } from "typeorm";
import { UsuarioService } from "../../services/UsuarioService";
import { Usuario, NivelAcesso } from "../../entities/Usuario";
import { Tarefa } from "../../entities/Tarefas";
import { authenticator } from "otplib";

// DataSource de teste em memória
const TestDataSource = new DataSource({
    type: "sqlite",
    database: ":memory:",
    synchronize: true,
    dropSchema: true,
    logging: false,
    entities: [Usuario, Tarefa],
});

describe("UsuarioService", () => {
    let usuarioService: UsuarioService;

    beforeAll(async () => {
        await TestDataSource.initialize();
        usuarioService = new UsuarioService(TestDataSource);
    });

    afterAll(async () => {
        await TestDataSource.destroy();
    });

    beforeEach(async () => {
        // Limpar dados antes de cada teste
        await TestDataSource.getRepository(Usuario).clear();
        await TestDataSource.getRepository(Tarefa).clear();
    });

    describe("criarUsuario", () => {
        it("deve criar um novo usuário com sucesso", async () => {
            const dto = {
                username: "testuser",
                senha: "senha123",
                nivelAcesso: "administrativo"
            };

            const result = await usuarioService.criarUsuario(dto);

            expect(result.usuario.username).toBe("testuser");
            expect(result.usuario.nivelAcesso).toBe("administrativo");
            expect(result.secret2FA).toBeDefined();
        });

        it("deve lançar erro se usuário já existe", async () => {
            const dto = {
                username: "testuser",
                senha: "senha123"
            };

            await usuarioService.criarUsuario(dto);

            await expect(usuarioService.criarUsuario(dto)).rejects.toThrow("Usuário já existe");
        });

        it("deve usar nível de acesso padrão se não fornecido", async () => {
            const dto = {
                username: "testuser",
                senha: "senha123"
            };

            const result = await usuarioService.criarUsuario(dto);

            expect(result.usuario.nivelAcesso).toBe(NivelAcesso.VISUALIZACAO);
        });
    });

    describe("autenticarUsuario", () => {
        it("deve autenticar usuário com credenciais válidas", async () => {
            const dto = {
                username: "testuser",
                senha: "senha123"
            };

            const { usuario, secret2FA } = await usuarioService.criarUsuario(dto);
            const token2FA = authenticator.generate(secret2FA);

            const usuarioAutenticado = await usuarioService.autenticarUsuario(
                dto.username,
                dto.senha,
                token2FA
            );

            expect(usuarioAutenticado.username).toBe("testuser");
        });

        it("deve lançar erro com senha inválida", async () => {
            const dto = {
                username: "testuser",
                senha: "senha123"
            };

            const { secret2FA } = await usuarioService.criarUsuario(dto);
            const token2FA = authenticator.generate(secret2FA);

            await expect(
                usuarioService.autenticarUsuario("testuser", "senhaErrada", token2FA)
            ).rejects.toThrow("Usuário ou senha inválidos");
        });

        it("deve lançar erro com token 2FA inválido", async () => {
            const dto = {
                username: "testuser",
                senha: "senha123"
            };

            await usuarioService.criarUsuario(dto);

            await expect(
                usuarioService.autenticarUsuario("testuser", "senha123", "tokenInvalido")
            ).rejects.toThrow("Token 2FA inválido");
        });
    });

    describe("listarUsuarios", () => {
        it("deve listar todos os usuários", async () => {
            await usuarioService.criarUsuario({ username: "user1", senha: "senha1" });
            await usuarioService.criarUsuario({ username: "user2", senha: "senha2" });

            const usuarios = await usuarioService.listarUsuarios();

            expect(usuarios).toHaveLength(2);
            expect(usuarios[0].username).toBe("user1");
            expect(usuarios[1].username).toBe("user2");
        });
    });

    describe("buscarUsuarioPorId", () => {
        it("deve buscar usuário por ID", async () => {
            const { usuario } = await usuarioService.criarUsuario({
                username: "testuser",
                senha: "senha123"
            });

            const encontrado = await usuarioService.buscarUsuarioPorId(usuario.id);

            expect(encontrado).toBeDefined();
            expect(encontrado?.username).toBe("testuser");
        });

        it("deve retornar null se usuário não existe", async () => {
            const encontrado = await usuarioService.buscarUsuarioPorId(999);

            expect(encontrado).toBeNull();
        });
    });

    describe("atualizarUsuario", () => {
        it("deve atualizar username do usuário", async () => {
            const { usuario } = await usuarioService.criarUsuario({
                username: "testuser",
                senha: "senha123"
            });

            const atualizado = await usuarioService.atualizarUsuario(usuario.id, {
                username: "newusername"
            });

            expect(atualizado.username).toBe("newusername");
        });

        it("deve atualizar senha do usuário", async () => {
            const { usuario } = await usuarioService.criarUsuario({
                username: "testuser",
                senha: "senha123"
            });

            await usuarioService.atualizarUsuario(usuario.id, {
                senha: "novaSenha123"
            });

            // Verificar se a senha foi atualizada tentando autenticar
            const usuarioOriginal = await usuarioService.buscarUsuarioPorUsername("testuser");
            const secret2FA = usuarioOriginal!.secret2FA;
            const token2FA = authenticator.generate(secret2FA);

            await expect(
                usuarioService.autenticarUsuario("testuser", "novaSenha123", token2FA)
            ).resolves.toBeDefined();
        });

        it("deve lançar erro se usuário não existe", async () => {
            await expect(
                usuarioService.atualizarUsuario(999, { username: "newuser" })
            ).rejects.toThrow("Usuário não encontrado");
        });
    });

    describe("deletarUsuario", () => {
        it("deve deletar usuário", async () => {
            const { usuario } = await usuarioService.criarUsuario({
                username: "testuser",
                senha: "senha123"
            });

            await usuarioService.deletarUsuario(usuario.id);

            const encontrado = await usuarioService.buscarUsuarioPorId(usuario.id);
            expect(encontrado).toBeNull();
        });

        it("deve lançar erro se usuário não existe", async () => {
            await expect(usuarioService.deletarUsuario(999)).rejects.toThrow(
                "Usuário não encontrado"
            );
        });
    });
});

