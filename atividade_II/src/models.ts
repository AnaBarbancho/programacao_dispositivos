export interface TarefaCreate {
    titulo: string;
    descricao?: string;
    concluida?: boolean;
}

export interface Tarefa extends TarefaCreate {
    id: number;
}
