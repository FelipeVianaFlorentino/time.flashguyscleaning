// Lógica específica da interface do admin com Supabase

let funcionarioAdmin;

// Inicializar página
document.addEventListener('DOMContentLoaded', async function() {
    // Verificar se usuário está logado
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    funcionarioAdmin = await getUsuarioAtual();
    if (!funcionarioAdmin) {
        alert('Erro ao carregar dados do usuário.');
        window.location.href = 'index.html';
        return;
    }
    
    // Verificar se é admin
    if (funcionarioAdmin.tipo !== 'admin') {
        alert('Acesso negado. Apenas administradores podem acessar esta página.');
        window.location.href = 'funcionario.html';
        return;
    }
    
    // Exibir informações do usuário no card
    document.getElementById('userEmail').textContent = funcionarioAdmin.email || 'N/A';
    document.getElementById('userTipo').textContent = funcionarioAdmin.tipo === 'admin' ? 'Admin' : 'Funcionário';
    document.getElementById('userDepartamento').textContent = funcionarioAdmin.departamento || 'N/A';
    
    // Carregar dados
    await carregarHorasExtrasPendentes();
    await carregarDashboard();
    await carregarFuncionarios();
    await carregarRelatorioMensal();
    
    // Atualizar a cada 30 segundos
    setInterval(async () => {
        await carregarHorasExtrasPendentes();
        await carregarDashboard();
        await carregarFuncionarios();
        await carregarRelatorioMensal();
    }, 30000);
});

// Carregar horas extras pendentes
async function carregarHorasExtrasPendentes() {
    try {
        const pendentesDiv = document.getElementById('horasExtrasPendentes');
        const pendentes = await getHorasExtrasPendentes();
        
        if (pendentes.length === 0) {
            pendentesDiv.innerHTML = '<p class="empty-state">Nenhuma solicitação pendente.</p>';
            return;
        }
        
        let html = '';
        pendentes.forEach(horaExtra => {
            const horas = horaExtra.fim ? calcularHoras(horaExtra.inicio, horaExtra.fim) : 0;
            const dataFormatada = formatarDataHora(horaExtra.inicio);
            const fimFormatado = horaExtra.fim ? formatarHora(horaExtra.fim) : 'Em andamento...';
            
            html += `
                <div class="pendente-item">
                    <div class="pendente-info">
                        <h4>${horaExtra.funcionarioNome || 'Desconhecido'}</h4>
                        <p><strong>Departamento:</strong> ${horaExtra.funcionarioDepartamento || 'Desconhecido'}</p>
                        <p><strong>Data:</strong> ${dataFormatada}</p>
                        <p><strong>Horas:</strong> ${horas}h</p>
                    </div>
                    <div class="pendente-actions">
                        <button class="btn btn-success" onclick="aprovarHoraExtra(${horaExtra.id})">
                            ✓ Aprovar
                        </button>
                        <button class="btn btn-danger" onclick="rejeitarHoraExtra(${horaExtra.id})">
                            ✗ Rejeitar
                        </button>
                    </div>
                </div>
            `;
        });
        
        pendentesDiv.innerHTML = html;
    } catch (error) {
        console.error('Erro ao carregar horas extras pendentes:', error);
        document.getElementById('horasExtrasPendentes').innerHTML = 
            '<p class="empty-state">Erro ao carregar horas extras pendentes.</p>';
    }
}

// Aprovar hora extra
async function aprovarHoraExtra(id) {
    try {
        if (!confirm('Tem certeza que deseja aprovar esta hora extra?')) {
            return;
        }
        
        const resultado = await window.aprovarHoraExtra(id);
        
        if (resultado.success) {
            alert('Hora extra aprovada com sucesso!');
            await carregarHorasExtrasPendentes();
            await carregarDashboard();
            await carregarFuncionarios();
            await carregarRelatorioMensal();
        } else {
            alert('Erro ao aprovar: ' + resultado.message);
        }
    } catch (error) {
        alert('Erro ao aprovar hora extra: ' + error.message);
    }
}

// Rejeitar hora extra
async function rejeitarHoraExtra(id) {
    try {
        if (!confirm('Tem certeza que deseja rejeitar esta hora extra?')) {
            return;
        }
        
        const resultado = await window.rejeitarHoraExtra(id);
        
        if (resultado.success) {
            alert('Hora extra rejeitada.');
            await carregarHorasExtrasPendentes();
            await carregarDashboard();
            await carregarFuncionarios();
            await carregarRelatorioMensal();
        } else {
            alert('Erro ao rejeitar: ' + resultado.message);
        }
    } catch (error) {
        alert('Erro ao rejeitar hora extra: ' + error.message);
    }
}

// Carregar dashboard por departamento
async function carregarDashboard() {
    try {
        const dashboardDiv = document.getElementById('dashboardDepartamentos');
        const funcionarios = await getAllFuncionarios();
        const mesAtual = getMesAtual();
        const departamentos = ['Operações', 'Tech', 'Marketing', 'Produto', 'Dados'];
        
        let html = '';
        
        for (const dept of departamentos) {
            const funcionariosDept = funcionarios.filter(f => f.departamento === dept);
            if (funcionariosDept.length === 0) continue;
            
            let totalHoras = 0;
            let totalHorasExtras = 0;
            let totalPagar = 0;
            
            for (const func of funcionariosDept) {
                const horasMes = await calcularHorasMes(func.id, mesAtual);
                const horasExtrasMes = await calcularHorasExtrasMes(func.id, mesAtual);
                totalHoras += horasMes;
                totalHorasExtras += horasExtrasMes;
                totalPagar += (horasMes * func.valor_hora) + (horasExtrasMes * func.valor_hora);
            }
            
            html += `
                <div class="departamento-section">
                    <h3>${dept}</h3>
                    <div class="departamento-stats">
                        <div class="stat-item">
                            <label>Funcionários</label>
                            <div class="value">${funcionariosDept.length}</div>
                        </div>
                        <div class="stat-item">
                            <label>Horas Normais</label>
                            <div class="value">${totalHoras.toFixed(1)}h</div>
                        </div>
                        <div class="stat-item">
                            <label>Horas Extras</label>
                            <div class="value">${totalHorasExtras.toFixed(1)}h</div>
                        </div>
                        <div class="stat-item">
                            <label>Total a Pagar</label>
                            <div class="value">R$ ${totalPagar.toFixed(2)}</div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        dashboardDiv.innerHTML = html || '<p class="empty-state">Nenhum funcionário cadastrado.</p>';
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        document.getElementById('dashboardDepartamentos').innerHTML = 
            '<p class="empty-state">Erro ao carregar dashboard.</p>';
    }
}

// Carregar lista de funcionários
async function carregarFuncionarios() {
    try {
        const funcionariosDiv = document.getElementById('listaFuncionarios');
        const funcionarios = await getAllFuncionarios();
        const mesAtual = getMesAtual();
        
        if (funcionarios.length === 0) {
            funcionariosDiv.innerHTML = '<p class="empty-state">Nenhum funcionário cadastrado.</p>';
            return;
        }
        
        let html = '';
        
        for (const func of funcionarios) {
            const horasMes = await calcularHorasMes(func.id, mesAtual);
            const horasExtrasMes = await calcularHorasExtrasMes(func.id, mesAtual);
            const valorNormal = horasMes * func.valor_hora;
            const valorExtra = horasExtrasMes * func.valor_hora;
            const totalPagar = valorNormal + valorExtra;
            
            html += `
                <div class="funcionario-card">
                    <div class="funcionario-header">
                        <h3>${func.nome}</h3>
                        <span style="color: #667eea; font-weight: 600;">${func.departamento}</span>
                    </div>
                    <div class="funcionario-info">
                        <div class="info-item">
                            <label>Valor Base/Hora</label>
                            <input type="number" 
                                   value="${func.valor_hora}" 
                                   step="0.01"
                                   onchange="atualizarValorHoraFuncionario('${func.id}', this.value)">
                        </div>
                        <div class="info-item">
                            <label>Horas Normais (mês)</label>
                            <div class="value">${horasMes.toFixed(1)}h</div>
                        </div>
                        <div class="info-item">
                            <label>Horas Extras (mês)</label>
                            <div class="value">${horasExtrasMes.toFixed(1)}h</div>
                        </div>
                        <div class="info-item">
                            <label>Valor Normal</label>
                            <div class="value">R$ ${valorNormal.toFixed(2)}</div>
                        </div>
                        <div class="info-item">
                            <label>Valor Extras</label>
                            <div class="value">R$ ${valorExtra.toFixed(2)}</div>
                        </div>
                        <div class="info-item">
                            <label>Total a Pagar</label>
                            <div class="value" style="color: #28a745; font-size: 1.3em;">R$ ${totalPagar.toFixed(2)}</div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        funcionariosDiv.innerHTML = html;
    } catch (error) {
        console.error('Erro ao carregar funcionários:', error);
        document.getElementById('listaFuncionarios').innerHTML = 
            '<p class="empty-state">Erro ao carregar funcionários.</p>';
    }
}

// Atualizar valor por hora do funcionário
async function atualizarValorHoraFuncionario(userId, novoValor) {
    try {
        const valor = parseFloat(novoValor);
        if (isNaN(valor) || valor < 0) {
            alert('Por favor, insira um valor válido.');
            await carregarFuncionarios();
            return;
        }
        
        const resultado = await atualizarValorHora(userId, valor);
        
        if (resultado.success) {
            alert('Valor atualizado com sucesso!');
            await carregarFuncionarios();
            await carregarDashboard();
            await carregarRelatorioMensal();
        } else {
            alert('Erro ao atualizar: ' + resultado.message);
            await carregarFuncionarios();
        }
    } catch (error) {
        alert('Erro ao atualizar valor: ' + error.message);
        await carregarFuncionarios();
    }
}

// Carregar relatório mensal
async function carregarRelatorioMensal() {
    try {
        const relatorioDiv = document.getElementById('relatorioMensal');
        const funcionarios = await getAllFuncionarios();
        const mesAtual = getMesAtual();
        const departamentos = ['Operações', 'Tech', 'Marketing', 'Produto', 'Dados'];
        
        let html = '';
        let totalGeralHoras = 0;
        let totalGeralExtras = 0;
        let totalGeralPagar = 0;
        
        for (const dept of departamentos) {
            const funcionariosDept = funcionarios.filter(f => f.departamento === dept);
            if (funcionariosDept.length === 0) continue;
            
            let totalHoras = 0;
            let totalHorasExtras = 0;
            let totalPagar = 0;
            
            for (const func of funcionariosDept) {
                const horasMes = await calcularHorasMes(func.id, mesAtual);
                const horasExtrasMes = await calcularHorasExtrasMes(func.id, mesAtual);
                totalHoras += horasMes;
                totalHorasExtras += horasExtrasMes;
                totalPagar += (horasMes * func.valor_hora) + (horasExtrasMes * func.valor_hora);
            }
            
            totalGeralHoras += totalHoras;
            totalGeralExtras += totalHorasExtras;
            totalGeralPagar += totalPagar;
            
            html += `
                <div class="relatorio-section">
                    <h3>${dept}</h3>
                    <div class="departamento-stats">
                        <div class="stat-item">
                            <label>Horas Normais</label>
                            <div class="value">${totalHoras.toFixed(1)}h</div>
                        </div>
                        <div class="stat-item">
                            <label>Horas Extras</label>
                            <div class="value">${totalHorasExtras.toFixed(1)}h</div>
                        </div>
                        <div class="stat-item">
                            <label>Total a Pagar</label>
                            <div class="value">R$ ${totalPagar.toFixed(2)}</div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Total geral
        html += `
            <div class="relatorio-total">
                <h3>Total Geral da Folha</h3>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 20px;">
                    <div>
                        <label style="font-size: 0.9em; opacity: 0.9;">Horas Normais</label>
                        <div class="value" style="font-size: 1.8em;">${totalGeralHoras.toFixed(1)}h</div>
                    </div>
                    <div>
                        <label style="font-size: 0.9em; opacity: 0.9;">Horas Extras</label>
                        <div class="value" style="font-size: 1.8em;">${totalGeralExtras.toFixed(1)}h</div>
                    </div>
                    <div>
                        <label style="font-size: 0.9em; opacity: 0.9;">Total a Pagar</label>
                        <div class="value" style="font-size: 1.8em;">R$ ${totalGeralPagar.toFixed(2)}</div>
                    </div>
                </div>
            </div>
        `;
        
        relatorioDiv.innerHTML = html;
    } catch (error) {
        console.error('Erro ao carregar relatório:', error);
        document.getElementById('relatorioMensal').innerHTML = 
            '<p class="empty-state">Erro ao carregar relatório.</p>';
    }
}

// Logout
async function logout() {
    await fazerLogout();
}
