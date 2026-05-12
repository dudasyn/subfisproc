const reportsView = {
    async render(container, user, params) {
        if (user.role !== 'Admin' && user.role !== 'Gestor') {
            container.innerHTML = `<div class="card"><div class="card-body text-center"><h3 class="text-secondary">Acesso Negado</h3><p>Apenas Gestores e Administradores têm acesso a esta área.</p></div></div>`;
            return;
        }

        const activeTab = params && params[1] ? params[1].toLowerCase() : null;

        if (!activeTab) {
            container.innerHTML = `
                <div class="view-section">
                    <div style="margin-bottom: 2.25rem;">
                        <h2 style="font-size: 1.6rem; font-weight: 800; color: var(--accent); margin: 0 0 0.35rem 0;">Relatórios e Estatísticas</h2>
                        <p style="color: var(--text-secondary); font-size: 0.95rem; margin: 0;">Selecione um dos módulos analíticos abaixo para auditar fluxos, gerar relatórios e exportar dados.</p>
                    </div>
                    
                    <div class="config-grid-cards" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem;">
                        
                        <!-- CARD 1: MOVIMENTACOES -->
                        <a href="#reports/movimentacoes" class="config-menu-card">
                            <div class="card h-100" style="transition: all 0.2s ease; cursor: pointer; border: 1px solid var(--border-color); border-radius: var(--radius-lg); overflow: hidden; height: 100%; background: #ffffff;">
                                <div class="card-body" style="padding: 1.75rem; display: flex; flex-direction: column; gap: 1.25rem;">
                                    <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(0, 114, 188, 0.08); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
                                        <i class="fa-solid fa-arrow-right-arrow-left"></i>
                                    </div>
                                    <div>
                                        <h3 style="font-size: 1.15rem; font-weight: 750; color: var(--accent); margin: 0 0 0.5rem 0; display: flex; align-items: center; justify-content: space-between;">
                                            Movimentações <i class="fa-solid fa-arrow-right" style="font-size: 0.85rem; opacity: 0; transform: translateX(-5px); transition: all 0.25s ease;"></i>
                                        </h3>
                                        <p style="color: var(--text-secondary); font-size: 0.88rem; line-height: 1.5; margin: 0;">Filtre entradas, saídas e trâmites por período e setor. Exporte relatórios em formato Excel (XLSX) ou PDF.</p>
                                    </div>
                                </div>
                            </div>
                        </a>

                        <!-- CARD 2: PARADOS -->
                        <a href="#reports/parados" class="config-menu-card">
                            <div class="card h-100" style="transition: all 0.2s ease; cursor: pointer; border: 1px solid var(--border-color); border-radius: var(--radius-lg); overflow: hidden; height: 100%; background: #ffffff;">
                                <div class="card-body" style="padding: 1.75rem; display: flex; flex-direction: column; gap: 1.25rem;">
                                    <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(239, 68, 68, 0.08); color: #dc2626; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
                                        <i class="fa-solid fa-hourglass-half"></i>
                                    </div>
                                    <div>
                                        <h3 style="font-size: 1.15rem; font-weight: 750; color: var(--accent); margin: 0 0 0.5rem 0; display: flex; align-items: center; justify-content: space-between;">
                                            Processos Parados <i class="fa-solid fa-arrow-right" style="font-size: 0.85rem; opacity: 0; transform: translateX(-5px); transition: all 0.25s ease;"></i>
                                        </h3>
                                        <p style="color: var(--text-secondary); font-size: 0.88rem; line-height: 1.5; margin: 0;">Identifique processos que estão retidos nos setores por mais dias do que o limite recomendado de fluxo.</p>
                                    </div>
                                </div>
                            </div>
                        </a>

                        <!-- CARD 3: SECTOR STATS -->
                        <a href="#reports/sector-stats" class="config-menu-card">
                            <div class="card h-100" style="transition: all 0.2s ease; cursor: pointer; border: 1px solid var(--border-color); border-radius: var(--radius-lg); overflow: hidden; height: 100%; background: #ffffff;">
                                <div class="card-body" style="padding: 1.75rem; display: flex; flex-direction: column; gap: 1.25rem;">
                                    <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(245, 158, 11, 0.08); color: #d97706; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
                                        <i class="fa-solid fa-chart-pie"></i>
                                    </div>
                                    <div>
                                        <h3 style="font-size: 1.15rem; font-weight: 750; color: var(--accent); margin: 0 0 0.5rem 0; display: flex; align-items: center; justify-content: space-between;">
                                            Totais por Setor <i class="fa-solid fa-arrow-right" style="font-size: 0.85rem; opacity: 0; transform: translateX(-5px); transition: all 0.25s ease;"></i>
                                        </h3>
                                        <p style="color: var(--text-secondary); font-size: 0.88rem; line-height: 1.5; margin: 0;">Acompanhe o volume quantitativo total de entradas e saídas de trâmites agrupados por setor ativo.</p>
                                    </div>
                                </div>
                            </div>
                        </a>

                        <!-- CARD 4: AUDITORES -->
                        <a href="#reports/auditores" class="config-menu-card">
                            <div class="card h-100" style="transition: all 0.2s ease; cursor: pointer; border: 1px solid var(--border-color); border-radius: var(--radius-lg); overflow: hidden; height: 100%; background: #ffffff;">
                                <div class="card-body" style="padding: 1.75rem; display: flex; flex-direction: column; gap: 1.25rem;">
                                    <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(99, 102, 241, 0.08); color: #4f46e5; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
                                        <i class="fa-solid fa-user-tie"></i>
                                    </div>
                                    <div>
                                        <h3 style="font-size: 1.15rem; font-weight: 750; color: var(--accent); margin: 0 0 0.5rem 0; display: flex; align-items: center; justify-content: space-between;">
                                            Auditores <i class="fa-solid fa-arrow-right" style="font-size: 0.85rem; opacity: 0; transform: translateX(-5px); transition: all 0.25s ease;"></i>
                                        </h3>
                                        <p style="color: var(--text-secondary); font-size: 0.88rem; line-height: 1.5; margin: 0;">Monitore em tempo real a carga atual de processos em posse técnica de cada Auditor Fiscal.</p>
                                    </div>
                                </div>
                            </div>
                        </a>

                    </div>
                </div>
            `;
            return;
        }

        let tabTitle = 'Relatórios';
        if (activeTab === 'movimentacoes') tabTitle = 'Movimentações';
        else if (activeTab === 'parados') tabTitle = 'Processos Parados';
        else if (activeTab === 'sector-stats') tabTitle = 'Estatísticas por Setor';
        else if (activeTab === 'auditores') tabTitle = 'Carga de Auditores';

        container.innerHTML = `
            <div class="view-section">
                <!-- BREADCRUMB -->
                <div class="config-breadcrumb" style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; font-weight: 500; margin-bottom: 1.5rem;">
                    <a href="#reports" style="color: var(--primary); text-decoration: none; display: inline-flex; align-items: center; gap: 0.35rem; font-weight: 700;">
                        <i class="fa-solid fa-arrow-left"></i> Voltar para Relatórios
                    </a>
                    <span style="color: var(--text-secondary); opacity: 0.5;">/</span>
                    <span style="color: var(--text-primary); font-weight: 600;">${tabTitle}</span>
                </div>

                <!-- MOVIMENTACOES TAB -->
                ${activeTab === 'movimentacoes' ? `
                <div class="tab-content active" id="tab-movimentacoes">
                    <div class="card mb-1">
                        <div class="card-header border-bottom">
                            <h3>Relatório de Movimentações</h3>
                            <p>Filtrar por período para entradas e saídas.</p>
                        </div>
                        <div class="card-body">
                            <div class="grid-form" style="align-items: end;">
                                <div class="form-group">
                                    <label>Data Início</label>
                                    <input type="date" id="rep-mov-start">
                                </div>
                                <div class="form-group">
                                    <label>Data Fim</label>
                                    <input type="date" id="rep-mov-end">
                                </div>
                                <div class="form-group">
                                    <label>Tipo de Ação</label>
                                    <select id="rep-mov-action" style="height: 48px;">
                                        <option value="">Todas</option>
                                        <option value="ENTRADA">Somente Entradas (Tramitação)</option>
                                        <option value="SAIDA">Somente Saídas</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Setor</label>
                                    <select id="rep-mov-sector" style="height: 48px;">
                                        <option value="">Todos</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <button class="btn-primary" id="btn-gen-mov" style="height: 48px; width: 100%;"><i class="fa-solid fa-sync"></i> Gerar</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div id="mov-results" style="display:none;">
                        <div class="flex-between mb-1" style="align-items: center;">
                            <div>
                                <h4 id="mov-summary-text" style="margin: 0; color: var(--primary-color);"></h4>
                            </div>
                            <div style="display: flex; gap:10px;">
                                <button class="btn-secondary" id="btn-mov-xlsx" style="width:auto;"><i class="fa-solid fa-file-excel"></i> Exportar XLSX</button>
                                <button class="btn-secondary" id="btn-mov-pdf" style="width:auto;"><i class="fa-solid fa-file-pdf"></i> Exportar PDF</button>
                            </div>
                        </div>
                        <div class="card">
                            <div class="table-responsive">
                                <table class="data-table" id="table-mov">
                                    <thead>
                                        <tr>
                                            <th>Data</th>
                                            <th>Ação</th>
                                            <th>Processo</th>
                                            <th>Setor / Destino</th>
                                            <th>Responsável</th>
                                        </tr>
                                    </thead>
                                    <tbody id="tbody-mov"></tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                ` : ''}

                <!-- PARADOS TAB -->
                ${activeTab === 'parados' ? `
                <div class="tab-content active" id="tab-parados">
                    <div class="card mb-1">
                        <div class="card-header border-bottom flex-between">
                            <div>
                                <h3>Processos Parados por Setor</h3>
                                <p>Processos em posse da SUBFIS há muitos dias.</p>
                            </div>
                            <div class="flex-center" style="gap:10px;">
                                <select id="rep-stagnant-sector" style="height: 38px; width: 200px;">
                                    <option value="">Todos os setores...</option>
                                </select>
                                <label style="font-size:0.85rem; white-space:nowrap;">Mínimo de dias:</label>
                                <input type="number" id="rep-stagnant-days" value="15" style="width: 80px; height: 38px;">
                                <button class="btn-primary" id="btn-gen-stagnant" style="width:auto; height: 38px;"><i class="fa-solid fa-sync"></i></button>
                            </div>
                        </div>
                    </div>

                    <div id="stagnant-results" style="display:none;">
                        <div class="flex-end mb-1" style="gap:10px;">
                            <button class="btn-secondary" id="btn-stag-xlsx" style="width:auto;"><i class="fa-solid fa-file-excel"></i> Exportar XLSX</button>
                            <button class="btn-secondary" id="btn-stag-pdf" style="width:auto;"><i class="fa-solid fa-file-pdf"></i> Exportar PDF</button>
                        </div>
                        <div class="card">
                            <div class="table-responsive">
                                <table class="data-table" id="table-stag">
                                    <thead>
                                        <tr>
                                            <th>Processo</th>
                                            <th>Assunto</th>
                                            <th>Auditor Responsável</th>
                                            <th>Setor Atual</th>
                                            <th>Última Mov.</th>
                                            <th>Dias Parado</th>
                                        </tr>
                                    </thead>
                                    <tbody id="tbody-stag"></tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                ` : ''}

                <!-- SECTOR STATS TAB -->
                ${activeTab === 'sector-stats' ? `
                <div class="tab-content active" id="tab-sector-stats">
                    <div class="card mb-1">
                        <div class="card-header border-bottom">
                            <h3>Totais por Setor (Entradas e Saídas)</h3>
                            <p>Resumo quantitativo de movimentações agrupadas por setor no período selecionado.</p>
                        </div>
                        <div class="card-body">
                            <div class="grid-form" style="align-items: end;">
                                <div class="form-group">
                                    <label>Data Início</label>
                                    <input type="date" id="rep-sec-start">
                                </div>
                                <div class="form-group">
                                    <label>Data Fim</label>
                                    <input type="date" id="rep-sec-end">
                                </div>
                                <div class="form-group">
                                    <button class="btn-primary" id="btn-gen-sec" style="height: 48px; width: 100%;"><i class="fa-solid fa-sync"></i> Gerar Relatório</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div id="sec-results" style="display:none;">
                        <div class="flex-end mb-1" style="gap:10px;">
                            <button class="btn-secondary" id="btn-sec-xlsx" style="width:auto;"><i class="fa-solid fa-file-excel"></i> Exportar XLSX</button>
                            <button class="btn-secondary" id="btn-sec-pdf" style="width:auto;"><i class="fa-solid fa-file-pdf"></i> Exportar PDF</button>
                        </div>
                        <div class="card">
                            <div class="table-responsive">
                                <table class="data-table" id="table-sec">
                                    <thead>
                                        <tr>
                                            <th>Setor</th>
                                            <th class="text-center">Total de Entradas</th>
                                            <th class="text-center">Total de Saídas</th>
                                            <th class="text-center">Processos Sob Custódia (Hoje)</th>
                                        </tr>
                                    </thead>
                                    <tbody id="tbody-sec"></tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                ` : ''}

                <!-- AUDITORES TAB -->
                ${activeTab === 'auditores' ? `
                <div class="tab-content active" id="tab-auditores">
                    <div class="card mb-1">
                        <div class="card-header border-bottom flex-between">
                            <div>
                                <h3>Carga Atual de Processos por Auditor</h3>
                                <p>Processos que estão atualmente sob responsabilidade de cada auditor.</p>
                            </div>
                            <button class="btn-primary" id="btn-gen-auditors" style="width:auto; height: 38px;"><i class="fa-solid fa-sync"></i> Atualizar</button>
                        </div>
                    </div>

                    <div id="auditors-results" style="display:none;">
                        <div class="flex-end mb-1" style="gap:10px;">
                            <button class="btn-secondary" id="btn-aud-xlsx" style="width:auto;"><i class="fa-solid fa-file-excel"></i> Exportar XLSX</button>
                            <button class="btn-secondary" id="btn-aud-pdf" style="width:auto;"><i class="fa-solid fa-file-pdf"></i> Exportar PDF</button>
                        </div>
                        <div class="card">
                            <div class="table-responsive">
                                <table class="data-table" id="table-aud">
                                    <thead>
                                        <tr>
                                            <th>Auditor</th>
                                            <th>Setor Principal</th>
                                            <th class="text-center">Processos em Carga</th>
                                        </tr>
                                    </thead>
                                    <tbody id="tbody-aud"></tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                ` : ''}
            </div>
        `;

        // Fetch Data for active tab only
        if (activeTab === 'movimentacoes') {
            this.initMovements();
        } else if (activeTab === 'parados') {
            this.initStagnant();
        } else if (activeTab === 'sector-stats') {
            this.initSectorStats();
        } else if (activeTab === 'auditores') {
            this.initAuditors();
        }
    },

    attachTabEvents() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                
                const tab = e.target.closest('.tab-btn');
                tab.classList.add('active');
                document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
            });
        });
    },

    initMovements() {
        const btn = document.getElementById('btn-gen-mov');
        const startInput = document.getElementById('rep-mov-start');
        const endInput = document.getElementById('rep-mov-end');
        const sectorSelect = document.getElementById('rep-mov-sector');
        const results = document.getElementById('mov-results');
        const tbody = document.getElementById('tbody-mov');

        // Load sectors for filter
        Api.sectors.list().then(sectors => {
            sectorSelect.innerHTML += sectors.map(s => `<option value="${s.id}">${s.alias || s.name}</option>`).join('');
        }).catch(e => console.warn('Erro ao carregar setores no filtro de movimentações', e));

        // Set default dates (current month)
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        startInput.value = `${y}-${m}-01`;
        endInput.value = new Date().toISOString().split('T')[0];

        btn.onclick = async () => {
            const start = startInput.value;
            const end = endInput.value;
            const action = document.getElementById('rep-mov-action').value;
            const sectorId = sectorSelect.value;
            if (!start || !end) return window.app.toast('Selecione as datas', 'error');

            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

            try {
                const data = await Api.reports.movements(start, end, action, sectorId);
                
                const summaryText = document.getElementById('mov-summary-text');
                if (action === 'ENTRADA') {
                    summaryText.innerHTML = `<i class="fa-solid fa-arrow-right-to-bracket"></i> ${data.length} Entrada(s) / Tramitação(ões) no período`;
                } else if (action === 'SAIDA') {
                    summaryText.innerHTML = `<i class="fa-solid fa-arrow-right-from-bracket"></i> ${data.length} Saída(s) no período`;
                } else {
                    summaryText.innerHTML = `<i class="fa-solid fa-list"></i> ${data.length} Movimentação(ões) no período`;
                }

                tbody.innerHTML = data.map(m => `
                    <tr>
                        <td>${window.app.formatDate(m.movement_date)}</td>
                        <td><span class="badge ${m.action === 'ENTRADA' ? 'badge-success' : 'badge-warning'}">${window.app.formatAction(m.action, m.destination_sector)}</span></td>
                        <td>
                            <strong>${m.process_number}</strong>
                            ${m.parent_id ? '<i class="fa-solid fa-paperclip" title="Apenso" style="margin-left:5px; font-size:0.7rem; color:var(--text-secondary);"></i>' : (m.attachments_count > 0 ? '<i class="fa-solid fa-link" title="Possui apensos" style="margin-left:5px; font-size:0.7rem; color:var(--primary-color);"></i>' : '')}
                        </td>
                        <td>${m.destination_sector}</td>
                        <td>${m.user_name}</td>
                    </tr>
                `).join('');

                if (data.length === 0) tbody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhum registro encontrado</td></tr>';
                results.style.display = 'block';
            } catch (e) {
                window.app.toast(e.message, 'error');
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-sync"></i> Gerar';
            }
        };

        document.getElementById('btn-mov-xlsx').onclick = () => {
            const sumText = document.getElementById('mov-summary-text').innerText;
            this.exportXLSX('table-mov', 'Relatorio_Movimentacoes', sumText);
        };
        document.getElementById('btn-mov-pdf').onclick = () => {
            const sumText = document.getElementById('mov-summary-text').innerText;
            this.exportPDF('table-mov', 'Relatório de Movimentações', sumText);
        };
    },

    async initStagnant() {
        const btn = document.getElementById('btn-gen-stagnant');
        const daysInput = document.getElementById('rep-stagnant-days');
        const sectorSelect = document.getElementById('rep-stagnant-sector');
        const results = document.getElementById('stagnant-results');
        const tbody = document.getElementById('tbody-stag');

        // Load sectors for filter
        try {
            const sectors = await Api.sectors.list();
            sectorSelect.innerHTML += sectors.map(s => `<option value="${s.id}">${s.alias || s.name}</option>`).join('');
        } catch (e) {
            console.warn('Erro ao carregar setores no filtro', e);
        }

        btn.onclick = async () => {
            const days = daysInput.value || 15;
            const sectorId = sectorSelect.value;
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

            try {
                const data = await Api.reports.stagnant(days, sectorId);
                tbody.innerHTML = data.map(p => `
                    <tr>
                        <td>
                            <strong>${p.process_number}</strong>
                            ${p.parent_id ? '<i class="fa-solid fa-paperclip" title="Apenso" style="margin-left:5px; font-size:0.7rem; color:var(--text-secondary);"></i>' : (p.attachments_count > 0 ? '<i class="fa-solid fa-link" title="Possui apensos" style="margin-left:5px; font-size:0.7rem; color:var(--primary-color);"></i>' : '')}
                        </td>
                        <td>${p.subject}</td>
                        <td>${p.responsible_name || '<span style="color:var(--text-secondary);font-style:italic;">Não definido</span>'}</td>
                        <td>${p.current_sector}</td>
                        <td>${window.app.formatDate(p.last_movement)}</td>
                        <td class="text-center"><span class="badge badge-danger">${p.idle_days} dias</span></td>
                    </tr>
                `).join('');

                if (data.length === 0) tbody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhum processo parado</td></tr>';
                results.style.display = 'block';
            } catch (e) {
                window.app.toast(e.message, 'error');
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-sync"></i>';
            }
        };

        document.getElementById('btn-stag-xlsx').onclick = () => this.exportXLSX('table-stag', 'Relatorio_Stagnados');
        document.getElementById('btn-stag-pdf').onclick = () => this.exportPDF('table-stag', 'Processos Stagnados');
    },

    initAuditors() {
        const btn = document.getElementById('btn-gen-auditors');
        const results = document.getElementById('auditors-results');
        const tbody = document.getElementById('tbody-aud');

        btn.onclick = async () => {
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

            try {
                const data = await Api.reports.auditorStats();
                tbody.innerHTML = data.map(r => `
                    <tr>
                        <td><strong>${r.name}</strong></td>
                        <td>${r.sector_name}</td>
                        <td class="text-center">
                            <span
                                class="badge ${r.current_workload > 0 ? 'badge-primary' : 'badge-secondary'}" 
                                style="font-size:1rem; padding: 0.4rem 0.8rem; ${r.current_workload > 0 ? 'cursor:pointer;' : ''}"
                                ${r.current_workload > 0 ? `onclick="window.app.showAuditorDrawer(${r.id}, '${r.name.replace(/'/g, "\\'")}')"`  : ''}
                                title="${r.current_workload > 0 ? 'Clique para ver os processos' : ''}"
                            >
                                ${r.current_workload} processos
                                ${r.current_workload > 0 ? '<i class="fa-solid fa-chevron-right" style="font-size:0.7rem;margin-left:4px;"></i>' : ''}
                            </span>
                        </td>
                    </tr>
                `).join('');

                if (data.length === 0) tbody.innerHTML = '<tr><td colspan="3" class="text-center">Nenhum auditor encontrado</td></tr>';
                results.style.display = 'block';
            } catch (e) {
                window.app.toast(e.message, 'error');
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-sync"></i> Atualizar';
            }
        };

        document.getElementById('btn-aud-xlsx').onclick = () => this.exportXLSX('table-aud', 'Relatorio_Auditores');
        document.getElementById('btn-aud-pdf').onclick = () => this.exportPDF('table-aud', 'Carga de Trabalho por Auditor');
    },

    initSectorStats() {
        const btn = document.getElementById('btn-gen-sec');
        const startInput = document.getElementById('rep-sec-start');
        const endInput = document.getElementById('rep-sec-end');
        const results = document.getElementById('sec-results');
        const tbody = document.getElementById('tbody-sec');

        // Set default dates (current month)
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        startInput.value = `${y}-${m}-01`;
        endInput.value = new Date().toISOString().split('T')[0];

        btn.onclick = async () => {
            const start = startInput.value;
            const end = endInput.value;
            if (!start || !end) return window.app.toast('Selecione as datas', 'error');

            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

            try {
                const data = await Api.reports.sectorStats(start, end);
                tbody.innerHTML = data.map(s => `
                    <tr>
                        <td>
                            <strong>${s.sector_alias || s.sector_name}</strong>
                            <div style="font-size:0.75rem; color:var(--text-secondary);">${s.sector_alias ? s.sector_name : ''}</div>
                        </td>
                        <td class="text-center"><span class="badge badge-success" style="font-size:0.9rem;">${s.total_entries}</span></td>
                        <td class="text-center"><span class="badge badge-warning" style="font-size:0.9rem;">${s.total_exits}</span></td>
                        <td class="text-center"><span class="badge badge-primary" style="font-size:0.9rem; font-weight:700;">${s.total_custody}</span></td>
                    </tr>
                `).join('');

                if (data.length === 0) tbody.innerHTML = '<tr><td colspan="4" class="text-center">Nenhum dado encontrado para o período</td></tr>';
                results.style.display = 'block';
            } catch (e) {
                window.app.toast(e.message, 'error');
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-sync"></i> Gerar Relatório';
            }
        };

        document.getElementById('btn-sec-xlsx').onclick = () => this.exportXLSX('table-sec', 'Relatorio_Totais_Setor');
        document.getElementById('btn-sec-pdf').onclick = () => this.exportPDF('table-sec', 'Totais de Movimentações por Setor');
    },

    exportXLSX(tableId, filename, subtitle = '') {
        const table = document.getElementById(tableId);
        let caption = null;
        if (subtitle) {
            caption = document.createElement('caption');
            caption.innerText = subtitle;
            table.insertBefore(caption, table.firstChild);
        }
        const wb = XLSX.utils.table_to_book(table);
        if (caption) table.removeChild(caption);
        XLSX.writeFile(wb, `${filename}.xlsx`);
    },

    exportPDF(tableId, title, subtitle = '') {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.text(title, 14, 20);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 28);
        
        let startY = 35;
        if (subtitle) {
            doc.setFontSize(10);
            doc.setTextColor(50);
            doc.text(subtitle, 14, 34);
            startY = 40;
        }
        
        doc.autoTable({
            html: `#${tableId}`,
            startY: startY,
            theme: 'grid',
            headStyles: { fillColor: [37, 99, 235], textColor: 255 },
            styles: { fontSize: 9 }
        });
        
        doc.save(`${title.replace(/ /g, '_')}.pdf`);
    }
};

window.reportsView = reportsView;
