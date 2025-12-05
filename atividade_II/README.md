# TaskManager - Sistema de Gerenciamento de Tarefas

Sistema completo de gerenciamento de tarefas com autenticação de dois fatores (2FA), controle de acesso por níveis e interface Kanban responsiva.

## 🚀 Tecnologias

- **Backend**: Node.js, Express, TypeScript
- **Banco de Dados**: PostgreSQL (produção) / SQLite (testes)
- **ORM**: TypeORM
- **Autenticação**: JWT + 2FA (OTP)
- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Testes**: Jest, Supertest

## 📋 Funcionalidades

- ✅ Autenticação com JWT e 2FA
- ✅ CRUD completo de usuários e tarefas
- ✅ Controle de acesso por níveis (Visualização, Gerencial, Administrativo)
- ✅ Interface Kanban com drag & drop
- ✅ API RESTful completa
- ✅ Testes unitários e de integração
- ✅ **TDD (Test-Driven Development)** aplicado em todas as funcionalidades

## 🏗️ Design Patterns Utilizados

Este projeto implementa três padrões de design fundamentais, um de cada categoria:

### 1. Factory Pattern (Criacional)

**Localização**: `src/patterns/factory/ServiceFactory.ts`

**Propósito**: 
O Factory Pattern centraliza a criação de objetos (services), encapsulando a lógica de instanciação e permitindo flexibilidade na injeção de dependências. Isso é especialmente útil para testes, onde podemos injetar um DataSource de teste.

**Problema Resolvido**:
- **Antes**: Services eram criados diretamente nas rotas com `new UsuarioService()`, dificultando testes e injeção de dependências

Exemplo (como estava):

```typescript
// src/routes/usuarioRoutes.ts (antes)
import { Router } from 'express';
import { UsuarioService } from '../services/UsuarioService';

const router = Router();

router.post('/registro', async (req, res) => {
    // Instanciação direta impede injeção de datasource para testes
    const usuarioService = new UsuarioService();
    const usuario = await usuarioService.criarUsuario(req.body);
    res.json(usuario);
});
```

- **Depois**: Centralização da criação através da Factory, permitindo fácil substituição do DataSource para testes

Exemplo (como está agora):

```typescript
// src/routes/usuarioRoutes.ts (agora)
import { Router } from 'express';
import { ServiceFactory } from '../patterns/factory/ServiceFactory';

const router = Router();

router.post('/registro', async (req, res) => {
    // Cria service via factory (permite injetar DataSource em testes)
    const usuarioService = ServiceFactory.createUsuarioService();
    const usuario = await usuarioService.criarUsuario(req.body);
    res.json(usuario);
});
```




**Benefícios**:
- Facilita testes unitários com banco em memória
- Centraliza lógica de criação
- Reduz acoplamento entre rotas e services
- Facilita manutenção e evolução

---

### 2. Facade Pattern (Estrutural)

**Localização**: `src/patterns/facade/AuthFacade.ts`

**Propósito**:
O Facade Pattern fornece uma interface simplificada e unificada para o sistema complexo de autenticação e autorização. Esconde a complexidade de geração/validação de tokens JWT, middleware de autenticação e autorização por níveis.

**Problema Resolvido**:
- **Antes**: Rotas precisavam usar múltiplos middlewares (`autenticarToken`, `autorizarNivel`) e gerar tokens manualmente com `jwt.sign()`, aumentando complexidade e duplicação de código
- **Depois**: Interface única e simples através da Facade, reduzindo código nas rotas e centralizando lógica de autenticação

Exemplo (como estava):

```typescript
// src/routes/usuarioRoutes.ts (antes)
import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UsuarioService } from '../services/UsuarioService';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config/jwt';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
    const { username, senha, token2FA } = req.body;
    const usuarioService = new UsuarioService();
    const usuario = await usuarioService.autenticarUsuario(username, senha, token2FA);
    const token = jwt.sign({ id: usuario.id, username: usuario.username, nivelAcesso: usuario.nivelAcesso }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.json({ token });
});

// rota protegida com middlewares separados
function autenticarToken(req: any, res: Response, next: any) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ msg: 'Token não fornecido' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        req.user = decoded;
        next();
    } catch (err) {
        res.status(403).json({ msg: 'Token inválido' });
    }
}

function autorizarNivel(allowedLevels: string[]) {
    return (req: any, res: Response, next: any) => {
        if (!allowedLevels.includes(req.user.nivelAcesso)) {
            return res.status(403).json({ msg: 'Acesso negado' });
        }
        next();
    };
}
```

Exemplo (como está agora):

```typescript
// src/routes/usuarioRoutes.ts (agora)
import { Router } from 'express';
import { authFacade } from '../patterns/facade/AuthFacade';

const router = Router();

router.post('/login', async (req, res) => {
    const { username, senha, token2FA } = req.body;
    const token = await authFacade.login(username, senha, token2FA);
    res.json({ token });
});

// rota protegida usando a facade
router.get('/usuarios', authFacade.requireAuth(/* níveis permitidos */), (req, res) => {
    // ...handler
});
```



**Benefícios**:
- Simplifica uso de autenticação/autorização nas rotas
- Centraliza lógica de tokens JWT
- Reduz duplicação de código
- Facilita manutenção e evolução do sistema de auth
- Interface mais limpa e intuitiva

---

### 3. Strategy Pattern (Comportamental)

**Localização**: `src/patterns/strategy/ValidationStrategy.ts`

**Propósito**:
O Strategy Pattern define uma família de algoritmos de validação, encapsula cada um e os torna intercambiáveis. Permite que diferentes estratégias de validação sejam aplicadas sem modificar o código cliente.

**Problema Resolvido**:
- **Antes**: Validações eram feitas inline nas rotas ou services, dificultando reutilização, testes e adição de novos tipos de validação
- **Depois**: Cada tipo de validação é uma estratégia isolada, facilmente intercambiável e testável

Exemplo (como estava):

```typescript
// src/routes/usuarioRoutes.ts (antes)
import { Router } from 'express';

const router = Router();

router.post('/registro', async (req, res) => {
    const { username, senha } = req.body;
    // validação inline
    if (!username || username.length < 3) return res.status(400).json({ msg: 'Username inválido' });
    if (!senha || senha.length < 6) return res.status(400).json({ msg: 'Senha muito curta' });

    // criar usuário...
});
```

Exemplo (como está agora):

```typescript
// src/routes/usuarioRoutes.ts (agora)
import { Router } from 'express';
import { ValidatorFactory } from '../patterns/strategy/ValidationStrategy';

const router = Router();

router.post('/registro', async (req, res) => {
    const { username, senha } = req.body;
    const usernameValidator = ValidatorFactory.createUsernameValidator();
    const passwordValidator = ValidatorFactory.createPasswordValidator(6, false, true);

    const uRes = usernameValidator.validate(username);
    if (!uRes.isValid) return res.status(400).json({ msg: uRes.error });

    const pRes = passwordValidator.validate(senha);
    if (!pRes.isValid) return res.status(400).json({ msg: pRes.error });

    // criar usuário com validações aplicadas
});
```


**Benefícios**:
- Facilita adicionar novos tipos de validação sem modificar código existente
- Permite trocar estratégias em tempo de execução
- Facilita testes unitários de cada estratégia isoladamente
- Código mais extensível e manutenível
- Reutilização de validações em diferentes partes do sistema

---

## 📁 Estrutura do Projeto

```
src/
├── config/              # Configurações (JWT, etc.)
├── dto/                 # Data Transfer Objects
├── entities/            # Entidades TypeORM
├── middleware/          # Middlewares Express
├── patterns/            # Design Patterns
│   ├── factory/         # Factory Pattern
│   ├── facade/          # Facade Pattern
│   └── strategy/        # Strategy Pattern
├── routes/              # Rotas da API
├── services/            # Camada de serviços
└── tests/               # Testes
    ├── integration/     # Testes de integração
    ├── middleware/      # Testes de middleware
    ├── patterns/        # Testes TDD dos Design Patterns
    │   ├── factory/     # Testes Factory Pattern
    │   ├── facade/      # Testes Facade Pattern
    │   └── strategy/    # Testes Strategy Pattern
    └── services/        # Testes de services
```

## 🧪 Testes

Execute os testes com:

```bash
npm test
```

O projeto possui:
- ✅ Testes unitários de services
- ✅ Testes de middleware
- ✅ Testes de integração da API
- ✅ Testes dos Design Patterns (Factory, Facade, Strategy)
- ✅ Cobertura completa de funcionalidades

### 🎯 Test-Driven Development (TDD)

Este projeto utiliza **TDD (Test-Driven Development)** como metodologia de desenvolvimento. TDD é uma prática onde escrevemos os testes **antes** de implementar o código de produção, seguindo o ciclo **Red-Green-Refactor**.

#### 📋 Ciclo TDD: Red-Green-Refactor

O desenvolvimento segue três etapas cíclicas:

1. **🔴 RED (Vermelho)** - Escrever um teste que falha
   - Define o comportamento esperado
   - O teste falha porque a funcionalidade ainda não existe

2. **🟢 GREEN (Verde)** - Implementar código mínimo para o teste passar
   - Foco em fazer o teste passar rapidamente
   - Código pode não ser perfeito ainda

3. **🔵 REFACTOR (Refatorar)** - Melhorar o código mantendo os testes passando
   - Remove duplicação
   - Melhora legibilidade e estrutura
   - Mantém os testes verdes

#### 💡 Exemplo Prático no Projeto

##### Funcionalidade: Filtrar tarefas por status

**🔴 Passo 1: RED - Escrever o teste primeiro**

```typescript
describe("listarTarefasPorUsuarioEStatus - TDD", () => {
    it("deve filtrar tarefas por status 'pendente'", async () => {
        // Criar tarefas com diferentes status
        await tarefaService.criarTarefa(usuarioId, {
            titulo: "Tarefa pendente 1",
            status: "pendente"
        });
        await tarefaService.criarTarefa(usuarioId, {
            titulo: "Tarefa em andamento",
            status: "andamento"
        });

        // Filtrar por status pendente
        const tarefasPendentes = await tarefaService.listarTarefasPorUsuarioEStatus(
            usuarioId,
            "pendente"
        );

        expect(tarefasPendentes).toHaveLength(2);
        tarefasPendentes.forEach(tarefa => {
            expect(tarefa.status).toBe("pendente");
        });
    });
});
```

**Resultado**: ❌ Teste falha porque o método não existe ainda

**🟢 Passo 2: GREEN - Implementar o código mínimo**

```typescript
async listarTarefasPorUsuarioEStatus(
    usuarioId: number,
    status: "pendente" | "andamento" | "concluida"
): Promise<TarefaResponseDTO[]> {
    const tarefas = await this.tarefaRepository.find({
        where: {
            usuario: { id: usuarioId },
            status: status
        },
        relations: ["usuario"]
    });
    return tarefas.map(t => this.toResponseDTO(t));
}
```

**Resultado**: ✅ Teste passa!

**🔵 Passo 3: REFACTOR - Melhorar o código (se necessário)**

Neste caso, o código já está limpo e eficiente, então não foi necessário refatorar.

#### 📊 Cobertura TDD no Projeto

O projeto aplica TDD nas seguintes áreas:

- ✅ **Design Patterns**:
  - `ServiceFactory` (`src/tests/patterns/factory/ServiceFactory.test.ts`)
  - `AuthFacade` (`src/tests/patterns/facade/AuthFacade.test.ts`)
  - `ValidationStrategy` (`src/tests/patterns/strategy/ValidationStrategy.test.ts`)

- ✅ **Services**:
  - `UsuarioService` (testes existentes)
  - `TarefaService` (incluindo novo método com TDD: `listarTarefasPorUsuarioEStatus`)

- ✅ **Middleware**:
  - Autenticação e autorização

- ✅ **Integração**:
  - Testes end-to-end da API

#### 🎓 Benefícios do TDD

1. **Design melhor**: Forçar a pensar na interface antes da implementação
2. **Documentação viva**: Os testes servem como documentação do comportamento esperado
3. **Confiança**: Refatoração segura com rede de segurança de testes
4. **Detecção precoce de bugs**: Problemas são encontrados antes mesmo do código ser escrito
5. **Código testável**: O código fica naturalmente mais testável e desacoplado

#### 📝 Estrutura de Testes

```
src/tests/
├── patterns/
│   ├── factory/
│   │   └── ServiceFactory.test.ts      # TDD: Factory Pattern
│   ├── facade/
│   │   └── AuthFacade.test.ts          # TDD: Facade Pattern
│   └── strategy/
│       └── ValidationStrategy.test.ts  # TDD: Strategy Pattern
├── services/
│   ├── usuarioService.test.ts
│   └── tarefaService.test.ts           # Inclui exemplo TDD completo
├── middleware/
│   └── auth.test.ts
└── integration/
    └── api.test.ts
```

#### 🚀 Executando Testes Específicos

```bash
# Executar todos os testes
npm test

# Executar testes em modo watch (desenvolvimento)
npm run test:watch

# Executar testes de um arquivo específico
npm test -- tarefaService

# Executar testes de padrões
npm test -- patterns
```

## 🚀 Como Executar

1. **Instalar dependências**:
```bash
npm install
```

2. **Configurar banco de dados**:
   - Edite `src/data-source.ts` com suas credenciais PostgreSQL
   - Ou use SQLite para desenvolvimento

3. **Executar servidor**:
```bash
npm start
# ou
npx ts-node src/index.ts
```

4. **Acessar aplicação**:
   - Frontend: `http://localhost:3000`
   - API: `http://localhost:3000/api`

## 📝 Endpoints da API

### Autenticação
- `POST /registro` - Criar novo usuário
- `POST /login` - Autenticar usuário

### Usuários (requer autenticação)
- `GET /usuarios` - Listar todos (apenas admin)
- `GET /usuarios/:id` - Buscar por ID
- `PUT /usuarios/:id` - Atualizar usuário
- `DELETE /usuarios/:id` - Deletar usuário (apenas admin)

### Tarefas (requer autenticação)
- `GET /tarefas` - Listar tarefas do usuário
- `POST /tarefas` - Criar tarefa (gerencial/admin)
- `PUT /tarefas/:id` - Atualizar tarefa (gerencial/admin)
- `DELETE /tarefas/:id` - Deletar tarefa (apenas admin)

## 🔐 Níveis de Acesso

- **Visualização**: Apenas visualizar tarefas
- **Gerencial**: Criar e editar tarefas
- **Administrativo**: Acesso completo (incluindo deletar)


**Desenvolvido com TypeScript, Express e TypeORM**

