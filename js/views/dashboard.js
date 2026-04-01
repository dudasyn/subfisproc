const dashboardView = {
    async render(container, user) {
        container.innerHTML = `
            <div class="view-section flex-center" style="height: 300px;">
                <i class="fa-solid fa-spinner fa-spin fa-3x" style="color:var(--primary)"></i>
            </div>
        `;
        try {
            const stats = await Api.dashboard.getStats();
            
            let tbody = stats.recent_activity.map(m => `
                <tr>
                    <td>
                        <strong>${m.process_number}</strong>
                        ${m.parent_id ? '<i class="fa-solid fa-paperclip" title="Apenso" style="margin-left:5px; font-size:0.7rem; color:var(--text-secondary);"></i>' : (m.attachments_count > 0 ? '<i class="fa-solid fa-link" title="Possui apensos" style="margin-left:5px; font-size:0.7rem; color:var(--primary-color);"></i>' : '')}
                    </td>
                    <td>
                        <span class="badge badge-${m.action === 'ENTRADA' ? 'success' : 'warning'}">
                            ${m.action}
                        </span>
                    </td>
                    <td>${window.app.formatDate(m.movement_date)}</td>
                    <td>${m.destination_sector}</td>
                    <td>${m.user_name}</td>
                </tr>
            `).join('');
            
            if (stats.recent_activity.length === 0) {
                tbody = `<tr><td colspan="5" class="text-center">Nenhuma movimentação registrada</td></tr>`;
            }

            container.innerHTML = `
                <div class="view-section">
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-icon icon-success"><i class="fa-solid fa-arrow-right-to-bracket"></i></div>
                            <div class="stat-info">
                                <h3>Total Entradas</h3>
                                <h2>${stats.entradas}</h2>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon icon-warning"><i class="fa-solid fa-arrow-right-from-bracket"></i></div>
                            <div class="stat-info">
                                <h3>Total Saídas</h3>
                                <h2>${stats.saidas}</h2>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon icon-primary"><i class="fa-solid fa-file-lines"></i></div>
                            <div class="stat-info">
                                <h3>Processos</h3>
                                <h2>${stats.total_processes}</h2>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card mt-2">
                        <div class="card-header">
                            <h3>Movimentações Recentes</h3>
                        </div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="data-table">
                                    <thead>
                                        <tr>
                                            <th>Processo</th>
                                            <th>Ação</th>
                                            <th>Data</th>
                                            <th>Destino</th>
                                            <th>Responsável</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${tbody}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } catch (e) {
            container.innerHTML = `<div class="error-msg text-center mt-2">Erro ao carregar o dashboard: ${e.message}</div>`;
        }
    }
};

window.dashboardView = dashboardView;
