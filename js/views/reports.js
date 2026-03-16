const reportsView = {
    async render(container, user) {
        if (user.role !== 'Admin' && user.role !== 'Gestor') {
            container.innerHTML = `<div class="card"><div class="card-body text-center"><h3 class="text-secondary">Acesso Negado</h3><p>Apenas Gestores e Administradores têm acesso a esta área.</p></div></div>`;
            return;
        }

        container.innerHTML = `
            <div class="view-section">
                <div class="tabs-header">
                    <button class="tab-btn active" data-tab="movimentacoes"><i class="fa-solid fa-arrow-right-arrow-left"></i> Entradas / Saídas</button>
                    <button class="tab-btn" data-tab="parados"><i class="fa-solid fa-hourglass-half"></i> Processos Parados</button>
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
                                <div class="form-group col-span-2">
                                    <label>Data Início</label>
                                    <input type="date" id="rep-mov-start">
                                </div>
                                <div class="form-group col-span-2">
                                    <label>Data Fim</label>
                                    <input type="date" id="rep-mov-end">
                                </div>
                                <div class="form-group">
                                    <button class="btn-primary" id="btn-gen-mov" style="height: 48px;"><i class="fa-solid fa-sync"></i> Gerar</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div id="mov-results" style="display:none;">
                        <div class="flex-end mb-1" style="gap:10px;">
                            <button class="btn-secondary" id="btn-mov-xlsx" style="width:auto;"><i class="fa-solid fa-file-excel"></i> Exportar XLSX</button>
                            <button class="btn-secondary" id="btn-mov-pdf" style="width:auto;"><i class="fa-solid fa-file-pdf"></i> Exportar PDF</button>
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
                                <h3>Processos Stagnados</h3>
                                <p>Processos em posse da SUBFIS há muitos dias.</p>
                            </div>
                            <div class="flex-center" style="gap:10px;">
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
                                            <th>Requerente</th>
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
        `;

        this.attachTabEvents();
        this.initMovements();
        this.initStagnant();
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
        const results = document.getElementById('mov-results');
        const tbody = document.getElementById('tbody-mov');

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
                const data = await Api.reports.movements(start, end);
                tbody.innerHTML = data.map(m => `
                    <tr>
                        <td>${new Date(m.movement_date + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                        <td><span class="badge ${m.action === 'ENTRADA' ? 'badge-success' : 'badge-warning'}">${m.action}</span></td>
                        <td><strong>${m.process_number}</strong></td>
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

        document.getElementById('btn-mov-xlsx').onclick = () => this.exportXLSX('table-mov', 'Relatorio_Movimentacoes');
        document.getElementById('btn-mov-pdf').onclick = () => this.exportPDF('table-mov', 'Relatório de Movimentações');
    },

    initStagnant() {
        const btn = document.getElementById('btn-gen-stagnant');
        const daysInput = document.getElementById('rep-stagnant-days');
        const results = document.getElementById('stagnant-results');
        const tbody = document.getElementById('tbody-stag');

        btn.onclick = async () => {
            const days = daysInput.value || 15;
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

            try {
                const data = await Api.reports.stagnant(days);
                tbody.innerHTML = data.map(p => `
                    <tr>
                        <td><strong>${p.process_number}</strong></td>
                        <td>${p.subject}</td>
                        <td>${p.requester}</td>
                        <td>${new Date(p.last_movement + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
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

    exportXLSX(tableId, filename) {
        const wb = XLSX.utils.table_to_book(document.getElementById(tableId));
        XLSX.writeFile(wb, `${filename}.xlsx`);
    },

    exportPDF(tableId, title) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.text(title, 14, 20);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 28);
        
        doc.autoTable({
            html: `#${tableId}`,
            startY: 35,
            theme: 'grid',
            headStyles: { fillColor: [37, 99, 235], textColor: 255 },
            styles: { fontSize: 9 }
        });
        
        doc.save(`${title.replace(/ /g, '_')}.pdf`);
    }
};

window.reportsView = reportsView;
