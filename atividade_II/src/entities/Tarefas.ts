
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Usuario } from "./Usuario";

@Entity()
export class Tarefa {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    titulo!: string;

    @Column()
    descricao?: string;

    @Column({ default: false })
    concluida!: boolean;

    @ManyToOne(() => Usuario, (usuario) => usuario.tarefas)
    usuario!: Usuario;
}
