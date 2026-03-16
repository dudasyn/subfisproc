const searchView = {
    async render(container, user) {
        container.innerHTML = `
            <div class="view-section">
                <div class="card mb-2">
                    <div class="card-header border-bottom">
                        <h3>Buscar Processo</h3>
                        <p class="text-secondary">Acompanhe a localização e o histórico completo de qualquer processo.</p>
                    </div>
                    <div class="card-body">
                        <div class="grid-form" style="align-items: end;">
                            <div class="form-group col-span-3">
                                <label>Número do Processo</label>
                                <div class="input-group" style="margin-bottom:0;">
                                    <i class="fa-solid fa-magnifying-glass"></i>
                                    <input type="text" id="search-input" placeholder="Ex: 12345/2026" style="border:none; padding-left:0;">
                                </div>
                            </div>
                            <div class="form-group">
                                <button id="btn-search-proc" class="btn-primary" style="height: 48px;">
                                    <span>Buscar</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="search-results" style="display:none;">
                    <div class="grid-form mb-2">
                        <div class="card col-span-2">
                            <div class="card-header border-bottom">
                                <h4>Informações do Processo</h4>
                            </div>
                            <div class="card-body">
                                <div class="details-grid">
                                    <div class="detail-item">
                                        <span class="label">Assunto:</span>
                                        <span class="value" id="res-assunto">-</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="label">Requerente:</span>
                                        <span class="value" id="res-requerente">-</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="label">Documento:</span>
                                        <span class="value" id="res-doc">-</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="label">Status Atual:</span>
                                        <span class="value" id="res-status">-</span>
                                    </div>
                                </div>
                                <div class="mt-2">
                                    <span class="label">Observações:</span>
                                    <p class="text-secondary mt-1" id="res-obs">-</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="card">
                            <div class="card-header border-bottom">
                                <h4>Localização Atual</h4>
                            </div>
                            <div class="card-body text-center py-3">
                                <div id="status-badge" class="status-indicator">
                                    <i class="fa-solid fa-location-dot"></i>
                                    <h2 id="res-sector-now">...</h2>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header border-bottom flex-between">
                            <h4>Histórico de Movimentações</h4>
                        </div>
                        <div class="table-responsive">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Data</th>
                                        <th>Ação</th>
                                        <th>Destino / Local</th>
                                        <th>Responsável</th>
                                    </tr>
                                </thead>
                                <tbody id="history-body">
                                    <!-- History rows will be injected here -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div id="search-empty" class="card text-center py-5" style="display:none;">
                    <i class="fa-solid fa-folder-open text-secondary mb-2" style="font-size: 3rem; opacity: 0.3;"></i>
                    <h3>Processo não encontrado</h3>
                    <p class="text-secondary">Verifique o número digitado e tente novamente.</p>
                </div>
            </div>

            <style>
                .details-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                }
                .detail-item {
                    display: flex;
                    flex-direction: column;
                }
                .detail-item .label {
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    color: var(--text-secondary);
                    font-weight: 600;
                    margin-bottom: 0.2rem;
                }
                .detail-item .value {
                    font-weight: 500;
                    color: var(--text-primary);
                }
                .status-indicator {
                    padding: 2rem;
                    border-radius: var(--radius-lg);
                    background: var(--bg-soft);
                    border: 1px solid var(--border-color);
                }
                .status-indicator i {
                    font-size: 2.5rem;
                    color: var(--primary-color);
                    margin-bottom: 1rem;
                }
                .badge-entrada {
                    background: rgba(16, 185, 129, 0.1);
                    color: #10b981;
                    padding: 0.2rem 0.6rem;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    font-weight: 600;
                }
                .badge-saida {
                    background: rgba(245, 158, 11, 0.1);
                    color: #f59e0b;
                    padding: 0.2rem 0.6rem;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    font-weight: 600;
                }
            </style>
        `;

        const btnSearch = document.getElementById('btn-search-proc');
        const inputSearch = document.getElementById('search-input');
        const resultsDiv = document.getElementById('search-results');
        const emptyDiv = document.getElementById('search-empty');

        const doSearch = async () => {
            const number = inputSearch.value.trim();
            if (!number) return;

            btnSearch.disabled = true;
            btnSearch.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

            try {
                const process = await Api.movements.getByNumber(number);
                if (process) {
                    // Load history
                    const history = await Api.movements.listByProcess(process.id);
                    
                    // Fill Details
                    document.getElementById('res-assunto').textContent = process.subject;
                    document.getElementById('res-requerente').textContent = process.requester;
                    document.getElementById('res-doc').textContent = process.document_number || 'Não informado';
                    document.getElementById('res-obs').textContent = process.observations || 'Sem observações';
                    
                    // Current Status
                    const lastMov = history[0];
                    if (lastMov) {
                        document.getElementById('res-status').textContent = lastMov.action === 'ENTRADA' ? 'Em posse da SUBFIS' : 'Enviado para ' + lastMov.destination_sector;
                        document.getElementById('res-sector-now').textContent = lastMov.action === 'ENTRADA' ? 'SUBFIS' : lastMov.destination_sector;
                    }

                    // Fill History table
                    const tbody = document.getElementById('history-body');
                    tbody.innerHTML = history.map(m => `
                        <tr>
                            <td>${new Date(m.movement_date + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                            <td><span class="badge-${m.action.toLowerCase()}">${m.action}</span></td>
                            <td>${m.destination_sector}</td>
                            <td>${m.user_name}</td>
                        </tr>
                    `).join('');

                    resultsDiv.style.display = 'block';
                    emptyDiv.style.display = 'none';
                } else {
                    resultsDiv.style.display = 'none';
                    emptyDiv.style.display = 'block';
                }
            } catch (err) {
                window.app.toast('Erro ao buscar processo', 'error');
            } finally {
                btnSearch.disabled = false;
                btnSearch.innerHTML = '<span>Buscar</span>';
            }
        };

        btnSearch.addEventListener('click', doSearch);
        inputSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') doSearch();
        });
    }
};

window.searchView = searchView;
