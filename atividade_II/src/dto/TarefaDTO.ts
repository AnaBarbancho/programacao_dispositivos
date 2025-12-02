export interface CreateTarefaDTO {
    titulo: string;
    descricao?: string;
    status?: "pendente" | "andamento" | "concluida";
}

export interface UpdateTarefaDTO {
    titulo?: string;
    descricao?: string;
    status?: "pendente" | "andamento" | "concluida";
}

export interface TarefaResponseDTO {
    id: number;
    titulo: string;
    descricao?: string;
    status: "pendente" | "andamento" | "concluida";
    usuario: {
        id: number;
        username: string;
    };
}

