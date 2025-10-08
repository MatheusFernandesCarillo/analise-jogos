// Variáveis globais
let dadosCompletos = [];
let dadosFiltrados = [];

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    inicializarSelect2();
    carregarDados();
});

function inicializarSelect2() {
    $('.filter-select').select2({
        placeholder: 'Selecione...',
        allowClear: true,
        width: '100%'
    });
}

async function carregarDados() {
    mostrarLoading(true);
    
    try {
        // Carrega o CSV processado
        const response = await fetch('data/games_processed.csv');
        const csvText = await response.text();
        dadosCompletos = parseCSV(csvText);
        dadosFiltrados = [...dadosCompletos];
        
        popularFiltros();
        atualizarDashboard();
        mostrarLoading(false);
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        mostrarLoading(false);
        alert('Erro ao carregar dados. Verifique o console para mais detalhes.');
    }
}

function parseCSV(csvText) {
    const linhas = csvText.split('\n');
    const cabecalho = linhas[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    return linhas.slice(1).map(linha => {
        const valores = linha.split(',').map(v => v.trim().replace(/"/g, ''));
        const obj = {};
        cabecalho.forEach((h, i) => {
            // Converte números
            if (['Vendas_Global', 'Vendas_EUA', 'Vendas_Europa', 'Vendas_Japão', 'Vendas_Outros', 'Lançamento'].includes(h)) {
                obj[h] = parseFloat(valores[i]) || 0;
            } else {
                obj[h] = valores[i] || '';
            }
        });
        return obj;
    }).filter(obj => obj.Nome && obj.Lançamento); // Remove linhas vazias
}

function popularFiltros() {
    // Anos
    const anos = [...new Set(dadosCompletos.map(d => d.Lançamento))].sort((a, b) => a - b);
    const anoSelect = $('#ano-select');
    anos.forEach(ano => {
        const option = new Option(ano, ano, false, false);
        anoSelect.append(option);
    });

    // Plataformas
    const plataformas = [...new Set(dadosCompletos.map(d => d.Plataforma))].sort();
    const plataformaSelect = $('#plataforma-select');
    plataformas.forEach(plataforma => {
        const option = new Option(plataforma, plataforma, false, false);
        plataformaSelect.append(option);
    });

    // Gêneros
    const generos = [...new Set(dadosCompletos.map(d => d.Genero))].sort();
    const generoSelect = $('#genero-select');
    generos.forEach(genero => {
        const option = new Option(genero, genero, false, false);
        generoSelect.append(option);
    });

    // Atualizar Select2
    $('.filter-select').trigger('change');
}

function aplicarFiltros() {
    const regiao = document.getElementById('regiao-select').value;
    const anosSelecionados = $('#ano-select').val() || [];
    const plataformasSelecionadas = $('#plataforma-select').val() || [];
    const generosSelecionados = $('#genero-select').val() || [];

    dadosFiltrados = dadosCompletos.filter(jogo => {
        const anoMatch = anosSelecionados.length === 0 || anosSelecionados.includes(jogo.Lançamento.toString());
        const plataformaMatch = plataformasSelecionadas.length === 0 || plataformasSelecionadas.includes(jogo.Plataforma);
        const generoMatch = generosSelecionados.length === 0 || generosSelecionados.includes(jogo.Genero);
        
        return anoMatch && plataformaMatch && generoMatch;
    });

    if (dadosFiltrados.length === 0) {
        dadosFiltrados = [...dadosCompletos];
        alert('Nenhum resultado encontrado com os filtros aplicados. Mostrando todos os dados.');
    }

    atualizarDashboard();
}

function limparFiltros() {
    $('.filter-select').val(null).trigger('change');
    dadosFiltrados = [...dadosCompletos];
    atualizarDashboard();
}

function atualizarDashboard() {
    const regiao = document.getElementById('regiao-select').value;
    atualizarMetricas(regiao);
    atualizarGraficos(regiao);
    atualizarTabela();
}

function atualizarMetricas(regiao) {
    const dados = dadosFiltrados.length > 0 ? dadosFiltrados : dadosCompletos;
    
    // Ano com mais lançamentos
    const jogosPorAno = {};
    dados.forEach(jogo => {
        jogosPorAno[jogo.Lançamento] = (jogosPorAno[jogo.Lançamento] || 0) + 1;
    });
    const anoTop = Object.entries(jogosPorAno).reduce((a, b) => a[1] > b[1] ? a : b, ['-', 0]);
    document.getElementById('metric-ano').textContent = anoTop[0];
    document.getElementById('metric-total').textContent = anoTop[1].toLocaleString();

    // Gênero mais vendido
    const vendasPorGenero = {};
    dados.forEach(jogo => {
        vendasPorGenero[jogo.Genero] = (vendasPorGenero[jogo.Genero] || 0) + jogo[regiao];
    });
    const generoTop = Object.entries(vendasPorGenero).reduce((a, b) => a[1] > b[1] ? a : b, ['-', 0]);
    document.getElementById('metric-genero').textContent = generoTop[0];

    // Plataforma líder
    const vendasPorPlataforma = {};
    dados.forEach(jogo => {
        vendasPorPlataforma[jogo.Plataforma] = (vendasPorPlataforma[jogo.Plataforma] || 0) + jogo[regiao];
    });
    const plataformaTop = Object.entries(vendasPorPlataforma).reduce((a, b) => a[1] > b[1] ? a : b, ['-', 0]);
    document.getElementById('metric-plataforma').textContent = plataformaTop[0];
}

function atualizarGraficos(regiao) {
    const dados = dadosFiltrados.length > 0 ? dadosFiltrados : dadosCompletos;
    
    // Gráfico de plataformas
    atualizarGraficoPlataformas(dados, regiao);
    
    // Gráfico de anos
    atualizarGraficoAnos(dados, regiao);
    
    // Gráfico de franquias
    atualizarGraficoFranquias(dados, regiao);
}

function atualizarGraficoPlataformas(dados, regiao) {
    const vendasPlataforma = {};
    dados.forEach(jogo => {
        vendasPlataforma[jogo.Plataforma] = (vendasPlataforma[jogo.Plataforma] || 0) + jogo[regiao];
    });
    
    const plataformasTop = Object.entries(vendasPlataforma)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    const trace = {
        x: plataformasTop.map(p => p[0]),
        y: plataformasTop.map(p => p[1]),
        type: 'bar',
        marker: {
            color: '#64b5f6'
        },
        hovertemplate: '<b>%{x}</b><br>Vendas: %{y:.2f}M<extra></extra>'
    };
    
    const layout = {
        title: `Top 10 Plataformas - ${getNomeRegiao(regiao)}`,
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#f0f0f0' },
        xaxis: { 
            tickangle: 45,
            gridcolor: '#374151'
        },
        yaxis: {
            title: 'Vendas (Milhões USD)',
            gridcolor: '#374151'
        },
        margin: { t: 50, r: 30, b: 80, l: 60 }
    };
    
    Plotly.react('chart-plataforma', [trace], layout);
}

function atualizarGraficoAnos(dados, regiao) {
    const vendasAno = {};
    dados.forEach(jogo => {
        vendasAno[jogo.Lançamento] = (vendasAno[jogo.Lançamento] || 0) + jogo[regiao];
    });
    
    const anosOrdenados = Object.entries(vendasAno).sort((a, b) => a[0] - b[0]);
    
    const trace = {
        x: anosOrdenados.map(a => a[0]),
        y: anosOrdenados.map(a => a[1]),
        type: 'scatter',
        mode: 'lines+markers',
        line: { 
            color: '#bb86fc',
            width: 3
        },
        marker: { 
            color: '#bb86fc',
            size: 6
        },
        hovertemplate: 'Ano: %{x}<br>Vendas: %{y:.2f}M<extra></extra>'
    };
    
    const layout = {
        title: `Evolução das Vendas - ${getNomeRegiao(regiao)}`,
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#f0f0f0' },
        xaxis: { 
            title: 'Ano',
            gridcolor: '#374151'
        },
        yaxis: {
            title: 'Vendas (Milhões USD)',
            gridcolor: '#374151'
        },
        margin: { t: 50, r: 30, b: 60, l: 60 }
    };
    
    Plotly.react('chart-ano', [trace], layout);
}

function atualizarGraficoFranquias(dados, regiao) {
    const franquiasConhecidas = ['Call of Duty', 'FIFA', 'Mario', 'Pokémon', 'Grand Theft Auto', 
                                'The Sims', 'Need for Speed', 'Assassin', 'Final Fantasy', 'Halo'];

    function identificarFranquia(nome) {
        if (!nome) return 'Outras';
        nome = nome.toLowerCase();
        for (const franquia of franquiasConhecidas) {
            if (nome.includes(franquia.toLowerCase())) {
                return franquia;
            }
        }
        return 'Outras';
    }

    // Calcular vendas por franquia
    const vendasFranquias = {};
    dados.forEach(jogo => {
        const franquia = identificarFranquia(jogo.Nome);
        vendasFranquias[franquia] = (vendasFranquias[franquia] || 0) + jogo[regiao];
    });

    // Filtrar apenas franquias conhecidas e ordenar
    const franquiasPrincipais = Object.entries(vendasFranquias)
        .filter(([franquia]) => franquia !== 'Outras')
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15);

    const trace = {
        x: franquiasPrincipais.map(f => f[0]),
        y: franquiasPrincipais.map(f => f[1]),
        type: 'bar',
        marker: {
            color: franquiasPrincipais.map(f => getCorFranquia(f[0]))
        },
        hovertemplate: '<b>%{x}</b><br>Vendas: %{y:.2f}M<extra></extra>'
    };

    const layout = {
        title: `Top 15 Franquias - ${getNomeRegiao(regiao)}`,
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#f0f0f0' },
        xaxis: { 
            tickangle: 45,
            gridcolor: '#374151'
        },
        yaxis: {
            title: 'Vendas (Milhões USD)',
            gridcolor: '#374151'
        },
        margin: { t: 50, r: 30, b: 120, l: 60 }
    };

    Plotly.react('chart-franquias', [trace], layout);
}

function atualizarTabela() {
    const dados = dadosFiltrados.length > 0 ? dadosFiltrados.slice(0, 50) : dadosCompletos.slice(0, 50); // Limita a 50 registros
    
    let html = `
        <div class="table-info">
            <p>Mostrando ${dados.length} de ${dadosFiltrados.length} jogos</p>
        </div>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Nome</th>
                    <th>Plataforma</th>
                    <th>Ano</th>
                    <th>Gênero</th>
                    <th>Vendas Global</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    dados.forEach(jogo => {
        html += `
            <tr>
                <td>${jogo.Nome || '-'}</td>
                <td>${jogo.Plataforma || '-'}</td>
                <td>${jogo.Lançamento || '-'}</td>
                <td>${jogo.Genero || '-'}</td>
                <td>$${(jogo.Vendas_Global || 0).toFixed(2)}M</td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    document.getElementById('tabela-dados').innerHTML = html;
}

function getNomeRegiao(regiao) {
    const regioes = {
        'Vendas_Global': 'Global',
        'Vendas_EUA': 'América do Norte',
        'Vendas_Europa': 'Europa',
        'Vendas_Japão': 'Japão',
        'Vendas_Outros': 'Resto do Mundo'
    };
    return regioes[regiao];
}

function getCorFranquia(franquia) {
    const cores = {
        'Call of Duty': '#FF6B00',
        'FIFA': '#009688', 
        'Mario': '#E91E63',
        'Pokémon': '#FFC107',
        'Grand Theft Auto': '#4CAF50',
        'The Sims': '#9C27B0',
        'Need for Speed': '#FF9800',
        'Assassin': '#795548',
        'Final Fantasy': '#3F51B5',
        'Halo': '#00BCD4'
    };
    return cores[franquia] || '#2196F3';
}

function mostrarLoading(mostrar) {
    document.getElementById('loading').style.display = mostrar ? 'flex' : 'none';
}

// Event listeners
document.getElementById('regiao-select').addEventListener('change', function() {
    atualizarDashboard();
});