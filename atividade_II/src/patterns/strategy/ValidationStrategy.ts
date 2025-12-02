/**
 * Strategy Pattern (Comportamental)
 * 
 * Define uma família de algoritmos de validação, encapsula cada um
 * e os torna intercambiáveis. Permite que o algoritmo varie independentemente
 * dos clientes que o utilizam.
 * 
 * Problema resolvido:
 * - Permite adicionar novos tipos de validação sem modificar código existente
 * - Facilita testes unitários de cada estratégia isoladamente
 * - Torna o código mais extensível e manutenível
 */

/**
 * Interface comum para todas as estratégias de validação
 */
export interface ValidationStrategy {
    validate(value: string): { isValid: boolean; error?: string };
}

/**
 * Estratégia de validação de senha
 * Valida se a senha atende aos critérios de segurança
 */
export class PasswordValidationStrategy implements ValidationStrategy {
    private minLength: number;
    private requireUppercase: boolean;
    private requireNumber: boolean;

    constructor(
        minLength: number = 6,
        requireUppercase: boolean = false,
        requireNumber: boolean = false
    ) {
        this.minLength = minLength;
        this.requireUppercase = requireUppercase;
        this.requireNumber = requireNumber;
    }

    validate(senha: string): { isValid: boolean; error?: string } {
        if (!senha || senha.length < this.minLength) {
            return {
                isValid: false,
                error: `Senha deve ter no mínimo ${this.minLength} caracteres`
            };
        }

        if (this.requireUppercase && !/[A-Z]/.test(senha)) {
            return {
                isValid: false,
                error: "Senha deve conter pelo menos uma letra maiúscula"
            };
        }

        if (this.requireNumber && !/[0-9]/.test(senha)) {
            return {
                isValid: false,
                error: "Senha deve conter pelo menos um número"
            };
        }

        return { isValid: true };
    }
}

/**
 * Estratégia de validação de username
 * Valida se o username atende aos critérios
 */
export class UsernameValidationStrategy implements ValidationStrategy {
    private minLength: number;
    private maxLength: number;
    private allowedPattern: RegExp;

    constructor(
        minLength: number = 3,
        maxLength: number = 20,
        allowedPattern: RegExp = /^[a-zA-Z0-9_]+$/
    ) {
        this.minLength = minLength;
        this.maxLength = maxLength;
        this.allowedPattern = allowedPattern;
    }

    validate(username: string): { isValid: boolean; error?: string } {
        if (!username) {
            return {
                isValid: false,
                error: "Username é obrigatório"
            };
        }

        if (username.length < this.minLength) {
            return {
                isValid: false,
                error: `Username deve ter no mínimo ${this.minLength} caracteres`
            };
        }

        if (username.length > this.maxLength) {
            return {
                isValid: false,
                error: `Username deve ter no máximo ${this.maxLength} caracteres`
            };
        }

        if (!this.allowedPattern.test(username)) {
            return {
                isValid: false,
                error: "Username pode conter apenas letras, números e underscore"
            };
        }

        return { isValid: true };
    }
}

/**
 * Estratégia de validação de token 2FA
 * Valida o formato do token 2FA (deve ser numérico de 6 dígitos)
 */
export class Token2FAValidationStrategy implements ValidationStrategy {
    validate(token: string): { isValid: boolean; error?: string } {
        if (!token) {
            return {
                isValid: false,
                error: "Token 2FA é obrigatório"
            };
        }

        if (!/^\d{6}$/.test(token)) {
            return {
                isValid: false,
                error: "Token 2FA deve ser um número de 6 dígitos"
            };
        }

        return { isValid: true };
    }
}

/**
 * Contexto que utiliza as estratégias de validação
 * Permite trocar a estratégia em tempo de execução
 */
export class ValidationContext {
    private strategy: ValidationStrategy;

    constructor(strategy: ValidationStrategy) {
        this.strategy = strategy;
    }

    /**
     * Define uma nova estratégia de validação
     */
    setStrategy(strategy: ValidationStrategy): void {
        this.strategy = strategy;
    }

    /**
     * Executa a validação usando a estratégia atual
     */
    validate(value: string): { isValid: boolean; error?: string } {
        return this.strategy.validate(value);
    }
}

/**
 * Factory para criar validadores pré-configurados
 */
export class ValidatorFactory {
    static createPasswordValidator(
        minLength: number = 6,
        requireUppercase: boolean = false,
        requireNumber: boolean = false
    ): ValidationContext {
        return new ValidationContext(
            new PasswordValidationStrategy(minLength, requireUppercase, requireNumber)
        );
    }

    static createUsernameValidator(
        minLength: number = 3,
        maxLength: number = 20
    ): ValidationContext {
        return new ValidationContext(
            new UsernameValidationStrategy(minLength, maxLength)
        );
    }

    static createToken2FAValidator(): ValidationContext {
        return new ValidationContext(
            new Token2FAValidationStrategy()
        );
    }
}

