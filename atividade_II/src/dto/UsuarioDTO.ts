export interface CreateUsuarioDTO {
    username: string;
    senha: string;
    nivelAcesso?: string;
}

export interface UpdateUsuarioDTO {
    username?: string;
    senha?: string;
    nivelAcesso?: string;
}

export interface LoginDTO {
    username: string;
    senha: string;
    token2FA: string;
}

export interface UsuarioResponseDTO {
    id: number;
    username: string;
    nivelAcesso: string;
    // Não incluir senhaHash nem secret2FA por segurança
}


