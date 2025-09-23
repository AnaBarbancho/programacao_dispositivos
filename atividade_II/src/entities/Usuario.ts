import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

export enum NivelAcesso {
    ADMINISTRATIVO = "administrativo",
    GERENCIAL = "gerencial",
    VISUALIZACAO = "visualizacao"
}

@Entity()
export class Usuario {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ unique: true })
    username!: string;

    @Column()
    senhaHash!: string;

    @Column()
    secret2FA!: string;

    @Column({
        type: "enum",
        enum: NivelAcesso,
        default: NivelAcesso.VISUALIZACAO
    })
    nivelAcesso!: NivelAcesso;
    tarefas: any;
}
