import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Usuario } from "./Usuario";

@Entity()
export class Tarefa {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    titulo!: string;

    @Column({ nullable: true })
    descricao?: string;

    @Column({
        type: "simple-enum", // compatível com SQLite e PostgreSQL
        enum: ["pendente", "andamento", "concluida"],
        default: "pendente"
    })
    status!: "pendente" | "andamento" | "concluida";

    @ManyToOne(() => Usuario, (usuario) => usuario.tarefas, { onDelete: "CASCADE" })
    usuario!: Usuario;
}
