// Serviço para interagir com Supabase

// Validar email @flashguyscleaning.com
function validarEmail(email) {
    return email.toLowerCase().endsWith('@flashguyscleaning.com');
}

// ========== AUTENTICAÇÃO ==========

// Fazer login
async function fazerLogin(email, senha) {
    try {
        if (!validarEmail(email)) {
            return { success: false, message: 'Apenas emails @flashguyscleaning.com podem fazer login.' };
        }

        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email.toLowerCase(),
            password: senha
        });

        if (error) {
            return { success: false, message: error.message };
        }

        // Buscar dados do usuário na tabela usuarios
        const usuario = await getUsuarioPorId(data.user.id);
        if (!usuario) {
            return { success: false, message: 'Usuário não encontrado no sistema.' };
        }

        return { success: true, usuario: usuario };
    } catch (error) {
        return { success: false, message: 'Erro ao fazer login: ' + error.message };
    }
}

// Cadastrar novo usuário
async function cadastrarUsuario(nome, email, senha, departamento) {
    try {
        // Validar email
        if (!validarEmail(email)) {
            return { success: false, message: 'Apenas emails @flashguyscleaning.com podem se cadastrar.' };
        }

        // Criar usuário no Supabase Auth primeiro
        const { data: authData, error: authError } = await supabaseClient.auth.signUp({
            email: email.toLowerCase(),
            password: senha
        });

        if (authError) {
            return { success: false, message: authError.message };
        }

        // IMPORTANTE: Inserir sempre como 'funcionario' primeiro para evitar recursão RLS
        // Se for o primeiro usuário, será atualizado para admin via trigger SQL ou manualmente
        // Alternativamente, você pode criar o primeiro usuário manualmente no Supabase Dashboard
        
        // Criar registro na tabela usuarios (sempre como funcionario inicialmente)
        const { data: usuarioData, error: usuarioError } = await supabaseClient
            .from('usuarios')
            .insert([
                {
                    id: authData.user.id,
                    nome: nome,
                    email: email.toLowerCase(),
                    departamento: departamento,
                    tipo: 'funcionario', // Sempre começar como funcionario
                    valor_hora: 25
                }
            ])
            .select()
            .single();

        if (usuarioError) {
            console.error('Erro ao criar perfil:', usuarioError);
            
            // Se o erro for de recursão, tentar uma abordagem alternativa
            if (usuarioError.message.includes('recursion') || usuarioError.message.includes('infinite')) {
                return { 
                    success: false, 
                    message: 'Erro de configuração RLS. Por favor, crie o primeiro usuário manualmente no Supabase Dashboard ou configure as políticas RLS conforme SOLUCAO-RLS.md' 
                };
            }
            
            return { success: false, message: 'Erro ao criar perfil: ' + usuarioError.message };
        }

        // Verificar se é o primeiro usuário DEPOIS da inserção (mais seguro)
        // Tentar atualizar para admin se não houver outros usuários
        try {
            const { data: outrosUsuarios, error: checkError } = await supabaseClient
                .from('usuarios')
                .select('id')
                .neq('id', authData.user.id)
                .limit(1);
            
            // Se não há outros usuários, este é o primeiro - atualizar para admin
            if (!checkError && (!outrosUsuarios || outrosUsuarios.length === 0)) {
                const { error: updateError } = await supabaseClient
                    .from('usuarios')
                    .update({ tipo: 'admin' })
                    .eq('id', authData.user.id);
                
                if (!updateError) {
                    usuarioData.tipo = 'admin';
                }
            }
        } catch (e) {
            // Se falhar ao verificar/atualizar, continuar com funcionario
            console.log('Não foi possível verificar se é primeiro usuário');
        }

        return { success: true, usuario: usuarioData };
    } catch (error) {
        return { success: false, message: 'Erro ao cadastrar: ' + error.message };
    }
}

// Obter usuário atual logado
async function getUsuarioAtual() {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return null;

        const usuario = await getUsuarioPorId(user.id);
        return usuario;
    } catch (error) {
        console.error('Erro ao obter usuário atual:', error);
        return null;
    }
}

// Obter usuário por ID
async function getUsuarioPorId(userId) {
    try {
        const { data, error } = await supabaseClient
            .from('usuarios')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Erro ao buscar usuário:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        return null;
    }
}

// Fazer logout
async function fazerLogout() {
    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) {
            console.error('Erro ao fazer logout:', error);
        }
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
        window.location.href = 'index.html';
    }
}

// ========== RECUPERAÇÃO DE SENHA ==========

// Enviar email de recuperação de senha
async function enviarRecuperacaoSenha(email) {
    try {
        if (!validarEmail(email)) {
            return { success: false, message: 'Apenas emails @flashguyscleaning.com podem recuperar senha.' };
        }

        const redirectUrl = window.location.origin + '/reset-password.html';
        
        const { data, error } = await supabaseClient.auth.resetPasswordForEmail(email.toLowerCase(), {
            redirectTo: redirectUrl
        });

        if (error) {
            return { success: false, message: error.message };
        }

        return { success: true, message: 'Se o email existir, você receberá um link de recuperação.' };
    } catch (error) {
        return { success: false, message: 'Erro ao enviar email de recuperação: ' + error.message };
    }
}

// Redefinir senha
async function redefinirSenha(novaSenha) {
    try {
        const { data, error } = await supabaseClient.auth.updateUser({
            password: novaSenha
        });

        if (error) {
            return { success: false, message: error.message };
        }

        return { success: true, message: 'Senha redefinida com sucesso!' };
    } catch (error) {
        return { success: false, message: 'Erro ao redefinir senha: ' + error.message };
    }
}

// ========== REGISTROS DE PONTO ==========

// Iniciar jornada
async function iniciarJornada(userId) {
    try {
        const hoje = new Date().toISOString().split('T')[0];
        
        // Verificar se já existe registro do dia sem fim
        const { data: registrosExistentes } = await supabaseClient
            .from('registros_ponto')
            .select('*')
            .eq('user_id', userId)
            .eq('tipo', 'entrada')
            .gte('timestamp', hoje + 'T00:00:00')
            .lt('timestamp', hoje + 'T23:59:59')
            .order('timestamp', { ascending: false })
            .limit(1);

        if (registrosExistentes && registrosExistentes.length > 0) {
            // Verificar se há uma saída correspondente
            const { data: saida } = await supabaseClient
                .from('registros_ponto')
                .select('*')
                .eq('user_id', userId)
                .eq('tipo', 'saida')
                .gte('timestamp', registrosExistentes[0].timestamp)
                .order('timestamp', { ascending: true })
                .limit(1);

            if (!saida || saida.length === 0) {
                return { success: false, message: 'Você já possui uma jornada iniciada hoje!' };
            }
        }

        const { data, error } = await supabaseClient
            .from('registros_ponto')
            .insert([
                {
                    user_id: userId,
                    tipo: 'entrada',
                    timestamp: new Date().toISOString()
                }
            ])
            .select()
            .single();

        if (error) {
            return { success: false, message: error.message };
        }

        return { success: true, registro: data };
    } catch (error) {
        return { success: false, message: 'Erro ao iniciar jornada: ' + error.message };
    }
}

// Finalizar jornada
async function finalizarJornada(userId) {
    try {
        const hoje = new Date().toISOString().split('T')[0];
        
        // Buscar última entrada sem saída
        const { data: entradas } = await supabaseClient
            .from('registros_ponto')
            .select('*')
            .eq('user_id', userId)
            .eq('tipo', 'entrada')
            .gte('timestamp', hoje + 'T00:00:00')
            .lt('timestamp', hoje + 'T23:59:59')
            .order('timestamp', { ascending: false });

        if (!entradas || entradas.length === 0) {
            return { success: false, message: 'Nenhuma jornada ativa encontrada!' };
        }

        // Verificar se a última entrada já tem saída
        const ultimaEntrada = entradas[0];
        const { data: saidas } = await supabaseClient
            .from('registros_ponto')
            .select('*')
            .eq('user_id', userId)
            .eq('tipo', 'saida')
            .gte('timestamp', ultimaEntrada.timestamp)
            .order('timestamp', { ascending: false })
            .limit(1);

        if (saidas && saidas.length > 0) {
            return { success: false, message: 'Jornada já foi finalizada!' };
        }

        const { data, error } = await supabaseClient
            .from('registros_ponto')
            .insert([
                {
                    user_id: userId,
                    tipo: 'saida',
                    timestamp: new Date().toISOString()
                }
            ])
            .select()
            .single();

        if (error) {
            return { success: false, message: error.message };
        }

        // Calcular horas trabalhadas
        const horasTrabalhadas = calcularHoras(ultimaEntrada.timestamp, data.timestamp);

        return { success: true, registro: data, horas: horasTrabalhadas };
    } catch (error) {
        return { success: false, message: 'Erro ao finalizar jornada: ' + error.message };
    }
}

// Obter registros do dia
async function getRegistrosDia(userId) {
    try {
        const hoje = new Date().toISOString().split('T')[0];
        
        const { data, error } = await supabaseClient
            .from('registros_ponto')
            .select('*')
            .eq('user_id', userId)
            .gte('timestamp', hoje + 'T00:00:00')
            .lt('timestamp', hoje + 'T23:59:59')
            .order('timestamp', { ascending: true });

        if (error) {
            console.error('Erro ao buscar registros:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Erro ao buscar registros:', error);
        return [];
    }
}

// ========== HORAS EXTRAS ==========

// Iniciar hora extra
async function iniciarHoraExtra(userId) {
    try {
        const hoje = new Date().toISOString().split('T')[0];
        
        // Verificar se já existe hora extra do dia sem fim
        const { data: horasExtrasExistentes } = await supabaseClient
            .from('horas_extras')
            .select('*')
            .eq('user_id', userId)
            .gte('inicio', hoje + 'T00:00:00')
            .lt('inicio', hoje + 'T23:59:59')
            .is('fim', null);

        if (horasExtrasExistentes && horasExtrasExistentes.length > 0) {
            return { success: false, message: 'Você já possui uma hora extra iniciada hoje!' };
        }

        const { data, error } = await supabaseClient
            .from('horas_extras')
            .insert([
                {
                    user_id: userId,
                    inicio: new Date().toISOString(),
                    fim: null,
                    status: 'pendente'
                }
            ])
            .select()
            .single();

        if (error) {
            return { success: false, message: error.message };
        }

        return { success: true, horaExtra: data };
    } catch (error) {
        return { success: false, message: 'Erro ao iniciar hora extra: ' + error.message };
    }
}

// Finalizar hora extra
async function finalizarHoraExtra(userId) {
    try {
        const hoje = new Date().toISOString().split('T')[0];
        
        // Buscar hora extra ativa
        const { data: horasExtras } = await supabaseClient
            .from('horas_extras')
            .select('*')
            .eq('user_id', userId)
            .gte('inicio', hoje + 'T00:00:00')
            .lt('inicio', hoje + 'T23:59:59')
            .is('fim', null)
            .order('inicio', { ascending: false })
            .limit(1);

        if (!horasExtras || horasExtras.length === 0) {
            return { success: false, message: 'Nenhuma hora extra ativa encontrada!' };
        }

        const horaExtra = horasExtras[0];
        const agora = new Date().toISOString();

        const { data, error } = await supabaseClient
            .from('horas_extras')
            .update({ fim: agora })
            .eq('id', horaExtra.id)
            .select()
            .single();

        if (error) {
            return { success: false, message: error.message };
        }

        // Calcular horas trabalhadas
        const horasTrabalhadas = calcularHoras(horaExtra.inicio, agora);

        return { success: true, horaExtra: data, horas: horasTrabalhadas };
    } catch (error) {
        return { success: false, message: 'Erro ao finalizar hora extra: ' + error.message };
    }
}

// Obter horas extras do usuário
async function getHorasExtrasUsuario(userId) {
    try {
        const { data, error } = await supabaseClient
            .from('horas_extras')
            .select('*')
            .eq('user_id', userId)
            .order('inicio', { ascending: false });

        if (error) {
            console.error('Erro ao buscar horas extras:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Erro ao buscar horas extras:', error);
        return [];
    }
}

// Obter horas extras pendentes (admin)
async function getHorasExtrasPendentes() {
    try {
        const { data, error } = await supabaseClient
            .from('horas_extras')
            .select('*')
            .eq('status', 'pendente')
            .not('fim', 'is', null)
            .order('inicio', { ascending: false });

        if (error) {
            console.error('Erro ao buscar horas extras pendentes:', error);
            return [];
        }

        // Buscar nomes dos usuários
        const horasExtrasComNomes = await Promise.all(
            (data || []).map(async (horaExtra) => {
                const usuario = await getUsuarioPorId(horaExtra.user_id);
                return {
                    ...horaExtra,
                    funcionarioNome: usuario ? usuario.nome : 'Desconhecido',
                    funcionarioDepartamento: usuario ? usuario.departamento : 'Desconhecido'
                };
            })
        );

        return horasExtrasComNomes;
    } catch (error) {
        console.error('Erro ao buscar horas extras pendentes:', error);
        return [];
    }
}

// Aprovar hora extra
async function aprovarHoraExtra(horaExtraId) {
    try {
        const { data, error } = await supabaseClient
            .from('horas_extras')
            .update({ status: 'aprovado' })
            .eq('id', horaExtraId)
            .select()
            .single();

        if (error) {
            return { success: false, message: error.message };
        }

        return { success: true, horaExtra: data };
    } catch (error) {
        return { success: false, message: 'Erro ao aprovar hora extra: ' + error.message };
    }
}

// Rejeitar hora extra
async function rejeitarHoraExtra(horaExtraId) {
    try {
        const { data, error } = await supabaseClient
            .from('horas_extras')
            .update({ status: 'rejeitado' })
            .eq('id', horaExtraId)
            .select()
            .single();

        if (error) {
            return { success: false, message: error.message };
        }

        return { success: true, horaExtra: data };
    } catch (error) {
        return { success: false, message: 'Erro ao rejeitar hora extra: ' + error.message };
    }
}

// ========== FUNCIONÁRIOS (ADMIN) ==========

// Obter todos os funcionários
async function getAllFuncionarios() {
    try {
        const { data, error } = await supabaseClient
            .from('usuarios')
            .select('*')
            .order('nome', { ascending: true });

        if (error) {
            console.error('Erro ao buscar funcionários:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Erro ao buscar funcionários:', error);
        return [];
    }
}

// Atualizar valor por hora
async function atualizarValorHora(userId, novoValor) {
    try {
        const { data, error } = await supabaseClient
            .from('usuarios')
            .update({ valor_hora: parseFloat(novoValor) })
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            return { success: false, message: error.message };
        }

        return { success: true, usuario: data };
    } catch (error) {
        return { success: false, message: 'Erro ao atualizar valor: ' + error.message };
    }
}

// ========== CÁLCULOS ==========

// Calcular horas trabalhadas no mês
async function calcularHorasMes(userId, mes) {
    try {
        const inicioMes = mes + '-01T00:00:00';
        const fimMes = new Date(new Date(inicioMes).setMonth(new Date(inicioMes).getMonth() + 1)).toISOString();

        const { data: registros, error } = await supabase
            .from('registros_ponto')
            .select('*')
            .eq('user_id', userId)
            .gte('timestamp', inicioMes)
            .lt('timestamp', fimMes)
            .order('timestamp', { ascending: true });

        if (error) {
            console.error('Erro ao calcular horas do mês:', error);
            return 0;
        }

        let totalHoras = 0;
        let entradaAtual = null;

        (registros || []).forEach(registro => {
            if (registro.tipo === 'entrada') {
                entradaAtual = registro.timestamp;
            } else if (registro.tipo === 'saida' && entradaAtual) {
                totalHoras += calcularHoras(entradaAtual, registro.timestamp);
                entradaAtual = null;
            }
        });

        return totalHoras;
    } catch (error) {
        console.error('Erro ao calcular horas do mês:', error);
        return 0;
    }
}

// Calcular horas extras aprovadas no mês
async function calcularHorasExtrasMes(userId, mes) {
    try {
        const inicioMes = mes + '-01T00:00:00';
        const fimMes = new Date(new Date(inicioMes).setMonth(new Date(inicioMes).getMonth() + 1)).toISOString();

        const { data: horasExtras, error } = await supabase
            .from('horas_extras')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'aprovado')
            .not('fim', 'is', null)
            .gte('inicio', inicioMes)
            .lt('inicio', fimMes);

        if (error) {
            console.error('Erro ao calcular horas extras do mês:', error);
            return 0;
        }

        let totalHoras = 0;
        (horasExtras || []).forEach(h => {
            if (h.fim) {
                totalHoras += calcularHoras(h.inicio, h.fim);
            }
        });

        return totalHoras;
    } catch (error) {
        console.error('Erro ao calcular horas extras do mês:', error);
        return 0;
    }
}

// Função auxiliar para calcular horas
function calcularHoras(entrada, saida) {
    const diff = new Date(saida) - new Date(entrada);
    const horas = diff / (1000 * 60 * 60);
    return Math.round(horas * 100) / 100;
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

// Obter mês atual no formato YYYY-MM
function getMesAtual() {
    const hoje = new Date();
    return hoje.toISOString().slice(0, 7);
}

// Expor funções no escopo global
window.fazerLogin = fazerLogin;
window.cadastrarUsuario = cadastrarUsuario;
window.getUsuarioAtual = getUsuarioAtual;
window.getUsuarioPorId = getUsuarioPorId;
window.fazerLogout = fazerLogout;
window.iniciarJornada = iniciarJornada;
window.finalizarJornada = finalizarJornada;
window.getRegistrosDia = getRegistrosDia;
window.iniciarHoraExtra = iniciarHoraExtra;
window.finalizarHoraExtra = finalizarHoraExtra;
window.getHorasExtrasUsuario = getHorasExtrasUsuario;
window.getHorasExtrasPendentes = getHorasExtrasPendentes;
window.aprovarHoraExtra = aprovarHoraExtra;
window.rejeitarHoraExtra = rejeitarHoraExtra;
window.getAllFuncionarios = getAllFuncionarios;
window.atualizarValorHora = atualizarValorHora;
window.calcularHorasMes = calcularHorasMes;
window.calcularHorasExtrasMes = calcularHorasExtrasMes;
window.calcularHoras = calcularHoras;
window.formatarDataHora = formatarDataHora;
window.formatarHora = formatarHora;
window.getMesAtual = getMesAtual;
window.validarEmail = validarEmail;
window.enviarRecuperacaoSenha = enviarRecuperacaoSenha;
window.redefinirSenha = redefinirSenha;

