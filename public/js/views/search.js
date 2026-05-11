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

                <!-- PAINEL PRINCIPAL (Divide o fluxo em 3 Áreas Claras e Premium) -->
                <div id="main-panel">
                    
                    <!-- ÁREA 1: Processos em Análise no Setor (Custódia Ativa) -->
                    <div id="analysis-section" class="card mb-4" style="box-shadow: 0 4px 20px rgba(0,0,0,0.02); border-left: 5px solid #0072bc;">
                        <div class="card-header border-bottom flex-between" style="flex-wrap: wrap; gap: 1rem; background: rgba(0, 114, 188, 0.02);">
                            <h4 style="display: flex; align-items: center; gap: 10px; font-weight: 750; margin: 0; color: #0072bc; font-family: 'Outfit', sans-serif;">
                                <i class="fa-solid fa-hourglass-half"></i> ÁREA 1: Processos em Análise no Setor
                            </h4>
                            <!-- Controles de Paginação -->
                            <div style="display: flex; gap: 0.5rem; align-items: center;">
                                <button id="btn-analysis-prev" class="btn-secondary" style="padding: 0.35rem 0.75rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); background: var(--bg-soft); cursor: pointer;"><i class="fa-solid fa-chevron-left"></i></button>
                                <span id="analysis-page-info" style="font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); min-width: 90px; text-align: center;">Página 1 de 1</span>
                                <button id="btn-analysis-next" class="btn-secondary" style="padding: 0.35rem 0.75rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); background: var(--bg-soft); cursor: pointer;"><i class="fa-solid fa-chevron-right"></i></button>
                            </div>
                        </div>
                        <div class="card-body p-0">
                            <!-- Filtro sensitivo local -->
                            <div style="padding: 0.75rem 1.25rem; border-bottom: 1px solid var(--border-color); background: var(--bg-soft);">
                                <div class="mov-input-icon-wrapper" style="width: 100%;">
                                    <i class="fa-solid fa-filter" style="color: #0072bc;"></i>
                                    <input type="text" id="analysis-filter-query" placeholder="Filtrar processos em análise por número (sensitivo)..." style="width: 100%; height: 38px; border-radius: var(--radius-md); font-size: 0.85rem; padding-left: 2.5rem; background: var(--bg-primary); border: 1px solid var(--border-color);">
                                </div>
                            </div>
                            <div class="recent-list" id="analysis-processes-list">
                                <div class="p-3 text-center text-secondary">
                                    <i class="fa-solid fa-spinner fa-spin"></i> Carregando processos em análise...
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- ÁREA 2: Processos já Tramitados (Histórico de Trâmites) -->
                    <div id="tramitados-section" class="card mb-4" style="box-shadow: 0 4px 20px rgba(0,0,0,0.02); border-left: 5px solid #8b5cf6;">
                        <div class="card-header border-bottom flex-between" style="flex-wrap: wrap; gap: 1rem; background: rgba(139, 92, 246, 0.02);">
                            <h4 style="display: flex; align-items: center; gap: 10px; font-weight: 750; margin: 0; color: #8b5cf6; font-family: 'Outfit', sans-serif;">
                                <i class="fa-solid fa-history"></i> ÁREA 2: Processos já Tramitados
                            </h4>
                            <!-- Controles de Paginação -->
                            <div style="display: flex; gap: 0.5rem; align-items: center;">
                                <button id="btn-tramitados-prev" class="btn-secondary" style="padding: 0.35rem 0.75rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); background: var(--bg-soft); cursor: pointer;"><i class="fa-solid fa-chevron-left"></i></button>
                                <span id="tramitados-page-info" style="font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); min-width: 90px; text-align: center;">Página 1 de 1</span>
                                <button id="btn-tramitados-next" class="btn-secondary" style="padding: 0.35rem 0.75rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); background: var(--bg-soft); cursor: pointer;"><i class="fa-solid fa-chevron-right"></i></button>
                            </div>
                        </div>
                        <div class="card-body p-0">
                            <!-- Filtro sensitivo local -->
                            <div style="padding: 0.75rem 1.25rem; border-bottom: 1px solid var(--border-color); background: var(--bg-soft);">
                                <div class="mov-input-icon-wrapper" style="width: 100%;">
                                    <i class="fa-solid fa-filter" style="color: #8b5cf6;"></i>
                                    <input type="text" id="tramitados-filter-query" placeholder="Filtrar processos tramitados por número (sensitivo)..." style="width: 100%; height: 38px; border-radius: var(--radius-md); font-size: 0.85rem; padding-left: 2.5rem; background: var(--bg-primary); border: 1px solid var(--border-color);">
                                </div>
                            </div>
                            <div class="recent-list" id="tramitados-processes-list">
                                <div class="p-3 text-center text-secondary">
                                    <i class="fa-solid fa-spinner fa-spin"></i> Carregando processos já tramitados...
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- ÁREA 3: Buscar Processos Fora do Setor (Consulta Avançada) -->
                    <div id="search-filter-card" class="card mb-4" style="box-shadow: 0 4px 20px rgba(0,0,0,0.02); border-left: 5px solid #f59e0b;">
                        <div class="card-header border-bottom" style="background: rgba(245, 158, 11, 0.02);">
                            <h3 style="font-size: 1.15rem; display: flex; align-items: center; gap: 10px; font-weight: 750; margin: 0; color: #f59e0b; font-family: 'Outfit', sans-serif;"><i class="fa-solid fa-magnifying-glass"></i> ÁREA 3: Buscar Processos Fora do Setor</h3>
                            <p class="text-secondary" style="font-size: 0.85rem; margin-top: 0.25rem;">Consulte processos que não estão em sua custódia ativa (busca geral restrita ao seu escopo de acesso).</p>
                        </div>
                        <div class="card-body" style="padding: 1.5rem;">
                            <div class="grid-form" style="gap:1.25rem;">
                                <!-- Linha 1: Campos de Busca -->
                                <div class="form-group col-span-2">
                                    <label style="font-weight: 600; color: var(--text-primary); margin-bottom: 0.4rem; display: block;">Número do Processo</label>
                                    <div class="mov-input-icon-wrapper" style="width: 100%;">
                                        <i class="fa-solid fa-magnifying-glass" style="color: #f59e0b;"></i>
                                        <input type="text" id="search-input" placeholder="Digite o número exato ou parcial (Ex: 009/002082/2026)..." style="width: 100%; height: 46px; border-radius: var(--radius-md);">
                                    </div>
                                </div>
                                <div class="form-group col-span-1">
                                    <label style="font-weight: 600; color: var(--text-primary); margin-bottom: 0.4rem; display: block;">Filtrar por Setor</label>
                                    <div class="mov-input-icon-wrapper">
                                        <i class="fa-solid fa-building" style="color: #f59e0b;"></i>
                                        <select id="filter-sector" style="height: 46px; border-radius: var(--radius-md); background-color: var(--bg-primary); padding-left: 2.8rem; width: 100%;">
                                            <option value="">Todos os setores...</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="form-group col-span-1">
                                    <label style="font-weight: 600; color: var(--text-primary); margin-bottom: 0.4rem; display: block;">Por Auditor/Responsável</label>
                                    <div class="mov-input-icon-wrapper">
                                        <i class="fa-solid fa-user-tie" style="color: #f59e0b;"></i>
                                        <select id="filter-auditor" style="height: 46px; border-radius: var(--radius-md); background-color: var(--bg-primary); padding-left: 2.8rem; width: 100%;">
                                            <option value="">Todos os auditores...</option>
                                        </select>
                                    </div>
                                </div>

                                <input type="hidden" id="filter-mode" value="current">

                                <!-- Linha 2: Botões Simétricos Expandidos -->
                                <div class="form-group col-span-4" style="display: flex; gap: 1rem; margin-top: 0.5rem; align-items: center; width: 100%;">
                                    <button id="btn-search-proc" class="btn-primary" style="height: 48px; flex: 3; display: flex; align-items: center; justify-content: center; gap: 0.6rem; background: linear-gradient(135deg, #f59e0b, #d97706); border: none; box-shadow: 0 4px 10px rgba(245, 158, 11, 0.25); font-weight: 700; font-size: 0.95rem; transition: all 0.25s ease; color: white;">
                                        <i class="fa-solid fa-search"></i> Buscar Fora do Setor
                                    </button>
                                    <button id="btn-clear-filters-top" class="btn-secondary" type="button" style="height: 48px; flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.5rem; background: var(--bg-soft); border: 1px solid var(--border-color); color: var(--text-primary); font-weight: 600; font-size: 0.95rem; transition: all 0.25s ease;">
                                        <i class="fa-solid fa-filter-circle-xmark" style="color: var(--text-secondary);"></i> Limpar Filtros
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                <!-- SEÇÃO DE RESULTADOS DA BUSCA -->
                <div id="search-list-section" class="card mb-4" style="display:none; box-shadow: 0 4px 20px rgba(0,0,0,0.02);">
                    <div class="card-header border-bottom flex-between">
                        <h4 style="font-weight: 750; color: #f59e0b;"><i class="fa-solid fa-list"></i> Resultados da Busca Fora do Setor</h4>
                        <button class="btn-secondary" id="btn-back-recent" style="padding: 0.5rem 1rem; display: flex; align-items: center; gap: 0.5rem; font-weight: 600;">
                            <i class="fa-solid fa-arrow-left"></i> Voltar
                        </button>
                    </div>
                    <div class="card-body p-0">
                        <div class="recent-list" id="search-processes-list">
                        </div>
                    </div>
                </div>

                <!-- SEÇÃO DE DETALHES DO PROCESSO (Ativa após clique) -->
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
                                <h4 style="display: flex; align-items: center; gap: 8px; font-weight: 750; flex-wrap: wrap;">
                                    <i class="fa-solid fa-circle-info" style="color: var(--primary-color);"></i> Informações Gerais do Processo:
                                    <span id="res-process-number-badge" style="background: rgba(0, 114, 188, 0.1); color: #0072bc; padding: 4px 12px; border-radius: 6px; font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 1.15rem; margin-left: 5px; border: 1px solid rgba(0, 114, 188, 0.2);"></span>
                                </h4>
                            </div>
                            <div class="card-body" style="padding: 1.5rem;">
                                <div class="details-grid-premium">
                                    <!-- Card 1: Número do Processo -->
                                    <div class="detail-card-item card-indigo">
                                        <div class="detail-card-icon">
                                            <i class="fa-solid fa-folder-open"></i>
                                        </div>
                                        <div class="detail-card-content">
                                            <span class="detail-card-label">Número do Processo</span>
                                            <span class="detail-card-value" id="res-process-number">-</span>
                                        </div>
                                    </div>
                                    <!-- Card 2: Assunto -->
                                    <div class="detail-card-item card-blue">
                                        <div class="detail-card-icon">
                                            <i class="fa-solid fa-file-lines"></i>
                                        </div>
                                        <div class="detail-card-content">
                                            <span class="detail-card-label">Assunto</span>
                                            <span class="detail-card-value" id="res-assunto">-</span>
                                        </div>
                                    </div>
                                    <!-- Card 3: Requerente -->
                                    <div class="detail-card-item card-purple">
                                        <div class="detail-card-icon">
                                            <i class="fa-solid fa-user-tie"></i>
                                        </div>
                                        <div class="detail-card-content">
                                            <span class="detail-card-label">Requerente</span>
                                            <span class="detail-card-value" id="res-requerente">-</span>
                                        </div>
                                    </div>
                                    <!-- Card 4: Documento / CPF CNPJ -->
                                    <div class="detail-card-item card-amber">
                                        <div class="detail-card-icon">
                                            <i class="fa-solid fa-id-card"></i>
                                        </div>
                                        <div class="detail-card-content">
                                            <span class="detail-card-label">CPF / CNPJ</span>
                                            <span class="detail-card-value" id="res-doc">-</span>
                                        </div>
                                    </div>
                                    <!-- Card 5: Setor de Custódia / Posse -->
                                    <div class="detail-card-item card-emerald">
                                        <div class="detail-card-icon">
                                            <i class="fa-solid fa-building"></i>
                                        </div>
                                        <div class="detail-card-content">
                                            <span class="detail-card-label">Setor de Custódia</span>
                                            <span class="detail-card-value" id="res-sector">-</span>
                                        </div>
                                    </div>
                                    <!-- Card 6: Auditor Responsável -->
                                    <div class="detail-card-item card-teal">
                                        <div class="detail-card-icon">
                                            <i class="fa-solid fa-user-shield"></i>
                                        </div>
                                        <div class="detail-card-content">
                                            <span class="detail-card-label">Auditor Responsável</span>
                                            <span class="detail-card-value" id="res-responsible">-</span>
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
                    background: rgba(0, 114, 188, 0.1);
                    color: #0072bc;
                    padding: 0.25rem 0.65rem;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    font-weight: 700;
                }
                .badge-saida {
                    background: rgba(139, 92, 246, 0.1);
                    color: #8b5cf6;
                    padding: 0.25rem 0.65rem;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    font-weight: 700;
                }
            </style>
        `;

        // Elementos de Controle Geral
        const btnSearch = document.getElementById('btn-search-proc');
        const btnClearFiltersTop = document.getElementById('btn-clear-filters-top');
        const inputSearch = document.getElementById('search-input');
        const filterSector = document.getElementById('filter-sector');
        const filterAuditor = document.getElementById('filter-auditor');
        const resultsDiv = document.getElementById('search-results');
        const emptyDiv = document.getElementById('search-empty');
        const mainPanel = document.getElementById('main-panel');
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

        // PAGINAÇÃO E FILTROS: ÁREA 1 (Processos em Análise)
        let pageAnalysis = 1;
        const limitAnalysis = 5;
        let searchAnalysis = '';

        // PAGINAÇÃO E FILTROS: ÁREA 2 (Processos já Tramitados)
        let pageTramitados = 1;
        const limitTramitados = 5;
        let searchTramitados = '';

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

        // CARREGAR ÁREA 1: PROCESSOS EM ANÁLISE
        const loadAnalysisProcesses = async () => {
            try {
                const listContainer = document.getElementById('analysis-processes-list');
                const pageInfo = document.getElementById('analysis-page-info');
                const btnPrev = document.getElementById('btn-analysis-prev');
                const btnNext = document.getElementById('btn-analysis-next');
                
                listContainer.innerHTML = '<div class="p-3 text-center text-secondary"><i class="fa-solid fa-spinner fa-spin"></i> Carregando processos em análise...</div>';
                
                const data = await Api.movements.search(searchAnalysis, '', false, '', pageAnalysis, limitAnalysis, 'analysis');
                const processes = data.processes || [];
                const pagination = data.pagination || { total: 0, pages: 1 };
                
                if (pageInfo) pageInfo.textContent = `Página ${pagination.page} de ${pagination.pages || 1}`;
                if (btnPrev) {
                    btnPrev.disabled = pagination.page === 1;
                    btnPrev.style.opacity = pagination.page === 1 ? '0.4' : '1';
                }
                if (btnNext) {
                    btnNext.disabled = pagination.page >= pagination.pages;
                    btnNext.style.opacity = pagination.page >= pagination.pages ? '0.4' : '1';
                }
                
                if (processes.length === 0) {
                    listContainer.innerHTML = '<div class="p-4 text-center text-secondary">Nenhum processo em análise no seu setor atualmente.</div>';
                    return;
                }
                
                listContainer.innerHTML = processes.map(m => `
                    <div class="recent-item" data-number="${m.process_number}" style="border-left: 4px solid #0072bc; background: rgba(0, 114, 188, 0.015); display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; margin-bottom: 10px; border-radius: 8px; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;">
                        <div class="recent-info" style="flex: 1; padding-right: 15px;">
                            <h5 style="color: #0072bc; font-weight: 750; font-family: 'Outfit', sans-serif; margin: 0 0 4px 0; font-size: 1.05rem; display: flex; align-items: center; gap: 8px;">
                                ${m.process_number} 
                                ${m.parent_id ? '<i class="fa-solid fa-paperclip" title="Apenso" style="font-size:0.8rem; color:var(--text-secondary);"></i>' : (m.attachments_count > 0 ? '<i class="fa-solid fa-link" title="Possui apensos" style="font-size:0.8rem; color:var(--primary-color);"></i>' : '')}
                            </h5>
                            <p style="font-weight: 500; font-size: 0.88rem; margin: 0 0 6px 0; color: var(--text-primary);">${m.subject || 'Sem assunto'}</p>
                            <div style="display: flex; flex-wrap: wrap; gap: 16px; font-size: 0.76rem; color: var(--text-secondary);">
                                <span style="display: flex; align-items: center; gap: 4px;"><i class="fa-solid fa-user-tie" style="color: #0072bc;"></i> Auditor: <strong style="color: var(--text-primary); font-weight: 600;">${m.responsible_name || 'Não atribuído'}</strong></span>
                                <span style="display: flex; align-items: center; gap: 4px;"><i class="fa-solid fa-building" style="color: #0072bc;"></i> Setor: <strong style="color: var(--text-primary); font-weight: 600;">${m.last_sector_name || '-'}</strong></span>
                            </div>
                        </div>
                        <div class="recent-status" style="text-align: right; min-width: 140px; display: flex; flex-direction: column; align-items: flex-end;">
                            <span class="badge-entrada" style="letter-spacing: 0.02em; font-size: 0.72rem; font-weight: 600; padding: 3px 8px; border-radius: 4px; background: rgba(0, 114, 188, 0.1); color: #0072bc; border: 1px solid rgba(0, 114, 188, 0.2);">EM CUSTÓDIA</span>
                            <p style="font-size: 0.72rem; margin: 6px 0 0 0; font-weight: 500; color: var(--text-secondary);"><i class="fa-solid fa-calendar-days" style="font-size: 0.7rem;"></i> ${m.movement_date ? window.app.formatDate(m.movement_date) : 'Sem data'}</p>
                        </div>
                    </div>
                `).join('');
                
                listContainer.querySelectorAll('.recent-item').forEach(item => {
                    item.addEventListener('click', () => {
                        inputSearch.value = item.dataset.number;
                        loadProcessDetails(item.dataset.number);
                    });
                });
            } catch (err) {
                console.error(err);
                document.getElementById('analysis-processes-list').innerHTML = '<div class="p-4 text-center text-danger">Erro ao carregar processos em análise.</div>';
            }
        };

        // CARREGAR ÁREA 2: PROCESSOS JÁ TRAMITADOS
        const loadTramitadosProcesses = async () => {
            try {
                const listContainer = document.getElementById('tramitados-processes-list');
                const pageInfo = document.getElementById('tramitados-page-info');
                const btnPrev = document.getElementById('btn-tramitados-prev');
                const btnNext = document.getElementById('btn-tramitados-next');
                
                listContainer.innerHTML = '<div class="p-3 text-center text-secondary"><i class="fa-solid fa-spinner fa-spin"></i> Carregando processos tramitados...</div>';
                
                const data = await Api.movements.search(searchTramitados, '', false, '', pageTramitados, limitTramitados, 'tramitados');
                const processes = data.processes || [];
                const pagination = data.pagination || { total: 0, pages: 1 };
                
                if (pageInfo) pageInfo.textContent = `Página ${pagination.page} de ${pagination.pages || 1}`;
                if (btnPrev) {
                    btnPrev.disabled = pagination.page === 1;
                    btnPrev.style.opacity = pagination.page === 1 ? '0.4' : '1';
                }
                if (btnNext) {
                    btnNext.disabled = pagination.page >= pagination.pages;
                    btnNext.style.opacity = pagination.page >= pagination.pages ? '0.4' : '1';
                }
                
                if (processes.length === 0) {
                    listContainer.innerHTML = '<div class="p-4 text-center text-secondary">Nenhum processo tramitado anteriormente por este setor.</div>';
                    return;
                }
                
                listContainer.innerHTML = processes.map(m => `
                    <div class="recent-item" data-number="${m.process_number}" style="border-left: 4px solid #8b5cf6; background: rgba(139, 92, 246, 0.015); display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; margin-bottom: 10px; border-radius: 8px; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;">
                        <div class="recent-info" style="flex: 1; padding-right: 15px;">
                            <h5 style="color: #8b5cf6; font-weight: 750; font-family: 'Outfit', sans-serif; margin: 0 0 4px 0; font-size: 1.05rem; display: flex; align-items: center; gap: 8px;">
                                ${m.process_number} 
                                ${m.parent_id ? '<i class="fa-solid fa-paperclip" title="Apenso" style="font-size:0.8rem; color:var(--text-secondary);"></i>' : (m.attachments_count > 0 ? '<i class="fa-solid fa-link" title="Possui apensos" style="font-size:0.8rem; color:var(--primary-color);"></i>' : '')}
                            </h5>
                            <p style="font-weight: 500; font-size: 0.88rem; margin: 0 0 6px 0; color: var(--text-primary);">${m.subject || 'Sem assunto'}</p>
                            <div style="display: flex; flex-wrap: wrap; gap: 16px; font-size: 0.76rem; color: var(--text-secondary);">
                                <span style="display: flex; align-items: center; gap: 4px;"><i class="fa-solid fa-user-tie" style="color: #8b5cf6;"></i> Auditor: <strong style="color: var(--text-primary); font-weight: 600;">${m.responsible_name || 'Não atribuído'}</strong></span>
                                <span style="display: flex; align-items: center; gap: 4px;"><i class="fa-solid fa-building" style="color: #8b5cf6;"></i> Destino: <strong style="color: var(--text-primary); font-weight: 600;">${m.last_sector_name || '-'}</strong></span>
                            </div>
                        </div>
                        <div class="recent-status" style="text-align: right; min-width: 140px; display: flex; flex-direction: column; align-items: flex-end;">
                            <span class="badge-saida" style="letter-spacing: 0.02em; font-size: 0.72rem; font-weight: 600; padding: 3px 8px; border-radius: 4px; background: rgba(139, 92, 246, 0.1); color: #8b5cf6; border: 1px solid rgba(139, 92, 246, 0.2);">HISTÓRICO</span>
                            <p style="font-size: 0.72rem; margin: 6px 0 0 0; font-weight: 500; color: var(--text-secondary);"><i class="fa-solid fa-calendar-days" style="font-size: 0.7rem;"></i> ${m.movement_date ? window.app.formatDate(m.movement_date) : 'Sem data'}</p>
                        </div>
                    </div>
                `).join('');
                
                listContainer.querySelectorAll('.recent-item').forEach(item => {
                    item.addEventListener('click', () => {
                        inputSearch.value = item.dataset.number;
                        loadProcessDetails(item.dataset.number);
                    });
                });
            } catch (err) {
                console.error(err);
                document.getElementById('tramitados-processes-list').innerHTML = '<div class="p-4 text-center text-danger">Erro ao carregar processos já tramitados.</div>';
            }
        };

        // Paginação Área 1
        document.getElementById('btn-analysis-prev').addEventListener('click', () => {
            if (pageAnalysis > 1) {
                pageAnalysis--;
                loadAnalysisProcesses();
            }
        });
        document.getElementById('btn-analysis-next').addEventListener('click', () => {
            pageAnalysis++;
            loadAnalysisProcesses();
        });

        // Paginação Área 2
        document.getElementById('btn-tramitados-prev').addEventListener('click', () => {
            if (pageTramitados > 1) {
                pageTramitados--;
                loadTramitadosProcesses();
            }
        });
        document.getElementById('btn-tramitados-next').addEventListener('click', () => {
            pageTramitados++;
            loadTramitadosProcesses();
        });

        // Debounce para filtros sensitivos rápidos
        let analysisTimeout = null;
        document.getElementById('analysis-filter-query').addEventListener('input', (e) => {
            clearTimeout(analysisTimeout);
            analysisTimeout = setTimeout(() => {
                searchAnalysis = e.target.value.trim();
                pageAnalysis = 1;
                loadAnalysisProcesses();
            }, 300);
        });

        let tramitadosTimeout = null;
        document.getElementById('tramitados-filter-query').addEventListener('input', (e) => {
            clearTimeout(tramitadosTimeout);
            tramitadosTimeout = setTimeout(() => {
                searchTramitados = e.target.value.trim();
                pageTramitados = 1;
                loadTramitadosProcesses();
            }, 300);
        });

        // Item de Renderização da Busca Fora do Setor
        const renderProcessItem = (m) => `
            <div class="recent-item search-result-item" data-number="${m.process_number}" style="border-left: 4px solid #f59e0b; background: rgba(245, 158, 11, 0.015); display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; margin-bottom: 10px; border-radius: 8px; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;">
                <div class="recent-info" style="flex: 1; padding-right: 15px;">
                    <h5 style="color: #f59e0b; font-weight: 750; font-family: 'Outfit', sans-serif; margin: 0 0 4px 0; font-size: 1.05rem; display: flex; align-items: center; gap: 8px;">
                        ${m.process_number} 
                        ${m.parent_id ? '<i class="fa-solid fa-paperclip" title="Apenso" style="font-size:0.8rem; color:var(--text-secondary);"></i>' : (m.attachments_count > 0 ? '<i class="fa-solid fa-link" title="Possui apensos" style="font-size:0.8rem; color:var(--primary-color);"></i>' : '')}
                    </h5>
                    <p style="font-weight: 500; font-size: 0.88rem; margin: 0 0 6px 0; color: var(--text-primary);">${m.subject || 'Sem assunto'}</p>
                    <div style="display: flex; flex-wrap: wrap; gap: 16px; font-size: 0.76rem; color: var(--text-secondary); margin-bottom: 8px;">
                        <span style="display: flex; align-items: center; gap: 4px;"><i class="fa-solid fa-user-tie" style="color: #f59e0b;"></i> Auditor: <strong style="color: var(--text-primary); font-weight: 600;">${m.responsible_name || 'Não atribuído'}</strong></span>
                        <span style="display: flex; align-items: center; gap: 4px;"><i class="fa-solid fa-building" style="color: #f59e0b;"></i> Local: <strong style="color: var(--text-primary); font-weight: 600;">${m.last_sector_name || '-'}</strong></span>
                    </div>
                    <div style="display:flex; gap:0.5rem;">
                        <span class="badge-action btn-detail" data-number="${m.process_number}" style="background:#0072bc; color:white; border-radius:4px; padding:3px 10px; font-size:0.75rem; font-weight:600; cursor:pointer; display: inline-flex; align-items: center; gap: 4px; transition: opacity 0.15s;"><i class="fa-solid fa-eye"></i> Detalhar</span>
                        <span class="badge-action btn-move-fast" data-number="${m.process_number}" style="background:#79b947; color:white; border-radius:4px; padding:3px 10px; font-size:0.75rem; font-weight:600; cursor:pointer; display: inline-flex; align-items: center; gap: 4px; transition: opacity 0.15s;"><i class="fa-solid fa-share"></i> Tramitar</span>
                    </div>
                </div>
                <div class="recent-status" style="text-align: right; min-width: 140px; display: flex; flex-direction: column; align-items: flex-end;">
                    <span class="${m.action === 'ENTRADA' ? 'badge-entrada' : 'badge-saida'}" style="letter-spacing: 0.02em; font-size: 0.72rem; font-weight: 600; padding: 3px 8px; border-radius: 4px; background: ${m.action === 'ENTRADA' ? 'rgba(0, 114, 188, 0.1)' : 'rgba(239, 68, 68, 0.1)'}; color: ${m.action === 'ENTRADA' ? '#0072bc' : '#ef4444'}; border: 1px solid ${m.action === 'ENTRADA' ? 'rgba(0, 114, 188, 0.2)' : 'rgba(239, 68, 68, 0.2)'};">${m.action === 'ENTRADA' ? 'CUSTÓDIA ATIVA' : 'SAÍDA / TRÂMITE'}</span>
                    <p style="font-size: 0.72rem; margin: 6px 0 0 0; font-weight: 500; color: var(--text-secondary);"><i class="fa-solid fa-calendar-days" style="font-size: 0.7rem;"></i> ${m.movement_date ? window.app.formatDate(m.movement_date) : 'Sem data'}</p>
                </div>
            </div>
        `;

        // Executar Busca Geral (Área 3)
        const doSearch = async () => {
            const query = inputSearch.value.trim();
            const sectorId = filterSector.value;
            const auditorId = filterAuditor ? filterAuditor.value : '';
            const onlyCurrent = false; // Queremos varrer todas as ocorrências de trâmites fora do setor
            
            if (!query && !sectorId && !auditorId) {
                window.app.toast('Digite um número ou selecione um setor/auditor para buscar', 'warning');
                return;
            }

            btnSearch.disabled = true;
            btnSearch.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Buscando...';

            try {
                const data = await Api.movements.search(query, sectorId, onlyCurrent, auditorId, 1, 50, 'outside');
                const processes = data.processes || [];
                
                mainPanel.style.display = 'none';
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

                    searchList.querySelectorAll('.search-result-item').forEach(item => {
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
                window.app.toast(err.message || 'Erro ao buscar processos', 'error');
            } finally {
                btnSearch.disabled = false;
                btnSearch.innerHTML = '<i class="fa-solid fa-search"></i> Buscar Fora do Setor';
            }
        };

        // CARREGAR DETALHES COMPLETOS DE UM PROCESSO
        const loadProcessDetails = async (number) => {
            try {
                const data = await Api.movements.getByNumber(number);
                if (data && data.exists) {
                    const process = data.process;
                    // Carregar histórico completo do processo
                    const history = await Api.movements.listByProcess(process.id);
                    
                    // Preencher campos informativos
                    const badgeElem = document.getElementById('res-process-number-badge');
                    if (badgeElem) badgeElem.textContent = process.process_number || '';
                    
                    const numElem = document.getElementById('res-process-number');
                    if (numElem) numElem.textContent = process.process_number || '';

                    document.getElementById('res-assunto').textContent = process.subject || 'Processo Importado';
                    document.getElementById('res-requerente').textContent = process.requester || 'Importação de Dados';
                    document.getElementById('res-doc').textContent = process.document_number || 'Não informado';
                    document.getElementById('res-obs').textContent = process.observations || 'Sem observações';
                    
                    // Status e Posse Atual (Novos Cards)
                    const lastMov = history[0];
                    const sectorElem = document.getElementById('res-sector');
                    const respElem = document.getElementById('res-responsible');

                    if (lastMov) {
                        if (sectorElem) sectorElem.textContent = lastMov.destination_sector || '-';
                        if (respElem) respElem.textContent = lastMov.responsible_name || 'Não atribuído';
                    } else {
                        if (sectorElem) sectorElem.textContent = '-';
                        if (respElem) respElem.textContent = 'Não atribuído';
                    }

                    // REGRA DE CUSTÓDIA / POSSE DE PROCESSO (BOTÃO TRAMITAR)
                    const lastSectorId = process.last_destination_sector_id;
                    const lastAction = process.last_action;

                    // O usuário pode tramitar se for Admin OU se não tiver histórico OU se estiver sob custódia de um dos seus setores autorizados (via backend)
                    const canTramitar = (user.role === 'Admin' || !lastSectorId || process.is_authorized_custody);
                    const alertBanner = document.getElementById('posse-alert-banner');

                    if (!canTramitar) {
                        btnTramitar.style.display = 'none';
                        const currentSectorName = lastMov ? lastMov.destination_sector : 'outro setor';
                        const statusDesc = lastAction === 'SAIDA' ? 'Aguardando recebimento' : 'Em posse física';
                        alertBanner.innerHTML = `
                            <div class="alert alert-danger" style="display:flex; align-items:center; gap: 0.75rem; background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2); color: #ef4444; padding: 1rem 1.25rem; border-radius: var(--radius-md); font-weight: 500; font-size: 0.9rem;">
                                <i class="fa-solid fa-triangle-exclamation" style="font-size: 1.25rem;"></i>
                                <span>Este processo encontra-se atualmente em: <strong>${currentSectorName}</strong> (${statusDesc}). A tramitação é de direito exclusivo dos responsáveis com posse ativa sobre a custódia do processo.</span>
                            </div>
                        `;
                        alertBanner.style.display = 'block';
                    } else {
                        btnTramitar.style.display = 'flex';
                        alertBanner.style.display = 'none';
                    }

                    // Seção de apensos
                    const attachDiv = document.getElementById('res-attachment-info');
                    const attachText = document.getElementById('res-attachment-text');
                    const childrenDiv = document.getElementById('res-children-list');
                    const childrenContainer = document.getElementById('children-items-container');
                    
                    if (process.parent_id) {
                        attachDiv.style.display = 'block';
                        attachText.textContent = `Este processo está APENSADO ao processo ${process.parent_process_number}`;
                        btnDetachMain.style.display = 'block';
                        childrenDiv.style.display = 'none';
                        btnAttachProc.style.display = 'none';
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

                    // Histórico de movimentações na linha do tempo
                    const tbody = document.getElementById('history-body');
                    tbody.innerHTML = history.length ? history.map(h => `
                        <tr>
                            <td><strong>${window.app.formatDate(h.movement_date)}</strong></td>
                            <td><span class="${h.action === 'ENTRADA' ? 'badge-entrada' : 'badge-saida'}">${h.action === 'ENTRADA' ? 'ENTRADA (Tramitação)' : 'SAÍDA'}</span></td>
                            <td><strong>${h.destination_sector}</strong></td>
                            <td>${h.responsible_name || '-'}</td>
                            <td>${h.user_name || '-'}</td>
                        </tr>
                    `).join('') : '<tr><td colspan="5" class="text-center">Nenhuma movimentação encontrada</td></tr>';

                    resultsDiv.style.display = 'block';
                    mainPanel.style.display = 'none';
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
                } else {
                    currentProcessId = null;
                    mainPanel.style.display = 'none';
                    resultsDiv.style.display = 'none';
                    searchListSection.style.display = 'none';
                    emptyDiv.style.display = 'block';
                }
            } catch(e) {
                window.app.toast(e.message || 'Erro ao carregar detalhes do processo', 'error');
            }
        };

        // RESETAR TELA PARA PAINEL PRINCIPAL COM TODAS AS ÁREAS
        const resetView = () => {
            inputSearch.value = '';
            if (filterSector) filterSector.value = '';
            if (filterAuditor) filterAuditor.value = '';
            resultsDiv.style.display = 'none';
            emptyDiv.style.display = 'none';
            searchListSection.style.display = 'none';
            mainPanel.style.display = 'block';
            
            // Recarrega as duas áreas principais com as buscas limpas
            searchAnalysis = '';
            pageAnalysis = 1;
            document.getElementById('analysis-filter-query').value = '';
            loadAnalysisProcesses();

            searchTramitados = '';
            pageTramitados = 1;
            document.getElementById('tramitados-filter-query').value = '';
            loadTramitadosProcesses();
        };

        btnSearch.addEventListener('click', doSearch);
        inputSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') doSearch();
        });
        
        if (btnClearFiltersTop) {
            btnClearFiltersTop.addEventListener('click', resetView);
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

        // Adição de estilos adicionais premium
        const style = document.createElement('style');
        style.textContent = `
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

            .details-grid-premium {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
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

            .detail-card-item.card-pink {
                background: rgba(239, 68, 68, 0.02);
                border-color: rgba(239, 68, 68, 0.12);
            }
            .detail-card-item.card-pink .detail-card-icon {
                background: rgba(239, 68, 68, 0.08);
                color: #ef4444;
            }
            .detail-card-item.card-pink:hover {
                border-color: rgba(239, 68, 68, 0.25);
                background: rgba(239, 68, 68, 0.04);
            }

            .detail-card-item.card-teal {
                background: rgba(20, 184, 166, 0.02);
                border-color: rgba(20, 184, 166, 0.12);
            }
            .detail-card-item.card-teal .detail-card-icon {
                background: rgba(20, 184, 166, 0.08);
                color: #14b8a6;
            }
            .detail-card-item.card-teal:hover {
                border-color: rgba(20, 184, 166, 0.25);
                background: rgba(20, 184, 166, 0.04);
            }

            .detail-card-item.card-indigo {
                background: rgba(99, 102, 241, 0.02);
                border-color: rgba(99, 102, 241, 0.12);
            }
            .detail-card-item.card-indigo .detail-card-icon {
                background: rgba(99, 102, 241, 0.08);
                color: #6366f1;
            }
            .detail-card-item.card-indigo:hover {
                border-color: rgba(99, 102, 241, 0.25);
                background: rgba(99, 102, 241, 0.04);
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

            .search-action-bar button {
                transition: all 0.25s ease;
            }
            .search-action-bar button:hover {
                transform: translateY(-1px);
            }
            #btn-tramitar-proc:hover {
                box-shadow: 0 6px 15px rgba(121, 185, 71, 0.35);
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

        // Inicializar o carregamento das listas
        loadAnalysisProcesses();
        loadTramitadosProcesses();

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

        this.loadProcessDetails = loadProcessDetails;
        this.resetView = resetView;

        // Suporte para busca automatizada via drawer de auditores ou hash de rota
        this._autoSearch = (processNumber) => {
            inputSearch.value = processNumber;
            filterSector.value = '';
            loadProcessDetails(processNumber);
        };

        const preload = viewParts.slice(1).join('/');
        if (preload) {
            setTimeout(() => this._autoSearch(preload), 100);
        }
    }
};

window.searchView = searchView;
