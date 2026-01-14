# 🕐 Sistema de Controle de Ponto

Sistema web simples de controle de ponto com duas interfaces: **Admin** e **Time (Funcionário)**.

## 📋 Funcionalidades

### Tela de Login
- Campo para nome do funcionário
- Dropdown para selecionar departamento (Operações, Tech, Marketing, Produto, Dados)
- Botões para entrar como Funcionário ou Admin

### Interface do Funcionário (Time)
- Visualização do nome e departamento logado
- Botão "INICIAR JORNADA" (registra hora de entrada)
- Botão "FINALIZAR JORNADA" (registra hora de saída)
- Seção de Horas Extras:
  - Botão "INICIAR HORA EXTRA"
  - Botão "FINALIZAR HORA EXTRA"
  - Status de aprovação pendente
- Histórico dos registros do dia atual
- Botão de logout

### Interface do Admin
- Dashboard com visão geral por departamento
- Lista de funcionários com:
  - Total de horas trabalhadas no mês
  - Valor base por hora (editável)
  - Horas normais vs horas extras
  - Cálculo automático do valor a pagar
- Seção de "Horas Extras Pendentes" com aprovação/rejeição
- Relatório mensal:
  - Total de horas por departamento
  - Total a pagar por departamento
  - Total geral da folha

## 🚀 Como Rodar

1. **Abra o arquivo `index.html` no seu navegador**
   - Você pode simplesmente dar duplo clique no arquivo `index.html`
   - Ou abrir através do navegador: `File > Open File` e selecionar `index.html`
   - Ou usar um servidor local simples (veja opções abaixo)

2. **Servidor Local (Opcional, mas recomendado)**
   
   **Opção 1 - Python:**
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Depois acesse: http://localhost:8000
   ```
   
   **Opção 2 - Node.js (http-server):**
   ```bash
   npx http-server -p 8000
   
   # Depois acesse: http://localhost:8000
   ```
   
   **Opção 3 - VS Code Live Server:**
   - Instale a extensão "Live Server" no VS Code
   - Clique com botão direito no `index.html` e selecione "Open with Live Server"

## 📊 Dados Iniciais

O sistema já vem com alguns funcionários de exemplo pré-cadastrados:
- João Silva - Tech
- Maria Santos - Marketing
- Pedro Costa - Operações
- Ana Oliveira - Produto
- Carlos Souza - Dados
- Julia Lima - Tech

**Valor base padrão:** R$ 25,00/hora (pode ser alterado pelo admin)

## 💾 Armazenamento

Todos os dados são armazenados no **localStorage** do navegador, incluindo:
- Funcionários cadastrados
- Registros de ponto
- Horas extras (pendentes, aprovadas, rejeitadas)
- Valores por hora configurados

**⚠️ Importante:** Os dados são armazenados localmente no navegador. Se você limpar o cache ou usar outro navegador, os dados serão perdidos.

## 🎨 Tecnologias Utilizadas

- HTML5
- CSS3 (design moderno e responsivo)
- JavaScript puro (ES6+)
- LocalStorage para persistência de dados

## 📱 Responsividade

O sistema é totalmente responsivo e funciona bem em:
- Desktop
- Tablet
- Smartphone

## 🔐 Segurança

Este é um sistema simples de demonstração. A autenticação é básica e não possui validações de segurança avançadas. Para uso em produção, seria necessário implementar:
- Autenticação real com backend
- Validação de sessões
- Criptografia de dados sensíveis
- Banco de dados real

## 📝 Regras de Cálculo

- **Horas normais:** valor base/hora
- **Horas extras:** valor base/hora (mesmo valor, sem adicional)
- Apenas horas extras **aprovadas** pelo admin são contabilizadas no cálculo
- Cálculo automático da diferença entre entrada e saída

## 🎯 Fluxo de Uso

1. **Funcionário:**
   - Faz login na tela inicial
   - Inicia jornada ao começar o trabalho
   - Finaliza jornada ao terminar
   - Pode solicitar horas extras (que ficam pendentes até aprovação)

2. **Admin:**
   - Faz login como admin
   - Visualiza dashboard e funcionários
   - Aprova ou rejeita horas extras pendentes
   - Edita valores por hora dos funcionários
   - Visualiza relatórios mensais

---

Desenvolvido com ❤️ para controle de ponto simples e eficiente.

