const searchView = {
    async render(container, user, viewParts = []) {
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
                        <div style="display:flex; gap:0.5rem;">
                            <button class="btn-secondary" id="btn-attach-proc" style="display:none;">
                                <i class="fa-solid fa-link"></i> Apensar Processo
                            </button>
                            <button class="btn-secondary" id="btn-delete-proc" style="background:#fee2e2; color:#b91c1c; border-color:#fecaca; display:none;">
                                <i class="fa-solid fa-trash"></i> Excluir Processo
                            </button>
                        </div>
                    </div>
                    <div class="grid-form mb-2">
                        <div class="card col-span-2">
                            <div class="card-header border-bottom flex-between">
                                <h4>Informações do Processo</h4>
                                <div id="res-actions" style="display:flex; gap:0.5rem;">
                                    <button class="btn-secondary" id="btn-edit-proc" style="display:none; padding: 0.4rem 0.8rem; font-size: 0.8rem;">
                                        <i class="fa-solid fa-pen-to-square"></i> Editar
                                    </button>
                                    <div id="edit-actions" style="display:none; gap:0.5rem;">
                                        <button class="btn-primary" id="btn-save-proc" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; background: #10b981; border-color: #10b981;">
                                            <i class="fa-solid fa-check"></i> Salvar
                                        </button>
                                        <button class="btn-secondary" id="btn-cancel-edit" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;">
                                            <i class="fa-solid fa-xmark"></i> Cancelar
                                        </button>
                                    </div>
                                </div>
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
                                    <div class="flex-between">
                                        <div>
                                            <i class="fa-solid fa-paperclip text-primary mr-1"></i>
                                            <span id="res-attachment-text" style="font-size: 0.9rem; font-weight: 500; color: #1e40af;">-</span>
                                        </div>
                                        <button class="btn-secondary" id="btn-detach-main" style="padding: 0.2rem 0.5rem; font-size: 0.75rem; background:white; display:none;">
                                            <i class="fa-solid fa-link-slash"></i> Desapensar
                                        </button>
                                    </div>
                                </div>
                                <div id="res-children-list" class="mt-2" style="display:none;">
                                    <span class="label">Processos Apensados:</span>
                                    <div id="children-items-container" class="mt-1" style="display:flex; flex-wrap:wrap; gap:0.5rem;">
                                        <!-- Children pills here -->
                                    </div>
                                </div>
                                <div class="mt-2">
                                    <span class="label">Observações:</span>
                                    <p class="text-secondary mt-1" id="res-obs">-</p>
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
                                        <th>Auditor Responsável</th>
                                        <th>Colaborador</th>
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
                .badge-action {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.3rem;
                    padding: 0.25rem 0.6rem;
                    border-radius: 4px;
                    font-size: 0.7rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    cursor: pointer;
                    transition: var(--transition);
                    background: var(--bg-secondary);
                    color: var(--text-secondary);
                    border: 1px solid var(--border-color);
                }
                .badge-action:hover {
                    background: var(--primary-color);
                    color: white;
                    border-color: var(--primary-color);
                }
                .badge-action i { font-size: 0.75rem; }
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
        const btnAttachProc = document.getElementById('btn-attach-proc');
        const btnDetachMain = document.getElementById('btn-detach-main');
        
        const btnEditProc = document.getElementById('btn-edit-proc');
        const btnSaveProc = document.getElementById('btn-save-proc');
        const btnCancelEdit = document.getElementById('btn-cancel-edit');
        const editActions = document.getElementById('edit-actions');
        
        let currentProcessId = null;
        let isEditing = false;
        let originalData = {};

        // Load Sectors for filter
        const sectors = await Api.sectors.list();
        filterSector.innerHTML += sectors.map(s => `<option value="${s.id}">${s.alias || s.name}</option>`).join('');

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
                            <div style="display:flex; gap:0.5rem; margin-top:0.3rem;">
                                <span class="badge-action btn-detail" data-number="${m.process_number}"><i class="fa-solid fa-eye"></i> Detalhar</span>
                                <span class="badge-action btn-move-fast" data-number="${m.process_number}"><i class="fa-solid fa-share-from-square"></i> Tramitar</span>
                            </div>
                        </div>
                        <div class="recent-status" style="min-width: 180px;">
                            <span class="badge-${m.action.toLowerCase()}">${m.action === 'ENTRADA' ? 'ENTRADA (Tramitação)' : m.action}</span>
                            <p style="font-size: 0.75rem; margin-top: 6px; font-weight: 500; color: var(--text-primary);">${window.app.formatDate(m.movement_date)}</p>
                        </div>
                    </div>
                `).join('');

                document.querySelectorAll('.btn-detail').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const num = btn.dataset.number;
                        inputSearch.value = num;
                        loadProcessDetails(num);
                    });
                });

                document.querySelectorAll('.btn-move-fast').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        window.location.hash = `#movements/${btn.dataset.number}`;
                    });
                });

                // Maintain click on the item itself as "Detail"
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
                    <div style="display:flex; gap:0.5rem; margin-top:0.3rem;">
                        <span class="badge-action btn-detail" data-number="${m.process_number}"><i class="fa-solid fa-eye"></i> Detalhar</span>
                        <span class="badge-action btn-move-fast" data-number="${m.process_number}"><i class="fa-solid fa-share-from-square"></i> Tramitar</span>
                    </div>
                </div>
                <div class="recent-status" style="min-width: 180px;">
                    <span class="badge-${(m.action || 'NOVO').toLowerCase()}">${m.action === 'ENTRADA' ? 'ENTRADA (Tramitação)' : (m.action || 'NOVO')}</span>
                    <p style="font-size: 0.75rem; margin-top: 6px; font-weight: 500; color: var(--text-primary);">${window.app.formatDate(m.movement_date)}</p>
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
                    
                    searchList.querySelectorAll('.btn-detail').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            loadProcessDetails(btn.dataset.number);
                        });
                    });

                    searchList.querySelectorAll('.btn-move-fast').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            window.location.hash = `#movements/${btn.dataset.number}`;
                        });
                    });

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
                    } else {
                        document.getElementById('res-status').textContent = 'Sem movimentação';
                    }

                    // Attachment Info in Details
                    const attachDiv = document.getElementById('res-attachment-info');
                    const attachText = document.getElementById('res-attachment-text');
                    const childrenDiv = document.getElementById('res-children-list');
                    const childrenContainer = document.getElementById('children-items-container');
                    
                    if (process.parent_id) {
                        attachDiv.style.display = 'block';
                        attachText.textContent = `Este processo está APENSADO ao processo ${process.parent_process_number}`;
                        btnDetachMain.style.display = 'block';
                        childrenDiv.style.display = 'none';
                        btnAttachProc.style.display = 'none'; // Cannot attach if already a child
                    } else if (process.attachments_count > 0) {
                        attachDiv.style.display = 'none';
                        childrenDiv.style.display = 'block';
                        btnAttachProc.style.display = 'block';
                        
                        childrenContainer.innerHTML = process.attached_processes.map(childNumber => `
                            <div class="attachment-pill" style="cursor:pointer;" onclick="searchView._autoSearch('${childNumber}')">
                                <i class="fa-solid fa-paperclip"></i>
                                <span>${childNumber}</span>
                            </div>
                        `).join('');
                    } else {
                        attachDiv.style.display = 'none';
                        childrenDiv.style.display = 'none';
                        btnAttachProc.style.display = 'block';
                    }

                    // Fill History table
                    const tbody = document.getElementById('history-body');
                    tbody.innerHTML = history.length ? history.map(h => `
                        <tr>
                            <td>${window.app.formatDate(h.movement_date)}</td>
                            <td><span class="badge-${h.action.toLowerCase()}">${h.action === 'ENTRADA' ? 'ENTRADA (Tramitação)' : h.action}</span></td>
                            <td>${h.destination_sector}</td>
                            <td>${h.responsible_name || '-'}</td>
                            <td>${h.user_name || '-'}</td>
                        </tr>
                    `).join('') : '<tr><td colspan="5" class="text-center">Nenhuma movimentação encontrada</td></tr>';

                    resultsDiv.style.display = 'block';
                    recentSection.style.display = 'none';
                    searchListSection.style.display = 'none';
                    emptyDiv.style.display = 'none';

                    currentProcessId = process.id;
                    originalData = {
                        subject: process.subject || '',
                        requester: process.requester || '',
                        document_number: process.document_number || '',
                        observations: process.observations || ''
                    };

                    if (user.role === 'Admin' || user.role === 'Gestor' || user.role === 'Secretaria' || user.role === 'Assistente Operacional') {
                        btnEditProc.style.display = 'block';
                    }
                    if (user.role === 'Admin' || user.role === 'Gestor') {
                        btnDeleteProc.style.display = 'block';
                    }
                }
            } catch(e) {
                window.app.toast('Erro ao carregar detalhes', 'error');
            }
        };

        const toggleEditMode = (editing) => {
            isEditing = editing;
            const elements = {
                assunto: document.getElementById('res-assunto'),
                requerente: document.getElementById('res-requerente'),
                doc: document.getElementById('res-doc'),
                obs: document.getElementById('res-obs')
            };

            if (editing) {
                elements.assunto.innerHTML = `<input type="text" id="edit-assunto" class="form-control-sm" style="width:100%" value="${originalData.subject}">`;
                elements.requerente.innerHTML = `<input type="text" id="edit-requerente" class="form-control-sm" style="width:100%" value="${originalData.requester}">`;
                elements.doc.innerHTML = `<input type="text" id="edit-doc" class="form-control-sm" style="width:100%" value="${originalData.document_number}">`;
                elements.obs.innerHTML = `<textarea id="edit-obs" class="form-control-sm" style="width:100%; min-height:80px;">${originalData.observations}</textarea>`;
                
                btnEditProc.style.display = 'none';
                editActions.style.display = 'flex';
                btnDeleteProc.style.display = 'none';
                btnAttachProc.style.display = 'none';
            } else {
                elements.assunto.textContent = originalData.subject || 'Processo Importado';
                elements.requerente.textContent = originalData.requester || 'Importação de Dados';
                elements.doc.textContent = originalData.document_number || 'Não informado';
                elements.obs.textContent = originalData.observations || 'Sem observações';
                
                btnEditProc.style.display = 'block';
                editActions.style.display = 'none';
                if (user.role === 'Admin' || user.role === 'Gestor') {
                    btnDeleteProc.style.display = 'block';
                }
                btnAttachProc.style.display = 'block';
            }
        };

        btnEditProc.addEventListener('click', () => toggleEditMode(true));
        btnCancelEdit.addEventListener('click', () => toggleEditMode(false));

        btnSaveProc.addEventListener('click', async () => {
            const updatedData = {
                id: currentProcessId,
                subject: document.getElementById('edit-assunto').value.trim(),
                requester: document.getElementById('edit-requerente').value.trim(),
                document_number: document.getElementById('edit-doc').value.trim(),
                observations: document.getElementById('edit-obs').value.trim()
            };

            try {
                btnSaveProc.disabled = true;
                btnSaveProc.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                
                await Api.processes.update(updatedData);
                window.app.toast('Informações atualizadas com sucesso!');
                
                // Update original data and exit edit mode
                originalData = { ...updatedData };
                toggleEditMode(false);
            } catch (err) {
                window.app.toast(err.message, 'error');
            } finally {
                btnSaveProc.disabled = false;
                btnSaveProc.innerHTML = '<i class="fa-solid fa-check"></i> Salvar';
            }
        });

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

        btnAttachProc.addEventListener('click', async () => {
            const childNumber = prompt('Digite o número do processo que deseja APENSAR a este:\n(O processo já deve estar cadastrado no sistema)');
            if (!childNumber) return;

            try {
                btnAttachProc.disabled = true;
                
                // Validação: O processo filho deve existir
                const check = await Api.movements.getByNumber(childNumber);
                if (!check || !check.exists) {
                    throw new Error('O processo informado não foi encontrado no sistema. Por favor, cadastre-o primeiro.');
                }
                
                if (check.process.id == currentProcessId) {
                    throw new Error('Um processo não pode ser apensado a si mesmo.');
                }

                await Api.processes.attach(currentProcessId, childNumber);
                window.app.toast('Processo apensado com sucesso!');
                loadProcessDetails(inputSearch.value);
            } catch (err) {
                window.app.toast(err.message, 'error');
            } finally {
                btnAttachProc.disabled = false;
            }
        });

        btnDetachMain.addEventListener('click', async () => {
            if (!confirm('Deseja desapensar este processo do seu processo pai?')) return;
            try {
                await Api.processes.detach(currentProcessId);
                window.app.toast('Processo desapensado com sucesso!');
                loadProcessDetails(inputSearch.value);
            } catch (err) {
                window.app.toast(err.message, 'error');
            }
        });

        btnClearSearch.addEventListener('click', resetView);
        btnClearEmpty.addEventListener('click', resetView);
        if(btnBackRecent) btnBackRecent.addEventListener('click', resetView);

        // Styling for pills
        const style = document.createElement('style');
        style.textContent = `
            .attachment-pill {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                background: #eff6ff;
                border: 1px solid #bfdbfe;
                padding: 0.3rem 0.8rem;
                border-radius: 20px;
                font-size: 0.85rem;
                color: #1e40af;
                font-weight: 500;
            }
            .btn-detach-child {
                border: none;
                background: none;
                color: #ef4444;
                cursor: pointer;
                padding: 0;
                display: flex;
                align-items: center;
                font-size: 1rem;
                margin-left: 0.3rem;
            }
            .attachment-pill:hover { background: #dbeafe; }
            
            #history-body td {
                padding: 1rem 0.75rem;
                vertical-align: middle;
            }
            #history-body tr {
                border-bottom: 1px solid #f1f5f9;
            }
            #history-body tr:last-child {
                border-bottom: none;
            }
        `;
        document.head.appendChild(style);

        // Initial load
        loadRecent();

        // Expose for external calls (e.g., from auditor drawer)
        this._autoSearch = (processNumber) => {
            inputSearch.value = processNumber;
            filterSector.value = '';
            // Single process lookup goes directly to detail view
            loadProcessDetails(processNumber);
        };

        // If navigated with a process number in hash (e.g. #search/009/001/2023)
        const preload = viewParts.slice(1).join('/');
        if (preload) {
            setTimeout(() => this._autoSearch(preload), 100);
        }
    }
};

window.searchView = searchView;
