// Variáveis globais
let dadosCompletos = [];
let dadosFiltrados = [];

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('Página carregada');
    carregarDados();
});

async function carregarDados() {
    console.log('Tentando carregar dados...');
    document.getElementById('loading').style.display = 'flex';
    
    try {
        // Tenta carregar do arquivo local primeiro
        let response = await fetch('data/games_processed.csv');
        
        if (!response.ok) {
            // Se não encontrar, usa a URL original
            console.log('Arquivo local não encontrado, usando URL original...');
            response = await fetch('https://raw.githubusercontent.com/MatheusFernandesCarillo/jogos-analise/main/Video_Games_Sales_as_at_22_Dec_2016.csv');
        }
        
        const csvText = await response.text();
        console.log('Dados carregados com sucesso:', csvText.length, 'caracteres');
        
        dadosCompletos = processarDadosCSV(csvText);
        dadosFiltrados = [...dadosCompletos];
        
        console.log('Dados processados:', dadosCompletos.length, 'registros');
        
        popularFiltros();
        atualizarDashboard();
        
        document.getElementById('loading').style.display = 'none';
        
    } catch (error) {
        console.error('Erro crítico:', error);
        document.getElementById('loading').style.display = 'none';
        document.getElementById('tabela-dados').innerHTML = `
            <div style="color: red; padding: 2rem; text-align: center;">
                <h3>Erro ao carregar dados</h3>
                <p>Verifique o console para detalhes</p>
            </div>
        `;
    }
}

function processarDadosCSV(csvText) {
    const linhas = csvText.split('\n');
    const cabecalho = linhas[0].split(',').map(h => h.trim());
    
    const dados = linhas.slice(1).map(linha => {
        const valores = linha.split(',').map(v => v.trim().replace(/"/g, ''));
        const obj = {};
        cabecalho.forEach((h, i) => {
            const colunasMapeadas = {
                'Name': 'Nome',
                'Platform': 'Plataforma', 
                'Year_of_Release': 'Lançamento',
                'Genre': 'Genero',
                'Publisher': 'Publicadora',
                'NA_Sales': 'Vendas_EUA',
                'EU_Sales': 'Vendas_Europa',
                'JP_Sales': 'Vendas_Japão',
                'Other_Sales': 'Vendas_Outros',
                'Global_Sales': 'Vendas_Global'
            };
            
            const nomeColuna = colunasMapeadas[h] || h;
            
            if (nomeColuna.includes('Vendas') || nomeColuna === 'Lançamento') {
                obj[nomeColuna] = parseFloat(valores[i]) || 0;
            } else {
                obj[nomeColuna] = valores[i] || '';
            }
        });
        return obj;
    }).filter(obj => obj.Nome && obj.Lançamento && obj.Lançamento !== 3);
    
    console.log('Dados filtrados:', dados.length, 'registros válidos');
    return dados;
}

function popularFiltros() {
    console.log('Populando filtros...');
    // Implementação simples dos filtros
}

function atualizarDashboard() {
    console.log('Atualizando dashboard...');
    
    // Atualiza a região
    document.getElementById('regiao-atual').textContent = 'Região: Global';
    
    // Atualiza métricas básicas
    document.getElementById('metric-ano').textContent = '2009';
    document.getElementById('metric-total').textContent = '1000';
    document.getElementById('metric-genero').textContent = 'Action';
    document.getElementById('metric-plataforma').textContent = 'DS';
    
    // Atualiza tabela
    atualizarTabela();
}

function atualizarTabela() {
    const html = `
        <div class="table-info">
            <p>Mostrando ${Math.min(dadosCompletos.length, 50)} de ${dadosCompletos.length} jogos</p>
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
                ${dadosCompletos.slice(0, 10).map(jogo => `
                    <tr>
                        <td>${jogo.Nome || '-'}</td>
                        <td>${jogo.Plataforma || '-'}</td>
                        <td>${jogo.Lançamento || '-'}</td>
                        <td>${jogo.Genero || '-'}</td>
                        <td>$${(jogo.Vendas_Global || 0).toFixed(2)}M</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    document.getElementById('tabela-dados').innerHTML = html;
}

// Funções vazias para evitar erros
function aplicarFiltros() { console.log('Aplicando filtros...'); }
function limparFiltros() { console.log('Limpando filtros...'); }
function atualizarAnaliseFranquias() { console.log('Atualizando franquias...'); }
function atualizarAnaliseRegional() { console.log('Atualizando regional...'); }
function atualizarDetalhesFranquia() { console.log('Atualizando detalhes franquia...'); }
function inicializarAnalises() { console.log('Inicializando análises...'); }
