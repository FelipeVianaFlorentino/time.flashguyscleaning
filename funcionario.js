// Lógica específica da interface do funcionário com Supabase

let funcionario;
let userId;

// Inicializar página
document.addEventListener('DOMContentLoaded', async function() {
    // Verificar se usuário está logado
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    userId = user.id;
    funcionario = await getUsuarioAtual();
    
    if (!funcionario) {
        alert('Erro ao carregar dados do usuário.');
        window.location.href = 'index.html';
        return;
    }
    
    // Mostrar informações do funcionário
    document.getElementById('infoFuncionario').textContent = 
        `${funcionario.nome} - ${funcionario.departamento}`;
    
    // Exibir informações do usuário no card
    document.getElementById('userEmail').textContent = funcionario.email || 'N/A';
    document.getElementById('userTipo').textContent = funcionario.tipo === 'admin' ? 'Admin' : 'Funcionário';
    document.getElementById('userDepartamento').textContent = funcionario.departamento || 'N/A';
    
    // Verificar estado atual
    await verificarEstadoJornada();
    await verificarEstadoHoraExtra();
    await atualizarHistorico();
});

// Verificar estado da jornada
async function verificarEstadoJornada() {
    try {
        const registrosDia = await getRegistrosDia(userId);
        
        // Agrupar entradas e saídas
        let entradaAtual = null;
        let saidaAtual = null;
        
        registrosDia.forEach(registro => {
            if (registro.tipo === 'entrada') {
                entradaAtual = registro;
            } else if (registro.tipo === 'saida') {
                saidaAtual = registro;
            }
        });
        
        // Verificar se há entrada sem saída
        if (entradaAtual && (!saidaAtual || new Date(saidaAtual.timestamp) < new Date(entradaAtual.timestamp))) {
            document.getElementById('btnIniciarJornada').disabled = true;
            document.getElementById('btnFinalizarJornada').disabled = false;
            const statusDiv = document.getElementById('statusJornada');
            statusDiv.className = 'status-info active';
            statusDiv.innerHTML = `⏰ Jornada iniciada às ${formatarHora(entradaAtual.timestamp)}`;
        } else {
            document.getElementById('btnIniciarJornada').disabled = false;
            document.getElementById('btnFinalizarJornada').disabled = true;
            document.getElementById('statusJornada').className = 'status-info';
            document.getElementById('statusJornada').textContent = '';
        }
    } catch (error) {
        console.error('Erro ao verificar estado da jornada:', error);
    }
}

// Verificar estado da hora extra
async function verificarEstadoHoraExtra() {
    try {
        const horasExtras = await getHorasExtrasUsuario(userId);
        const hoje = new Date().toISOString().split('T')[0];
        const horaExtraAtiva = horasExtras.find(h => {
            const dataInicio = h.inicio.split('T')[0];
            return dataInicio === hoje && !h.fim;
        });
        
        if (horaExtraAtiva) {
            document.getElementById('btnIniciarExtra').disabled = true;
            document.getElementById('btnFinalizarExtra').disabled = false;
            const statusDiv = document.getElementById('statusExtra');
            statusDiv.className = 'status-info active';
            statusDiv.innerHTML = `⏱️ Hora extra iniciada às ${formatarHora(horaExtraAtiva.inicio)}`;
        } else {
            document.getElementById('btnIniciarExtra').disabled = false;
            document.getElementById('btnFinalizarExtra').disabled = true;
            const statusDiv = document.getElementById('statusExtra');
            statusDiv.className = 'status-info';
            
            // Verificar se há hora extra pendente
            const horaExtraPendente = horasExtras.find(h => {
                const dataInicio = h.inicio.split('T')[0];
                return dataInicio === hoje && h.status === 'pendente' && h.fim;
            });
            
            if (horaExtraPendente) {
                statusDiv.textContent = '⏳ Aguardando aprovação do admin';
                statusDiv.style.background = '#fff3cd';
                statusDiv.style.color = '#856404';
            } else {
                statusDiv.textContent = '';
            }
        }
    } catch (error) {
        console.error('Erro ao verificar estado da hora extra:', error);
    }
}

// Handler para iniciar jornada
async function iniciarJornada() {
    try {
        const btn = document.getElementById('btnIniciarJornada');
        btn.disabled = true;
        btn.textContent = 'Carregando...';
        
        // Usar a função do serviço com nome diferente para evitar recursão
        const resultado = await window.iniciarJornadaService(userId);
        
        if (!resultado || !resultado.success) {
            alert(resultado?.message || 'Erro ao iniciar jornada');
            btn.disabled = false;
            btn.textContent = '⏰ INICIAR JORNADA';
            return;
        }
        
        await verificarEstadoJornada();
        await atualizarHistorico();
        btn.textContent = '⏰ INICIAR JORNADA';
    } catch (error) {
        console.error('Erro completo:', error);
        alert('Erro ao iniciar jornada: ' + error.message);
        const btn = document.getElementById('btnIniciarJornada');
        if (btn) {
            btn.disabled = false;
            btn.textContent = '⏰ INICIAR JORNADA';
        }
    }
}

// Handler para finalizar jornada
async function finalizarJornada() {
    try {
        const btn = document.getElementById('btnFinalizarJornada');
        btn.disabled = true;
        btn.textContent = 'Carregando...';
        
        const resultado = await window.finalizarJornadaService(userId);
        
        if (!resultado || !resultado.success) {
            alert(resultado?.message || 'Erro ao finalizar jornada');
            btn.disabled = false;
            btn.textContent = '🏁 FINALIZAR JORNADA';
            return;
        }
        
        alert(`Jornada finalizada! Total de horas trabalhadas: ${resultado.horas}h`);
        
        await verificarEstadoJornada();
        await atualizarHistorico();
        btn.textContent = '🏁 FINALIZAR JORNADA';
    } catch (error) {
        console.error('Erro completo:', error);
        alert('Erro ao finalizar jornada: ' + error.message);
        const btn = document.getElementById('btnFinalizarJornada');
        if (btn) {
            btn.disabled = false;
            btn.textContent = '🏁 FINALIZAR JORNADA';
        }
    }
}

// Handler para iniciar hora extra
async function iniciarHoraExtra() {
    try {
        const btn = document.getElementById('btnIniciarExtra');
        btn.disabled = true;
        btn.textContent = 'Carregando...';
        
        const resultado = await window.iniciarHoraExtraService(userId);
        
        if (!resultado || !resultado.success) {
            alert(resultado?.message || 'Erro ao iniciar hora extra');
            btn.disabled = false;
            btn.textContent = '⏱️ INICIAR HORA EXTRA';
            return;
        }
        
        await verificarEstadoHoraExtra();
        await atualizarHistorico();
        btn.textContent = '⏱️ INICIAR HORA EXTRA';
    } catch (error) {
        console.error('Erro completo:', error);
        alert('Erro ao iniciar hora extra: ' + error.message);
        const btn = document.getElementById('btnIniciarExtra');
        if (btn) {
            btn.disabled = false;
            btn.textContent = '⏱️ INICIAR HORA EXTRA';
        }
    }
}

// Handler para finalizar hora extra
async function finalizarHoraExtra() {
    try {
        const btn = document.getElementById('btnFinalizarExtra');
        btn.disabled = true;
        btn.textContent = 'Carregando...';
        
        const resultado = await window.finalizarHoraExtraService(userId);
        
        if (!resultado || !resultado.success) {
            alert(resultado?.message || 'Erro ao finalizar hora extra');
            btn.disabled = false;
            btn.textContent = '🏁 FINALIZAR HORA EXTRA';
            return;
        }
        
        alert(`Hora extra finalizada! Total: ${resultado.horas}h. Aguardando aprovação do admin.`);
        
        await verificarEstadoHoraExtra();
        await atualizarHistorico();
        btn.textContent = '🏁 FINALIZAR HORA EXTRA';
    } catch (error) {
        console.error('Erro completo:', error);
        alert('Erro ao finalizar hora extra: ' + error.message);
        const btn = document.getElementById('btnFinalizarExtra');
        if (btn) {
            btn.disabled = false;
            btn.textContent = '🏁 FINALIZAR HORA EXTRA';
        }
    }
}

// Atualizar histórico do dia
async function atualizarHistorico() {
    try {
        const historicoDiv = document.getElementById('historicoDia');
        const registrosDia = await getRegistrosDia(userId);
        const horasExtrasDia = await getHorasExtrasUsuario(userId);
        const hoje = new Date().toISOString().split('T')[0];
        
        const horasExtrasHoje = horasExtrasDia.filter(h => {
            const dataInicio = h.inicio.split('T')[0];
            return dataInicio === hoje;
        });
        
        if (registrosDia.length === 0 && horasExtrasHoje.length === 0) {
            historicoDiv.innerHTML = '<p class="empty-state">Nenhum registro ainda hoje.</p>';
            return;
        }
        
        let html = '';
        
        // Processar registros de jornada normal
        let entradaAtual = null;
        registrosDia.forEach(registro => {
            if (registro.tipo === 'entrada') {
                entradaAtual = registro;
            } else if (registro.tipo === 'saida' && entradaAtual) {
                const horas = calcularHoras(entradaAtual.timestamp, registro.timestamp);
                html += `
                    <div class="historico-item">
                        <div>
                            <strong>Jornada Normal</strong>
                            <p>Entrada: ${formatarHora(entradaAtual.timestamp)} | Saída: ${formatarHora(registro.timestamp)}</p>
                        </div>
                        <div>
                            <strong>${horas}h</strong>
                        </div>
                    </div>
                `;
                entradaAtual = null;
            }
        });
        
        // Se há entrada sem saída
        if (entradaAtual) {
            html += `
                <div class="historico-item">
                    <div>
                        <strong>Jornada Normal</strong>
                        <p>Entrada: ${formatarHora(entradaAtual.timestamp)} | Em andamento...</p>
                    </div>
                </div>
            `;
        }
        
        // Processar horas extras
        horasExtrasHoje.forEach(horaExtra => {
            if (horaExtra.fim) {
                const horas = calcularHoras(horaExtra.inicio, horaExtra.fim);
                const statusBadge = horaExtra.status === 'aprovado' ? 
                    '<span style="color: #28a745;">✓ Aprovado</span>' : 
                    horaExtra.status === 'pendente' ?
                    '<span style="color: #ff9800;">⏳ Pendente</span>' :
                    '<span style="color: #dc3545;">✗ Rejeitado</span>';
                html += `
                    <div class="historico-item">
                        <div>
                            <strong>Hora Extra</strong>
                            <p>Início: ${formatarHora(horaExtra.inicio)} | Fim: ${formatarHora(horaExtra.fim)} | ${statusBadge}</p>
                        </div>
                        <div>
                            <strong>${horas}h</strong>
                        </div>
                    </div>
                `;
            } else {
                html += `
                    <div class="historico-item">
                        <div>
                            <strong>Hora Extra</strong>
                            <p>Início: ${formatarHora(horaExtra.inicio)} | Em andamento...</p>
                        </div>
                    </div>
                `;
            }
        });
        
        historicoDiv.innerHTML = html;
    } catch (error) {
        console.error('Erro ao atualizar histórico:', error);
        document.getElementById('historicoDia').innerHTML = 
            '<p class="empty-state">Erro ao carregar histórico.</p>';
    }
}

// Logout
async function logout() {
    await fazerLogout();
}
