# 🕐 Sistema de Controle de Ponto - Supabase

Sistema web de controle de ponto integrado com **Supabase** como backend real.

## 🚀 Configuração do Supabase

### Estrutura das Tabelas

O sistema utiliza as seguintes tabelas no Supabase:

#### 1. `usuarios`
```sql
- id (uuid, primary key, references auth.users)
- nome (text)
- email (text, unique)
- departamento (text)
- tipo (text) - 'admin' ou 'funcionario'
- valor_hora (numeric)
- created_at (timestamp)
```

#### 2. `registros_ponto`
```sql
- id (uuid, primary key)
- user_id (uuid, references usuarios.id)
- tipo (text) - 'entrada' ou 'saida'
- timestamp (timestamp)
- created_at (timestamp)
```

#### 3. `horas_extras`
```sql
- id (uuid, primary key)
- user_id (uuid, references usuarios.id)
- inicio (timestamp)
- fim (timestamp, nullable)
- status (text) - 'pendente', 'aprovado', 'rejeitado'
- created_at (timestamp)
```

### Políticas RLS (Row Level Security)

**IMPORTANTE:** Configure as políticas RLS no Supabase:

1. **usuarios:**
   - SELECT: Usuários podem ver seus próprios dados, admins podem ver todos
   - UPDATE: Apenas admins podem atualizar

2. **registros_ponto:**
   - SELECT: Usuários veem apenas seus próprios registros, admins veem todos
   - INSERT: Usuários podem inserir apenas seus próprios registros

3. **horas_extras:**
   - SELECT: Usuários veem apenas suas horas extras, admins veem todas
   - INSERT: Usuários podem inserir apenas suas horas extras
   - UPDATE: Apenas admins podem atualizar status

## 📋 Como Testar

### 1. Verificar Conexão com Supabase

1. Abra o arquivo `index.html` no navegador
2. Abra o Console do Desenvolvedor (F12)
3. Verifique se não há erros de conexão

### 2. Criar Primeiro Usuário (Admin)

1. Acesse a tela de cadastro
2. Preencha os dados:
   - Nome: Seu nome
   - Email: `seu.email@flashguyscleaning.com` (obrigatório terminar com @flashguyscleaning.com)
   - Senha: Mínimo 6 caracteres
   - Departamento: Selecione um
3. Clique em "Cadastrar"
4. **O primeiro usuário cadastrado automaticamente vira ADMIN**

### 3. Testar Login

1. Na tela de login, digite o email e senha cadastrados
2. Clique em "Entrar"
3. Você será redirecionado automaticamente:
   - **Admin** → `admin.html`
   - **Funcionário** → `funcionario.html`

### 4. Testar Interface do Funcionário

1. Faça login como funcionário
2. Clique em "INICIAR JORNADA" - deve registrar entrada
3. Clique em "FINALIZAR JORNADA" - deve registrar saída e calcular horas
4. Clique em "INICIAR HORA EXTRA" - deve iniciar hora extra pendente
5. Clique em "FINALIZAR HORA EXTRA" - deve finalizar e aguardar aprovação
6. Verifique o histórico do dia

### 5. Testar Interface do Admin

1. Faça login como admin
2. **Horas Extras Pendentes:**
   - Veja lista de horas extras aguardando aprovação
   - Clique em "Aprovar" ou "Rejeitar"
3. **Dashboard:**
   - Veja estatísticas por departamento
   - Total de horas normais e extras
   - Total a pagar por departamento
4. **Funcionários:**
   - Veja lista de todos os funcionários
   - Edite o valor por hora de cada um
   - Veja cálculos automáticos de pagamento
5. **Relatório Mensal:**
   - Veja totais por departamento
   - Veja total geral da folha

## 🔧 Troubleshooting

### Erro: "Failed to fetch"
- Verifique se as credenciais do Supabase estão corretas em `supabase-config.js`
- Verifique se o projeto Supabase está ativo
- Verifique a conexão com a internet

### Erro: "User not found"
- Verifique se o usuário foi criado na tabela `usuarios`
- Verifique se as políticas RLS estão configuradas corretamente

### Erro: "Email já cadastrado"
- O email já existe no sistema
- Tente fazer login ao invés de cadastrar

### Erro: "Apenas emails @flashguyscleaning.com"
- O sistema valida que o email termine com `@flashguyscleaning.com`
- Use um email válido com esse domínio

### Dados não aparecem
- Verifique o Console do navegador (F12) para erros
- Verifique se as políticas RLS estão permitindo acesso
- Verifique se os dados foram salvos no Supabase (Dashboard do Supabase)

## 📁 Arquivos do Sistema

- `index.html` - Tela de login
- `cadastro.html` - Tela de cadastro
- `funcionario.html` - Interface do funcionário
- `admin.html` - Interface do admin
- `supabase-config.js` - Configuração do Supabase
- `supabase-service.js` - Funções de interação com Supabase
- `funcionario.js` - Lógica da interface do funcionário
- `admin.js` - Lógica da interface do admin
- `styles.css` - Estilos do sistema

## 🔐 Segurança

- Autenticação via Supabase Auth
- Validação de email obrigatória (@flashguyscleaning.com)
- Senha mínima de 6 caracteres
- Row Level Security (RLS) no Supabase
- Usuários só veem seus próprios dados
- Admins têm acesso completo

## 📊 Funcionalidades

### Funcionário
- ✅ Iniciar/Finalizar jornada
- ✅ Iniciar/Finalizar horas extras
- ✅ Ver histórico do dia
- ✅ Ver status de aprovação de horas extras

### Admin
- ✅ Ver todos os funcionários
- ✅ Aprovar/Rejeitar horas extras
- ✅ Editar valor por hora
- ✅ Ver dashboard por departamento
- ✅ Ver relatório mensal
- ✅ Calcular totais de pagamento

## 🎯 Próximos Passos

1. Configure as políticas RLS no Supabase Dashboard
2. Teste o cadastro do primeiro usuário (admin)
3. Teste o cadastro de funcionários
4. Teste todas as funcionalidades
5. Verifique os dados no Supabase Dashboard

---

**Desenvolvido com Supabase** ❤️

