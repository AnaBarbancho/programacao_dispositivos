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

    @Column({ default: false })
    concluida!: boolean;

    @ManyToOne(() => Usuario)
    usuario!: Usuario;
}
