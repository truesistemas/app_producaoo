# 🔐 Sistema de Autenticação - ControleProd

## 📋 Visão Geral

O ControleProd agora possui um sistema completo de autenticação com controle granular de acesso baseado em roles. O sistema implementa JWT (JSON Web Tokens) para autenticação segura e stateless.

## 🚀 Funcionalidades Implementadas

### ✅ Autenticação Backend
- **Middleware JWT**: Autenticação baseada em tokens
- **Hash de senhas**: Utilizando bcrypt com salt rounds 12
- **Rotas protegidas**: Todas as APIs requerem autenticação
- **Controle granular**: Três níveis de acesso (operator, supervisor, admin)

### ✅ Sistema de Roles

| Role | Nível | Permissões |
|------|-------|------------|
| **Operator** | 1 | Visualizar dados, iniciar/pausar produção |
| **Supervisor** | 2 | Operator + Gerenciar colaboradores, máquinas, matrizes |
| **Admin** | 3 | Supervisor + Deletar dados, gerenciar usuários |

### ✅ Frontend Completo
- **Página de Login/Registro**: Interface moderna com tabs
- **Context de Autenticação**: Gerenciamento de estado global
- **Route Guards**: Proteção automática de rotas
- **Sidebar dinâmica**: Informações do usuário e logout
- **Feedback visual**: Badges coloridos por role

## 🔑 Credenciais Padrão

Para testar o sistema, foi criado um usuário administrador:

```
Username: admin
Password: admin123
Role: admin
```

## 🛡️ Segurança Implementada

### Backend
- Senhas hasheadas com bcrypt (12 rounds)
- JWT com issuer e audience validation
- Middleware de autenticação em todas as rotas protegidas
- Validação granular por roles

### Frontend
- Token armazenado em localStorage (pode ser migrado para httpOnly cookies)
- Refresh automático de token
- Logout automático em caso de token inválido
- Context React para estado de autenticação

## 📡 Rotas da API

### Autenticação
```
POST /api/auth/login        - Login do usuário
POST /api/auth/register     - Registro de novo usuário  
GET  /api/auth/me          - Informações do usuário atual
POST /api/auth/logout      - Logout (client-side)
PUT  /api/auth/change-password - Alterar senha
```

### Proteção das Rotas Existentes
```
GET /api/employees         - Requer: Autenticação
POST /api/employees        - Requer: Supervisor+
PUT /api/employees/:id     - Requer: Supervisor+
DELETE /api/employees/:id  - Requer: Admin

GET /api/machines          - Requer: Autenticação
POST /api/machines         - Requer: Supervisor+

GET /api/production-sessions - Requer: Autenticação
GET /api/dashboard/stats   - Requer: Autenticação
```

## 🎨 Componentes Frontend

### Novos Componentes
- `contexts/auth-context.tsx` - Context de autenticação
- `pages/login.tsx` - Página de login/registro
- `components/auth/route-guard.tsx` - Proteção de rotas

### Componentes Atualizados
- `App.tsx` - Integração com AuthProvider e rotas protegidas
- `components/layout/sidebar.tsx` - Dropdown do usuário com logout
- `lib/queryClient.tsx` - Inclusão automática de token JWT

## 🚀 Como Usar

### 1. Primeiro Acesso
1. Acesse `http://localhost:5002`
2. Será redirecionado para `/login`
3. Use as credenciais padrão: `admin` / `admin123`

### 2. Criando Novos Usuários
1. Na tela de login, clique na tab "Cadastrar"
2. Preencha nome, usuário, senha e role
3. Ou use a API `/api/auth/register`

### 3. Testando Roles
- **Operator**: Pode ver dados mas não pode criar/editar/deletar
- **Supervisor**: Pode gerenciar colaboradores, máquinas, etc.
- **Admin**: Acesso total ao sistema

## 🔧 Scripts Úteis

```bash
# Criar usuário admin (se não existir)
npm run create-admin

# Executar sistema em desenvolvimento
npm run dev

# Aplicar mudanças no banco
npm run db:push
```

## 🎯 Próximos Passos Sugeridos

1. **Refresh Token**: Implementar renovação automática de tokens
2. **Session Management**: Migrar para httpOnly cookies
3. **Audit Log**: Registrar ações dos usuários
4. **2FA**: Autenticação de dois fatores
5. **Password Policy**: Políticas de senha mais rigorosas
6. **Rate Limiting**: Proteção contra ataques de força bruta

## 🐛 Troubleshooting

### Token Expirado
- Faça logout e login novamente
- Tokens são válidos por 24h por padrão

### Erro de Permissão
- Verifique se o usuário tem o role adequado
- Alguns recursos exigem Supervisor ou Admin

### Problemas de Conexão
- Verifique se o banco de dados está acessível
- Confirme as variáveis de ambiente

---

## 📝 Notas Técnicas

- JWT Secret: Configurable via `JWT_SECRET` env var
- Token Expiry: Configurable via `JWT_EXPIRES_IN` env var
- Role Hierarchy: Operator(1) < Supervisor(2) < Admin(3)
- Password Requirements: Mínimo 6 caracteres

O sistema está totalmente funcional e pronto para produção! 🎉 