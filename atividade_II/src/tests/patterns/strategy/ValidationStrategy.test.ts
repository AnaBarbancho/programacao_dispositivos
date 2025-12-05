import {
    PasswordValidationStrategy,
    UsernameValidationStrategy,
    Token2FAValidationStrategy,
    ValidationContext,
    ValidatorFactory
} from "../../../patterns/strategy/ValidationStrategy";

describe("ValidationStrategy - TDD Tests", () => {
    describe("PasswordValidationStrategy", () => {
        it("deve validar senha com tamanho mínimo", () => {
            const strategy = new PasswordValidationStrategy(6);
            
            const result = strategy.validate("senha123");
            
            expect(result.isValid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        it("deve rejeitar senha menor que o tamanho mínimo", () => {
            const strategy = new PasswordValidationStrategy(6);
            
            const result = strategy.validate("senha");
            
            expect(result.isValid).toBe(false);
            expect(result.error).toContain("mínimo 6 caracteres");
        });

        it("deve validar senha com maiúscula quando requerido", () => {
            const strategy = new PasswordValidationStrategy(6, true, false);
            
            const result = strategy.validate("Senha123");
            
            expect(result.isValid).toBe(true);
        });

        it("deve rejeitar senha sem maiúscula quando requerido", () => {
            const strategy = new PasswordValidationStrategy(6, true, false);
            
            const result = strategy.validate("senha123");
            
            expect(result.isValid).toBe(false);
            expect(result.error).toContain("maiúscula");
        });

        it("deve validar senha com número quando requerido", () => {
            const strategy = new PasswordValidationStrategy(6, false, true);
            
            const result = strategy.validate("senha123");
            
            expect(result.isValid).toBe(true);
        });

        it("deve rejeitar senha sem número quando requerido", () => {
            const strategy = new PasswordValidationStrategy(6, false, true);
            
            const result = strategy.validate("senhatest");
            
            expect(result.isValid).toBe(false);
            expect(result.error).toContain("número");
        });

        it("deve validar senha com todos os requisitos", () => {
            const strategy = new PasswordValidationStrategy(8, true, true);
            
            const result = strategy.validate("Senha123");
            
            expect(result.isValid).toBe(true);
        });

        it("deve rejeitar senha vazia", () => {
            const strategy = new PasswordValidationStrategy(6);
            
            const result = strategy.validate("");
            
            expect(result.isValid).toBe(false);
        });
    });

    describe("UsernameValidationStrategy", () => {
        it("deve validar username válido", () => {
            const strategy = new UsernameValidationStrategy(3, 20);
            
            const result = strategy.validate("testuser");
            
            expect(result.isValid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        it("deve rejeitar username muito curto", () => {
            const strategy = new UsernameValidationStrategy(3, 20);
            
            const result = strategy.validate("ab");
            
            expect(result.isValid).toBe(false);
            expect(result.error).toContain("mínimo 3 caracteres");
        });

        it("deve rejeitar username muito longo", () => {
            const strategy = new UsernameValidationStrategy(3, 10);
            
            const result = strategy.validate("usernamemuitolongo");
            
            expect(result.isValid).toBe(false);
            expect(result.error).toContain("máximo 10 caracteres");
        });

        it("deve rejeitar username com caracteres especiais", () => {
            const strategy = new UsernameValidationStrategy(3, 20);
            
            const result = strategy.validate("test-user!");
            
            expect(result.isValid).toBe(false);
            expect(result.error).toContain("letras, números e underscore");
        });

        it("deve aceitar username com underscore", () => {
            const strategy = new UsernameValidationStrategy(3, 20);
            
            const result = strategy.validate("test_user");
            
            expect(result.isValid).toBe(true);
        });

        it("deve rejeitar username vazio", () => {
            const strategy = new UsernameValidationStrategy(3, 20);
            
            const result = strategy.validate("");
            
            expect(result.isValid).toBe(false);
            expect(result.error).toContain("obrigatório");
        });

        it("deve aceitar username com números", () => {
            const strategy = new UsernameValidationStrategy(3, 20);
            
            const result = strategy.validate("user123");
            
            expect(result.isValid).toBe(true);
        });
    });

    describe("Token2FAValidationStrategy", () => {
        it("deve validar token 2FA válido de 6 dígitos", () => {
            const strategy = new Token2FAValidationStrategy();
            
            const result = strategy.validate("123456");
            
            expect(result.isValid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        it("deve rejeitar token 2FA com menos de 6 dígitos", () => {
            const strategy = new Token2FAValidationStrategy();
            
            const result = strategy.validate("12345");
            
            expect(result.isValid).toBe(false);
            expect(result.error).toContain("6 dígitos");
        });

        it("deve rejeitar token 2FA com mais de 6 dígitos", () => {
            const strategy = new Token2FAValidationStrategy();
            
            const result = strategy.validate("1234567");
            
            expect(result.isValid).toBe(false);
            expect(result.error).toContain("6 dígitos");
        });

        it("deve rejeitar token 2FA com letras", () => {
            const strategy = new Token2FAValidationStrategy();
            
            const result = strategy.validate("12345a");
            
            expect(result.isValid).toBe(false);
            expect(result.error).toContain("6 dígitos");
        });

        it("deve rejeitar token 2FA vazio", () => {
            const strategy = new Token2FAValidationStrategy();
            
            const result = strategy.validate("");
            
            expect(result.isValid).toBe(false);
            expect(result.error).toContain("obrigatório");
        });
    });

    describe("ValidationContext", () => {
        it("deve usar a estratégia configurada para validar", () => {
            const strategy = new PasswordValidationStrategy(6);
            const context = new ValidationContext(strategy);
            
            const result = context.validate("senha123");
            
            expect(result.isValid).toBe(true);
        });

        it("deve permitir trocar a estratégia em tempo de execução", () => {
            const passwordStrategy = new PasswordValidationStrategy(6);
            const usernameStrategy = new UsernameValidationStrategy(3, 20);
            
            const context = new ValidationContext(passwordStrategy);
            
            // Validar com estratégia de senha
            expect(context.validate("senha123").isValid).toBe(true);
            
            // Trocar para estratégia de username
            context.setStrategy(usernameStrategy);
            
            // Agora deve validar como username
            expect(context.validate("testuser").isValid).toBe(true);
            expect(context.validate("senha123").isValid).toBe(true); // username válido também
        });
    });

    describe("ValidatorFactory", () => {
        it("deve criar validador de senha com configuração padrão", () => {
            const validator = ValidatorFactory.createPasswordValidator();
            
            expect(validator.validate("senha123").isValid).toBe(true);
            expect(validator.validate("senha").isValid).toBe(false);
        });

        it("deve criar validador de senha com configuração customizada", () => {
            const validator = ValidatorFactory.createPasswordValidator(8, true, true);
            
            expect(validator.validate("Senha123").isValid).toBe(true);
            expect(validator.validate("senha123").isValid).toBe(false); // sem maiúscula
        });

        it("deve criar validador de username com configuração padrão", () => {
            const validator = ValidatorFactory.createUsernameValidator();
            
            expect(validator.validate("testuser").isValid).toBe(true);
            expect(validator.validate("ab").isValid).toBe(false);
        });

        it("deve criar validador de username com configuração customizada", () => {
            const validator = ValidatorFactory.createUsernameValidator(5, 15);
            
            expect(validator.validate("testuser").isValid).toBe(true);
            expect(validator.validate("test").isValid).toBe(false); // muito curto
        });

        it("deve criar validador de token 2FA", () => {
            const validator = ValidatorFactory.createToken2FAValidator();
            
            expect(validator.validate("123456").isValid).toBe(true);
            expect(validator.validate("12345").isValid).toBe(false);
        });
    });
});

