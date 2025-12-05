import "reflect-metadata";
import { DataSource } from "typeorm";
import { ServiceFactory } from "../../../patterns/factory/ServiceFactory";
import { UsuarioService } from "../../../services/UsuarioService";
import { TarefaService } from "../../../services/TarefaService";
import { AppDataSource } from "../../../data-source";
import { Usuario } from "../../../entities/Usuario";
import { Tarefa } from "../../../entities/Tarefas";

// DataSource de teste
const TestDataSource = new DataSource({
    type: "sqlite",
    database: ":memory:",
    synchronize: true,
    dropSchema: true,
    logging: false,
    entities: [Usuario, Tarefa],
});

describe("ServiceFactory - TDD Tests", () => {
    afterEach(() => {
        // Resetar o DataSource após cada teste
        ServiceFactory.resetDataSource();
    });

    describe("createUsuarioService", () => {
        it("deve criar UsuarioService com AppDataSource padrão quando nenhum DataSource é configurado", () => {
            const service = ServiceFactory.createUsuarioService();
            
            expect(service).toBeInstanceOf(UsuarioService);
            expect(service).toBeDefined();
        });

        it("deve criar UsuarioService com DataSource customizado quando configurado", async () => {
            await TestDataSource.initialize();
            ServiceFactory.setDataSource(TestDataSource);
            
            const service = ServiceFactory.createUsuarioService();
            
            expect(service).toBeInstanceOf(UsuarioService);
            
            await TestDataSource.destroy();
        });
    });

    describe("createTarefaService", () => {
        it("deve criar TarefaService com AppDataSource padrão quando nenhum DataSource é configurado", () => {
            const service = ServiceFactory.createTarefaService();
            
            expect(service).toBeInstanceOf(TarefaService);
            expect(service).toBeDefined();
        });

        it("deve criar TarefaService com DataSource customizado quando configurado", async () => {
            await TestDataSource.initialize();
            ServiceFactory.setDataSource(TestDataSource);
            
            const service = ServiceFactory.createTarefaService();
            
            expect(service).toBeInstanceOf(TarefaService);
            
            await TestDataSource.destroy();
        });
    });

    describe("createAllServices", () => {
        it("deve criar todos os services de uma vez", () => {
            const services = ServiceFactory.createAllServices();
            
            expect(services.usuarioService).toBeInstanceOf(UsuarioService);
            expect(services.tarefaService).toBeInstanceOf(TarefaService);
        });

        it("deve criar todos os services com DataSource customizado quando configurado", async () => {
            await TestDataSource.initialize();
            ServiceFactory.setDataSource(TestDataSource);
            
            const services = ServiceFactory.createAllServices();
            
            expect(services.usuarioService).toBeInstanceOf(UsuarioService);
            expect(services.tarefaService).toBeInstanceOf(TarefaService);
            
            await TestDataSource.destroy();
        });
    });

    describe("setDataSource e resetDataSource", () => {
        it("deve permitir configurar um DataSource customizado", async () => {
            await TestDataSource.initialize();
            
            ServiceFactory.setDataSource(TestDataSource);
            const service = ServiceFactory.createUsuarioService();
            
            expect(service).toBeDefined();
            
            await TestDataSource.destroy();
        });

        it("deve resetar para AppDataSource padrão após resetDataSource", async () => {
            await TestDataSource.initialize();
            ServiceFactory.setDataSource(TestDataSource);
            
            ServiceFactory.resetDataSource();
            
            // Após reset, deve usar AppDataSource padrão
            const service = ServiceFactory.createUsuarioService();
            expect(service).toBeInstanceOf(UsuarioService);
            
            await TestDataSource.destroy();
        });
    });
});

