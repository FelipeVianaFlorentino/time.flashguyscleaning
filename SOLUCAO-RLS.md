# 🔧 Solução para Erro de Recursão RLS

## Problema
Erro: "infinite recursion detected in policy for relation 'usuarios'"

Este erro ocorre quando as políticas RLS tentam verificar permissões consultando a própria tabela `usuarios` durante uma inserção, criando um loop infinito.

## ⚡ Solução Rápida (Recomendada)

### Opção 1: Criar Primeiro Usuário Manualmente

1. Acesse o Supabase Dashboard
2. Vá em **Table Editor** > **usuarios**
3. Clique em **Insert** e crie o primeiro usuário manualmente:
   - `id`: UUID do usuário do Auth (pegue em Authentication > Users)
   - `nome`: Nome do usuário
   - `email`: Email do usuário
   - `departamento`: Departamento
   - `tipo`: **'admin'** (importante!)
   - `valor_hora`: 25
4. Depois disso, os próximos cadastros funcionarão normalmente

### Opção 2: Configurar Políticas RLS Corretas (Solução Definitiva)

## Solução: Configurar Políticas RLS Corretas no Supabase

### 1. Acesse o Supabase Dashboard
- Vá para: Authentication > Policies
- Ou: Table Editor > usuarios > RLS Policies

### 2. Configure as Políticas para a tabela `usuarios`

#### Política de INSERT (Permitir inserção do próprio usuário)
```sql
CREATE POLICY "Users can insert their own record"
ON usuarios
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);
```

#### Política de SELECT (Ver próprio registro ou ser admin)
```sql
CREATE POLICY "Users can view own record or admins can view all"
ON usuarios
FOR SELECT
TO authenticated
USING (
  auth.uid() = id 
  OR 
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = auth.uid() 
    AND tipo = 'admin'
  )
);
```

**⚠️ ATENÇÃO:** A política acima ainda pode causar recursão. Use esta versão mais segura:

```sql
-- Política de SELECT mais segura
CREATE POLICY "Users can view own record"
ON usuarios
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Política adicional para admins verem todos
CREATE POLICY "Admins can view all users"
ON usuarios
FOR SELECT
TO authenticated
USING (
  (SELECT tipo FROM usuarios WHERE id = auth.uid()) = 'admin'
);
```

**⚠️ AINDA PODE CAUSAR RECURSÃO!** Use esta abordagem alternativa:

### Solução Recomendada: Função SQL + Trigger

#### 1. Criar função para verificar se é admin (sem recursão)
```sql
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = user_id 
    AND tipo = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 2. Criar função para contar usuários (sem recursão)
```sql
CREATE OR REPLACE FUNCTION count_usuarios()
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM usuarios);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 3. Políticas RLS Simplificadas

**INSERT:**
```sql
CREATE POLICY "Allow insert own user"
ON usuarios
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);
```

**SELECT (próprio registro):**
```sql
CREATE POLICY "View own user"
ON usuarios
FOR SELECT
TO authenticated
USING (auth.uid() = id);
```

**SELECT (admins veem todos):**
```sql
CREATE POLICY "Admins view all"
ON usuarios
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));
```

**UPDATE (apenas admins):**
```sql
CREATE POLICY "Only admins can update"
ON usuarios
FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()));
```

### 3. Trigger para Primeiro Usuário ser Admin

Crie um trigger que automaticamente define o primeiro usuário como admin:

```sql
CREATE OR REPLACE FUNCTION set_first_user_as_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- Se não há nenhum usuário, este é o primeiro
  IF (SELECT COUNT(*) FROM usuarios) = 0 THEN
    NEW.tipo := 'admin';
  ELSE
    -- Se não foi definido, padrão é funcionario
    IF NEW.tipo IS NULL THEN
      NEW.tipo := 'funcionario';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER first_user_admin_trigger
BEFORE INSERT ON usuarios
FOR EACH ROW
EXECUTE FUNCTION set_first_user_as_admin();
```

### 4. Alternativa Mais Simples (Recomendada)

Se as soluções acima ainda causarem problemas, use esta abordagem:

1. **Desabilite RLS temporariamente** para criar o primeiro usuário manualmente no Supabase Dashboard
2. **Crie o primeiro usuário como admin** diretamente no banco
3. **Reative RLS** com políticas mais simples:

```sql
-- Política INSERT: Qualquer usuário autenticado pode inserir seu próprio registro
CREATE POLICY "insert_own_user"
ON usuarios FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Política SELECT: Ver próprio registro
CREATE POLICY "select_own_user"
ON usuarios FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Política SELECT: Admins veem todos (usando função SECURITY DEFINER)
CREATE POLICY "admins_select_all"
ON usuarios FOR SELECT
TO authenticated
USING (
  (SELECT tipo FROM usuarios WHERE id = auth.uid() LIMIT 1) = 'admin'
);
```

## Como Aplicar

1. Acesse o Supabase Dashboard
2. Vá em SQL Editor
3. Execute os comandos SQL acima na ordem
4. Teste o cadastro novamente

## Nota Importante

O código JavaScript foi atualizado para tentar evitar a recursão, mas a solução definitiva está nas políticas RLS do Supabase. Configure as políticas conforme descrito acima.

