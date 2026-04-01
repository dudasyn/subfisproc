const searchView = {
    async render(container, user) {
        container.innerHTML = `
            <div class="view-section">
                <div class="card mb-1">
                    <div class="card-header border-bottom">
                        <h3>Listar Processos</h3>
                        <p class="text-secondary">Filtre processos por número ou por situação nos setores.</p>
                    </div>
                    <div class="card-body">
                        <div class="grid-form" style="gap:1rem; align-items: end;">
                            <div class="form-group col-span-2">
                                <label>Número do Processo</label>
                                <div class="input-group" style="margin-bottom:0;">
                                    <i class="fa-solid fa-magnifying-glass" style="left: 1.2rem;"></i>
                                    <input type="text" id="search-input" placeholder="Ex: 12345/2026" style="padding-left: 3rem;">
                                </div>
                            </div>
                            <div class="form-group col-span-1">
                                <label>Filtrar por Setor</label>
                                <select id="filter-sector">
                                    <option value="">Todos os setores...</option>
                                </select>
                            </div>
                            <div class="form-group col-span-1">
                                <label>Tipo de Filtro</label>
                                <select id="filter-mode">
                                    <option value="current">Onde está agora</option>
                                    <option value="history">Já passou por lá (Histórico)</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <button id="btn-search-proc" class="btn-primary" style="height: 48px; width: 100%;">
                                    <span>Filtrar</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="recent-section" class="card mb-2">
                    <div class="card-header border-bottom">
                        <h4>Últimos Processos Movimentados</h4>
                    </div>
                    <div class="card-body p-0">
                        <div class="recent-list" id="recent-processes-list">
                            <div class="p-3 text-center text-secondary">
                                <i class="fa-solid fa-spinner fa-spin"></i> Carregando processos...
                            </div>
                        </div>
                    </div>
                </div>

                <div id="search-list-section" class="card mb-2" style="display:none;">
                    <div class="card-header border-bottom flex-between">
                        <h4>Resultados da Busca</h4>
                        <button class="btn-secondary" id="btn-back-recent" style="padding: 0.4rem 0.8rem;">
                            <i class="fa-solid fa-arrow-left"></i> Voltar
                        </button>
                    </div>
                    <div class="card-body p-0">
                        <div class="recent-list" id="search-processes-list">
                        </div>
                    </div>
                </div>

                <div id="search-results" style="display:none;">
                    <div class="flex-between mb-1">
                        <button class="btn-secondary" id="btn-clear-search">
                            <i class="fa-solid fa-arrow-left"></i> Voltar para recentes
                        </button>
                        <button class="btn-secondary" id="btn-delete-proc" style="background:#fee2e2; color:#b91c1c; border-color:#fecaca; display:none;">
                            <i class="fa-solid fa-trash"></i> Excluir Processo
                        </button>
                    </div>
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
                                </div>
                                <div id="res-attachment-info" class="mt-2" style="display:none; padding: 0.8rem; border-radius: var(--radius-md); background: #eff6ff; border: 1px solid #bfdbfe;">
                                    <i class="fa-solid fa-link text-primary mr-1"></i>
                                    <span id="res-attachment-text" style="font-size: 0.9rem; font-weight: 500; color: #1e40af;">-</span>
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
                    <button class="btn-secondary" id="btn-clear-empty" style="position:absolute; top:1rem; left:1rem;">
                        <i class="fa-solid fa-arrow-left"></i> Voltar
                    </button>
                    <i class="fa-solid fa-folder-open text-secondary mb-2" style="font-size: 3rem; opacity: 0.3;"></i>
                    <h3>Processo não encontrado</h3>
                    <p class="text-secondary">Verifique o número digitado e tente novamente.</p>
                </div>
            </div>

            <style>
                .recent-list { overflow: hidden; }
                .recent-item {
                    padding: 1rem 1.5rem;
                    border-bottom: 1px solid var(--border-color);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    cursor: pointer;
                    transition: var(--transition);
                }
                .recent-item:last-child { border-bottom: none; }
                .recent-item:hover { background: var(--primary-light); }
                .recent-info h5 { margin: 0; font-size: 1rem; color: var(--text-primary); }
                .recent-info p { margin: 0; font-size: 0.85rem; color: var(--text-secondary); }
                .recent-status { text-align: right; }

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
        const filterSector = document.getElementById('filter-sector');
        const filterMode = document.getElementById('filter-mode');
        const resultsDiv = document.getElementById('search-results');
        const emptyDiv = document.getElementById('search-empty');
        const recentSection = document.getElementById('recent-section');
        const recentList = document.getElementById('recent-processes-list');
        const searchListSection = document.getElementById('search-list-section');
        const searchList = document.getElementById('search-processes-list');
        const btnBackRecent = document.getElementById('btn-back-recent');
        const btnClearSearch = document.getElementById('btn-clear-search');
        const btnClearEmpty = document.getElementById('btn-clear-empty');
        const btnDeleteProc = document.getElementById('btn-delete-proc');
        let currentProcessId = null;

        // Load Sectors for filter
        const sectors = await Api.sectors.list();
        filterSector.innerHTML += sectors.map(s => `<option value="${s.id}">${s.name}</option>`).join('');

        const loadRecent = async () => {
            try {
                const latest = await Api.movements.listLatest();
                if (latest.length === 0) {
                    recentList.innerHTML = '<div class="p-4 text-center text-secondary">Nenhum processo movimentado recentemente.</div>';
                    return;
                }

                recentList.innerHTML = latest.map(m => `
                    <div class="recent-item" data-number="${m.process_number}">
                        <div class="recent-info">
                            <h5>${m.process_number} ${m.parent_id ? '<i class="fa-solid fa-paperclip" title="Apenso" style="font-size:0.8rem; color:var(--text-secondary);"></i>' : (m.attachments_count > 0 ? '<i class="fa-solid fa-link" title="Possui apensos" style="font-size:0.8rem; color:var(--primary-color);"></i>' : '')}</h5>
                            <p>${m.subject}</p>
                            ${m.parent_id ? `<small style="color:var(--text-secondary); font-size:0.7rem;">Apenso ao ${m.parent_process_number}</small>` : (m.attachments_count > 0 ? `<small style="color:var(--primary-color); font-size:0.7rem;">Possui ${m.attachments_count} apenso(s)</small>` : '')}
                        </div>
                        <div class="recent-status">
                            <span class="badge-${m.action.toLowerCase()}">${m.action === 'ENTRADA' ? 'ENTRADA (Tramitação)' : m.action}</span>
                            <p style="font-size: 0.7rem; margin-top: 4px;">${window.app.formatDate(m.movement_date)}</p>
                        </div>
                    </div>
                `).join('');

                document.querySelectorAll('.recent-item').forEach(item => {
                    item.addEventListener('click', () => {
                        inputSearch.value = item.dataset.number;
                        loadProcessDetails(item.dataset.number);
                    });
                });
            } catch (err) {
                recentList.innerHTML = '<div class="p-4 text-center text-danger">Erro ao carregar processos recentes.</div>';
            }
        };

        const renderProcessItem = (m) => `
            <div class="recent-item search-result-item" data-number="${m.process_number}">
                <div class="recent-info">
                    <h5>${m.process_number} ${m.parent_id ? '<i class="fa-solid fa-paperclip" title="Apenso" style="font-size:0.8rem; color:var(--text-secondary);"></i>' : (m.attachments_count > 0 ? '<i class="fa-solid fa-link" title="Possui apensos" style="font-size:0.8rem; color:var(--primary-color);"></i>' : '')}</h5>
                    <p>${m.subject || 'Sem assunto'}</p>
                    ${m.parent_id ? `<small style="color:var(--text-secondary); font-size:0.7rem;">Apenso ao ${m.parent_process_number}</small>` : (m.attachments_count > 0 ? `<small style="color:var(--primary-color); font-size:0.7rem;">Possui ${m.attachments_count} apenso(s)</small>` : '')}
                </div>
                <div class="recent-status">
                    <span class="badge-${(m.action || 'NOVO').toLowerCase()}">${m.action === 'ENTRADA' ? 'ENTRADA (Tramitação)' : (m.action || 'NOVO')}</span>
                    <p style="font-size: 0.7rem; margin-top: 4px;">${window.app.formatDate(m.movement_date)}</p>
                </div>
            </div>
        `;

        const doSearch = async () => {
            const query = inputSearch.value.trim();
            const sectorId = filterSector.value;
            const onlyCurrent = filterMode.value === 'current';
            
            if (!query && !sectorId) {
                window.app.toast('Digite um número ou selecione um setor', 'warning');
                return;
            }

            btnSearch.disabled = true;
            btnSearch.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

            try {
                const processes = await Api.movements.search(query, sectorId, onlyCurrent);
                
                recentSection.style.display = 'none';
                resultsDiv.style.display = 'none';
                
                if (processes && processes.length > 0) {
                    searchList.innerHTML = processes.map(renderProcessItem).join('');
                    
                    document.querySelectorAll('.search-result-item').forEach(item => {
                        item.addEventListener('click', () => {
                            inputSearch.value = item.dataset.number;
                            loadProcessDetails(item.dataset.number);
                        });
                    });
                    
                    searchListSection.style.display = 'block';
                    emptyDiv.style.display = 'none';
                } else {
                    currentProcessId = null;
                    searchListSection.style.display = 'none';
                    emptyDiv.style.display = 'block';
                }
            } catch (err) {
                window.app.toast('Erro ao buscar processos', 'error');
            } finally {
                btnSearch.disabled = false;
                btnSearch.innerHTML = '<span>Filtrar</span>';
            }
        };

        const loadProcessDetails = async (number) => {
            try {
                const data = await Api.movements.getByNumber(number);
                if (data && data.exists) {
                    const process = data.process;
                    // Load history
                    const history = await Api.movements.listByProcess(process.id);
                    
                    // Fill Details
                    document.getElementById('res-assunto').textContent = process.subject || 'Processo Importado';
                    document.getElementById('res-requerente').textContent = process.requester || 'Importação de Dados';
                    document.getElementById('res-doc').textContent = process.document_number || 'Não informado';
                    document.getElementById('res-obs').textContent = process.observations || 'Sem observações';
                    
                    // Current Status
                    const lastMov = history[0];
                    if (lastMov) {
                        const setorName = lastMov.destination_sector || 'Não informado';
                        document.getElementById('res-status').textContent = lastMov.action === 'ENTRADA' ? 'Em posse de ' + setorName : 'Enviado para ' + setorName;
                        document.getElementById('res-sector-now').textContent = setorName;
                    } else {
                        document.getElementById('res-status').textContent = 'Sem movimentação';
                        document.getElementById('res-sector-now').textContent = '-';
                    }

                    // Attachment Info in Details
                    const attachDiv = document.getElementById('res-attachment-info');
                    const attachText = document.getElementById('res-attachment-text');
                    if (process.parent_id) {
                        attachDiv.style.display = 'block';
                        attachText.textContent = `Este processo está APENSADO ao processo ${process.parent_process_number}`;
                    } else if (process.attachments_count > 0) {
                        attachDiv.style.display = 'block';
                        attachText.textContent = `Este processo possui ${process.attachments_count} processo(s) apensado(s) a ele.`;
                    } else {
                        attachDiv.style.display = 'none';
                    }

                    // Fill History table
                    const tbody = document.getElementById('history-body');
                    tbody.innerHTML = history.map(m => `
                        <tr>
                            <td>${window.app.formatDate(m.movement_date)}</td>
                            <td><span class="badge-${m.action.toLowerCase()}">${m.action === 'ENTRADA' ? 'ENTRADA (Tramitação)' : m.action}</span></td>
                            <td>${m.destination_sector}</td>
                            <td>${m.responsible_name || '<span style="color:var(--text-secondary);font-style:italic;">Não definido</span>'}</td>
                        </tr>
                    `).join('');

                    resultsDiv.style.display = 'block';
                    recentSection.style.display = 'none';
                    searchListSection.style.display = 'none';
                    emptyDiv.style.display = 'none';

                    currentProcessId = process.id;
                    if (user.role === 'Admin' || user.role === 'Gestor') {
                        btnDeleteProc.style.display = 'block';
                    }
                }
            } catch(e) {
                window.app.toast('Erro ao carregar detalhes', 'error');
            }
        };

        const resetView = () => {
            inputSearch.value = '';
            resultsDiv.style.display = 'none';
            emptyDiv.style.display = 'none';
            recentSection.style.display = 'block';
            loadRecent();
        };

        btnSearch.addEventListener('click', doSearch);
        inputSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') doSearch();
        });
        
        btnDeleteProc.addEventListener('click', async () => {
            if (!currentProcessId) return;
            if (!confirm('ATENÇÃO: Deseja realmente excluir este processo e TODO o seu histórico de movimentações? Esta ação não pode ser desfeita.')) return;

            try {
                btnDeleteProc.disabled = true;
                btnDeleteProc.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Excluindo...';
                
                await Api.processes.delete(currentProcessId);
                window.app.toast('Processo e histórico excluídos com sucesso!');
                resetView();
            } catch (err) {
                window.app.toast(err.message, 'error');
                btnDeleteProc.disabled = false;
                btnDeleteProc.innerHTML = '<i class="fa-solid fa-trash"></i> Excluir Processo';
            }
        });

        btnClearSearch.addEventListener('click', resetView);
        btnClearEmpty.addEventListener('click', resetView);
        if(btnBackRecent) btnBackRecent.addEventListener('click', resetView);

        // Initial load
        loadRecent();
    }
};

window.searchView = searchView;
