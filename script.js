// Funções compartilhadas

// Validar email @flashguyscleaning.com
function validarEmail(email) {
    return email.toLowerCase().endsWith('@flashguyscleaning.com');
}

// Inicializar dados
function initData() {
    // Inicializar usuários se não existir
    if (!localStorage.getItem('usuarios')) {
        localStorage.setItem('usuarios', JSON.stringify([]));
    }
    
    // Migrar funcionários antigos para novo formato (se existirem)
    const funcionariosAntigos = localStorage.getItem('funcionarios');
    if (funcionariosAntigos) {
        try {
            const funcionarios = JSON.parse(funcionariosAntigos);
            const usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
            
            // Converter funcionários antigos para novo formato
            funcionarios.forEach((func, index) => {
                const emailExistente = usuarios.find(u => u.email === `${func.nome.toLowerCase().replace(/\s+/g, '.')}@flashguyscleaning.com`);
                if (!emailExistente) {
                    usuarios.push({
                        id: func.id,
                        nome: func.nome,
                        email: `${func.nome.toLowerCase().replace(/\s+/g, '.')}@flashguyscleaning.com`,
                        senha: 'senha123', // Senha padrão para migração
                        departamento: func.departamento,
                        valorHora: func.valorHora || 25,
                        tipo: index === 0 ? 'admin' : 'funcionario' // Primeiro vira admin
                    });
                }
            });
            
            localStorage.setItem('usuarios', JSON.stringify(usuarios));
        } catch (e) {
            console.log('Erro ao migrar dados antigos');
        }
    }
    
    if (!localStorage.getItem('registros')) {
        localStorage.setItem('registros', JSON.stringify([]));
    }
    
    if (!localStorage.getItem('horasExtras')) {
        localStorage.setItem('horasExtras', JSON.stringify([]));
    }
}

// Obter todos os usuários
function getAllUsuarios() {
    return JSON.parse(localStorage.getItem('usuarios') || '[]');
}

// Buscar usuário por email
function getUsuarioPorEmail(email) {
    const usuarios = getAllUsuarios();
    return usuarios.find(u => u.email === email.toLowerCase());
}

// Cadastrar novo usuário
function cadastrarUsuario(nome, email, senha, departamento) {
    // Validar email
    if (!validarEmail(email)) {
        return { success: false, message: 'Apenas emails @flashguyscleaning.com podem se cadastrar.' };
    }
    
    // Verificar se email já existe
    const usuarios = getAllUsuarios();
    if (usuarios.find(u => u.email === email.toLowerCase())) {
        return { success: false, message: 'Este email já está cadastrado.' };
    }
    
    // Verificar se é o primeiro usuário (vira admin)
    const isPrimeiroUsuario = usuarios.length === 0;
    
    // Criar novo usuário
    const novoId = usuarios.length > 0 ? Math.max(...usuarios.map(u => u.id)) + 1 : 1;
    const novoUsuario = {
        id: novoId,
        nome: nome,
        email: email.toLowerCase(),
        senha: senha, // Em produção, isso deveria ser hash
        departamento: departamento,
        valorHora: 25,
        tipo: isPrimeiroUsuario ? 'admin' : 'funcionario'
    };
    
    usuarios.push(novoUsuario);
    localStorage.setItem('usuarios', JSON.stringify(usuarios));
    
    // Criar também no formato funcionário para compatibilidade
    criarFuncionarioSeNaoExistir(novoUsuario);
    
    return { success: true, usuario: novoUsuario };
}

// Criar funcionário se não existir (para compatibilidade)
function criarFuncionarioSeNaoExistir(usuario) {
    const funcionarios = JSON.parse(localStorage.getItem('funcionarios') || '[]');
    const funcionarioExistente = funcionarios.find(f => f.id === usuario.id);
    
    if (!funcionarioExistente) {
        funcionarios.push({
            id: usuario.id,
            nome: usuario.nome,
            departamento: usuario.departamento,
            valorHora: usuario.valorHora
        });
        localStorage.setItem('funcionarios', JSON.stringify(funcionarios));
    }
}

// Fazer login
function fazerLogin(email, senha) {
    const usuario = getUsuarioPorEmail(email);
    
    if (!usuario) {
        return null;
    }
    
    // Em produção, comparar hash da senha
    if (usuario.senha !== senha) {
        return null;
    }
    
    // Criar funcionário se não existir (para compatibilidade)
    criarFuncionarioSeNaoExistir(usuario);
    
    // Retornar usuário sem senha
    const usuarioLogado = { ...usuario };
    delete usuarioLogado.senha;
    
    return usuarioLogado;
}

// Obter funcionário (mantido para compatibilidade)
function getFuncionario(nome, departamento) {
    const funcionarios = JSON.parse(localStorage.getItem('funcionarios') || '[]');
    return funcionarios.find(f => f.nome === nome && f.departamento === departamento);
}

// Criar novo funcionário (mantido para compatibilidade)
function criarFuncionario(nome, departamento) {
    const funcionarios = JSON.parse(localStorage.getItem('funcionarios') || '[]');
    const novoId = funcionarios.length > 0 ? Math.max(...funcionarios.map(f => f.id)) + 1 : 1;
    const novoFuncionario = {
        id: novoId,
        nome: nome,
        departamento: departamento,
        valorHora: 25
    };
    funcionarios.push(novoFuncionario);
    localStorage.setItem('funcionarios', JSON.stringify(funcionarios));
    return novoFuncionario;
}

// Obter funcionário logado
function getFuncionarioLogado() {
    const funcionarioStr = localStorage.getItem('funcionarioLogado');
    if (!funcionarioStr) {
        window.location.href = 'index.html';
        return null;
    }
    const usuario = JSON.parse(funcionarioStr);
    
    // Garantir que o funcionário existe na lista de funcionários
    criarFuncionarioSeNaoExistir(usuario);
    
    return usuario;
}

// Logout
function logout() {
    localStorage.removeItem('funcionarioLogado');
    window.location.href = 'index.html';
}

// Formatar data/hora
function formatarDataHora(data) {
    const d = new Date(data);
    return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Formatar apenas hora
function formatarHora(data) {
    const d = new Date(data);
    return d.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Calcular diferença de horas
function calcularHoras(entrada, saida) {
    const diff = new Date(saida) - new Date(entrada);
    const horas = diff / (1000 * 60 * 60);
    return Math.round(horas * 100) / 100; // Arredondar para 2 casas decimais
}

// Obter data atual no formato YYYY-MM-DD
function getDataAtual() {
    const hoje = new Date();
    return hoje.toISOString().split('T')[0];
}

// Obter registros do dia atual
function getRegistrosDia(funcionarioId) {
    const registros = JSON.parse(localStorage.getItem('registros') || '[]');
    const hoje = getDataAtual();
    return registros.filter(r => 
        r.funcionarioId === funcionarioId && 
        r.data === hoje
    );
}

// Obter horas extras do funcionário
function getHorasExtras(funcionarioId) {
    const horasExtras = JSON.parse(localStorage.getItem('horasExtras') || '[]');
    return horasExtras.filter(h => h.funcionarioId === funcionarioId);
}

// Obter todas as horas extras pendentes
function getHorasExtrasPendentes() {
    const horasExtras = JSON.parse(localStorage.getItem('horasExtras') || '[]');
    return horasExtras.filter(h => h.status === 'pendente');
}

// Obter todos os funcionários
function getAllFuncionarios() {
    // Tentar obter da lista de funcionários primeiro
    const funcionarios = JSON.parse(localStorage.getItem('funcionarios') || '[]');
    
    // Se não houver funcionários, criar a partir dos usuários
    if (funcionarios.length === 0) {
        const usuarios = getAllUsuarios();
        const funcionariosNovos = usuarios.map(u => ({
            id: u.id,
            nome: u.nome,
            departamento: u.departamento,
            valorHora: u.valorHora || 25
        }));
        localStorage.setItem('funcionarios', JSON.stringify(funcionariosNovos));
        return funcionariosNovos;
    }
    
    return funcionarios;
}

// Obter todos os registros
function getAllRegistros() {
    return JSON.parse(localStorage.getItem('registros') || '[]');
}

// Obter todas as horas extras
function getAllHorasExtras() {
    return JSON.parse(localStorage.getItem('horasExtras') || '[]');
}

// Obter mês atual no formato YYYY-MM
function getMesAtual() {
    const hoje = new Date();
    return hoje.toISOString().slice(0, 7);
}

// Calcular horas trabalhadas no mês
function calcularHorasMes(funcionarioId, mes) {
    const registros = getAllRegistros();
    const registrosMes = registros.filter(r => {
        const registroMes = r.data.slice(0, 7);
        return r.funcionarioId === funcionarioId && registroMes === mes && r.saida;
    });
    
    let totalHoras = 0;
    registrosMes.forEach(r => {
        totalHoras += calcularHoras(r.entrada, r.saida);
    });
    
    return totalHoras;
}

// Calcular horas extras aprovadas no mês
function calcularHorasExtrasMes(funcionarioId, mes) {
    const horasExtras = getAllHorasExtras();
    const horasExtrasMes = horasExtras.filter(h => {
        const horaExtraMes = h.data.slice(0, 7);
        return h.funcionarioId === funcionarioId && 
               horaExtraMes === mes && 
               h.status === 'aprovado' &&
               h.saida;
    });
    
    let totalHoras = 0;
    horasExtrasMes.forEach(h => {
        totalHoras += calcularHoras(h.entrada, h.saida);
    });
    
    return totalHoras;
}

// Atualizar valor por hora do funcionário
function atualizarValorHora(funcionarioId, novoValor) {
    const funcionarios = getAllFuncionarios();
    const funcionario = funcionarios.find(f => f.id === funcionarioId);
    if (funcionario) {
        funcionario.valorHora = parseFloat(novoValor);
        localStorage.setItem('funcionarios', JSON.stringify(funcionarios));
    }
}

