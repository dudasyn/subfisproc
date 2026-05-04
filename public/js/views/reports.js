const reportsView = {
    async render(container, user) {
        if (user.role !== 'Admin' && user.role !== 'Gestor') {
            container.innerHTML = `<div class="card"><div class="card-body text-center"><h3 class="text-secondary">Acesso Negado</h3><p>Apenas Gestores e Administradores têm acesso a esta área.</p></div></div>`;
            return;
        }

        container.innerHTML = `
            <div class="view-section">
                <div class="tabs-header">
                    <button class="tab-btn active" data-tab="movimentacoes"><i class="fa-solid fa-arrow-right-arrow-left"></i> Entradas / Saídas / Tramit.</button>
                    <button class="tab-btn" data-tab="parados"><i class="fa-solid fa-hourglass-half"></i> Processos Parados por Setor</button>
                    <button class="tab-btn" data-tab="sector-stats"><i class="fa-solid fa-chart-pie"></i> Entradas / Saídas por Setor</button>
                    <button class="tab-btn" data-tab="auditores"><i class="fa-solid fa-user-tie"></i> Auditores (Carga Atual)</button>
                </div>

                <!-- MOVIMENTACOES TAB -->
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

                <!-- PARADOS TAB -->
                <div class="tab-content" id="tab-parados">
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

                    </div>
                </div>

                <!-- SECTOR STATS TAB -->
                <div class="tab-content" id="tab-sector-stats">
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
                                            <th class="text-center">Saldo / Fluxo Total</th>
                                        </tr>
                                    </thead>
                                    <tbody id="tbody-sec"></tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- AUDITORES TAB -->
                <div class="tab-content" id="tab-auditores">
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
            </div>

            <!-- DRAWER: Lista de processos do auditor -->
            <div id="auditor-drawer" style="
                position: fixed; top: 0; right: -540px; width: 540px; height: 100vh;
                background-color: #ffffff;
                box-shadow: -6px 0 32px rgba(0,0,0,0.22);
                z-index: 9999; display: flex; flex-direction: column;
                transition: right 0.35s cubic-bezier(.4,0,.2,1);
                border-left: 2px solid #e2e8f0;
            ">
                <div style="padding: 1.5rem 1.5rem 1rem; border-bottom: 1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center; flex-shrink:0;">
                    <div>
                        <h3 id="drawer-title" style="margin:0;">Processos do Auditor</h3>
                        <p id="drawer-subtitle" style="margin:0.2rem 0 0; font-size:0.85rem; color:var(--text-secondary);"></p>
                    </div>
                    <button onclick="reportsView.closeDrawer()" style="background:none;border:none;cursor:pointer;font-size:1.3rem;color:var(--text-secondary);padding:0.3rem;">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div id="drawer-body" style="flex:1; overflow-y:auto; padding: 1rem 1.5rem;">
                    <div class="text-center p-4"><i class="fa-solid fa-spinner fa-spin"></i></div>
                </div>
            </div>
            <div id="drawer-backdrop" onclick="reportsView.closeDrawer()" style="
                display:none; position:fixed; inset:0; background:rgba(0,0,0,0.3); z-index:9998;
            "></div>
        `;

        this.attachTabEvents();
        this.initMovements();
        this.initStagnant();
        this.initSectorStats();
        this.initAuditors();
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
                        <td><span class="badge ${m.action === 'ENTRADA' ? 'badge-success' : 'badge-warning'}">${m.action === 'ENTRADA' ? 'ENTRADA (Tramitação)' : m.action}</span></td>
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
                                ${r.current_workload > 0 ? `onclick="reportsView.showAuditorDrawer(${r.id}, '${r.name.replace(/'/g, "\\'")}')"`  : ''}
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
                        <td class="text-center"><strong>${parseInt(s.total_entries) + parseInt(s.total_exits)}</strong></td>
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

    async showAuditorDrawer(responsibleId, name) {
        const drawer = document.getElementById('auditor-drawer');
        const backdrop = document.getElementById('drawer-backdrop');
        const title = document.getElementById('drawer-title');
        const subtitle = document.getElementById('drawer-subtitle');
        const body = document.getElementById('drawer-body');

        title.textContent = name;
        subtitle.textContent = 'Carregando processos...';
        body.innerHTML = '<div class="text-center p-4"><i class="fa-solid fa-spinner fa-spin"></i></div>';
        drawer.style.right = '0';
        backdrop.style.display = 'block';

        try {
            const data = await Api.reports.auditorProcesses(responsibleId);
            subtitle.textContent = `${data.length} processo(s) em carga`;

            if (data.length === 0) {
                body.innerHTML = '<div class="text-center p-4 text-secondary"><i class="fa-solid fa-inbox"></i><br>Nenhum processo em carga no momento.</div>';
                return;
            }

            body.innerHTML = `
                <div style="display:flex; flex-direction:column; gap:0;">
                    ${data.map(p => `
                        <div style="
                            padding: 0.85rem 0;
                            border-bottom: 1px solid #f1f5f9;
                            display:flex; align-items:center; justify-content:space-between; gap:0.5rem;
                        ">
                            <div style="flex:1; min-width:0;">
                                <div style="display:flex; align-items:center; gap:0.6rem; margin-bottom:0.2rem;">
                                    <strong
                                        style="color:#2563eb; cursor:pointer; font-size:0.9rem;"
                                        onclick="reportsView.showProcessModal('${p.process_number}')"
                                        title="Ver histórico deste processo"
                                    >${p.process_number}</strong>
                                    <span class="badge ${p.idle_days >= 30 ? 'badge-danger' : p.idle_days >= 15 ? 'badge-warning' : 'badge-secondary'}" style="font-size:0.72rem; padding:0.15rem 0.45rem;">${p.idle_days}d parado</span>
                                </div>
                                <div style="font-size:0.78rem; color:#64748b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                                    ${p.subject}
                                </div>
                                <div style="font-size:0.75rem; color:#94a3b8; margin-top:0.15rem;">
                                    <i class="fa-solid fa-building" style="margin-right:3px;"></i>${p.current_sector}
                                    &nbsp;&bull;&nbsp;
                                    <i class="fa-solid fa-calendar" style="margin-right:3px;"></i>${window.app.formatDate(p.last_movement)}
                                </div>
                            </div>
                            <i class="fa-solid fa-chevron-right" style="color:#cbd5e1; font-size:0.75rem; flex-shrink:0;"></i>
                        </div>
                    `).join('')}
                </div>
            `;
        } catch (e) {
            body.innerHTML = `<div class="text-center p-4 text-danger">Erro ao carregar processos.</div>`;
        }
    },

    closeDrawer() {
        document.getElementById('auditor-drawer').style.right = '-540px';
        document.getElementById('drawer-backdrop').style.display = 'none';
    },

    async showProcessModal(processNumber) {
        const existing = document.getElementById('process-detail-modal');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'process-detail-modal';
        overlay.style.cssText = `
            position:fixed; inset:0; background:rgba(0,0,0,0.55);
            z-index:10000; display:flex; align-items:center; justify-content:center; padding:1rem;
        `;
        overlay.innerHTML = `
            <div style="
                background:#fff; border-radius:12px; width:100%; max-width:780px;
                max-height:90vh; display:flex; flex-direction:column;
                box-shadow:0 20px 60px rgba(0,0,0,0.3);
            ">
                <div style="padding:1.2rem 1.5rem; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center; flex-shrink:0;">
                    <div>
                        <h3 style="margin:0; font-size:1.1rem;">${processNumber}</h3>
                        <p style="margin:0.2rem 0 0; font-size:0.82rem; color:#64748b;" id="pdm-subtitle">Carregando...</p>
                    </div>
                    <button onclick="document.getElementById('process-detail-modal').remove()" style="background:none;border:none;cursor:pointer;font-size:1.3rem;color:#94a3b8;">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div id="pdm-body" style="flex:1; overflow-y:auto; padding:1.5rem;">
                    <div style="text-align:center; padding:2rem;"><i class="fa-solid fa-spinner fa-spin"></i> Carregando dados do processo...</div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

        try {
            const data = await Api.movements.getByNumber(processNumber);
            if (!data || !data.exists) {
                document.getElementById('pdm-body').innerHTML = '<div style="text-align:center; padding:2rem; color:#ef4444;">Processo não encontrado.</div>';
                return;
            }
            const process = data.process;
            const history = await Api.movements.listByProcess(process.id);
            const lastMov = history[0];
            const statusText = lastMov
                ? (lastMov.action === 'ENTRADA' ? 'Em posse de ' + lastMov.destination_sector : 'Enviado para ' + lastMov.destination_sector)
                : 'Sem movimentação';

            document.getElementById('pdm-subtitle').textContent = process.subject;

            document.getElementById('pdm-body').innerHTML = `
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; margin-bottom:1.5rem;">
                    <div style="background:#f8fafc; border-radius:8px; padding:0.9rem;">
                        <div style="font-size:0.7rem; color:#94a3b8; text-transform:uppercase; font-weight:600; margin-bottom:0.3rem;">Assunto</div>
                        <div style="font-weight:500;">${process.subject || '-'}</div>
                    </div>
                    <div style="background:#f8fafc; border-radius:8px; padding:0.9rem;">
                        <div style="font-size:0.7rem; color:#94a3b8; text-transform:uppercase; font-weight:600; margin-bottom:0.3rem;">Requerente</div>
                        <div style="font-weight:500;">${process.requester || '-'}</div>
                    </div>
                    <div style="background:#f8fafc; border-radius:8px; padding:0.9rem;">
                        <div style="font-size:0.7rem; color:#94a3b8; text-transform:uppercase; font-weight:600; margin-bottom:0.3rem;">Documento</div>
                        <div style="font-weight:500;">${process.document_number || 'Não informado'}</div>
                    </div>
                    <div style="background:#eff6ff; border-radius:8px; padding:0.9rem; border:1px solid #bfdbfe;">
                        <div style="font-size:0.7rem; color:#3b82f6; text-transform:uppercase; font-weight:600; margin-bottom:0.3rem;">Status Atual</div>
                        <div style="font-weight:500; color:#1e40af;">${statusText}</div>
                    </div>
                </div>
                <h4 style="margin:0 0 0.75rem; font-size:0.88rem; color:#475569; display:flex; align-items:center; gap:6px;">
                    <i class="fa-solid fa-clock-rotate-left"></i> Histórico de Movimentações
                </h4>
                <table style="width:100%; border-collapse:collapse; font-size:0.85rem;">
                    <thead>
                        <tr style="background:#f8fafc;">
                            <th style="padding:0.6rem 0.75rem; text-align:left; font-size:0.7rem; color:#64748b; text-transform:uppercase; font-weight:600;">Data</th>
                            <th style="padding:0.6rem 0.75rem; text-align:left; font-size:0.7rem; color:#64748b; text-transform:uppercase; font-weight:600;">Ação</th>
                            <th style="padding:0.6rem 0.75rem; text-align:left; font-size:0.7rem; color:#64748b; text-transform:uppercase; font-weight:600;">Destino / Local</th>
                            <th style="padding:0.6rem 0.75rem; text-align:left; font-size:0.7rem; color:#64748b; text-transform:uppercase; font-weight:600;">Auditor</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${history.length ? history.map(h => `
                            <tr style="border-bottom:1px solid #f1f5f9;">
                                <td style="padding:0.7rem 0.75rem;">${window.app.formatDate(h.movement_date)}</td>
                                <td style="padding:0.7rem 0.75rem;">
                                    <span style="
                                        padding:0.2rem 0.5rem; border-radius:20px; font-size:0.78rem; font-weight:600;
                                        background:${h.action === 'ENTRADA' ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)'};
                                        color:${h.action === 'ENTRADA' ? '#16a34a' : '#d97706'};
                                    ">${h.action === 'ENTRADA' ? 'ENTRADA (Tramitação)' : h.action}</span>
                                </td>
                                <td style="padding:0.7rem 0.75rem;">${h.destination_sector}</td>
                                <td style="padding:0.7rem 0.75rem; color:#64748b;">${h.responsible_name || '-'}</td>
                            </tr>
                        `).join('') : '<tr><td colspan="4" style="text-align:center; padding:1.5rem; color:#94a3b8;">Nenhuma movimentação encontrada</td></tr>'}
                    </tbody>
                </table>
            `;
        } catch(e) {
            document.getElementById('pdm-body').innerHTML = '<div style="text-align:center; padding:2rem; color:#ef4444;">Erro ao carregar os dados do processo.</div>';
        }
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
