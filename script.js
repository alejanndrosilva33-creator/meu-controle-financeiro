// ==========================================
// 1. CAPTURA DOS ELEMENTOS DO HTML (DOM)
// ==========================================
const botaoMenu = document.getElementById('botao-menu');
const menuPrincipal = document.getElementById('menu-principal');
const salarioInput = document.getElementById('salario');
const ganhosExtraInput = document.getElementById('ganhos-extra');
const botaoSalvarGanhosExtra = document.getElementById('botao-salvar-ganhos-extra');
const limiteCustoInput = document.getElementById('limite-custo');
const mesInput = document.getElementById('mes');
const anoInput = document.getElementById('ano');
const mesEmEdicao = document.getElementById('mes-em-edicao');
const formGasto = document.getElementById('form-gasto');
const diaInput = document.getElementById('dia');
const valorInput = document.getElementById('valor');
const categoriaInput = document.getElementById('categoria');
const descricaoInput = document.getElementById('descricao');
const botaoSalvar = document.getElementById('botao-salvar');
const botaoCancelarEdicao = document.getElementById('botao-cancelar-edicao');
const botaoSalvarResumo = document.getElementById('botao-salvar-resumo');
const saldoInicial = document.getElementById('saldo-inicial');
const limiteGastos = document.getElementById('limite-gastos');
const totalGasto = document.getElementById('total-gasto');
const saldoRestante = document.getElementById('saldo-restante');
const avisoLimite = document.getElementById('aviso-limite');
const avisoData = document.getElementById('aviso-data');
const listaGastos = document.getElementById('lista-gastos');
const telaInicialSections = document.querySelectorAll('.tela-inicial');
const minhasFinancasSection = document.getElementById('minhas-financas');
const resumosSalvosContainer = document.getElementById('resumos-salvos');

// ==========================================
// 2. CHAVES PARA IDENTIFICAÇÃO NO LOCALSTORAGE
// ==========================================
const STORAGE_GASTOS = 'financas_gastos';
const STORAGE_GANHOS = 'financas_ganhos_extra';
const STORAGE_RESUMOS = 'financas_resumos';
const STORAGE_CONFIG = 'financas_config';

// ==========================================
// 3. ESTADO DA APLICAÇÃO (VARIÁVEIS DE MEMÓRIA)
// ==========================================
let gastos = [];
let ganhosExtras = [];
let resumosSalvos = [];
let indiceEmEdicao = null;

const nomesMeses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

// Utilitário para formatar números como moeda brasileira (R$)
const formatoReal = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
});

// ==========================================
// 4. FUNÇÕES DE PERSISTÊNCIA (LOCALSTORAGE)
// ==========================================

// Salva todos os arrays e dados em formato de texto no navegador
function salvarDadosNoStorage() {
    localStorage.setItem(STORAGE_GASTOS, JSON.stringify(gastos));
    localStorage.setItem(STORAGE_GANHOS, JSON.stringify(ganhosExtras));
    localStorage.setItem(STORAGE_RESUMOS, JSON.stringify(resumosSalvos));
    
    const config = {
        salario: salarioInput.value,
        limite: limiteCustoInput.value,
        mes: mesInput.value,
        ano: anoInput.value
    };
    localStorage.setItem(STORAGE_CONFIG, JSON.stringify(config));
}

// Carrega os dados salvos do localStorage para as variáveis ao abrir a página
function carregarDadosDoStorage() {
    const gastosSalvos = localStorage.getItem(STORAGE_GASTOS);
    if (gastosSalvos) gastos = JSON.parse(gastosSalvos);

    const ganhosSalvos = localStorage.getItem(STORAGE_GANHOS);
    if (ganhosSalvos) ganhosExtras = JSON.parse(ganhosSalvos);

    const resumosSalvosData = localStorage.getItem(STORAGE_RESUMOS);
    if (resumosSalvosData) resumosSalvos = JSON.parse(resumosSalvosData);

    const configSalva = localStorage.getItem(STORAGE_CONFIG);
    if (configSalva) {
        const config = JSON.parse(configSalva);
        if (config.salario) salarioInput.value = config.salario;
        if (config.limite) limiteCustoInput.value = config.limite;
        if (config.mes !== undefined) mesInput.value = config.mes;
        if (config.ano) anoInput.value = config.ano;
    }
}

// ==========================================
// 5. CONVERSÕES E FORMATADORES DE DADOS
// ==========================================

// Transforma texto formatado (ex: "1.500,50") em um número válido (1500.50)
function converterMoedaParaNumero(valor) {
    const texto = String(valor).trim();
    if (!texto) return 0;

    const semMoeda = texto.replace(/[^\d.,]/g, '');
    const temVirgula = semMoeda.includes(',');
    const valorNormalizado = temVirgula
        ? semMoeda.replace(/\./g, '').replace(',', '.')
        : semMoeda.replace(/\./g, '');

    return Number(valorNormalizado) || 0;
}

// Formata o input monetário enquanto o usuário digita
function formatarMoedaEnquantoDigita(input) {
    const numeros = input.value.replace(/\D/g, '');
    if (!numeros) {
        input.value = '';
        return;
    }

    const valor = Number(numeros) / 100;
    input.value = valor.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Atalho para extrair o valor numérico de um campo input
function obterNumero(input) {
    return converterMoedaParaNumero(input.value);
}

// Retorna o ganho total (salário + soma das rendas extras)
function obterGanhosDoMes() {
    return obterNumero(salarioInput) + calcularTotalGanhosExtra();
}

// Retorna objeto com o mês e ano atualmente selecionados
function obterPeriodoSelecionado() {
    const mes = Number(mesInput.value);
    const ano = Number(anoInput.value) || new Date().getFullYear();
    return { mes, ano, nomeMes: nomesMeses[mes] };
}

// Verifica se determinado registro pertence ao mês/ano selecionado
function gastoPertenceAoPeriodo(gasto, periodo) {
    return gasto.mes === periodo.mes && gasto.ano === periodo.ano;
}

// ==========================================
// 6. CÁLCULOS FINANCEIROS
// ==========================================

// Soma todos os gastos cadastrados no mês ativo
function calcularTotalGasto() {
    const periodo = obterPeriodoSelecionado();
    return gastos.reduce((total, gasto) => {
        if (!gastoPertenceAoPeriodo(gasto, periodo)) return total;
        return total + gasto.valor;
    }, 0);
}

// Soma todos os ganhos extras cadastrados no mês ativo
function calcularTotalGanhosExtra() {
    const periodo = obterPeriodoSelecionado();
    return ganhosExtras.reduce((total, ganhoExtra) => {
        if (!gastoPertenceAoPeriodo(ganhoExtra, periodo)) return total;
        return total + ganhoExtra.valor;
    }, 0);
}

// ==========================================
// 7. TRATAMENTO DE DATAS
// ==========================================

// Mascara a digitação para o formato dd/mm/aaaa
function aplicarMascaraData(input) {
    const numeros = input.value.replace(/\D/g, '').slice(0, 8);
    const partes = [];

    if (numeros.length > 0) partes.push(numeros.slice(0, 2));
    if (numeros.length > 2) partes.push(numeros.slice(2, 4));
    if (numeros.length > 4) partes.push(numeros.slice(4, 8));

    input.value = partes.join('/');
}

// Converte a string inserida em objeto contendo dia, mês e ano numéricos
function obterDataDigitada() {
    const partes = diaInput.value.split('/');
    if (partes.length !== 3) return null;

    const dia = Number(partes[0]);
    const mes = Number(partes[1]) - 1;
    const ano = Number(partes[2]);
    const data = new Date(ano, mes, dia);

    if (data.getFullYear() !== ano || data.getMonth() !== mes || data.getDate() !== dia) {
        return null;
    }

    return { dia, mes, ano };
}

// Exibe/oculta mensagem de data inválida
function atualizarAvisoData(mostrar) {
    avisoData.classList.toggle('ativo', mostrar);
}

// Formata o objeto de data para exibição do custo na lista
function formatarDataCusto(gasto) {
    return [
        String(gasto.dia).padStart(2, '0'),
        String(gasto.mes + 1).padStart(2, '0'),
        gasto.ano
    ].join('/');
}

// ==========================================
// 8. MANIPULAÇÃO DE INTERFACE E FORMULÁRIOS
// ==========================================

// Atualiza o texto que indica o mês/ano que está sendo editado
function atualizarPeriodoEdicao() {
    const periodo = obterPeriodoSelecionado();
    mesEmEdicao.textContent = `${periodo.nomeMes} de ${periodo.ano}`;
}

// Reseta o formulário de cadastro para o estado inicial
function limparFormulario() {
    formGasto.reset();
    indiceEmEdicao = null;
    botaoSalvar.textContent = 'Salvar Custo';
    botaoCancelarEdicao.hidden = true;
}

// Registra um ganho extra para o mês atual
function salvarGanhoExtra() {
    const valorGanhoExtra = obterNumero(ganhosExtraInput);
    const periodo = obterPeriodoSelecionado();

    if (valorGanhoExtra <= 0) {
        ganhosExtraInput.focus();
        return;
    }

    ganhosExtras.push({
        mes: periodo.mes,
        ano: periodo.ano,
        valor: valorGanhoExtra
    });

    ganhosExtraInput.value = '0,00';
    salvarDadosNoStorage();
    atualizarResumo();
}

// Carrega os dados de um item no formulário para edição
function editarGasto(indice) {
    const gasto = gastos[indice];

    diaInput.value = formatarDataCusto(gasto);
    valorInput.value = gasto.valor.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    categoriaInput.value = gasto.categoria;
    descricaoInput.value = gasto.descricao;
    mesInput.value = gasto.mes;
    anoInput.value = gasto.ano;
    indiceEmEdicao = indice;
    botaoSalvar.textContent = 'Atualizar Custo';
    botaoCancelarEdicao.hidden = false;
    atualizarPeriodoEdicao();
    diaInput.focus();
}

// Gera um objeto consolidado dos valores do mês
function obterResumoAtual() {
    const periodo = obterPeriodoSelecionado();
    const ganhosMes = obterGanhosDoMes();
    const limiteCusto = obterNumero(limiteCustoInput);
    const total = calcularTotalGasto();

    return {
        mes: periodo.mes,
        ano: periodo.ano,
        nomeMes: periodo.nomeMes,
        ganhosMes,
        limiteCusto,
        totalGasto: total,
        saldoRestante: ganhosMes - total
    };
}

// Renderiza a lista de resumos salvos na tela "Minhas Finanças"
function atualizarResumosSalvos() {
    resumosSalvosContainer.replaceChildren();

    if (resumosSalvos.length === 0) {
        const mensagemVazia = document.createElement('p');
        mensagemVazia.className = 'mensagem-vazia';
        mensagemVazia.textContent = 'Nenhum resumo salvo ainda.';
        resumosSalvosContainer.appendChild(mensagemVazia);
        return;
    }

    resumosSalvos.forEach((resumo, indice) => {
        const cardResumo = document.createElement('article');
        const tituloResumo = document.createElement('h3');
        const acoesResumo = document.createElement('div');
        const botaoEditarResumo = document.createElement('button');
        const botaoExcluirResumo = document.createElement('button');

        cardResumo.className = 'resumo-salvo';
        tituloResumo.textContent = `Resumo de ${resumo.nomeMes} de ${resumo.ano}`;
        acoesResumo.className = 'acoes-resumo-salvo';
        botaoEditarResumo.type = 'button';
        botaoEditarResumo.textContent = 'Editar';
        botaoEditarResumo.className = 'botao-editar-resumo';
        botaoEditarResumo.addEventListener('click', () => editarResumoSalvo(indice));

        botaoExcluirResumo.type = 'button';
        botaoExcluirResumo.textContent = 'Excluir';
        botaoExcluirResumo.className = 'botao-excluir-resumo';
        botaoExcluirResumo.addEventListener('click', () => excluirResumoSalvo(indice));

        cardResumo.appendChild(tituloResumo);
        cardResumo.append(
            criarLinhaResumo('Ganhos do Mês', resumo.ganhosMes),
            criarLinhaResumo('Limite de Gastos', resumo.limiteCusto),
            criarLinhaResumo('Total Gasto', resumo.totalGasto),
            criarLinhaResumo('Saldo Restante', resumo.saldoRestante)
        );
        acoesResumo.appendChild(botaoEditarResumo);
        cardResumo.appendChild(acoesResumo);
        cardResumo.appendChild(botaoExcluirResumo);

        resumosSalvosContainer.appendChild(cardResumo);
    });
}

// Cria elementos HTML reutilizáveis para exibir os valores nos cards
function criarLinhaResumo(rotulo, valor) {
    const linha = document.createElement('p');
    const valorResumo = document.createElement('span');

    valorResumo.className = 'valor-destaque';
    valorResumo.textContent = formatoReal.format(valor);
    valorResumo.classList.toggle('salario-excedido', valor < 0);
    linha.append(`${rotulo}: `, valorResumo);

    return linha;
}

// Armazena o resumo do mês atual na aba "Minhas finanças"
function salvarResumoAtual() {
    const resumo = obterResumoAtual();
    const resumoExistente = resumosSalvos.findIndex((item) => (
        item.mes === resumo.mes && item.ano === resumo.ano
    ));

    if (resumoExistente >= 0) {
        resumosSalvos[resumoExistente] = resumo;
    } else {
        resumosSalvos.unshift(resumo);
    }

    salvarDadosNoStorage();
    atualizarResumosSalvos();
    exibirTela('minhas-financas');
}

// Carrega as configurações de um resumo salvo anteriormente para edição
function editarResumoSalvo(indice) {
    const resumo = resumosSalvos[indice];

    mesInput.value = resumo.mes;
    anoInput.value = resumo.ano;
    salarioInput.value = Math.max(resumo.ganhosMes - calcularTotalGanhosExtra(), 0).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    limiteCustoInput.value = resumo.limiteCusto.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    atualizarResumo();
    exibirTela('configuracao-mensal');
}

// Remove um resumo salvo pelo índice e atualiza a interface/storage
function excluirResumoSalvo(indice) {
    if (!confirm('Excluir este resumo salvo? Esta ação não pode ser desfeita.')) return;
    resumosSalvos.splice(indice, 1);
    salvarDadosNoStorage();
    atualizarResumosSalvos();
}

// Atualiza o bloco "Resumo do Mês" com totais e regras de estouro de limite
function atualizarResumo() {
    atualizarPeriodoEdicao();

    const ganhosMes = obterGanhosDoMes();
    const limiteCusto = obterNumero(limiteCustoInput);
    const total = calcularTotalGasto();
    const saldo = ganhosMes - total;
    const limiteFoiExcedido = limiteCusto > 0 && total > limiteCusto;
    const salarioFoiExcedido = ganhosMes > 0 && total > ganhosMes;

    saldoInicial.textContent = formatoReal.format(ganhosMes);
    limiteGastos.textContent = formatoReal.format(limiteCusto);
    totalGasto.textContent = formatoReal.format(total);
    saldoRestante.textContent = formatoReal.format(saldo);

    saldoRestante.classList.toggle('limite-excedido', limiteFoiExcedido && !salarioFoiExcedido);
    totalGasto.classList.toggle('limite-excedido', limiteFoiExcedido && !salarioFoiExcedido);
    saldoRestante.classList.toggle('salario-excedido', salarioFoiExcedido);
    totalGasto.classList.toggle('salario-excedido', salarioFoiExcedido);
    avisoLimite.classList.toggle('ativo', limiteFoiExcedido);

    atualizarHistorico();
    salvarDadosNoStorage();
}

// Reconstrói a lista HTML do histórico de custos do mês ativo
function atualizarHistorico() {
    const ganhosMes = obterGanhosDoMes();
    const limiteCusto = obterNumero(limiteCustoInput);
    let totalAcumulado = 0;

    listaGastos.replaceChildren();

    const periodo = obterPeriodoSelecionado();
    const gastosDoPeriodo = gastos
        .map((gasto, indiceOriginal) => ({ ...gasto, indiceOriginal }))
        .filter((gasto) => gastoPertenceAoPeriodo(gasto, periodo));

    if (gastosDoPeriodo.length === 0) {
        const itemVazio = document.createElement('li');
        itemVazio.textContent = 'Nenhum custo cadastrado para este mês.';
        listaGastos.appendChild(itemVazio);
        return;
    }

    gastosDoPeriodo.forEach((gasto) => {
        totalAcumulado += gasto.valor;

        const saldoAposGasto = ganhosMes - totalAcumulado;
        const limiteFoiExcedido = limiteCusto > 0 && totalAcumulado > limiteCusto;
        const salarioFoiExcedido = ganhosMes > 0 && totalAcumulado > ganhosMes;
        const item = document.createElement('li');
        const saldoHistorico = document.createElement('span');

        item.append(
            `${formatarDataCusto(gasto)} - `,
            `${gasto.categoria} - ${formatoReal.format(gasto.valor)} `,
            `(${gasto.descricao || 'Sem descrição'}) | Saldo restante: `
        );

        saldoHistorico.textContent = formatoReal.format(saldoAposGasto);
        saldoHistorico.classList.toggle('limite-excedido', limiteFoiExcedido && !salarioFoiExcedido);
        saldoHistorico.classList.toggle('salario-excedido', salarioFoiExcedido);
        item.appendChild(saldoHistorico);

        const botaoEditar = document.createElement('button');
        botaoEditar.type = 'button';
        botaoEditar.textContent = 'Editar';
        botaoEditar.className = 'botao-editar';
        botaoEditar.addEventListener('click', () => editarGasto(gasto.indiceOriginal));
        item.appendChild(botaoEditar);

        listaGastos.appendChild(item);
    });
}

// Alterna a exibição das seções para criar navegação entre telas
function exibirTela(destino) {
    const mostrarMinhasFinancas = destino === 'minhas-financas';

    telaInicialSections.forEach((section) => {
        section.classList.toggle('tela-oculta', mostrarMinhasFinancas);
    });

    minhasFinancasSection.classList.toggle('tela-oculta', !mostrarMinhasFinancas);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================================
// 9. EVENTOS DO SISTEMA (EVENT LISTENERS)
// ==========================================

// Alterna o estado do menu suspenso
botaoMenu.addEventListener('click', () => {
    const menuEstaAberto = menuPrincipal.classList.toggle('aberto');
    botaoMenu.setAttribute('aria-expanded', String(menuEstaAberto));
    botaoMenu.setAttribute('aria-label', menuEstaAberto ? 'Fechar menu' : 'Abrir menu');
});

// Navega entre telas ao clicar nas opções do menu
menuPrincipal.addEventListener('click', (evento) => {
    if (evento.target.tagName !== 'A') return;
    evento.preventDefault();
    menuPrincipal.classList.remove('aberto');
    botaoMenu.setAttribute('aria-expanded', 'false');
    botaoMenu.setAttribute('aria-label', 'Abrir menu');
    exibirTela(evento.target.getAttribute('href').replace('#', ''));
});

// Aplicação de máscaras dinâmicas nos inputs
diaInput.addEventListener('input', () => aplicarMascaraData(diaInput));
valorInput.addEventListener('input', () => formatarMoedaEnquantoDigita(valorInput));

// Processa o envio do formulário de novo custo / edição de custo
formGasto.addEventListener('submit', (evento) => {
    evento.preventDefault();

    const valorGasto = obterNumero(valorInput);
    const dataGasto = obterDataDigitada();
    const periodo = obterPeriodoSelecionado();

    if (!dataGasto) {
        atualizarAvisoData(true);
        diaInput.focus();
        return;
    }

    atualizarAvisoData(false);

    if (dataGasto.mes !== periodo.mes || dataGasto.ano !== periodo.ano) {
        alert('A data do custo precisa estar dentro do mês e ano selecionados.');
        diaInput.focus();
        return;
    }

    if (valorGasto <= 0) {
        alert('Informe um valor de custo maior que zero.');
        valorInput.focus();
        return;
    }

    const gasto = {
        dia: dataGasto.dia,
        mes: dataGasto.mes,
        ano: dataGasto.ano,
        valor: valorGasto,
        categoria: categoriaInput.value,
        descricao: descricaoInput.value.trim()
    };

    if (indiceEmEdicao === null) {
        gastos.push(gasto);
    } else {
        gastos[indiceEmEdicao] = gasto;
    }

    limparFormulario();
    diaInput.focus();
    atualizarResumo();
});

// Botão para cancelar a edição de um custo em andamento
botaoCancelarEdicao.addEventListener('click', () => {
    limparFormulario();
    diaInput.focus();
});

// Eventos dos botões de ação do topo
botaoSalvarGanhosExtra.addEventListener('click', salvarGanhoExtra);
botaoSalvarResumo.addEventListener('click', salvarResumoAtual);

// Formatação automática ao alterar os valores dos inputs de configuração
salarioInput.addEventListener('input', () => {
    formatarMoedaEnquantoDigita(salarioInput);
    atualizarResumo();
});

limiteCustoInput.addEventListener('input', () => {
    formatarMoedaEnquantoDigita(limiteCustoInput);
    atualizarResumo();
});

ganhosExtraInput.addEventListener('input', () => {
    formatarMoedaEnquantoDigita(ganhosExtraInput);
});

// Dispara atualizações ao trocar mês ou ano
mesInput.addEventListener('change', atualizarResumo);
anoInput.addEventListener('change', atualizarResumo);

// ==========================================
// 10. INICIALIZAÇÃO DO SISTEMA
// ==========================================

// Executa assim que a estrutura HTML estiver completamente carregada
window.addEventListener('DOMContentLoaded', () => {
    carregarDadosDoStorage();
    atualizarResumosSalvos();
    atualizarResumo();
});