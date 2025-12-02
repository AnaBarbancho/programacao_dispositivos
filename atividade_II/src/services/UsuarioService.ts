import bcrypt from "bcrypt";
import { authenticator } from "otplib";
import { DataSource, Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { Usuario, NivelAcesso } from "../entities/Usuario";
import { CreateUsuarioDTO, UpdateUsuarioDTO, UsuarioResponseDTO } from "../dto/UsuarioDTO";

export class UsuarioService {
    private usuarioRepository: Repository<Usuario>;

    constructor(dataSource?: DataSource) {
        const ds = dataSource || AppDataSource;
        this.usuarioRepository = ds.getRepository(Usuario);
    }

    async criarUsuario(dto: CreateUsuarioDTO): Promise<{ usuario: UsuarioResponseDTO; secret2FA: string }> {
        // Verificar se usuário já existe
        const existe = await this.usuarioRepository.findOne({ where: { username: dto.username } });
        if (existe) {
            throw new Error("Usuário já existe");
        }

        // Validar nível de acesso
        const nivelAcesso = dto.nivelAcesso 
            ? (Object.values(NivelAcesso).includes(dto.nivelAcesso as NivelAcesso) 
                ? dto.nivelAcesso as NivelAcesso 
                : NivelAcesso.VISUALIZACAO)
            : NivelAcesso.VISUALIZACAO;

        // Gerar secret 2FA
        const secret2FA = authenticator.generateSecret();

        // Criar usuário
        const usuario = this.usuarioRepository.create({
            username: dto.username,
            senhaHash: await bcrypt.hash(dto.senha, 10),
            secret2FA,
            nivelAcesso
        });

        const saved = await this.usuarioRepository.save(usuario);

        return {
            usuario: this.toResponseDTO(saved),
            secret2FA
        };
    }

    async buscarUsuarioPorId(id: number): Promise<UsuarioResponseDTO | null> {
        const usuario = await this.usuarioRepository.findOne({ where: { id } });
        return usuario ? this.toResponseDTO(usuario) : null;
    }

    async buscarUsuarioPorUsername(username: string): Promise<Usuario | null> {
        return await this.usuarioRepository.findOne({ where: { username } });
    }

    async listarUsuarios(): Promise<UsuarioResponseDTO[]> {
        const usuarios = await this.usuarioRepository.find();
        return usuarios.map(u => this.toResponseDTO(u));
    }

    async atualizarUsuario(id: number, dto: UpdateUsuarioDTO): Promise<UsuarioResponseDTO> {
        const usuario = await this.usuarioRepository.findOne({ where: { id } });
        if (!usuario) {
            throw new Error("Usuário não encontrado");
        }

        // Atualizar campos fornecidos
        if (dto.username !== undefined) {
            // Verificar se novo username já existe
            const existe = await this.usuarioRepository.findOne({ where: { username: dto.username } });
            if (existe && existe.id !== id) {
                throw new Error("Username já está em uso");
            }
            usuario.username = dto.username;
        }

        if (dto.senha !== undefined) {
            usuario.senhaHash = await bcrypt.hash(dto.senha, 10);
        }

        if (dto.nivelAcesso !== undefined) {
            if (Object.values(NivelAcesso).includes(dto.nivelAcesso as NivelAcesso)) {
                usuario.nivelAcesso = dto.nivelAcesso as NivelAcesso;
            } else {
                throw new Error("Nível de acesso inválido");
            }
        }

        const updated = await this.usuarioRepository.save(usuario);
        return this.toResponseDTO(updated);
    }

    async deletarUsuario(id: number): Promise<void> {
        const usuario = await this.usuarioRepository.findOne({ where: { id } });
        if (!usuario) {
            throw new Error("Usuário não encontrado");
        }

        await this.usuarioRepository.remove(usuario);
    }

    async autenticarUsuario(username: string, senha: string, token2FA: string): Promise<Usuario> {
        const usuario = await this.buscarUsuarioPorUsername(username);
        if (!usuario) {
            throw new Error("Usuário ou senha inválidos");
        }

        const senhaValida = await bcrypt.compare(senha, usuario.senhaHash);
        if (!senhaValida) {
            throw new Error("Usuário ou senha inválidos");
        }

        const token2FAValido = authenticator.check(token2FA, usuario.secret2FA);
        if (!token2FAValido) {
            throw new Error("Token 2FA inválido");
        }

        return usuario;
    }

    private toResponseDTO(usuario: Usuario): UsuarioResponseDTO {
        return {
            id: usuario.id,
            username: usuario.username,
            nivelAcesso: usuario.nivelAcesso
        };
    }
}

