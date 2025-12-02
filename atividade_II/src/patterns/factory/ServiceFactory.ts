import { DataSource } from "typeorm";
import { UsuarioService } from "../../services/UsuarioService";
import { TarefaService } from "../../services/TarefaService";
import { AppDataSource } from "../../data-source";

/**
 * Factory Pattern (Criacional)
 * 
 * Centraliza a criação de services, permitindo flexibilidade na instanciação
 * e facilitando a injeção de dependências (especialmente para testes).
 * 
 * Problema resolvido:
 * - Evita duplicação de código na criação de services
 * - Facilita testes ao permitir injeção de DataSource de teste
 * - Centraliza a lógica de criação, facilitando manutenção
 */
export class ServiceFactory {
    private static dataSource: DataSource | null = null;

    /**
     * Configura o DataSource a ser usado pela factory
     * Útil para testes onde queremos usar um banco em memória
     */
    static setDataSource(dataSource: DataSource): void {
        ServiceFactory.dataSource = dataSource;
    }

    /**
     * Reseta o DataSource para o padrão (AppDataSource)
     */
    static resetDataSource(): void {
        ServiceFactory.dataSource = null;
    }

    /**
     * Cria uma instância de UsuarioService
     * Se um DataSource foi configurado, usa ele; caso contrário, usa AppDataSource
     */
    static createUsuarioService(): UsuarioService {
        const ds = ServiceFactory.dataSource || AppDataSource;
        return new UsuarioService(ds);
    }

    /**
     * Cria uma instância de TarefaService
     * Se um DataSource foi configurado, usa ele; caso contrário, usa AppDataSource
     */
    static createTarefaService(): TarefaService {
        const ds = ServiceFactory.dataSource || AppDataSource;
        return new TarefaService(ds);
    }

    /**
     * Cria todos os services de uma vez
     * Útil para inicialização completa da aplicação
     */
    static createAllServices(): {
        usuarioService: UsuarioService;
        tarefaService: TarefaService;
    } {
        return {
            usuarioService: ServiceFactory.createUsuarioService(),
            tarefaService: ServiceFactory.createTarefaService()
        };
    }
}

