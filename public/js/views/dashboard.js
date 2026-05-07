const dashboardView = {
    // Keep reference to the active chart instance to avoid memory leaks or canvas duplication
    chartInstance: null,

    async render(container, user) {
        // Restricted access for profiles other than Admin or Gestor
        if (user.role !== 'Admin' && user.role !== 'Gestor') {
            container.innerHTML = `
                <div class="view-section flex-center animate-fade-in" style="min-height: 450px; display: flex; flex-direction: column; gap: 1.5rem; text-align: center; max-width: 500px; margin: 4rem auto; padding: 2.5rem; background: #ffffff; border-radius: var(--radius-lg); border: 1px solid var(--border-color); box-shadow: var(--shadow-md);">
                    <div style="width: 80px; height: 80px; background: rgba(239, 68, 68, 0.08); color: #ef4444; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; margin: 0 auto; border: 1px solid rgba(239, 68, 68, 0.2);">
                        <i class="fa-solid fa-shield-halved"></i>
                    </div>
                    <h2 style="font-weight: 750; color: var(--text-primary); margin: 0; font-size: 1.5rem; letter-spacing: -0.5px;">Acesso Reservado</h2>
                    <p style="color: var(--text-secondary); line-height: 1.6; margin: 0; font-size: 0.95rem;">
                        O painel analítico (Dashboard) é de uso exclusivo dos perfis de <strong>Administrador</strong> e <strong>Gestor</strong>. Seu perfil atual de <strong>${user.role}</strong> não possui privilégios de acesso a este recurso.
                    </p>
                    <button class="btn-primary" onclick="window.location.hash = '#search'" style="padding: 0.7rem 1.6rem; font-weight: 700; border-radius: var(--radius-md); display: flex; align-items: center; gap: 0.5rem; margin: 0.5rem auto 0; transition: all 0.25s ease;">
                        <i class="fa-solid fa-magnifying-glass"></i> Consultar Processos
                    </button>
                </div>
            `;
            return;
        }

        // Show high-performance beautiful initial loader
        container.innerHTML = `
            <div class="view-section flex-center" style="height: 400px; display: flex; flex-direction: column; gap: 1rem;">
                <i class="fa-solid fa-circle-notch fa-spin fa-3x" style="color:var(--primary)"></i>
                <span style="font-weight: 500; color: var(--text-secondary); font-size: 1.1rem; letter-spacing: 0.5px;">Carregando painel analítico...</span>
            </div>
        `;

        try {
            // Concurrent high-performance api fetches
            const [stats, sectors] = await Promise.all([
                Api.dashboard.getStats(),
                Api.sectors.list()
            ]);

            // Set up default filter dates (Start of Current Year to Today)
            const today = new Date();
            const currentYear = today.getFullYear();
            const defaultStart = `${currentYear}-01-01`;
            const defaultEnd = today.toISOString().split('T')[0];

            // Render view skeleton with original PMDC aesthetics
            container.innerHTML = `
                <style>
                    /* Premium Dashboard Elements */
                    .dashboard-header-container {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 1.5rem;
                        animation: fadeUp 0.4s ease-out;
                    }
                    .system-status {
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        font-size: 0.85rem;
                        background: #fff;
                        padding: 0.5rem 1rem;
                        border-radius: var(--radius-full);
                        border: 1px solid var(--border-color);
                        box-shadow: var(--shadow-sm);
                        font-weight: 600;
                        color: var(--text-primary);
                    }
                    .status-pulse {
                        width: 8px;
                        height: 8px;
                        background-color: var(--success);
                        border-radius: 50%;
                        display: inline-block;
                        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
                        animation: statusPulse 1.8s infinite;
                    }
                    @keyframes statusPulse {
                        0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
                        70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
                        100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
                    }

                    /* Interactive Filters */
                    .filter-bar-card {
                        background: #ffffff;
                        border: 1px solid var(--border-color);
                        border-radius: var(--radius-lg);
                        box-shadow: var(--shadow-sm);
                        padding: 1.25rem;
                        margin-bottom: 1.5rem;
                        animation: fadeUp 0.45s ease-out;
                        transition: var(--transition);
                    }
                    .filter-bar-card:hover {
                        border-color: rgba(0, 114, 188, 0.15);
                    }
                    .filter-group {
                        display: flex;
                        gap: 1rem;
                        align-items: flex-end;
                        flex-wrap: wrap;
                    }
                    .filter-control {
                        flex: 1;
                        min-width: 180px;
                        display: flex;
                        flex-direction: column;
                        gap: 0.4rem;
                    }
                    .filter-control label {
                        font-size: 0.78rem;
                        font-weight: 750;
                        color: var(--text-secondary);
                        text-transform: uppercase;
                        letter-spacing: 0.75px;
                    }
                    .filter-control select,
                    .filter-control input {
                        width: 100%;
                        padding: 0.65rem 1rem;
                        border: 1px solid var(--border-color);
                        border-radius: var(--radius-md);
                        font-family: inherit;
                        font-size: 0.9rem;
                        background: #f8fafc;
                        font-weight: 600;
                        color: var(--text-primary);
                        transition: var(--transition);
                    }
                    .filter-control select:focus,
                    .filter-control input:focus {
                        border-color: var(--primary);
                        background: #ffffff;
                        outline: none;
                        box-shadow: 0 0 0 3px rgba(0, 114, 188, 0.1);
                    }

                    /* Stats Grid and Segmented Target Groups */
                    .segmented-targets-container {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 1.5rem;
                        margin-bottom: 2rem;
                        width: 100%;
                        animation: fadeUp 0.5s ease-out;
                    }
                    @media (max-width: 1024px) {
                        .segmented-targets-container {
                            grid-template-columns: 1fr;
                        }
                    }
                    .target-group-panel {
                        background: rgba(248, 250, 252, 0.6);
                        border: 1px solid var(--border-color);
                        border-radius: var(--radius-lg);
                        padding: 1.5rem;
                        box-shadow: var(--shadow-sm);
                        display: flex;
                        flex-direction: column;
                        gap: 1.25rem;
                        transition: var(--transition);
                    }
                    .target-group-panel:hover {
                        border-color: rgba(0, 114, 188, 0.12);
                        background: rgba(248, 250, 252, 0.95);
                    }
                    .target-group-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 1rem;
                    }
                    @media (max-width: 520px) {
                        .target-group-grid {
                            grid-template-columns: 1fr;
                        }
                    }

                    .premium-stat-card {
                        background: var(--bg-surface);
                        border-radius: var(--radius-lg);
                        padding: 1.5rem;
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                        border: 1px solid var(--border-color);
                        box-shadow: var(--shadow-sm);
                        transition: var(--transition);
                        position: relative;
                        overflow: hidden;
                    }
                    .premium-stat-card::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 3px;
                        background: transparent;
                        transition: var(--transition);
                    }
                    
                    /* Cores específicas das barras superiores dos cartões */
                    .premium-stat-card.card-subfis-carga::before { background: var(--primary); }
                    .premium-stat-card.card-subfis-saidas::before { background: var(--warning); }
                    .premium-stat-card.card-subfis-tramitacoes::before { background: var(--success); }
                    .premium-stat-card.card-subfis-auditores::before { background: #6366f1; }
                    
                    .premium-stat-card.card-aft-carga::before { background: #8b5cf6; }
                    .premium-stat-card.card-aft-saidas::before { background: var(--warning); }
                    .premium-stat-card.card-aft-tramitacoes::before { background: var(--success); }
                    .premium-stat-card.card-aft-auditores::before { background: #6366f1; }

                    .premium-stat-card:hover {
                        transform: translateY(-4px);
                        box-shadow: var(--shadow-lg);
                        border-color: rgba(0, 114, 188, 0.15);
                    }

                    .stat-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 1.25rem;
                    }
                    .stat-badge-icon {
                        width: 44px;
                        height: 44px;
                        border-radius: 12px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 1.15rem;
                        transition: var(--transition);
                    }
                    .premium-stat-card:hover .stat-badge-icon {
                        transform: scale(1.1);
                    }
                    .icon-entradas { background: rgba(16, 185, 129, 0.1); color: var(--success); }
                    .icon-saidas { background: rgba(245, 158, 11, 0.1); color: var(--warning); }
                    .icon-processos { background: rgba(0, 114, 188, 0.1); color: var(--primary); }
                    .icon-responsibles { background: rgba(99, 102, 241, 0.1); color: #6366f1; }
                    .icon-sectors { background: rgba(168, 85, 247, 0.1); color: #a855f7; }

                    .stat-title {
                        font-size: 0.85rem;
                        color: var(--text-secondary);
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 0.75px;
                        margin: 0;
                    }
                    .stat-value {
                        font-size: 2.2rem;
                        font-weight: 800;
                        color: var(--text-primary);
                        line-height: 1;
                        margin: 0 0 0.5rem 0;
                        font-family: 'Outfit', sans-serif;
                    }
                    .stat-desc {
                        font-size: 0.75rem;
                        color: var(--text-secondary);
                        margin: 0;
                        font-weight: 500;
                        line-height: 1.4;
                    }

                    /* Layout Bottom Columns */
                    .dashboard-bottom-grid {
                        display: flex;
                        flex-direction: column;
                        gap: 1.5rem;
                        animation: fadeUp 0.6s ease-out;
                    }

                    .rank-badge {
                        width: 26px;
                        height: 26px;
                        border-radius: 50%;
                        background: #f1f5f9;
                        color: var(--text-secondary);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 0.8rem;
                        font-weight: 700;
                        margin: 0 auto;
                        border: 1px solid #e2e8f0;
                    }
                    .rank-badge.rank-1 { background: rgba(255, 193, 7, 0.15); color: #b45309; border-color: rgba(255,193,7,0.3); }
                    .rank-badge.rank-2 { background: rgba(148, 163, 184, 0.15); color: #475569; border-color: rgba(148,163,184,0.3); }
                    .rank-badge.rank-3 { background: rgba(180, 83, 9, 0.1); color: #78350f; border-color: rgba(180,83,9,0.2); }

                    .balance-badge {
                        font-size: 0.8rem;
                        font-weight: 700;
                        padding: 0.25rem 0.6rem;
                        border-radius: var(--radius-full);
                        display: inline-block;
                        text-align: center;
                    }
                    .balance-positive { background: rgba(16, 185, 129, 0.1); color: #065f46; }
                    .balance-negative { background: rgba(239, 68, 68, 0.1); color: #991b1b; }
                    .balance-neutral { background: #f1f5f9; color: var(--text-secondary); }

                    .process-number-display {
                        font-weight: 700;
                        color: var(--text-primary);
                        background: #f1f5f9;
                        padding: 0.25rem 0.6rem;
                        border-radius: 6px;
                        font-family: 'Courier New', Courier, monospace;
                        font-size: 0.9rem;
                        border: 1px solid #e2e8f0;
                    }
                    .sector-dot {
                        width: 6.5px;
                        height: 6.5px;
                        border-radius: 50%;
                        background: var(--primary);
                        display: inline-block;
                    }
                    .avatar-mini {
                        width: 24px;
                        height: 24px;
                        border-radius: 50%;
                        background: linear-gradient(135deg, var(--primary), var(--accent));
                        color: white;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 0.75rem;
                        font-weight: 700;
                    }
                    .dashboard-table-row {
                        transition: var(--transition);
                    }
                    .dashboard-table-row:hover {
                        background: rgba(241, 245, 249, 0.6) !important;
                    }

                    /* Clean Reset Button Style */
                    .btn-secondary-outline {
                        padding: 0.7rem 1.5rem;
                        height: auto;
                        border-radius: var(--radius-md);
                        font-weight: 700;
                        gap: 6px;
                        border: 1px solid var(--border-color);
                        cursor: pointer;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        background: #ffffff;
                        color: var(--text-secondary);
                        transition: var(--transition);
                    }
                    .btn-secondary-outline:hover {
                        background: #f1f5f9;
                        border-color: #cbd5e1;
                        color: var(--text-primary);
                    }
                </style>

                <div class="view-section">
                    <!-- Title Header -->
                    <div class="dashboard-header-container">
                        <div>
                            <h2 style="font-size: 1.6rem; font-weight: 800; color: var(--text-primary); margin: 0;">Painel de Controle Analítico</h2>
                            <p style="color: var(--text-secondary); margin: 0.25rem 0 0 0; font-size: 0.95rem;">Visão unificada das cargas de trabalho e fluxos de tramitação do SUBFIS.</p>
                        </div>
                        <div class="system-status">
                            <span class="status-pulse"></span>
                            <span>SISTEMA ATIVO</span>
                        </div>
                    </div>

                    <!-- Horizonal Filter Panel -->
                    <div class="filter-bar-card">
                        <div class="filter-group">
                            <div class="filter-control">
                                <label for="dashboard-filter-sector">Filtrar por Setor</label>
                                <select id="dashboard-filter-sector">
                                    <option value="">Todos os Setores</option>
                                    ${sectors.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
                                </select>
                            </div>
                            <div class="filter-control">
                                <label for="dashboard-filter-start">Período de Início</label>
                                <input type="date" id="dashboard-filter-start" value="${defaultStart}">
                            </div>
                            <div class="filter-control">
                                <label for="dashboard-filter-end">Período de Fim</label>
                                <input type="date" id="dashboard-filter-end" value="${defaultEnd}">
                            </div>
                            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                                <button id="btn-apply-dashboard-filters" class="btn-primary" style="padding: 0.7rem 1.5rem; height: auto; border-radius: var(--radius-md); font-weight: 700; gap: 6px;">
                                    <i class="fa-solid fa-filter"></i> Filtrar Painel
                                </button>
                                <button id="btn-clear-dashboard-filters" class="btn-secondary-outline">
                                    <i class="fa-solid fa-arrow-rotate-left"></i> Limpar
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Seção de Métricas Segmentadas por Alvo -->
                    <div style="margin: 2rem 0 1rem; display: flex; flex-direction: column; gap: 0.25rem;">
                        <h3 style="font-size: 1.3rem; font-weight: 800; color: var(--text-primary); margin: 0; display: flex; align-items: center; gap: 10px;">
                            <i class="fa-solid fa-layer-group" style="color: var(--primary);"></i> Métricas Segmentadas por Alvo
                        </h3>
                        <p style="color: var(--text-secondary); font-size: 0.88rem; margin: 0;">Acompanhamento de carga de trabalho atual, saídas para outros setores, tramitações internas e equipes dedicadas.</p>
                    </div>

                    <div class="segmented-targets-container">
                        <!-- Grupo Gabinete SUBFIS -->
                        <div class="target-group-panel">
                            <div style="display: flex; align-items: center; gap: 12px; border-bottom: 1px solid rgba(0, 114, 188, 0.1); padding-bottom: 1rem; margin-bottom: 0.25rem;">
                                <div style="width: 40px; height: 40px; background: rgba(0, 114, 188, 0.1); color: var(--primary); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">
                                    <i class="fa-solid fa-building"></i>
                                </div>
                                <div>
                                    <h3 style="font-size: 1.1rem; font-weight: 800; color: var(--text-primary); margin: 0;">Gabinete SUBFIS</h3>
                                    <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px;">Gabinete da Subsecretaria de Fiscalização</span>
                                </div>
                            </div>
                            
                            <div class="target-group-grid">
                                <!-- Carga de Trabalho Card -->
                                <div class="premium-stat-card card-subfis-carga">
                                    <div class="stat-header" style="margin-bottom: 0.5rem;">
                                        <h4 class="stat-title" style="font-size: 0.75rem;">Carga de Trabalho</h4>
                                        <div class="stat-badge-icon" style="width: 32px; height: 32px; border-radius: 8px; background: rgba(0, 114, 188, 0.08); color: var(--primary); font-size: 0.95rem;">
                                            <i class="fa-solid fa-briefcase"></i>
                                        </div>
                                    </div>
                                    <div class="stat-body">
                                        <h2 class="stat-value" id="subfis-carga-val" style="font-size: 1.8rem; margin-bottom: 0.25rem;">${stats.subfis_carga}</h2>
                                        <p class="stat-desc" style="font-size: 0.78rem; line-height: 1.2;">Processos sob custódia atual do setor e subsetores.</p>
                                    </div>
                                </div>

                                <!-- Saídas Card -->
                                <div class="premium-stat-card card-subfis-saidas">
                                    <div class="stat-header" style="margin-bottom: 0.5rem;">
                                        <h4 class="stat-title" style="font-size: 0.75rem;">Saídas (Exits)</h4>
                                        <div class="stat-badge-icon" style="width: 32px; height: 32px; border-radius: 8px; background: rgba(245, 158, 11, 0.08); color: var(--warning); font-size: 0.95rem;">
                                            <i class="fa-solid fa-right-from-bracket"></i>
                                        </div>
                                    </div>
                                    <div class="stat-body">
                                        <h2 class="stat-value" id="subfis-saidas-val" style="font-size: 1.8rem; margin-bottom: 0.25rem;">${stats.subfis_saidas}</h2>
                                        <p class="stat-desc" style="font-size: 0.78rem; line-height: 1.2;">Enviados para qualquer setor fora da SUBFIS no período.</p>
                                    </div>
                                </div>

                                <!-- Tramitações Card -->
                                <div class="premium-stat-card card-subfis-tramitacoes">
                                    <div class="stat-header" style="margin-bottom: 0.5rem;">
                                        <h4 class="stat-title" style="font-size: 0.75rem;">Tramitações</h4>
                                        <div class="stat-badge-icon" style="width: 32px; height: 32px; border-radius: 8px; background: rgba(16, 185, 129, 0.08); color: var(--success); font-size: 0.95rem;">
                                            <i class="fa-solid fa-shuffle"></i>
                                        </div>
                                    </div>
                                    <div class="stat-body">
                                        <h2 class="stat-value" id="subfis-tramitacoes-val" style="font-size: 1.8rem; margin-bottom: 0.25rem;">${stats.subfis_tramitacoes}</h2>
                                        <p class="stat-desc" style="font-size: 0.78rem; line-height: 1.2;">Movimentados internamente no grupo SUBFIS no período.</p>
                                    </div>
                                </div>

                                <!-- Auditores Card -->
                                <div class="premium-stat-card card-subfis-auditores">
                                    <div class="stat-header" style="margin-bottom: 0.5rem;">
                                        <h4 class="stat-title" style="font-size: 0.75rem;">Auditores</h4>
                                        <div class="stat-badge-icon" style="width: 32px; height: 32px; border-radius: 8px; background: rgba(99, 102, 241, 0.08); color: #6366f1; font-size: 0.95rem;">
                                            <i class="fa-solid fa-user-tie"></i>
                                        </div>
                                    </div>
                                    <div class="stat-body">
                                        <h2 class="stat-value" id="subfis-auditores-val" style="font-size: 1.8rem; margin-bottom: 0.25rem;">${stats.subfis_auditores}</h2>
                                        <p class="stat-desc" style="font-size: 0.78rem; line-height: 1.2;">Auditores responsáveis ativos lotados no setor.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Grupo Auditoria Fiscal AFT -->
                        <div class="target-group-panel">
                            <div style="display: flex; align-items: center; gap: 12px; border-bottom: 1px solid rgba(139, 92, 246, 0.15); padding-bottom: 1rem; margin-bottom: 0.25rem;">
                                <div style="width: 40px; height: 40px; background: rgba(139, 92, 246, 0.1); color: #8b5cf6; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">
                                    <i class="fa-solid fa-gavel"></i>
                                </div>
                                <div>
                                    <h3 style="font-size: 1.1rem; font-weight: 800; color: var(--text-primary); margin: 0;">Auditoria Fiscal AFT</h3>
                                    <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px;">Equipes de Auditoria Fiscal</span>
                                </div>
                            </div>
                            
                            <div class="target-group-grid">
                                <!-- Carga de Trabalho Card -->
                                <div class="premium-stat-card card-aft-carga">
                                    <div class="stat-header" style="margin-bottom: 0.5rem;">
                                        <h4 class="stat-title" style="font-size: 0.75rem;">Carga de Trabalho</h4>
                                        <div class="stat-badge-icon" style="width: 32px; height: 32px; border-radius: 8px; background: rgba(139, 92, 246, 0.08); color: #8b5cf6; font-size: 0.95rem;">
                                            <i class="fa-solid fa-briefcase"></i>
                                        </div>
                                    </div>
                                    <div class="stat-body">
                                        <h2 class="stat-value" id="aft-carga-val" style="font-size: 1.8rem; margin-bottom: 0.25rem;">${stats.aft_carga}</h2>
                                        <p class="stat-desc" style="font-size: 0.78rem; line-height: 1.2;">Processos sob custódia atual do setor e subsetores.</p>
                                    </div>
                                </div>

                                <!-- Saídas Card -->
                                <div class="premium-stat-card card-aft-saidas">
                                    <div class="stat-header" style="margin-bottom: 0.5rem;">
                                        <h4 class="stat-title" style="font-size: 0.75rem;">Saídas (Exits)</h4>
                                        <div class="stat-badge-icon" style="width: 32px; height: 32px; border-radius: 8px; background: rgba(245, 158, 11, 0.08); color: var(--warning); font-size: 0.95rem;">
                                            <i class="fa-solid fa-right-from-bracket"></i>
                                        </div>
                                    </div>
                                    <div class="stat-body">
                                        <h2 class="stat-value" id="aft-saidas-val" style="font-size: 1.8rem; margin-bottom: 0.25rem;">${stats.aft_saidas}</h2>
                                        <p class="stat-desc" style="font-size: 0.78rem; line-height: 1.2;">Enviados para qualquer setor fora da AFT no período.</p>
                                    </div>
                                </div>

                                <!-- Tramitações Card -->
                                <div class="premium-stat-card card-aft-tramitacoes">
                                    <div class="stat-header" style="margin-bottom: 0.5rem;">
                                        <h4 class="stat-title" style="font-size: 0.75rem;">Tramitações</h4>
                                        <div class="stat-badge-icon" style="width: 32px; height: 32px; border-radius: 8px; background: rgba(16, 185, 129, 0.08); color: var(--success); font-size: 0.95rem;">
                                            <i class="fa-solid fa-shuffle"></i>
                                        </div>
                                    </div>
                                    <div class="stat-body">
                                        <h2 class="stat-value" id="aft-tramitacoes-val" style="font-size: 1.8rem; margin-bottom: 0.25rem;">${stats.aft_tramitacoes}</h2>
                                        <p class="stat-desc" style="font-size: 0.78rem; line-height: 1.2;">Movimentados internamente no grupo AFT no período.</p>
                                    </div>
                                </div>

                                <!-- Auditores Card -->
                                <div class="premium-stat-card card-aft-auditores">
                                    <div class="stat-header" style="margin-bottom: 0.5rem;">
                                        <h4 class="stat-title" style="font-size: 0.75rem;">Auditores</h4>
                                        <div class="stat-badge-icon" style="width: 32px; height: 32px; border-radius: 8px; background: rgba(99, 102, 241, 0.08); color: #6366f1; font-size: 0.95rem;">
                                            <i class="fa-solid fa-user-tie"></i>
                                        </div>
                                    </div>
                                    <div class="stat-body">
                                        <h2 class="stat-value" id="aft-auditores-val" style="font-size: 1.8rem; margin-bottom: 0.25rem;">${stats.aft_auditores}</h2>
                                        <p class="stat-desc" style="font-size: 0.78rem; line-height: 1.2;">Auditores responsáveis ativos lotados no setor.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Bottom Grid -->
                    <div class="dashboard-bottom-grid">
                        
                        <!-- 1. Top 20 Sector Workload Grid (Full Width Stack) -->
                        <div class="card" style="box-shadow: var(--shadow-sm); border: 1px solid var(--border-color); border-radius: var(--radius-lg); overflow: hidden; margin: 0;">
                            <div class="card-header" style="padding: 1.5rem; border-bottom: 1px solid var(--border-color); background: #ffffff; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                                <div>
                                    <h3 style="font-size: 1.2rem; font-weight: 750; color: var(--text-primary); margin: 0; display: flex; align-items: center; gap: 8px;">
                                        <i class="fa-solid fa-ranking-star" style="color: var(--primary);"></i> Top 20 Carga de Trabalho por Setor
                                    </h3>
                                    <p style="color: var(--text-secondary); font-size: 0.85rem; margin: 0.25rem 0 0 0;">Ranking das unidades administrativas ordenado pelo fluxo de trâmites.</p>
                                </div>
                                <div id="sector-grid-date-badge" style="font-size: 0.75rem; background: rgba(0, 114, 188, 0.08); color: var(--primary); font-weight: 700; padding: 0.4rem 0.8rem; border-radius: var(--radius-full);">
                                    Carregando...
                                </div>
                            </div>
                            <div class="card-body p-0" style="max-height: 480px; overflow-y: auto;">
                                <div class="table-responsive">
                                    <table class="data-table" style="width: 100%; border-collapse: collapse;">
                                        <thead>
                                            <tr>
                                                <th style="padding: 1.1rem 1.5rem; font-size: 0.75rem; letter-spacing: 0.75px; text-transform: uppercase; font-weight: 700; color: var(--text-secondary); background: #f8fafc; border-bottom: 2px solid var(--border-color); text-align: center; width: 60px;">Rank</th>
                                                <th style="padding: 1.1rem 1.5rem; font-size: 0.75rem; letter-spacing: 0.75px; text-transform: uppercase; font-weight: 700; color: var(--text-secondary); background: #f8fafc; border-bottom: 2px solid var(--border-color);">Setor</th>
                                                <th style="padding: 1.1rem 1.5rem; font-size: 0.75rem; letter-spacing: 0.75px; text-transform: uppercase; font-weight: 700; color: var(--text-secondary); background: #f8fafc; border-bottom: 2px solid var(--border-color); text-align: center;">Entradas</th>
                                                <th style="padding: 1.1rem 1.5rem; font-size: 0.75rem; letter-spacing: 0.75px; text-transform: uppercase; font-weight: 700; color: var(--text-secondary); background: #f8fafc; border-bottom: 2px solid var(--border-color); text-align: center;">Saídas</th>
                                                <th style="padding: 1.1rem 1.5rem; font-size: 0.75rem; letter-spacing: 0.75px; text-transform: uppercase; font-weight: 700; color: var(--text-secondary); background: #f8fafc; border-bottom: 2px solid var(--border-color); text-align: center;">Trâmites</th>
                                                <th style="padding: 1.1rem 1.5rem; font-size: 0.75rem; letter-spacing: 0.75px; text-transform: uppercase; font-weight: 700; color: var(--text-secondary); background: #f8fafc; border-bottom: 2px solid var(--border-color); text-align: center;">Saldo</th>
                                            </tr>
                                        </thead>
                                        <tbody id="sector-workload-tbody">
                                            <tr>
                                                <td colspan="6" class="text-center" style="padding: 4rem;">
                                                    <i class="fa-solid fa-spinner fa-spin fa-2x" style="color:var(--primary); margin-bottom: 0.5rem; display:block;"></i>
                                                    Calculando carga de trabalho dos setores...
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <!-- 2. Recent Movements (Original Grid, now full width) -->
                        <div class="card" style="box-shadow: var(--shadow-sm); border: 1px solid var(--border-color); border-radius: var(--radius-lg); overflow: hidden; margin: 0;">
                            <div class="card-header" style="padding: 1.5rem; border-bottom: 1px solid var(--border-color); background: #ffffff; display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <h3 style="font-size: 1.2rem; font-weight: 750; color: var(--text-primary); margin: 0; display: flex; align-items: center; gap: 8px;">
                                        <i class="fa-solid fa-arrow-right-arrow-left" style="color: var(--primary);"></i> Últimas Movimentações
                                    </h3>
                                    <p style="color: var(--text-secondary); font-size: 0.85rem; margin: 0.25rem 0 0 0;">Histórico em tempo real dos últimos 7 trâmites realizados.</p>
                                </div>
                            </div>
                            <div class="card-body p-0">
                                <div class="table-responsive">
                                    <table class="data-table" style="width: 100%; border-collapse: collapse;">
                                        <thead>
                                            <tr>
                                                <th style="padding: 1.1rem 1.5rem; font-size: 0.75rem; letter-spacing: 0.75px; text-transform: uppercase; font-weight: 700; color: var(--text-secondary); background: #f8fafc; border-bottom: 2px solid var(--border-color);">Processo</th>
                                                <th style="padding: 1.1rem 1.5rem; font-size: 0.75rem; letter-spacing: 0.75px; text-transform: uppercase; font-weight: 700; color: var(--text-secondary); background: #f8fafc; border-bottom: 2px solid var(--border-color);">Ação</th>
                                                <th style="padding: 1.1rem 1.5rem; font-size: 0.75rem; letter-spacing: 0.75px; text-transform: uppercase; font-weight: 700; color: var(--text-secondary); background: #f8fafc; border-bottom: 2px solid var(--border-color);">Data do Trâmite</th>
                                                <th style="padding: 1.1rem 1.5rem; font-size: 0.75rem; letter-spacing: 0.75px; text-transform: uppercase; font-weight: 700; color: var(--text-secondary); background: #f8fafc; border-bottom: 2px solid var(--border-color);">Setor Destino</th>
                                                <th style="padding: 1.1rem 1.5rem; font-size: 0.75rem; letter-spacing: 0.75px; text-transform: uppercase; font-weight: 700; color: var(--text-secondary); background: #f8fafc; border-bottom: 2px solid var(--border-color);">Colaborador</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${stats.recent_activity.map(m => {
                                                const actionBadgeClass = m.action === 'ENTRADA' ? 'badge-success-glow' : 'badge-warning-glow';
                                                const actionLabel = window.app.formatAction(m.action, m.destination_sector);
                                                const processIcon = m.parent_id 
                                                    ? '<i class="fa-solid fa-paperclip" title="Apenso" style="margin-left: 8px; font-size: 0.8rem; color: var(--text-secondary); filter: drop-shadow(0 1px 1px rgba(0,0,0,0.1));"></i>' 
                                                    : (m.attachments_count > 0 
                                                        ? '<i class="fa-solid fa-link" title="Possui apensos" style="margin-left: 8px; font-size: 0.8rem; color: var(--primary); filter: drop-shadow(0 1px 1px rgba(37,99,235,0.2));"></i>' 
                                                        : '');
                                                
                                                return `
                                                    <tr class="dashboard-table-row">
                                                        <td style="padding: 1.1rem 1.5rem; vertical-align: middle;">
                                                            <div style="display: flex; align-items: center; gap: 4px;">
                                                                <span class="process-number-display">${m.process_number}</span>
                                                                ${processIcon}
                                                            </div>
                                                        </td>
                                                        <td style="padding: 1.1rem 1.5rem; vertical-align: middle;">
                                                            <span class="badge-custom ${actionBadgeClass}">
                                                                ${actionLabel}
                                                            </span>
                                                        </td>
                                                        <td style="padding: 1.1rem 1.5rem; vertical-align: middle; color: var(--text-primary); font-weight: 500;">
                                                            ${window.app.formatDate(m.movement_date)}
                                                        </td>
                                                        <td style="padding: 1.1rem 1.5rem; vertical-align: middle; font-weight: 500; color: var(--text-secondary);">
                                                            <div style="display: flex; align-items: center; gap: 8px;">
                                                                <div class="sector-dot"></div>
                                                                <span>${m.destination_sector}</span>
                                                            </div>
                                                        </td>
                                                        <td style="padding: 1.1rem 1.5rem; vertical-align: middle; font-weight: 500; color: var(--text-primary);">
                                                            <div style="display: flex; align-items: center; gap: 8px;">
                                                                <div class="avatar-mini">${m.user_name.charAt(0).toUpperCase()}</div>
                                                                <span>${m.user_name}</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                `;
                                            }).join('')}
                                            ${stats.recent_activity.length === 0 ? `<tr><td colspan="5" class="text-center" style="padding: 3rem; color: var(--text-secondary); font-size: 1rem;"><i class="fa-solid fa-folder-open fa-2x" style="display:block; margin-bottom: 0.75rem; opacity: 0.5;"></i> Nenhuma movimentação recente registrada</td></tr>` : ''}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                    </div>

                    <!-- Year-Over-Year Column Chart (Full Width Bottom) -->
                    <div class="card" style="box-shadow: var(--shadow-sm); border: 1px solid var(--border-color); border-radius: var(--radius-lg); margin-top: 1.5rem; padding: 1.5rem; background: #ffffff; animation: fadeUp 0.7s ease-out;">
                        <div style="margin-bottom: 1.25rem;">
                            <h3 style="font-size: 1.2rem; font-weight: 750; color: var(--text-primary); margin: 0; display: flex; align-items: center; gap: 8px;">
                                <i class="fa-solid fa-chart-column" style="color: var(--primary);"></i> Comparativo de Produtividade Anual
                            </h3>
                            <p style="color: var(--text-secondary); font-size: 0.85rem; margin: 0.25rem 0 0 0;">Análise do ano corrente versus anos anteriores de processos criados, entradas e saídas consolidadas.</p>
                        </div>
                        <div style="position: relative; height: 350px; width: 100%;">
                            <canvas id="yearly-comparison-chart"></canvas>
                        </div>
                    </div>
                </div>
            `;

            // Setup event listeners for apply and reset filters
            const applyBtn = document.getElementById('btn-apply-dashboard-filters');
            if (applyBtn) {
                applyBtn.addEventListener('click', () => {
                    const selSectorId = document.getElementById('dashboard-filter-sector').value;
                    const startDate = document.getElementById('dashboard-filter-start').value;
                    const endDate = document.getElementById('dashboard-filter-end').value;
                    this.updateFilteredData(startDate, endDate, selSectorId);
                });
            }

            const clearBtn = document.getElementById('btn-clear-dashboard-filters');
            if (clearBtn) {
                clearBtn.addEventListener('click', () => {
                    // Reset fields back to default
                    document.getElementById('dashboard-filter-sector').value = '';
                    document.getElementById('dashboard-filter-start').value = defaultStart;
                    document.getElementById('dashboard-filter-end').value = defaultEnd;
                    
                    // Re-run filter fetch with standard range
                    this.updateFilteredData(defaultStart, defaultEnd, '');
                });
            }

            // Perform initial load of filtered sector metrics & draw yearly comparison chart
            this.updateFilteredData(defaultStart, defaultEnd, '');
            this.renderYearlyChart(stats.yearly_stats || []);

        } catch (e) {
            container.innerHTML = `
                <div class="error-msg text-center mt-2" style="background: rgba(239, 68, 68, 0.05); padding: 2rem; border-radius: var(--radius-lg); border: 1px solid rgba(239, 68, 68, 0.2); max-width: 600px; margin: 2rem auto;">
                    <i class="fa-solid fa-triangle-exclamation fa-2x" style="color:var(--danger); margin-bottom: 0.5rem;"></i>
                    <h4 style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin: 0 0 0.5rem 0;">Erro de Comunicação</h4>
                    <p style="color: var(--text-secondary); font-size: 0.9rem; margin: 0;">${e.message}</p>
                </div>
            `;
        }
    },

    /**
     * Re-renders the Top 20 Sector Workload grid dynamically inside the dashboard without refreshing the entire page.
     */
    async updateFilteredData(start, end, sectorId) {
        const tbody = document.getElementById('sector-workload-tbody');
        const badge = document.getElementById('sector-grid-date-badge');
        
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center" style="padding: 4rem;">
                        <i class="fa-solid fa-spinner fa-spin fa-2x" style="color:var(--primary); margin-bottom: 0.5rem; display:block;"></i>
                        Recalculando fluxo de trâmites...
                    </td>
                </tr>
            `;
        }

        if (badge) {
            const fmtStart = window.app.formatDate(start);
            const fmtEnd = window.app.formatDate(end);
            badge.textContent = `${fmtStart} a ${fmtEnd}`;
        }

        try {
            // Recarregar estatísticas superiores do dashboard de forma síncrona
            try {
                const filteredStats = await Api.dashboard.getStats(start, end);
                
                // Atualizar valores de SUBFIS no DOM
                const subfisCarga = document.getElementById('subfis-carga-val');
                if (subfisCarga) subfisCarga.textContent = filteredStats.subfis_carga;
                
                const subfisSaidas = document.getElementById('subfis-saidas-val');
                if (subfisSaidas) subfisSaidas.textContent = filteredStats.subfis_saidas;
                
                const subfisTramitacoes = document.getElementById('subfis-tramitacoes-val');
                if (subfisTramitacoes) subfisTramitacoes.textContent = filteredStats.subfis_tramitacoes;
                
                const subfisAuditores = document.getElementById('subfis-auditores-val');
                if (subfisAuditores) subfisAuditores.textContent = filteredStats.subfis_auditores;

                // Atualizar valores de AFT no DOM
                const aftCarga = document.getElementById('aft-carga-val');
                if (aftCarga) aftCarga.textContent = filteredStats.aft_carga;
                
                const aftSaidas = document.getElementById('aft-saidas-val');
                if (aftSaidas) aftSaidas.textContent = filteredStats.aft_saidas;
                
                const aftTramitacoes = document.getElementById('aft-tramitacoes-val');
                if (aftTramitacoes) aftTramitacoes.textContent = filteredStats.aft_tramitacoes;
                
                const aftAuditores = document.getElementById('aft-auditores-val');
                if (aftAuditores) aftAuditores.textContent = filteredStats.aft_auditores;
            } catch (cardError) {
                console.error("Erro ao atualizar os cards do dashboard:", cardError);
            }

            // Fetch raw sector stats from backend report service
            const rawStats = await Api.reports.sectorStats(start, end);

            // Compute totals & balance metrics and sort/limit to top 20
            let processed = rawStats.map(s => {
                const totalEntries = parseInt(s.total_entries || 0);
                const totalExits = parseInt(s.total_exits || 0);
                const totalMovements = totalEntries + totalExits;
                const balance = totalEntries - totalExits;

                return {
                    id: s.id,
                    name: s.sector_name,
                    alias: s.sector_alias || s.sector_name,
                    entries: totalEntries,
                    exits: totalExits,
                    movements: totalMovements,
                    balance: balance
                };
            });

            // Filter by specific sector if requested in dropdown
            if (sectorId) {
                processed = processed.filter(s => String(s.id) === String(sectorId));
            }

            // Rank and sort by total movements desc
            processed.sort((a, b) => b.movements - a.movements);
            const top20 = processed.slice(0, 20);

            if (!tbody) return;

            if (top20.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center" style="padding: 3rem; color: var(--text-secondary); font-size: 0.95rem;">
                            <i class="fa-solid fa-circle-info fa-2x" style="display:block; margin-bottom:0.5rem; opacity:0.5;"></i>
                            Nenhuma movimentação encontrada no período selecionado.
                        </td>
                    </tr>
                `;
                return;
            }

            tbody.innerHTML = top20.map((s, index) => {
                const rankNum = index + 1;
                let rankClass = '';
                if (rankNum === 1) rankClass = 'rank-1';
                else if (rankNum === 2) rankClass = 'rank-2';
                else if (rankNum === 3) rankClass = 'rank-3';

                let balClass = 'balance-neutral';
                let balSymbol = '';
                if (s.balance > 0) {
                    balClass = 'balance-positive';
                    balSymbol = '+';
                } else if (s.balance < 0) {
                    balClass = 'balance-negative';
                }

                return `
                    <tr class="dashboard-table-row">
                        <td style="padding: 1rem 1.5rem; text-align: center; vertical-align: middle;">
                            <div class="rank-badge ${rankClass}">${rankNum}</div>
                        </td>
                        <td style="padding: 1rem 1.5rem; vertical-align: middle; color: var(--text-primary); font-weight: 700; font-size: 0.92rem;">
                            <div style="display: flex; flex-direction: column;">
                                <span>${s.name}</span>
                                ${s.alias !== s.name ? `<span style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 500;">${s.alias}</span>` : ''}
                            </div>
                        </td>
                        <td style="padding: 1rem 1.5rem; text-align: center; vertical-align: middle; font-weight: 600; color: #059669;">
                            ${s.entries}
                        </td>
                        <td style="padding: 1rem 1.5rem; text-align: center; vertical-align: middle; font-weight: 600; color: #d97706;">
                            ${s.exits}
                        </td>
                        <td style="padding: 1rem 1.5rem; text-align: center; vertical-align: middle; font-weight: 700; color: var(--text-primary); font-size: 0.95rem;">
                            ${s.movements}
                        </td>
                        <td style="padding: 1rem 1.5rem; text-align: center; vertical-align: middle;">
                            <span class="balance-badge ${balClass}">${balSymbol}${s.balance}</span>
                        </td>
                    </tr>
                `;
            }).join('');

        } catch (err) {
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center" style="padding: 3rem; color: var(--danger); font-weight: 500;">
                            <i class="fa-solid fa-triangle-exclamation fa-2x" style="margin-bottom:0.5rem; display:block;"></i>
                            Falha ao carregar dados dos setores: ${err.message}
                        </td>
                    </tr>
                `;
            }
        }
    },

    /**
     * Initializes and renders the YoY Chart.js bar graph comparing inputs, outputs, and processes.
     */
    renderYearlyChart(yearlyData) {
        const canvas = document.getElementById('yearly-comparison-chart');
        if (!canvas) return;

        // Clean up previous instance if exists to prevent rendering bugs on navigation
        if (this.chartInstance) {
            this.chartInstance.destroy();
            this.chartInstance = null;
        }

        // Verify Chart.js is successfully loaded
        if (typeof Chart === 'undefined') {
            canvas.parentElement.innerHTML = `
                <div class="text-center p-4" style="color: var(--text-secondary);">
                    <i class="fa-solid fa-circle-exclamation fa-2x" style="display:block; margin-bottom: 0.5rem;"></i>
                    Erro: Biblioteca de gráficos (Chart.js) não foi carregada corretamente.
                </div>
            `;
            return;
        }

        // Handle empty dataset edge case
        if (!yearlyData || yearlyData.length === 0) {
            const ctx = canvas.getContext('2d');
            ctx.font = '14px Outfit, sans-serif';
            ctx.fillStyle = '#64748b';
            ctx.textAlign = 'center';
            ctx.fillText('Nenhum dado anual consolidado encontrado para exibir o gráfico.', canvas.width / 2, canvas.height / 2);
            return;
        }

        // Prepare labels (Years) and series arrays
        const labels = yearlyData.map(item => `Ano ${item.year}`);
        const entriesData = yearlyData.map(item => parseInt(item.entradas));
        const exitsData = yearlyData.map(item => parseInt(item.saidas));
        const processesData = yearlyData.map(item => parseInt(item.processos));

        const ctx = canvas.getContext('2d');
        this.chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Entradas (Tramitações)',
                        data: entriesData,
                        backgroundColor: '#10b981', // Success HSL Green
                        borderRadius: 6,
                        borderSkipped: false,
                        maxBarThickness: 32
                    },
                    {
                        label: 'Saídas (Despachos)',
                        data: exitsData,
                        backgroundColor: '#f59e0b', // Accent HSL Orange/Amber
                        borderRadius: 6,
                        borderSkipped: false,
                        maxBarThickness: 32
                    },
                    {
                        label: 'Novos Processos',
                        data: processesData,
                        backgroundColor: '#0072bc', // PMDC Branding HSL Blue
                        borderRadius: 6,
                        borderSkipped: false,
                        maxBarThickness: 32
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            font: {
                                family: 'Outfit, sans-serif',
                                size: 12,
                                weight: 600
                            },
                            color: '#475569',
                            boxWidth: 14,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            padding: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        titleFont: {
                            family: 'Outfit, sans-serif',
                            size: 13,
                            weight: 700
                        },
                        bodyFont: {
                            family: 'Outfit, sans-serif',
                            size: 12,
                            weight: 500
                        },
                        padding: 12,
                        cornerRadius: 8,
                        boxPadding: 6,
                        usePointStyle: true
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                family: 'Outfit, sans-serif',
                                size: 12,
                                weight: 700
                            },
                            color: '#64748b'
                        }
                    },
                    y: {
                        grid: {
                            color: '#f1f5f9',
                            drawTicks: false
                        },
                        ticks: {
                            font: {
                                family: 'Outfit, sans-serif',
                                size: 11,
                                weight: 500
                            },
                            color: '#64748b',
                            padding: 8
                        },
                        border: {
                            dash: [4, 4],
                            color: '#e2e8f0'
                        }
                    }
                }
            }
        });
    }
};

window.dashboardView = dashboardView;
