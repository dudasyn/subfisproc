const searchView = {
    async render(container, user, viewParts = []) {
        container.innerHTML = `
            <div class="view-section">
                <!-- Barra de Identificação do Setor do Usuário (Destaque Premium) -->
                <div class="user-sector-identity-bar" style="background: linear-gradient(135deg, #0072bc, #004aad); color: white; border-radius: var(--radius-lg); padding: 1.15rem 1.5rem; margin-bottom: 1.25rem; display: flex; align-items: center; justify-content: space-between; box-shadow: var(--shadow-md); animation: fadeIn 0.4s ease-out;">
                    <div style="display: flex; align-items: center; gap: 0.85rem;">
                        <div style="background: rgba(255, 255, 255, 0.2); border-radius: 50%; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
                            <i class="fa-solid fa-shield-halved" style="font-size: 1.3rem; color: white;"></i>
                        </div>
                        <div>
                            <span style="display: block; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.85; font-weight: 600;">Setor Autenticado / Contexto de Segurança</span>
                            <strong style="display: block; font-size: 1.15rem; font-family: 'Outfit', sans-serif; font-weight: 700; letter-spacing: 0.02em;">${user.sector_name || 'Setor Não Definido'}</strong>
                        </div>
                    </div>
                    <div style="background: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.25); border-radius: 50px; padding: 0.45rem 1rem; font-size: 0.75rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; backdrop-filter: blur(4px); text-transform: uppercase; letter-spacing: 0.04em;">
                        <i class="fa-solid fa-user-lock" style="color: #79b947;"></i> Trâmite Restrito à Custódia
                    </div>
                </div>

                <!-- Seção 1 (Topo): Processos Atualmente no Seu Setor -->
                <div id="recent-section" class="card mb-2" style="box-shadow: 0 4px 20px rgba(0,0,0,0.02);">
                    <div class="card-header border-bottom flex-between" style="flex-wrap: wrap; gap: 1rem;">
                        <h4 id="recent-section-title" style="display: flex; align-items: center; gap: 8px; font-weight: 750; margin: 0;">
                            <i class="fa-solid fa-building" style="color:var(--primary-color);"></i> Processos Atualmente no Seu Setor
                        </h4>
                        <!-- Controles de Paginação do Setor (5 em 5) -->
                        <div id="sector-pagination" style="display: flex; gap: 0.5rem; align-items: center;">
                            <button id="btn-sector-prev" class="btn-secondary" style="padding: 0.35rem 0.75rem; border-radius: var(--radius-md); transition: var(--transition); border: 1px solid var(--border-color); background: var(--bg-soft); cursor: pointer;"><i class="fa-solid fa-chevron-left"></i></button>
                            <span id="sector-page-info" style="font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); min-width: 90px; text-align: center;">Página 1 de 1</span>
                            <button id="btn-sector-next" class="btn-secondary" style="padding: 0.35rem 0.75rem; border-radius: var(--radius-md); transition: var(--transition); border: 1px solid var(--border-color); background: var(--bg-soft); cursor: pointer;"><i class="fa-solid fa-chevron-right"></i></button>
                        </div>
                    </div>
                    <div class="card-body p-0">
                        <!-- Filtros Sensitivos do Setor (Número e Data com Mês/Ano) -->
                        <div id="sector-filters-panel" style="padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color); background: var(--bg-soft); display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 1rem; align-items: center;">
                            <div class="mov-input-icon-wrapper" style="width: 100%;">
                                <i class="fa-solid fa-filter" style="color: var(--primary-color);"></i>
                                <input type="text" id="sector-filter-query" placeholder="Filtrar por número nesta lista (sensitivo)..." style="width: 100%; height: 38px; border-radius: var(--radius-md); font-size: 0.85rem; padding-left: 2.5rem; background: var(--bg-primary); border: 1px solid var(--border-color);">
                            </div>
                            <div class="mov-input-icon-wrapper">
                                <i class="fa-solid fa-calendar-days" style="color: var(--primary-color);"></i>
                                <select id="sector-filter-month" style="height: 38px; border-radius: var(--radius-md); background-color: var(--bg-primary); padding-left: 2.5rem; width: 100%; font-size: 0.85rem; border: 1px solid var(--border-color);">
                                    <option value="">Filtrar Mês...</option>
                                    <option value="01">Janeiro</option>
                                    <option value="02">Fevereiro</option>
                                    <option value="03">Março</option>
                                    <option value="04">Abril</option>
                                    <option value="05">Maio</option>
                                    <option value="06">Junho</option>
                                    <option value="07">Julho</option>
                                    <option value="08">Agosto</option>
                                    <option value="09">Setembro</option>
                                    <option value="10">Outubro</option>
                                    <option value="11">Novembro</option>
                                    <option value="12">Dezembro</option>
                                </select>
                            </div>
                            <div class="mov-input-icon-wrapper">
                                <i class="fa-solid fa-calendar" style="color: var(--primary-color);"></i>
                                <select id="sector-filter-year" style="height: 38px; border-radius: var(--radius-md); background-color: var(--bg-primary); padding-left: 2.5rem; width: 100%; font-size: 0.85rem; border: 1px solid var(--border-color);">
                                    <option value="">Filtrar Ano...</option>
                                </select>
                            </div>
                        </div>
                        <div class="recent-list" id="recent-processes-list">
                            <div class="p-3 text-center text-secondary">
                                <i class="fa-solid fa-spinner fa-spin"></i> Carregando processos...
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Seção 2: Buscar Processo Fora do Setor -->
                <div id="search-filter-card" class="card mb-2">
                    <div class="card-header border-bottom">
                        <h3 style="font-size: 1.15rem; display: flex; align-items: center; gap: 8px; font-weight: 750; margin: 0;"><i class="fa-solid fa-magnifying-glass" style="color:var(--primary-color);"></i> Buscar Processo Fora do Setor</h3>
                        <p class="text-secondary" style="font-size: 0.85rem; margin-top: 0.25rem;">Filtre processos de qualquer setor da prefeitura por número, por auditor ou por destino.</p>
                    </div>
                    <div class="card-body" style="padding: 1.5rem;">
                        <div class="grid-form" style="gap:1.25rem;">
                            <!-- Linha 1: Campos de Busca -->
                            <div class="form-group col-span-2">
                                <label style="font-weight: 600; color: var(--text-primary); margin-bottom: 0.4rem; display: block;">Número do Processo</label>
                                <div class="mov-input-icon-wrapper" style="width: 100%;">
                                    <i class="fa-solid fa-magnifying-glass" style="color: var(--primary-color);"></i>
                                    <input type="text" id="search-input" placeholder="Digite o número exato ou parte (Ex: 009/002082/2026)..." style="width: 100%; height: 46px; border-radius: var(--radius-md);">
                                </div>
                            </div>
                            <div class="form-group col-span-1">
                                <label style="font-weight: 600; color: var(--text-primary); margin-bottom: 0.4rem; display: block;">Filtrar por Setor</label>
                                <div class="mov-input-icon-wrapper">
                                    <i class="fa-solid fa-building" style="color: var(--primary-color);"></i>
                                    <select id="filter-sector" style="height: 46px; border-radius: var(--radius-md); background-color: var(--bg-primary); padding-left: 2.8rem; width: 100%;">
                                        <option value="">Todos os setores...</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-group col-span-1">
                                <label style="font-weight: 600; color: var(--text-primary); margin-bottom: 0.4rem; display: block;">Por Auditor/Responsável</label>
                                <div class="mov-input-icon-wrapper">
                                    <i class="fa-solid fa-user-tie" style="color: var(--primary-color);"></i>
                                    <select id="filter-auditor" style="height: 46px; border-radius: var(--radius-md); background-color: var(--bg-primary); padding-left: 2.8rem; width: 100%;">
                                        <option value="">Todos os auditores...</option>
                                    </select>
                                </div>
                            </div>

                            <!-- Tipo de Filtro -->
                            <input type="hidden" id="filter-mode" value="current">

                            <!-- Linha 2: Botões Simétricos Expandidos -->
                            <div class="form-group col-span-4" style="display: flex; gap: 1rem; margin-top: 0.5rem; align-items: center; width: 100%;">
                                <button id="btn-search-proc" class="btn-primary" style="height: 48px; flex: 3; display: flex; align-items: center; justify-content: center; gap: 0.6rem; background: linear-gradient(135deg, #79b947, #5c9e2b); border: none; box-shadow: 0 4px 10px rgba(121, 185, 71, 0.25); font-weight: 700; font-size: 0.95rem; transition: all 0.25s ease;">
                                    <i class="fa-solid fa-sliders"></i> Filtrar Processos
                                </button>
                                <button id="btn-clear-filters-top" class="btn-secondary" type="button" style="height: 48px; flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.5rem; background: var(--bg-soft); border: 1px solid var(--border-color); color: var(--text-primary); font-weight: 600; font-size: 0.95rem; transition: all 0.25s ease;">
                                    <i class="fa-solid fa-filter-circle-xmark" style="color: var(--text-secondary);"></i> Limpar Filtros
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Seção 3: Resultados da Busca -->
                <div id="search-list-section" class="card mb-2" style="display:none; box-shadow: 0 4px 20px rgba(0,0,0,0.02);">
                    <div class="card-header border-bottom flex-between">
                        <h4>Resultados da Busca Geral (50 em 50)</h4>
                        <button class="btn-secondary" id="btn-back-recent" style="padding: 0.5rem 1rem; display: flex; align-items: center; gap: 0.5rem; font-weight: 600;">
                            <i class="fa-solid fa-arrow-left"></i> Voltar
                        </button>
                    </div>
                    <div class="card-body p-0">
                        <div class="recent-list" id="search-processes-list">
                        </div>
                    </div>
                </div>

                <!-- Seção 4: Detalhes do Processo -->
                <div id="search-results" style="display:none;">
                    <!-- Banner de Alerta de Posse de Setor -->
                    <div id="posse-alert-banner" style="display:none; margin-bottom: 1.25rem;"></div>

                    <div class="flex-between mb-2 search-action-bar" style="background: var(--bg-soft); padding: 0.8rem 1.2rem; border-radius: var(--radius-lg); border: 1px solid var(--border-color); margin-bottom: 1.5rem; gap: 1rem; flex-wrap: wrap;">
                        <button class="btn-secondary" id="btn-clear-search" style="padding: 0.6rem 1.2rem; display: flex; align-items: center; gap: 0.5rem; font-weight: 600; border-radius: var(--radius-md);">
                            <i class="fa-solid fa-arrow-left"></i> Voltar
                        </button>
                        <div style="display:flex; gap:0.75rem; align-items: center; flex-wrap: wrap;">
                            <button class="btn-primary" id="btn-tramitar-proc" style="background: linear-gradient(135deg, #79b947, #5c9e2b); border: none; box-shadow: 0 4px 10px rgba(121, 185, 71, 0.2); display:flex; align-items:center; gap:0.6rem; padding: 0.6rem 1.4rem; font-weight: 700; border-radius: var(--radius-md); transition: all 0.25s ease;">
                                <i class="fa-solid fa-route"></i> Realizar Tramitação
                            </button>
                            <button class="btn-secondary" id="btn-attach-proc" style="display:none; padding: 0.6rem 1.2rem; display: flex; align-items: center; gap: 0.5rem; font-weight: 600; border-radius: var(--radius-md);">
                                <i class="fa-solid fa-link"></i> Apensar Processo
                            </button>
                            <button class="btn-secondary" id="btn-edit-proc" style="display:none; padding: 0.6rem 1.2rem; display: flex; align-items: center; gap: 0.5rem; font-weight: 600; border-radius: var(--radius-md); transition: all 0.25s ease;">
                                <i class="fa-solid fa-pen-to-square"></i> Editar Processo
                            </button>
                            <div id="edit-actions" style="display:none; gap:0.5rem;">
                                <button class="btn-primary" id="btn-save-proc" style="padding: 0.6rem 1.2rem; display: flex; align-items: center; gap: 0.5rem; font-weight: 600; border-radius: var(--radius-md); background: #10b981; border-color: #10b981; color: white;">
                                    <i class="fa-solid fa-check"></i> Salvar
                                </button>
                                <button class="btn-secondary" id="btn-cancel-edit" style="padding: 0.6rem 1.2rem; display: flex; align-items: center; gap: 0.5rem; font-weight: 600; border-radius: var(--radius-md);">
                                    <i class="fa-solid fa-xmark"></i> Cancelar
                                </button>
                            </div>
                            <button class="btn-secondary" id="btn-delete-proc" style="background:#fee2e2; color:#b91c1c; border-color:#fecaca; display:none; padding: 0.6rem 1.2rem; display: flex; align-items: center; gap: 0.5rem; font-weight: 600; border-radius: var(--radius-md); transition: all 0.25s ease;">
                                <i class="fa-solid fa-trash"></i> Excluir Processo
                            </button>
                        </div>
                    </div>
                    
                    <div class="grid-form mb-2">
                        <div class="card col-span-4 search-process-details-card" style="box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
                            <div class="card-header border-bottom">
                                <h4 style="display: flex; align-items: center; gap: 8px; font-weight: 750;">
                                    <i class="fa-solid fa-circle-info" style="color: var(--primary-color);"></i> Informações Gerais do Processo
                                </h4>
                            </div>
                            <div class="card-body" style="padding: 1.5rem;">
                                <div class="details-grid-premium">
                                    <!-- Card 1: Assunto -->
                                    <div class="detail-card-item card-blue">
                                        <div class="detail-card-icon">
                                            <i class="fa-solid fa-file-lines"></i>
                                        </div>
                                        <div class="detail-card-content">
                                            <span class="detail-card-label">Assunto</span>
                                            <span class="detail-card-value" id="res-assunto">-</span>
                                        </div>
                                    </div>
                                    <!-- Card 2: Requerente -->
                                    <div class="detail-card-item card-purple">
                                        <div class="detail-card-icon">
                                            <i class="fa-solid fa-user-tie"></i>
                                        </div>
                                        <div class="detail-card-content">
                                            <span class="detail-card-label">Requerente</span>
                                            <span class="detail-card-value" id="res-requerente">-</span>
                                        </div>
                                    </div>
                                    <!-- Card 3: Documento / CPF CNPJ -->
                                    <div class="detail-card-item card-amber">
                                        <div class="detail-card-icon">
                                            <i class="fa-solid fa-id-card"></i>
                                        </div>
                                        <div class="detail-card-content">
                                            <span class="detail-card-label">CPF / CNPJ</span>
                                            <span class="detail-card-value" id="res-doc">-</span>
                                        </div>
                                    </div>
                                    <!-- Card 4: Localização Atual / Status -->
                                    <div class="detail-card-item card-emerald">
                                        <div class="detail-card-icon">
                                            <i class="fa-solid fa-map-location-dot"></i>
                                        </div>
                                        <div class="detail-card-content">
                                            <span class="detail-card-label">Posse Atual (Status)</span>
                                            <span class="detail-card-value" id="res-status">-</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Seção de Apensos / Apensados -->
                                <div id="res-attachment-info" class="mt-2" style="display:none; padding: 1rem 1.25rem; border-radius: var(--radius-md); background: rgba(59, 130, 246, 0.05); border: 1px solid rgba(59, 130, 246, 0.15); box-shadow: 0 2px 8px rgba(59, 130, 246, 0.05);">
                                    <div class="flex-between">
                                        <div style="display: flex; align-items: center; gap: 0.6rem;">
                                            <i class="fa-solid fa-paperclip text-primary" style="font-size: 1.2rem;"></i>
                                            <span id="res-attachment-text" style="font-size: 0.95rem; font-weight: 600; color: #1e40af;">-</span>
                                        </div>
                                        <button class="btn-secondary" id="btn-detach-main" style="padding: 0.35rem 0.8rem; font-size: 0.8rem; background:white; border-radius: var(--radius-sm); border: 1px solid #bfdbfe; color: #1e40af; font-weight: 600; display:none; transition: all 0.2s ease;">
                                            <i class="fa-solid fa-link-slash"></i> Desapensar
                                        </button>
                                    </div>
                                </div>
                                
                                <div id="res-children-list" class="mt-2" style="display:none; background: var(--bg-soft); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                                    <span class="label" style="display:block; font-weight:600; margin-bottom: 0.5rem; color: var(--text-secondary); text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em;">Processos Apensados a Este</span>
                                    <div id="children-items-container" style="display:flex; flex-wrap:wrap; gap:0.5rem;">
                                        <!-- Children pills here -->
                                    </div>
                                </div>

                                <!-- Seção de Observações -->
                                <div class="mt-2" style="background: var(--bg-soft); padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); margin-top: 1.5rem;">
                                    <span class="label" style="display:block; font-weight:600; margin-bottom: 0.5rem; color: var(--text-secondary); text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em;">Observações Gerais</span>
                                    <p class="text-secondary mt-1" id="res-obs" style="margin:0; line-height: 1.5; font-size: 0.95rem; color: var(--text-primary); font-weight: 400; white-space: pre-line;">-</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="card" style="box-shadow: 0 4px 20px rgba(0,0,0,0.02); margin-top: 1.5rem;">
                        <div class="card-header border-bottom flex-between">
                            <h4 style="display: flex; align-items: center; gap: 8px; font-weight: 750;">
                                <i class="fa-solid fa-history" style="color: var(--primary-color);"></i> Histórico de Movimentações (Linha do Tempo)
                            </h4>
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

                <div id="search-empty" class="card text-center py-5" style="display:none; position: relative; padding: 4rem 2rem; border-radius: var(--radius-lg); box-shadow: 0 4px 20px rgba(0,0,0,0.02);">
                    <button class="btn-secondary" id="btn-clear-empty" style="position:absolute; top:1.25rem; left:1.25rem; display: flex; align-items: center; gap: 0.5rem; font-weight: 600; padding: 0.5rem 1rem;">
                        <i class="fa-solid fa-arrow-left"></i> Voltar
                    </button>
                    <i class="fa-solid fa-folder-open text-secondary mb-2" style="font-size: 3.5rem; opacity: 0.25; color: var(--primary-color);"></i>
                    <h3 style="font-weight: 750; color: var(--accent); margin-bottom: 0.5rem;">Processo não encontrado</h3>
                    <p class="text-secondary mb-3" style="font-size: 0.95rem; max-width: 480px; margin: 0 auto 1.5rem; line-height: 1.5;">Este processo ainda não está cadastrado localmente. Você pode realizar uma nova tramitação e puxar os dados diretamente do STPD.</p>
                    <button id="btn-tramitar-empty" class="btn-primary" style="background: linear-gradient(135deg, #79b947, #5c9e2b); border: none; box-shadow: 0 4px 10px rgba(121, 185, 71, 0.25); width:auto; margin:0 auto; display:flex; align-items:center; gap:0.6rem; padding: 0.75rem 1.75rem; font-weight: 700; border-radius: var(--radius-md); transition: all 0.25s ease;">
                        <i class="fa-solid fa-route"></i> Realizar Tramitação para este Processo
                    </button>
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
        const btnClearFiltersTop = document.getElementById('btn-clear-filters-top');
        const inputSearch = document.getElementById('search-input');
        const filterSector = document.getElementById('filter-sector');
        const filterAuditor = document.getElementById('filter-auditor');
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
        const btnTramitar = document.getElementById('btn-tramitar-proc');
        const btnTramitarEmpty = document.getElementById('btn-tramitar-empty');
        
        const btnEditProc = document.getElementById('btn-edit-proc');
        const btnSaveProc = document.getElementById('btn-save-proc');
        const btnCancelEdit = document.getElementById('btn-cancel-edit');
        const editActions = document.getElementById('edit-actions');
        let isEditing = false;
        let originalData = {};
        
        let currentProcessId = null;

        // Variáveis de paginação para o setor
        let allSectorProcesses = []; // Lista original completa do setor
        let sectorProcesses = [];    // Lista filtrada sendo exibida
        let pageSector = 1;
        const pageSizeSector = 5;

        // Referências aos inputs de filtro do setor
        const sectorQueryInput = document.getElementById('sector-filter-query');
        const sectorMonthSelect = document.getElementById('sector-filter-month');
        const sectorYearSelect = document.getElementById('sector-filter-year');

        // Popular select do Ano do Setor dinamicamente de forma segura
        if (sectorYearSelect) {
            const currentYear = new Date().getFullYear();
            let yearsHtml = '<option value="">Filtrar Ano...</option>';
            for (let y = currentYear + 1; y >= 2020; y--) {
                yearsHtml += `<option value="${y}">${y}</option>`;
            }
            sectorYearSelect.innerHTML = yearsHtml;
        }

        const applySectorFilters = () => {
            const query = (sectorQueryInput ? sectorQueryInput.value : '').trim().toLowerCase();
            const month = sectorMonthSelect ? sectorMonthSelect.value : '';
            const year = sectorYearSelect ? sectorYearSelect.value : '';

            sectorProcesses = allSectorProcesses.filter(m => {
                // Filtro por número sensitivo (ignora barras e hífens se o usuário buscar contínuo)
                if (query) {
                    const cleanNum = m.process_number.toLowerCase().replace(/[^a-z0-9]/g, '');
                    const cleanQuery = query.replace(/[^a-z0-9]/g, '');
                    if (!cleanNum.includes(cleanQuery) && !m.process_number.toLowerCase().includes(query)) {
                        return false;
                    }
                }
                // Filtro por data (Mês / Ano do trâmite)
                if (month || year) {
                    if (!m.movement_date) return false;
                    const dateParts = m.movement_date.split(' ')[0].split('-'); // [YYYY, MM, DD]
                    if (dateParts.length >= 2) {
                        const mYear = dateParts[0]; // YYYY
                        const mMonth = dateParts[1]; // MM
                        if (month && mMonth !== month) {
                            return false;
                        }
                        if (year && mYear !== year) {
                            return false;
                        }
                    } else {
                        return false;
                    }
                }
                return true;
            });

            pageSector = 1;
            renderSectorPage();
        };

        if (sectorQueryInput) sectorQueryInput.addEventListener('input', applySectorFilters);
        if (sectorMonthSelect) sectorMonthSelect.addEventListener('change', applySectorFilters);
        if (sectorYearSelect) sectorYearSelect.addEventListener('change', applySectorFilters);

        // Load Sectors for filter
        try {
            const sectors = await Api.sectors.list();
            filterSector.innerHTML += sectors.map(s => `<option value="${s.id}">${s.alias || s.name}</option>`).join('');
        } catch (e) {
            console.error('Erro ao carregar setores:', e);
        }

        // Load Auditores/Responsáveis ativos para filtro
        try {
            const responsibles = await Api.responsibles.list();
            if (filterAuditor) {
                filterAuditor.innerHTML += responsibles.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
            }
        } catch (e) {
            console.error('Erro ao carregar auditores para filtro:', e);
        }

        const loadSectorProcesses = async () => {
            try {
                const sectorId = user.sector_id;
                const isAdmin = user.role === 'Admin';
                if (!sectorId && !isAdmin) {
                    recentList.innerHTML = '<div class="p-4 text-center text-secondary">Usuário não possui setor associado.</div>';
                    return;
                }

                const titleEl = document.getElementById('recent-section-title');
                if (titleEl) {
                    if (isAdmin && !sectorId) {
                        titleEl.innerHTML = `<i class="fa-solid fa-globe" style="color:var(--primary-color); margin-right: 0.35rem;"></i> Todos os Processos Ativos (Superadmin)`;
                    } else {
                        titleEl.innerHTML = `<i class="fa-solid fa-building" style="color:var(--primary-color); margin-right: 0.35rem;"></i> Processos Atualmente no Seu Setor (${user.sector_name || 'Setor Atual'})`;
                    }
                }

                recentList.innerHTML = '<div class="p-3 text-center text-secondary"><i class="fa-solid fa-spinner fa-spin"></i> Carregando processos...</div>';

                // Traz todos os processos no setor atual para podermos paginar client-side (ou todos se for admin sem setor)
                const list = await Api.movements.search('', sectorId || '', true, '', 1, 1000);
                
                // Garantir ordenação do trâmite mais recente para o mais antigo
                list.sort((a, b) => {
                    const dateA = new Date(a.movement_date || 0);
                    const dateB = new Date(b.movement_date || 0);
                    return dateB - dateA;
                });

                // Resetar inputs dos filtros sensitivos
                if (sectorQueryInput) sectorQueryInput.value = '';
                if (sectorMonthSelect) sectorMonthSelect.value = '';
                if (sectorYearSelect) sectorYearSelect.value = '';

                allSectorProcesses = list;
                sectorProcesses = list;
                pageSector = 1;
                renderSectorPage();
            } catch (err) {
                console.error(err);
                recentList.innerHTML = '<div class="p-4 text-center text-danger">Erro ao carregar processos do seu setor.</div>';
            }
        };

        const renderSectorPage = () => {
            const totalPages = Math.ceil(sectorProcesses.length / pageSizeSector) || 1;
            if (pageSector > totalPages) pageSector = totalPages;
            if (pageSector < 1) pageSector = 1;

            const btnPrev = document.getElementById('btn-sector-prev');
            const btnNext = document.getElementById('btn-sector-next');
            const pageInfo = document.getElementById('sector-page-info');

            if (pageInfo) {
                pageInfo.textContent = `Página ${pageSector} de ${totalPages}`;
            }
            if (btnPrev) {
                btnPrev.disabled = pageSector === 1;
                btnPrev.style.opacity = pageSector === 1 ? '0.4' : '1';
                btnPrev.style.cursor = pageSector === 1 ? 'not-allowed' : 'pointer';
            }
            if (btnNext) {
                btnNext.disabled = pageSector === totalPages;
                btnNext.style.opacity = pageSector === totalPages ? '0.4' : '1';
                btnNext.style.cursor = pageSector === totalPages ? 'not-allowed' : 'pointer';
            }

            if (sectorProcesses.length === 0) {
                recentList.innerHTML = '<div class="p-4 text-center text-secondary">Nenhum processo no seu setor atualmente.</div>';
                return;
            }

            const start = (pageSector - 1) * pageSizeSector;
            const end = start + pageSizeSector;
            const pageItems = sectorProcesses.slice(start, end);

            recentList.innerHTML = pageItems.map(m => `
                <div class="recent-item" data-number="${m.process_number}">
                    <div class="recent-info">
                        <h5>${m.process_number} ${m.parent_id ? '<i class="fa-solid fa-paperclip" title="Apenso" style="font-size:0.8rem; color:var(--text-secondary);"></i>' : (m.attachments_count > 0 ? '<i class="fa-solid fa-link" title="Possui apensos" style="font-size:0.8rem; color:var(--primary-color);"></i>' : '')}</h5>
                        <p>${m.subject || 'Sem assunto'}</p>
                        ${m.parent_id ? `<small style="color:var(--text-secondary); font-size:0.7rem;">Apenso ao ${m.parent_process_number}</small>` : (m.attachments_count > 0 ? `<small style="color:var(--primary-color); font-size:0.7rem;">Possui ${m.attachments_count} apenso(s)</small>` : '')}
                    </div>
                    <div class="recent-status">
                        <span class="badge-${(m.action || 'ENTRADA').toLowerCase()}">${window.app.formatAction(m.action, m.destination_sector)}</span>
                        <p style="font-size: 0.7rem; margin-top: 4px;">${m.movement_date ? window.app.formatDate(m.movement_date) : 'Sem data'}</p>
                    </div>
                </div>
            `).join('');

            document.querySelectorAll('#recent-processes-list .recent-item').forEach(item => {
                item.addEventListener('click', () => {
                    inputSearch.value = item.dataset.number;
                    loadProcessDetails(item.dataset.number);
                });
            });
        };

        // Vincular paginação do setor
        const btnPrevSector = document.getElementById('btn-sector-prev');
        const btnNextSector = document.getElementById('btn-sector-next');
        if (btnPrevSector) {
            btnPrevSector.addEventListener('click', () => {
                if (pageSector > 1) {
                    pageSector--;
                    renderSectorPage();
                }
            });
        }
        if (btnNextSector) {
            btnNextSector.addEventListener('click', () => {
                const totalPages = Math.ceil(sectorProcesses.length / pageSizeSector) || 1;
                if (pageSector < totalPages) {
                    pageSector++;
                    renderSectorPage();
                }
            });
        }

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
            const auditorId = filterAuditor ? filterAuditor.value : '';
            const onlyCurrent = filterMode.value === 'current';
            
            if (!query && !sectorId && !auditorId) {
                window.app.toast('Digite um número ou selecione um setor/auditor para buscar', 'warning');
                return;
            }

            btnSearch.disabled = true;
            btnSearch.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

            try {
                // Realizar busca (limite de 50 registros de cada vez para busca geral)
                const processes = await Api.movements.search(query, sectorId, onlyCurrent, auditorId, 1, 50);
                
                recentSection.style.display = 'none';
                document.getElementById('search-filter-card').style.display = 'none';
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
                btnSearch.innerHTML = '<i class="fa-solid fa-sliders"></i> Filtrar Processos';
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

                    // REGRA DE NEGÓCIO DE POSSE DE PROCESSO (BLOQUEIO DE TRAMITAÇÃO OPERACIONAL)
                    const userSectorId = user.sector_id;
                    const lastSectorId = process.last_destination_sector_id;
                    const lastAction = process.last_action;

                    // Pode movimentar se for Admin/Superadmin, ou se não tiver histórico (novo processo) OU se estiver sob custódia do seu setor e a ação for ENTRADA
                    const canTramitar = (user.role === 'Admin' || !lastSectorId || (lastSectorId == userSectorId && lastAction === 'ENTRADA'));
                    const alertBanner = document.getElementById('posse-alert-banner');

                    if (!canTramitar) {
                        btnTramitar.style.display = 'none';
                        const currentSectorName = lastMov ? lastMov.destination_sector : 'outro setor';
                        const statusDesc = lastAction === 'SAIDA' ? 'Aguardando recebimento' : 'Em posse física';
                        alertBanner.innerHTML = `
                            <div class="alert alert-danger" style="display:flex; align-items:center; gap: 0.75rem; background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2); color: #ef4444; padding: 1rem 1.25rem; border-radius: var(--radius-md); font-weight: 500; font-size: 0.9rem;">
                                <i class="fa-solid fa-triangle-exclamation" style="font-size: 1.25rem;"></i>
                                <span>Este processo encontra-se atualmente em: <strong>${currentSectorName}</strong> (${statusDesc}). A tramitação de nova movimentação é de direito exclusivo do setor detentor da custódia do processo.</span>
                            </div>
                        `;
                        alertBanner.style.display = 'block';
                    } else {
                        btnTramitar.style.display = 'flex';
                        alertBanner.style.display = 'none';
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
                    document.getElementById('search-filter-card').style.display = 'none';
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
                    } else {
                        btnEditProc.style.display = 'none';
                    }
                    if (user.role === 'Admin' || user.role === 'Gestor') {
                        btnDeleteProc.style.display = 'block';
                    } else {
                        btnDeleteProc.style.display = 'none';
                    }
                }
            } catch(e) {
                window.app.toast('Erro ao carregar detalhes', 'error');
            }
        };

        const resetView = () => {
            inputSearch.value = '';
            if (filterSector) filterSector.value = '';
            if (filterAuditor) filterAuditor.value = '';
            resultsDiv.style.display = 'none';
            emptyDiv.style.display = 'none';
            searchListSection.style.display = 'none';
            recentSection.style.display = 'block';
            document.getElementById('search-filter-card').style.display = 'block';
            loadSectorProcesses();
        };

        btnSearch.addEventListener('click', doSearch);
        inputSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') doSearch();
        });
        
        if (btnClearFiltersTop) {
            btnClearFiltersTop.addEventListener('click', () => {
                inputSearch.value = '';
                if (filterSector) filterSector.value = '';
                if (filterAuditor) filterAuditor.value = '';
                filterMode.value = 'current';
                resultsDiv.style.display = 'none';
                searchListSection.style.display = 'none';
                emptyDiv.style.display = 'none';
                recentSection.style.display = 'block';
                document.getElementById('search-filter-card').style.display = 'block';
                loadSectorProcesses();
            });
        }
        
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

        if (btnEditProc) btnEditProc.addEventListener('click', () => toggleEditMode(true));
        if (btnCancelEdit) btnCancelEdit.addEventListener('click', () => toggleEditMode(false));

        if (btnSaveProc) {
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
        }

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
             /* Wrappers de Ícones de Inputs Premium na Busca */
            .mov-input-icon-wrapper {
                position: relative;
                display: flex;
                align-items: center;
                width: 100%;
            }
            .mov-input-icon-wrapper i {
                position: absolute;
                left: 1rem;
                font-size: 1.1rem;
                color: var(--text-secondary);
                pointer-events: none;
                transition: var(--transition);
                z-index: 10;
            }
            .mov-input-icon-wrapper input,
            .mov-input-icon-wrapper select {
                padding-left: 2.8rem !important;
            }
            .mov-input-icon-wrapper input:focus + i,
            .mov-input-icon-wrapper select:focus + i {
                color: var(--primary-color);
            }

            /* Grid Premium de Detalhes do Processo (Cards Glassmorphic) */
            .details-grid-premium {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 1.25rem;
                margin-bottom: 1.5rem;
                width: 100%;
            }
            @media (max-width: 1024px) {
                .details-grid-premium {
                    grid-template-columns: repeat(2, 1fr);
                }
            }
            @media (max-width: 640px) {
                .details-grid-premium {
                    grid-template-columns: 1fr;
                }
            }

            .detail-card-item {
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 1.25rem;
                border-radius: var(--radius-lg);
                border: 1px solid var(--border-color);
                transition: all 0.25s ease;
                background: var(--bg-soft);
                box-shadow: 0 2px 6px rgba(0,0,0,0.01);
            }
            .detail-card-item:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.04);
            }

            /* Variantes de cores para os cards de detalhes */
            .detail-card-item.card-blue {
                background: rgba(59, 130, 246, 0.02);
                border-color: rgba(59, 130, 246, 0.12);
            }
            .detail-card-item.card-blue .detail-card-icon {
                background: rgba(59, 130, 246, 0.08);
                color: #3b82f6;
            }
            .detail-card-item.card-blue:hover {
                border-color: rgba(59, 130, 246, 0.25);
                background: rgba(59, 130, 246, 0.04);
            }

            .detail-card-item.card-purple {
                background: rgba(139, 92, 246, 0.02);
                border-color: rgba(139, 92, 246, 0.12);
            }
            .detail-card-item.card-purple .detail-card-icon {
                background: rgba(139, 92, 246, 0.08);
                color: #8b5cf6;
            }
            .detail-card-item.card-purple:hover {
                border-color: rgba(139, 92, 246, 0.25);
                background: rgba(139, 92, 246, 0.04);
            }

            .detail-card-item.card-amber {
                background: rgba(245, 158, 11, 0.02);
                border-color: rgba(245, 158, 11, 0.12);
            }
            .detail-card-item.card-amber .detail-card-icon {
                background: rgba(245, 158, 11, 0.08);
                color: #f59e0b;
            }
            .detail-card-item.card-amber:hover {
                border-color: rgba(245, 158, 11, 0.25);
                background: rgba(245, 158, 11, 0.04);
            }

            .detail-card-item.card-emerald {
                background: rgba(16, 185, 129, 0.02);
                border-color: rgba(16, 185, 129, 0.12);
            }
            .detail-card-item.card-emerald .detail-card-icon {
                background: rgba(16, 185, 129, 0.08);
                color: #10b981;
            }
            .detail-card-item.card-emerald:hover {
                border-color: rgba(16, 185, 129, 0.25);
                background: rgba(16, 185, 129, 0.04);
            }

            .detail-card-icon {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 44px;
                height: 44px;
                border-radius: var(--radius-md);
                font-size: 1.25rem;
                flex-shrink: 0;
            }

            .detail-card-content {
                display: flex;
                flex-direction: column;
                min-width: 0;
            }
            .detail-card-label {
                font-size: 0.72rem;
                text-transform: uppercase;
                font-weight: 600;
                color: var(--text-secondary);
                letter-spacing: 0.03em;
                margin-bottom: 0.15rem;
            }
            .detail-card-value {
                font-size: 0.92rem;
                font-weight: 600;
                color: var(--text-primary);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            /* Ações de Topo com Efeito */
            .search-action-bar button {
                transition: all 0.25s ease;
            }
            .search-action-bar button:hover {
                transform: translateY(-1px);
            }
            #btn-tramitar-proc:hover {
                box-shadow: 0 6px 15px rgba(121, 185, 71, 0.35);
            }
            #btn-clear-filters-top:hover {
                background: var(--border-color);
            }

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
        loadSectorProcesses();

        btnTramitar.addEventListener('click', () => {
            const num = inputSearch.value.trim();
            if (num) {
                window.location.hash = `#movements/${num}`;
            } else {
                window.app.toast('Busque ou selecione um processo primeiro', 'warning');
            }
        });

        btnTramitarEmpty.addEventListener('click', () => {
            const num = inputSearch.value.trim();
            if (num) {
                window.location.hash = `#movements/${num}`;
            }
        });

        // Expor funções utilitárias e instâncias no objeto searchView
        this.loadProcessDetails = loadProcessDetails;
        this.loadSectorProcesses = loadSectorProcesses;

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
