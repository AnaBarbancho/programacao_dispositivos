import { DataSource, Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { Tarefa } from "../entities/Tarefas";
import { Usuario } from "../entities/Usuario";
import { CreateTarefaDTO, UpdateTarefaDTO, TarefaResponseDTO } from "../dto/TarefaDTO";

export class TarefaService {
    private tarefaRepository: Repository<Tarefa>;
    private usuarioRepository: Repository<Usuario>;

    constructor(dataSource?: DataSource) {
        const ds = dataSource || AppDataSource;
        this.tarefaRepository = ds.getRepository(Tarefa);
        this.usuarioRepository = ds.getRepository(Usuario);
    }

    async listarTarefasPorUsuario(usuarioId: number): Promise<TarefaResponseDTO[]> {
        const tarefas = await this.tarefaRepository.find({
            where: { usuario: { id: usuarioId } },
            relations: ["usuario"]
        });
        return tarefas.map(t => this.toResponseDTO(t));
    }

    async buscarTarefaPorId(id: number, usuarioId: number): Promise<TarefaResponseDTO | null> {
        const tarefa = await this.tarefaRepository.findOne({
            where: { id, usuario: { id: usuarioId } },
            relations: ["usuario"]
        });
        return tarefa ? this.toResponseDTO(tarefa) : null;
    }

    async criarTarefa(usuarioId: number, dto: CreateTarefaDTO): Promise<TarefaResponseDTO> {
        const usuario = await this.usuarioRepository.findOne({ where: { id: usuarioId } });
        if (!usuario) {
            throw new Error("Usuário não encontrado");
        }

        const tarefa = this.tarefaRepository.create({
            titulo: dto.titulo,
            descricao: dto.descricao,
            status: dto.status || "pendente",
            usuario
        });

        const saved = await this.tarefaRepository.save(tarefa);
        const tarefaCompleta = await this.tarefaRepository.findOne({
            where: { id: saved.id },
            relations: ["usuario"]
        });

        return this.toResponseDTO(tarefaCompleta!);
    }

    async atualizarTarefa(id: number, usuarioId: number, dto: UpdateTarefaDTO): Promise<TarefaResponseDTO> {
        const tarefa = await this.tarefaRepository.findOne({
            where: { id, usuario: { id: usuarioId } }
        });

        if (!tarefa) {
            throw new Error("Tarefa não encontrada");
        }

        // Validar status se fornecido
        if (dto.status !== undefined) {
            const statusValidos = ["pendente", "andamento", "concluida"];
            if (!statusValidos.includes(dto.status)) {
                throw new Error("Status inválido");
            }
        }

        // Atualizar campos fornecidos
        if (dto.titulo !== undefined) tarefa.titulo = dto.titulo;
        if (dto.descricao !== undefined) tarefa.descricao = dto.descricao;
        if (dto.status !== undefined) tarefa.status = dto.status;

        const updated = await this.tarefaRepository.save(tarefa);
        const tarefaCompleta = await this.tarefaRepository.findOne({
            where: { id: updated.id },
            relations: ["usuario"]
        });

        return this.toResponseDTO(tarefaCompleta!);
    }

    async deletarTarefa(id: number, usuarioId: number): Promise<void> {
        const tarefa = await this.tarefaRepository.findOne({
            where: { id, usuario: { id: usuarioId } }
        });

        if (!tarefa) {
            throw new Error("Tarefa não encontrada");
        }

        await this.tarefaRepository.remove(tarefa);
    }

    private toResponseDTO(tarefa: Tarefa): TarefaResponseDTO {
        return {
            id: tarefa.id,
            titulo: tarefa.titulo,
            descricao: tarefa.descricao,
            status: tarefa.status,
            usuario: {
                id: tarefa.usuario.id,
                username: tarefa.usuario.username
            }
        };
    }
}

