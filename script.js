let dadosCompletos = [];
let dadosFiltrados = [];

document.addEventListener('DOMContentLoaded', function() {
    inicializarSelect2();
    carregarDados();
});

function inicializarSelect2() {
    $('.filter-select').select2({
        placeholder: 'Selecione...',
        allowClear: true,
        width: '100%',
        theme: 'default'
    });
    
    $('#franquia-select').select2({
        placeholder: 'Selecione uma franquia...',
        allowClear: false,
        width: '200px',
        theme: 'default'
    });
}

async function carregarDados() {
    mostrarLoading(true);
    
    try {
        const response = await fetch('data/games_processed.csv');
        const csvText = await response.text();
        dadosCompletos = parseCSV(csvText);
        dadosFiltrados = [...dadosCompletos];
        
        popularFiltros();
        atualizarDashboard();
        inicializarAnalises();
        
        const regiao = document.getElementById('regiao-select').value;
        atualizarAnaliseFranquias(regiao);
        
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
            if (['Vendas_Global', 'Vendas_EUA', 'Vendas_Europa', 'Vendas_Japão', 'Vendas_Outros', 'Lançamento'].includes(h)) {
                obj[h] = parseFloat(valores[i]) || 0;
            } else {
                obj[h] = valores[i] || '';
            }
        });
        return obj;
    }).filter(obj => obj.Nome && obj.Lançamento && obj.Lançamento !== 3); // FILTRA ANO 3
}

function popularFiltros() {
    const anos = [...new Set(dadosCompletos.map(d => d.Lançamento))]
        .filter(ano => ano !== 3) 
        .sort((a, b) => a - b);
    
    const anoSelect = $('#ano-select');
    anos.forEach(ano => {
        const option = new Option(ano, ano, false, false);
        anoSelect.append(option);
    });

    const plataformas = [...new Set(dadosCompletos.map(d => d.Plataforma))].sort();
    const plataformaSelect = $('#plataforma-select');
    plataformas.forEach(plataforma => {
        const option = new Option(plataforma, plataforma, false, false);
        plataformaSelect.append(option);
    });

    const generos = [...new Set(dadosCompletos.map(d => d.Genero))].sort();
    const generoSelect = $('#genero-select');
    generos.forEach(genero => {
        const option = new Option(genero, genero, false, false);
        generoSelect.append(option);
    });

    const generoRegionalSelect = $('#genero-regional-select');
    generos.forEach(genero => {
        const option = new Option(genero, genero, false, false);
        generoRegionalSelect.append(option);
    });

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
    document.getElementById('regiao-atual').textContent = `Região: ${getNomeRegiao(regiao)}`;
    
    atualizarMetricas(regiao);
    atualizarGraficos(regiao);
    atualizarTabela();
    
    atualizarAnaliseFranquias(regiao);
    atualizarAnaliseRegional();
}

function inicializarAnalises() {
    const regiao = document.getElementById('regiao-select').value;
    atualizarAnaliseFranquias(regiao);
    atualizarAnaliseRegional();
}

function atualizarMetricas(regiao) {
    const dados = dadosFiltrados.length > 0 ? dadosFiltrados : dadosCompletos;
    
    const jogosPorAno = {};
    dados.forEach(jogo => {
        if (jogo.Lançamento !== 3) {
            jogosPorAno[jogo.Lançamento] = (jogosPorAno[jogo.Lançamento] || 0) + 1;
        }
    });
    const anoTop = Object.entries(jogosPorAno).reduce((a, b) => a[1] > b[1] ? a : b, ['-', 0]);
    document.getElementById('metric-ano').textContent = anoTop[0];
    document.getElementById('metric-total').textContent = anoTop[1].toLocaleString();

    const vendasPorGenero = {};
    dados.forEach(jogo => {
        vendasPorGenero[jogo.Genero] = (vendasPorGenero[jogo.Genero] || 0) + jogo[regiao];
    });
    const generoTop = Object.entries(vendasPorGenero).reduce((a, b) => a[1] > b[1] ? a : b, ['-', 0]);
    document.getElementById('metric-genero').textContent = generoTop[0];


    const vendasPorPlataforma = {};
    dados.forEach(jogo => {
        vendasPorPlataforma[jogo.Plataforma] = (vendasPorPlataforma[jogo.Plataforma] || 0) + jogo[regiao];
    });
    const plataformaTop = Object.entries(vendasPorPlataforma).reduce((a, b) => a[1] > b[1] ? a : b, ['-', 0]);
    document.getElementById('metric-plataforma').textContent = plataformaTop[0];
}

function atualizarGraficos(regiao) {
    const dados = dadosFiltrados.length > 0 ? dadosFiltrados : dadosCompletos;
    
    atualizarGraficoPlataformas(dados, regiao);
    atualizarGraficoAnos(dados, regiao);
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
        marker: { color: '#64b5f6' },
        hovertemplate: '<b>%{x}</b><br>Vendas: %{y:.2f}M<extra></extra>'
    };
    
    const layout = {
        title: `Top 10 Plataformas - ${getNomeRegiao(regiao)}`,
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#f0f0f0' },
        xaxis: { tickangle: 45, gridcolor: '#374151' },
        yaxis: { title: 'Vendas (Milhões USD)', gridcolor: '#374151' },
        margin: { t: 50, r: 30, b: 80, l: 60 }
    };
    
    Plotly.react('chart-plataforma', [trace], layout);
}

function atualizarGraficoAnos(dados, regiao) {
    const vendasAno = {};
    dados.forEach(jogo => {
        if (jogo.Lançamento !== 3) { 
            vendasAno[jogo.Lançamento] = (vendasAno[jogo.Lançamento] || 0) + jogo[regiao];
        }
    });
    
    const anosOrdenados = Object.entries(vendasAno)
        .filter(([ano]) => ano !== '3')
        .sort((a, b) => a[0] - b[0]);
    
    const trace = {
        x: anosOrdenados.map(a => a[0]),
        y: anosOrdenados.map(a => a[1]),
        type: 'scatter',
        mode: 'lines+markers',
        line: { color: '#bb86fc', width: 3 },
        marker: { color: '#bb86fc', size: 6 },
        hovertemplate: 'Ano: %{x}<br>Vendas: %{y:.2f}M<extra></extra>'
    };
    
    const layout = {
        title: `Evolução das Vendas - ${getNomeRegiao(regiao)}`,
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#f0f0f0' },
        xaxis: { title: 'Ano', gridcolor: '#374151' },
        yaxis: { title: 'Vendas (Milhões USD)', gridcolor: '#374151' },
        margin: { t: 50, r: 30, b: 60, l: 60 }
    };
    
    Plotly.react('chart-ano', [trace], layout);
}

function atualizarTabela() {
    const dados = dadosFiltrados.length > 0 ? dadosFiltrados.slice(0, 50) : dadosCompletos.slice(0, 50);
    
    console.log('Dados para tabela:', dados.length, 'registros');
    
    if (dados.length === 0) {
        document.getElementById('tabela-dados').innerHTML = `
            <div class="no-data">
                <div class="icon">📭</div>
                <p>Nenhum dado encontrado com os filtros aplicados</p>
            </div>
        `;
        return;
    }
    
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
                    <th>Publicadora</th>
                    <th>Vendas Global</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    dados.forEach(jogo => {
        const nome = jogo.Nome || '-';
        const plataforma = jogo.Plataforma || '-';
        const ano = jogo.Lançamento || '-';
        const genero = jogo.Genero || '-';
        const publicadora = jogo.Publicadora || '-';
        const vendas = jogo.Vendas_Global ? `$${jogo.Vendas_Global.toFixed(2)}M` : '$0.00M';
        
        html += `
            <tr>
                <td title="${nome}">${nome.length > 30 ? nome.substring(0, 30) + '...' : nome}</td>
                <td>${plataforma}</td>
                <td>${ano}</td>
                <td>${genero}</td>
                <td title="${publicadora}">${publicadora.length > 20 ? publicadora.substring(0, 20) + '...' : publicadora}</td>
                <td style="text-align: right; font-weight: 600;">${vendas}</td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    document.getElementById('tabela-dados').innerHTML = html;
}

function atualizarAnaliseFranquias(regiao) {
    const dados = dadosFiltrados.length > 0 ? dadosFiltrados : dadosCompletos;
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

    const vendasFranquias = {};
    dados.forEach(jogo => {
        const franquia = identificarFranquia(jogo.Nome);
        vendasFranquias[franquia] = (vendasFranquias[franquia] || 0) + jogo[regiao];
    });

    const franquiasPrincipais = Object.entries(vendasFranquias)
        .filter(([franquia]) => franquia !== 'Outras')
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15);

    const coresEspeciais = {
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

    const cores = franquiasPrincipais.map(([franquia]) => 
        coresEspeciais[franquia] || '#2196F3'
    );

    const trace = {
        x: franquiasPrincipais.map(([f]) => f),
        y: franquiasPrincipais.map(([, v]) => v),
        type: 'bar',
        marker: { color: cores },
        hovertemplate: '<b>%{x}</b><br>Vendas: %{y:.2f}M<extra></extra>'
    };

    const layout = {
        title: `Top 15 Franquias - ${getNomeRegiao(regiao)}`,
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#f0f0f0' },
        xaxis: { tickangle: 45, gridcolor: '#374151' },
        yaxis: { title: 'Vendas (Milhões USD)', gridcolor: '#374151' },
        margin: { t: 50, r: 30, b: 120, l: 60 }
    };

    Plotly.react('chart-franquias', [trace], layout);

    atualizarMetricasFranquias(franquiasPrincipais, regiao);
}

function atualizarMetricasFranquias(franquiasPrincipais, regiao) {
    const franquiasAlvo = ['Call of Duty', 'FIFA', 'Mario', 'Pokémon'];
    const metricsContainer = document.getElementById('franquia-metrics');
    
    let html = '';
    
    franquiasAlvo.forEach(franquia => {
        const franquiaData = franquiasPrincipais.find(([f]) => f === franquia);
        let totalVendas = 0;
        let rankingPos = 'N/A';
        
        if (franquiaData) {
            totalVendas = franquiaData[1];
            rankingPos = franquiasPrincipais.findIndex(([f]) => f === franquia) + 1;
        }
        
        html += `
            <div class="metric-card">
                <div class="metric-content">
                    <h3>${franquia}</h3>
                    <p class="value">$${totalVendas.toFixed(1)}M</p>
                    <p class="rank">Rank: #${rankingPos}</p>
                </div>
            </div>
        `;
    });
    
    metricsContainer.innerHTML = html;
}

function atualizarDetalhesFranquia() {
    const franquiaSelecionada = document.getElementById('franquia-select').value;
    const regiao = document.getElementById('regiao-select').value;
    const dados = dadosFiltrados.length > 0 ? dadosFiltrados : dadosCompletos;
    
    const jogosFranquia = dados.filter(jogo => 
        jogo.Nome && jogo.Nome.toLowerCase().includes(franquiaSelequiaSelecionada.toLowerCase())
    );
    
    if (jogosFranquia.length === 0) {
        alert(`Nenhum jogo encontrado para a franquia ${franquiaSelecionada}`);
        return;
    }
    
    document.getElementById('initial-message').style.display = 'none';
    document.getElementById('chart-detalhes-franquia').style.display = 'block';
    document.getElementById('estatisticas-franquia').style.display = 'block';
    
    const topJogos = jogosFranquia
        .sort((a, b) => b[regiao] - a[regiao])
        .slice(0, 10);
    
    const trace = {
        x: topJogos.map(jogo => jogo.Nome),
        y: topJogos.map(jogo => jogo[regiao]),
        type: 'bar',
        marker: { 
            color: getCorFranquia(franquiaSelecionada)
        },
        hovertemplate: '<b>%{x}</b><br>Plataforma: %{customdata}<br>Vendas: %{y:.2f}M<extra></extra>',
        customdata: topJogos.map(jogo => jogo.Plataforma)
    };
    
    const layout = {
        title: `Top 10 Jogos - ${franquiaSelecionada} (${getNomeRegiao(regiao)})`,
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#f0f0f0' },
        xaxis: { tickangle: 45, gridcolor: '#374151' },
        yaxis: { title: 'Vendas (Milhões USD)', gridcolor: '#374151' },
        margin: { t: 50, r: 30, b: 150, l: 60 }
    };
    
    Plotly.react('chart-detalhes-franquia', [trace], layout);
    
    const totalJogos = jogosFranquia.length;
    const vendasTotais = jogosFranquia.reduce((sum, jogo) => sum + jogo[regiao], 0);
    const anoPrimeiro = Math.min(...jogosFranquia.map(jogo => jogo.Lançamento));
    const anoUltimo = Math.max(...jogosFranquia.map(jogo => jogo.Lançamento));
    const vendasMedias = vendasTotais / totalJogos;
    
    const statsHtml = `
        <h4>Estatísticas da franquia ${franquiaSelecionada}:</h4>
        <p><strong>Total de jogos:</strong> ${totalJogos}</p>
        <p><strong>Período:</strong> ${anoPrimeiro} - ${anoUltimo}</p>
        <p><strong>Vendas totais:</strong> $${vendasTotais.toFixed(2)}M</p>
        <p><strong>Vendas médias por jogo:</strong> $${vendasMedias.toFixed(2)}M</p>
    `;
    
    document.getElementById('estatisticas-franquia').innerHTML = statsHtml;
    document.getElementById('titulo-franquia').textContent = `Detalhes da Franquia: ${franquiaSelecionada}`;
}

function atualizarAnaliseRegional() {
    const generoSelecionado = document.getElementById('genero-regional-select').value;
    const regiaoComparacao = document.getElementById('regiao-comparacao-select').value;
    const dados = dadosFiltrados.length > 0 ? dadosFiltrados : dadosCompletos;
    
    if (!generoSelecionado) {
        alert('Por favor, selecione um gênero para análise.');
        return;
    }
    
    const regioesComparacao = {
        'América do Norte': 'Vendas_EUA',
        'Europa': 'Vendas_Europa', 
        'Japão': 'Vendas_Japão',
        'Resto do Mundo': 'Vendas_Outros',
        'Global': 'Vendas_Global'
    };
    
    const vendasRegiao = {};
    dados.forEach(jogo => {
        vendasRegiao[jogo.Genero] = (vendasRegiao[jogo.Genero] || 0) + jogo[regiaoComparacao];
    });
    
    const totalVendasRegiao = Object.values(vendasRegiao).reduce((a, b) => a + b, 0);
    const participacaoGenero = totalVendasRegiao > 0 ? 
        (vendasRegiao[generoSelecionado] / totalVendasRegiao) * 100 : 0;

    const participacoes = {};
    const rankings = {};
    
    for (const [regiaoNome, regiaoCol] of Object.entries(regioesComparacao)) {
        const vendasTemp = {};
        dados.forEach(jogo => {
            vendasTemp[jogo.Genero] = (vendasTemp[jogo.Genero] || 0) + jogo[regiaoCol];
        });
        
        const totalTemp = Object.values(vendasTemp).reduce((a, b) => a + b, 0);
        participacoes[regiaoNome] = totalTemp > 0 ? (vendasTemp[generoSelecionado] / totalTemp) * 100 : 0;
        
        // Ranking
        const generosOrdenados = Object.entries(vendasTemp)
            .sort((a, b) => b[1] - a[1])
            .map(([g]) => g);
        rankings[regiaoNome] = generosOrdenados.indexOf(generoSelecionado) + 1;
    }

    atualizarMetricasRegionais(participacaoGenero, rankings[getNomeRegiao(regiaoComparacao)], participacoes);

    const dfComparacao = Object.entries(participacoes).map(([regiao, participacao]) => ({
        Região: regiao,
        Participação: participacao,
        Ranking: rankings[regiao]
    }));

    const traceComparacao = {
        x: dfComparacao.map(d => d.Região),
        y: dfComparacao.map(d => d.Participação),
        type: 'bar',
        marker: {
            color: dfComparacao.map(d => 
                d.Região === getNomeRegiao(regiaoComparacao) ? '#FF6B00' : '#1f77b4'
            )
        },
        hovertemplate: '<b>%{x}</b><br>Participação: %{y:.1f}%<br>Rank: #%{customdata}<extra></extra>',
        customdata: dfComparacao.map(d => d.Ranking)
    };

    const layoutComparacao = {
        title: `Participação de ${generoSelecionado} por Região (%)`,
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#f0f0f0' },
        xaxis: { title: '', gridcolor: '#374151' },
        yaxis: { title: 'Participação (%)', gridcolor: '#374151' },
        margin: { t: 50, r: 30, b: 60, l: 60 }
    };

    Plotly.react('chart-comparacao-regional', [traceComparacao], layoutComparacao);

    const evolucao = {};
    dados
        .filter(jogo => jogo.Genero === generoSelecionado)
        .forEach(jogo => {
            if (jogo.Lançamento !== 3) { 
                evolucao[jogo.Lançamento] = (evolucao[jogo.Lançamento] || 0) + jogo[regiaoComparacao];
            }
        });

    const evolucaoOrdenada = Object.entries(evolucao)
        .filter(([ano]) => ano !== '3') 
        .sort((a, b) => a[0] - b[0]);

    const traceEvolucao = {
        x: evolucaoOrdenada.map(([ano]) => ano),
        y: evolucaoOrdenada.map(([, vendas]) => vendas),
        type: 'scatter',
        mode: 'lines+markers',
        line: { color: '#bb86fc', width: 3 },
        marker: { color: '#bb86fc', size: 6 },
        hovertemplate: 'Ano: %{x}<br>Vendas: %{y:.2f}M<extra></extra>'
    };

    const layoutEvolucao = {
        title: `Evolução de ${generoSelecionado} em ${getNomeRegiao(regiaoComparacao)}`,
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#f0f0f0' },
        xaxis: { title: 'Ano', gridcolor: '#374151' },
        yaxis: { title: 'Vendas (Milhões USD)', gridcolor: '#374151' },
        margin: { t: 50, r: 30, b: 60, l: 60 }
    };

    Plotly.react('chart-evolucao-regional', [traceEvolucao], layoutEvolucao);

    const vendasPorGenero = Object.entries(vendasRegiao)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);

    const traceGeneros = {
        x: vendasPorGenero.map(([genero]) => genero),
        y: vendasPorGenero.map(([, vendas]) => (vendas / totalVendasRegiao) * 100),
        type: 'bar',
        marker: {
            color: vendasPorGenero.map(([genero]) => 
                genero === generoSelecionado ? '#FF6B00' : '#1f77b4'
            )
        },
        hovertemplate: '<b>%{x}</b><br>Participação: %{y:.1f}%<extra></extra>'
    };

    const layoutGeneros = {
        title: 'Participação dos Gêneros (%)',
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#f0f0f0' },
        xaxis: { tickangle: 45, gridcolor: '#374151' },
        yaxis: { title: 'Participação (%)', gridcolor: '#374151' },
        margin: { t: 50, r: 30, b: 80, l: 60 }
    };

    Plotly.react('chart-comparacao-generos', [traceGeneros], layoutGeneros);

    const topJogos = dados
        .filter(jogo => jogo.Genero === generoSelecionado)
        .sort((a, b) => b[regiaoComparacao] - a[regiaoComparacao])
        .slice(0, 5)
        .map(jogo => ({
            Jogo: jogo.Nome,
            Plataforma: jogo.Plataforma,
            Ano: jogo.Lançamento,
            Vendas: `$${jogo[regiaoComparacao].toFixed(2)}M`
        }));

    let tabelaHtml = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Jogo</th>
                    <th>Plataforma</th>
                    <th>Ano</th>
                    <th>Vendas</th>
                </tr>
            </thead>
            <tbody>
    `;

    topJogos.forEach(jogo => {
        tabelaHtml += `
            <tr>
                <td>${jogo.Jogo}</td>
                <td>${jogo.Plataforma}</td>
                <td>${jogo.Ano}</td>
                <td style="text-align: right; font-weight: 600;">${jogo.Vendas}</td>
            </tr>
        `;
    });

    tabelaHtml += `
            </tbody>
        </table>
    `;

    document.getElementById('tabela-top-jogos').innerHTML = tabelaHtml;
}

function atualizarMetricasRegionais(participacao, ranking, participacoes) {
    const metricsContainer = document.getElementById('regional-metrics');
    
    const regiaoMaisPopular = Object.entries(participacoes).reduce((a, b) => a[1] > b[1] ? a : b)[0];
    const diferencaMais = participacoes[regiaoMaisPopular] - participacao;
    
    const regiaoMenosPopular = Object.entries(participacoes).reduce((a, b) => a[1] < b[1] ? a : b)[0];
    const diferencaMenos = participacao - participacoes[regiaoMenosPopular];

    const html = `
        <div class="metric-card">
            <div class="metric-content">
                <h3>Participação</h3>
                <p class="value">${participacao.toFixed(1)}%</p>
                <p class="rank">Rank: #${ranking}</p>
            </div>
        </div>
        <div class="metric-card">
            <div class="metric-content">
                <h3>Mais Popular em</h3>
                <p class="value">${regiaoMaisPopular}</p>
                <p class="rank">${regiaoMaisPopular !== getNomeRegiao(document.getElementById('regiao-comparacao-select').value) ? `+${diferencaMais.toFixed(1)}%` : '🏆'}</p>
            </div>
        </div>
        <div class="metric-card">
            <div class="metric-content">
                <h3>Menos Popular em</h3>
                <p class="value">${regiaoMenosPopular}</p>
                <p class="rank">${regiaoMenosPopular !== getNomeRegiao(document.getElementById('regiao-comparacao-select').value) ? `-${diferencaMenos.toFixed(1)}%` : '⬇️'}</p>
            </div>
        </div>
    `;

    metricsContainer.innerHTML = html;
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

document.getElementById('regiao-select').addEventListener('change', function() {
    atualizarDashboard();
});



