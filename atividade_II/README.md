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

## 🏗️ Design Patterns Utilizados

Este projeto implementa três padrões de design fundamentais, um de cada categoria:

### 1. Factory Pattern (Criacional)

**Localização**: `src/patterns/factory/ServiceFactory.ts`

**Propósito**: 
O Factory Pattern centraliza a criação de objetos (services), encapsulando a lógica de instanciação e permitindo flexibilidade na injeção de dependências. Isso é especialmente útil para testes, onde podemos injetar um DataSource de teste.

**Problema Resolvido**:
- **Antes**: Services eram criados diretamente nas rotas com `new UsuarioService()`, dificultando testes e injeção de dependências
- **Depois**: Centralização da criação através da Factory, permitindo fácil substituição do DataSource para testes




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
- ✅ Cobertura completa de funcionalidades

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

## 📄 Licença

ISC

---

**Desenvolvido com TypeScript, Express e TypeORM**

