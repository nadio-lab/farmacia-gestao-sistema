// Dados em LocalStorage
let produtos = JSON.parse(localStorage.getItem('produtos')) || [];
let vendas = JSON.parse(localStorage.getItem('vendas')) || [];
let clientes = JSON.parse(localStorage.getItem('clientes')) || [];
let fornecedores = JSON.parse(localStorage.getItem('fornecedores')) || [];

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
    atualizarDashboard();
    carregarTabelaProdutos();
    carregarSelectMedicamentos();
    carregarTabelaVendas();
    carregarTabelaClientes();
    carregarTabelaFornecedores();

    // Form de Produto
    document.getElementById('formProduto').addEventListener('submit', function(e) {
        e.preventDefault();
        adicionarProduto();
    });

    // Form de Venda
    document.getElementById('formVenda').addEventListener('submit', function(e) {
        e.preventDefault();
        adicionarVenda();
    });

    // Form de Cliente
    document.getElementById('formCliente').addEventListener('submit', function(e) {
        e.preventDefault();
        adicionarCliente();
    });

    // Form de Fornecedor
    document.getElementById('formFornecedor').addEventListener('submit', function(e) {
        e.preventDefault();
        adicionarFornecedor();
    });
});

// ============ DASHBOARD ============
function atualizarDashboard() {
    // Total de produtos
    document.getElementById('totalProdutos').textContent = produtos.length;

    // Receita total (este mês)
    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();
    
    let receitaMes = 0;
    vendas.forEach(venda => {
        const dataVenda = new Date(venda.data);
        if (dataVenda.getMonth() === mesAtual && dataVenda.getFullYear() === anoAtual) {
            receitaMes += parseFloat(venda.valorTotal);
        }
    });
    document.getElementById('receitaTotal').textContent = '€' + receitaMes.toFixed(2);

    // Total de clientes
    document.getElementById('totalClientes').textContent = clientes.length;

    // Alertas de stock baixo
    let alertasBaixoStock = produtos.filter(p => p.stock < 10).length;
    document.getElementById('alertas').textContent = alertasBaixoStock;

    // Alertas Stock
    let htmlAlertas = '';
    produtos.filter(p => p.stock < 10).forEach(p => {
        htmlAlertas += `
            <div class="alert-item">
                <strong>${p.nome}</strong> - Stock: ${p.stock} unidades
            </div>
        `;
    });
    if (htmlAlertas) {
        document.getElementById('alertasStock').innerHTML = htmlAlertas;
    } else {
        document.getElementById('alertasStock').innerHTML = '<p class="text-muted">Sem alertas de stock</p>';
    }

    // Últimas vendas
    let htmlVendas = '';
    vendas.slice(-5).reverse().forEach(v => {
        htmlVendas += `
            <tr>
                <td>${v.medicamento}</td>
                <td>${v.quantidade}</td>
                <td>€${parseFloat(v.valorTotal).toFixed(2)}</td>
            </tr>
        `;
    });
    if (htmlVendas) {
        document.querySelector('#ultimasVendas tbody').innerHTML = htmlVendas;
    }
}

// ============ PRODUTOS/MEDICAMENTOS ============
function adicionarProduto() {
    const codigo = document.getElementById('codigo').value;
    const nome = document.getElementById('nomeProd').value;
    const categoria = document.getElementById('categoria').value;
    const preco = document.getElementById('preco').value;
    const stock = document.getElementById('stock').value;
    const validade = document.getElementById('validade').value;

    if (codigo && nome && categoria && preco && stock && validade) {
        const produto = {
            id: Date.now(),
            codigo,
            nome,
            categoria,
            preco,
            stock,
            validade,
            dataCriacao: new Date().toLocaleDateString('pt-PT')
        };

        produtos.push(produto);
        localStorage.setItem('produtos', JSON.stringify(produtos));

        // Limpar form
        document.getElementById('formProduto').reset();
        
        // Fechar modal
        bootstrap.Modal.getInstance(document.getElementById('modalProduto')).hide();

        // Recarregar dados
        carregarTabelaProdutos();
        carregarSelectMedicamentos();
        atualizarDashboard();

        mostrarNotificacao('Medicamento adicionado com sucesso!', 'success');
    }
}

function carregarTabelaProdutos() {
    let html = '';
    if (produtos.length === 0) {
        html = '<tr><td colspan="7" class="text-center text-muted">Nenhum medicamento registado</td></tr>';
    } else {
        produtos.forEach(p => {
            html += `
                <tr>
                    <td><strong>${p.codigo}</strong></td>
                    <td>${p.nome}</td>
                    <td><span class="badge bg-info">${p.categoria}</span></td>
                    <td>€${parseFloat(p.preco).toFixed(2)}</td>
                    <td>
                        <span class="badge ${p.stock < 10 ? 'bg-danger' : 'bg-success'}">
                            ${p.stock}
                        </span>
                    </td>
                    <td>${p.validade}</td>
                    <td>
                        <button class="btn btn-sm btn-warning" onclick="editarProduto(${p.id})">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deletarProduto(${p.id})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
    }
    document.getElementById('corpoProdutos').innerHTML = html;
}

function carregarSelectMedicamentos() {
    let html = '<option value="">Selecione</option>';
    produtos.forEach(p => {
        html += `<option value="${p.nome}">${p.nome} - €${parseFloat(p.preco).toFixed(2)}</option>`;
    });
    document.getElementById('medicamentoVenda').innerHTML = html;
}

function deletarProduto(id) {
    if (confirm('Tem a certeza que deseja eliminar este medicamento?')) {
        produtos = produtos.filter(p => p.id !== id);
        localStorage.setItem('produtos', JSON.stringify(produtos));
        carregarTabelaProdutos();
        carregarSelectMedicamentos();
        atualizarDashboard();
        mostrarNotificacao('Medicamento eliminado!', 'danger');
    }
}

// ============ VENDAS ============
function adicionarVenda() {
    const cliente = document.getElementById('clienteVenda').value;
    const medicamento = document.getElementById('medicamentoVenda').value;
    const quantidade = parseInt(document.getElementById('quantidadeVenda').value);
    const preco = parseFloat(document.getElementById('precoVenda').value);

    if (cliente && medicamento && quantidade && preco) {
        // Verificar se há stock
        const prod = produtos.find(p => p.nome === medicamento);
        if (prod && prod.stock >= quantidade) {
            const venda = {
                id: Date.now(),
                idVenda: 'V' + Date.now(),
                cliente,
                medicamento,
                quantidade,
                precoUnitario: preco,
                valorTotal: (quantidade * preco),
                data: new Date().toLocaleDateString('pt-PT'),
                hora: new Date().toLocaleTimeString('pt-PT')
            };

            vendas.push(venda);
            
            // Atualizar stock
            prod.stock -= quantidade;
            
            localStorage.setItem('vendas', JSON.stringify(vendas));
            localStorage.setItem('produtos', JSON.stringify(produtos));

            // Limpar form
            document.getElementById('formVenda').reset();
            bootstrap.Modal.getInstance(document.getElementById('modalVenda')).hide();

            // Recarregar dados
            carregarTabelaVendas();
            carregarTabelaProdutos();
            atualizarDashboard();

            mostrarNotificacao('Venda registada com sucesso!', 'success');
        } else {
            mostrarNotificacao('Stock insuficiente!', 'danger');
        }
    }
}

function carregarTabelaVendas() {
    let html = '';
    if (vendas.length === 0) {
        html = '<tr><td colspan="7" class="text-center text-muted">Nenhuma venda registada</td></tr>';
    } else {
        vendas.forEach(v => {
            html += `
                <tr>
                    <td><strong>${v.idVenda}</strong></td>
                    <td>${v.cliente}</td>
                    <td>${v.medicamento}</td>
                    <td>${v.quantidade}</td>
                    <td><strong>€${parseFloat(v.valorTotal).toFixed(2)}</strong></td>
                    <td>${v.data}</td>
                    <td>
                        <button class="btn btn-sm btn-danger" onclick="deletarVenda(${v.id})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
    }
    document.getElementById('corpoVendas').innerHTML = html;
}

function deletarVenda(id) {
    if (confirm('Tem a certeza que deseja eliminar esta venda?')) {
        vendas = vendas.filter(v => v.id !== id);
        localStorage.setItem('vendas', JSON.stringify(vendas));
        carregarTabelaVendas();
        atualizarDashboard();
        mostrarNotificacao('Venda eliminada!', 'danger');
    }
}

// ============ CLIENTES ============
function adicionarCliente() {
    const nome = document.getElementById('nomeCliente').value;
    const email = document.getElementById('emailCliente').value;
    const telefone = document.getElementById('telefoneCliente').value;

    if (nome && email && telefone) {
        const cliente = {
            id: Date.now(),
            nome,
            email,
            telefone,
            dataRegisto: new Date().toLocaleDateString('pt-PT'),
            totalGasto: 0
        };

        clientes.push(cliente);
        localStorage.setItem('clientes', JSON.stringify(clientes));

        document.getElementById('formCliente').reset();
        bootstrap.Modal.getInstance(document.getElementById('modalCliente')).hide();

        carregarTabelaClientes();
        atualizarDashboard();
        mostrarNotificacao('Cliente adicionado com sucesso!', 'success');
    }
}

function carregarTabelaClientes() {
    let html = '';
    if (clientes.length === 0) {
        html = '<tr><td colspan="6" class="text-center text-muted">Nenhum cliente registado</td></tr>';
    } else {
        clientes.forEach(c => {
            html += `
                <tr>
                    <td><strong>${c.nome}</strong></td>
                    <td>${c.email}</td>
                    <td>${c.telefone}</td>
                    <td>${c.dataRegisto}</td>
                    <td>€${c.totalGasto.toFixed(2)}</td>
                    <td>
                        <button class="btn btn-sm btn-danger" onclick="deletarCliente(${c.id})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
    }
    document.getElementById('corpoClientes').innerHTML = html;
}

function deletarCliente(id) {
    if (confirm('Tem a certeza que deseja eliminar este cliente?')) {
        clientes = clientes.filter(c => c.id !== id);
        localStorage.setItem('clientes', JSON.stringify(clientes));
        carregarTabelaClientes();
        atualizarDashboard();
        mostrarNotificacao('Cliente eliminado!', 'danger');
    }
}

// ============ FORNECEDORES ============
function adicionarFornecedor() {
    const empresa = document.getElementById('empresa').value;
    const contacto = document.getElementById('contacto').value;
    const email = document.getElementById('emailFornecedor').value;
    const telefone = document.getElementById('telefoneFornecedor').value;

    if (empresa && contacto && email && telefone) {
        const fornecedor = {
            id: Date.now(),
            empresa,
            contacto,
            email,
            telefone,
            dataRegisto: new Date().toLocaleDateString('pt-PT')
        };

        fornecedores.push(fornecedor);
        localStorage.setItem('fornecedores', JSON.stringify(fornecedores));

        document.getElementById('formFornecedor').reset();
        bootstrap.Modal.getInstance(document.getElementById('modalFornecedor')).hide();

        carregarTabelaFornecedores();
        mostrarNotificacao('Fornecedor adicionado com sucesso!', 'success');
    }
}

function carregarTabelaFornecedores() {
    let html = '';
    if (fornecedores.length === 0) {
        html = '<tr><td colspan="5" class="text-center text-muted">Nenhum fornecedor registado</td></tr>';
    } else {
        fornecedores.forEach(f => {
            html += `
                <tr>
                    <td><strong>${f.empresa}</strong></td>
                    <td>${f.contacto}</td>
                    <td>${f.email}</td>
                    <td>${f.telefone}</td>
                    <td>
                        <button class="btn btn-sm btn-danger" onclick="deletarFornecedor(${f.id})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
    }
    document.getElementById('corpoFornecedores').innerHTML = html;
}

function deletarFornecedor(id) {
    if (confirm('Tem a certeza que deseja eliminar este fornecedor?')) {
        fornecedores = fornecedores.filter(f => f.id !== id);
        localStorage.setItem('fornecedores', JSON.stringify(fornecedores));
        carregarTabelaFornecedores();
        mostrarNotificacao('Fornecedor eliminado!', 'danger');
    }
}

// ============ RELATÓRIOS ============
function gerarRelatorio() {
    const dataInicio = document.getElementById('dataInicio').value;
    const dataFim = document.getElementById('dataFim').value;

    if (!dataInicio || !dataFim) {
        mostrarNotificacao('Selecione ambas as datas!', 'warning');
        return;
    }

    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);

    let vendasPeriodo = vendas.filter(v => {
        const data = new Date(v.data.split('/').reverse().join('-'));
        return data >= inicio && data <= fim;
    });

    let totalVendas = 0;
    let totalProdutos = 0;
    let produtosVendidos = {};

    vendasPeriodo.forEach(v => {
        totalVendas += parseFloat(v.valorTotal);
        totalProdutos += v.quantidade;
        if (produtosVendidos[v.medicamento]) {
            produtosVendidos[v.medicamento] += v.quantidade;
        } else {
            produtosVendidos[v.medicamento] = v.quantidade;
        }
    });

    // Resumo
    let resumoHtml = `
        <table class="table">
            <tr>
                <td><strong>Total de Vendas:</strong></td>
                <td><strong>€${totalVendas.toFixed(2)}</strong></td>
            </tr>
            <tr>
                <td><strong>Produtos Vendidos:</strong></td>
                <td><strong>${totalProdutos} unidades</strong></td>
            </tr>
            <tr>
                <td><strong>Número de Transações:</strong></td>
                <td><strong>${vendasPeriodo.length}</strong></td>
            </tr>
        </table>
    `;
    document.getElementById('resumoRelatorio').innerHTML = resumoHtml;

    // Detalhes
    let detalhesHtml = `
        <table class="table table-striped">
            <thead class="table-dark">
                <tr>
                    <th>Medicamento</th>
                    <th>Quantidade Vendida</th>
                    <th>Receita</th>
                </tr>
            </thead>
            <tbody>
    `;

    Object.keys(produtosVendidos).forEach(med => {
        const vendidosMed = vendasPeriodo.filter(v => v.medicamento === med);
        let receitaMed = 0;
        vendidosMed.forEach(v => receitaMed += parseFloat(v.valorTotal));
        
        detalhesHtml += `
            <tr>
                <td>${med}</td>
                <td>${produtosVendidos[med]}</td>
                <td>€${receitaMed.toFixed(2)}</td>
            </tr>
        `;
    });

    detalhesHtml += '</tbody></table>';
    document.getElementById('detalhesRelatorio').innerHTML = detalhesHtml;

    mostrarNotificacao('Relatório gerado com sucesso!', 'success');
}

// ============ NOTIFICAÇÕES ============
function mostrarNotificacao(mensagem, tipo = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${tipo} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 80px; right: 20px; z-index: 9999; min-width: 300px;';
    alertDiv.innerHTML = `
        ${mensagem}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 4000);
}