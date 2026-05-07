// configView v1.1
const configView = {
    async render(container, user, params) {
        const isAdmin = user.role === 'Admin' || user.role === 'Gestor';
        const isSuperAdmin = user.email === 'superadmin';
        
        // Injetar estilos customizados para a aba de importação premium e logs
        if (!document.getElementById('import-premium-styles')) {
            const style = document.createElement('style');
            style.id = 'import-premium-styles';
            style.innerHTML = `
                .import-dropzone {
                    border: 2px dashed rgba(37, 99, 235, 0.25);
                    background: #f8fafc;
                    border-radius: 12px;
                    padding: 2rem;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.2s ease-in-out;
                    margin-bottom: 1.5rem;
                }
                .import-dropzone:hover {
                    border-color: var(--primary);
                    background: rgba(37, 99, 235, 0.03);
                    transform: translateY(-2px);
                }
                .import-dropzone i {
                    color: var(--primary);
                    font-size: 2.5rem;
                    margin-bottom: 0.75rem;
                    display: block;
                }
                .import-dropzone h4 {
                    font-weight: 700;
                    margin: 0;
                    font-size: 1.1rem;
                }
                .import-dropzone p {
                    color: var(--text-secondary);
                    font-size: 0.85rem;
                    margin-top: 0.35rem;
                }
                .version-tag-wrapper {
                    background: #ffffff;
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    padding: 1.25rem;
                    margin-bottom: 1.5rem;
                    box-shadow: var(--shadow-sm);
                }
                .version-tag-input {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    border: 1px solid var(--border-color);
                    border-radius: 6px;
                    font-family: inherit;
                    font-size: 0.9rem;
                    transition: all 0.2s ease;
                    background: #f8fafc;
                    margin-top: 0.5rem;
                }
                .version-tag-input:focus {
                    background: #ffffff;
                    border-color: var(--primary);
                    outline: none;
                    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
                }
                .badge-custom {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 0.3rem 0.7rem;
                    border-radius: 50px;
                    font-size: 0.75rem;
                    font-weight: 600;
                }
                .badge-success-glow {
                    background: rgba(16, 185, 129, 0.08);
                    color: #059669;
                    box-shadow: 0 1px 2px rgba(16, 185, 129, 0.05);
                }
                .badge-warning-glow {
                    background: rgba(245, 158, 11, 0.08);
                    color: #d97706;
                }
                .btn-action-round {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    border: 1px solid transparent;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.85rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .btn-action-round:hover {
                    transform: scale(1.08) translateY(-1px);
                    box-shadow: var(--shadow-sm);
                }
                .badge-item {
                    background: rgba(241, 245, 249, 0.8);
                    color: #334155;
                    font-size: 0.75rem;
                    font-weight: 600;
                    padding: 0.25rem 0.55rem;
                    border-radius: 6px;
                    border: 1px solid #e2e8f0;
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                }
                .logs-terminal-container {
                    background: #0f172a;
                    color: #cbd5e1;
                    font-family: 'Fira Code', 'Courier New', Courier, monospace;
                    font-size: 0.8rem;
                    padding: 1.25rem;
                    border-radius: 8px;
                    max-height: 450px;
                    overflow-y: auto;
                    border: 1px solid #1e293b;
                    box-shadow: inset 0 2px 8px rgba(0,0,0,0.5);
                }
                .log-line {
                    line-height: 1.6;
                    margin-bottom: 0.4rem;
                    display: flex;
                    gap: 0.6rem;
                    align-items: flex-start;
                    border-bottom: 1px solid rgba(30, 41, 59, 0.4);
                    padding-bottom: 0.25rem;
                }
                .log-line:last-child {
                    border-bottom: none;
                    padding-bottom: 0;
                }
                .log-time { color: #64748b; font-weight: 500; font-size: 0.75rem; }
                .log-lvl-info { color: #34d399; font-weight: 700; font-size: 0.75rem; }
                .log-lvl-warning { color: #fbbf24; font-weight: 700; font-size: 0.75rem; }
                .log-lvl-error { color: #f87171; font-weight: 700; font-size: 0.75rem; }
                .log-phase { color: #38bdf8; font-weight: 600; font-size: 0.75rem; }
                .log-text { color: #f1f5f9; word-break: break-all; }
                .version-row {
                    transition: all 0.2s ease;
                }
                .version-row:hover {
                    background: rgba(248, 250, 252, 0.85) !important;
                }
                #loading-overlay-screen {
                    animation: fadeIn 0.2s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @media (max-width: 1024px) {
                    .import-columns-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        const activeTab = params && params[1] ? params[1].toLowerCase() : null;

        if (!activeTab) {
            container.innerHTML = `
                <div class="view-section">
                    <div style="margin-bottom: 2.25rem;">
                        <h2 style="font-size: 1.6rem; font-weight: 800; color: var(--accent); margin: 0 0 0.35rem 0;">Configurações do Sistema</h2>
                        <p style="color: var(--text-secondary); font-size: 0.95rem; margin: 0;">Selecione uma das categorias administrativas abaixo para gerenciar os parâmetros da plataforma.</p>
                    </div>
                    
                    <div class="config-grid-cards" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem;">
                        
                        <!-- CARD 1: SETORES -->
                        <a href="#config/setores" class="config-menu-card">
                            <div class="card h-100" style="transition: all 0.2s ease; cursor: pointer; border: 1px solid var(--border-color); border-radius: var(--radius-lg); overflow: hidden; height: 100%; background: #ffffff;">
                                <div class="card-body" style="padding: 1.75rem; display: flex; flex-direction: column; gap: 1.25rem;">
                                    <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(0, 114, 188, 0.08); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
                                        <i class="fa-solid fa-building"></i>
                                    </div>
                                    <div>
                                        <h3 style="font-size: 1.15rem; font-weight: 750; color: var(--accent); margin: 0 0 0.5rem 0; display: flex; align-items: center; justify-content: space-between;">
                                            Setores <i class="fa-solid fa-arrow-right" style="font-size: 0.85rem; opacity: 0; transform: translateX(-5px); transition: all 0.25s ease;"></i>
                                        </h3>
                                        <p style="color: var(--text-secondary); font-size: 0.88rem; line-height: 1.5; margin: 0;">Configure os setores ativos/inativos, controle tipos (interno/externo), defina hierarquias e visualize o histórico de trâmites.</p>
                                    </div>
                                </div>
                            </div>
                        </a>

                        <!-- CARD 2: RESPONSAVEIS -->
                        <a href="#config/responsaveis" class="config-menu-card">
                            <div class="card h-100" style="transition: all 0.2s ease; cursor: pointer; border: 1px solid var(--border-color); border-radius: var(--radius-lg); overflow: hidden; height: 100%; background: #ffffff;">
                                <div class="card-body" style="padding: 1.75rem; display: flex; flex-direction: column; gap: 1.25rem;">
                                    <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(16, 185, 129, 0.08); color: #059669; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
                                        <i class="fa-solid fa-user-tie"></i>
                                    </div>
                                    <div>
                                        <h3 style="font-size: 1.15rem; font-weight: 750; color: var(--accent); margin: 0 0 0.5rem 0; display: flex; align-items: center; justify-content: space-between;">
                                            Responsáveis <i class="fa-solid fa-arrow-right" style="font-size: 0.85rem; opacity: 0; transform: translateX(-5px); transition: all 0.25s ease;"></i>
                                        </h3>
                                        <p style="color: var(--text-secondary); font-size: 0.88rem; line-height: 1.5; margin: 0;">Cadastre e gerencie Auditores Fiscais e demais responsáveis de trâmites, vinculando-os aos seus setores de atuação.</p>
                                    </div>
                                </div>
                            </div>
                        </a>

                        <!-- CARD 3: COLABORADORES -->
                        ${isAdmin ? `
                        <a href="#config/colaboradores" class="config-menu-card">
                            <div class="card h-100" style="transition: all 0.2s ease; cursor: pointer; border: 1px solid var(--border-color); border-radius: var(--radius-lg); overflow: hidden; height: 100%; background: #ffffff;">
                                <div class="card-body" style="padding: 1.75rem; display: flex; flex-direction: column; gap: 1.25rem;">
                                    <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(245, 158, 11, 0.08); color: #d97706; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
                                        <i class="fa-solid fa-users"></i>
                                    </div>
                                    <div>
                                        <h3 style="font-size: 1.15rem; font-weight: 750; color: var(--accent); margin: 0 0 0.5rem 0; display: flex; align-items: center; justify-content: space-between;">
                                            Colaboradores <i class="fa-solid fa-arrow-right" style="font-size: 0.85rem; opacity: 0; transform: translateX(-5px); transition: all 0.25s ease;"></i>
                                        </h3>
                                        <p style="color: var(--text-secondary); font-size: 0.88rem; line-height: 1.5; margin: 0;">Administre permissões de acesso ao sistema, crie novos colaboradores, resete senhas e configure atribuições de perfil.</p>
                                    </div>
                                </div>
                            </div>
                        </a>
                        ` : ''}

                        <!-- CARD 4: IMPORTACAO -->
                        ${isAdmin ? `
                        <a href="#config/importacao" class="config-menu-card">
                            <div class="card h-100" style="transition: all 0.2s ease; cursor: pointer; border: 1px solid var(--border-color); border-radius: var(--radius-lg); overflow: hidden; height: 100%; background: #ffffff;">
                                <div class="card-body" style="padding: 1.75rem; display: flex; flex-direction: column; gap: 1.25rem;">
                                    <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(99, 102, 241, 0.08); color: #4f46e5; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
                                        <i class="fa-solid fa-file-import"></i>
                                    </div>
                                    <div>
                                        <h3 style="font-size: 1.15rem; font-weight: 750; color: var(--accent); margin: 0 0 0.5rem 0; display: flex; align-items: center; justify-content: space-between;">
                                            Importação e Backups <i class="fa-solid fa-arrow-right" style="font-size: 0.85rem; opacity: 0; transform: translateX(-5px); transition: all 0.25s ease;"></i>
                                        </h3>
                                        <p style="color: var(--text-secondary); font-size: 0.88rem; line-height: 1.5; margin: 0;">Importe arquivos SQL de produção, configure versões, realize backups preventivos de dados e analise logs detalhados.</p>
                                    </div>
                                </div>
                            </div>
                        </a>
                        ` : ''}

                    </div>
                </div>
            `;
            return;
        }

        let tabTitle = 'Configuração';
        if (activeTab === 'setores') tabTitle = 'Setores';
        else if (activeTab === 'responsaveis') tabTitle = 'Responsáveis';
        else if (activeTab === 'colaboradores') tabTitle = 'Colaboradores';
        else if (activeTab === 'importacao') tabTitle = 'Importação e Backups';

        container.innerHTML = `
            <div class="view-section">
                <!-- BREADCRUMB -->
                <div class="config-breadcrumb" style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; font-weight: 500; margin-bottom: 1.5rem;">
                    <a href="#config" style="color: var(--primary); text-decoration: none; display: inline-flex; align-items: center; gap: 0.35rem; font-weight: 700;">
                        <i class="fa-solid fa-arrow-left"></i> Voltar para Configurações
                    </a>
                    <span style="color: var(--text-secondary); opacity: 0.5;">/</span>
                    <span style="color: var(--text-primary); font-weight: 600;">${tabTitle}</span>
                </div>

                <!-- SETORES TAB -->
                ${activeTab === 'setores' ? `
                <div class="tab-content active" id="tab-setores">
                    <div class="card mb-1">
                        <div class="card-header flex-center" style="justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
                            <div>
                                <h3>Setores Ativos</h3>
                                <p>Gerencie os setores de destino dos processos de maneira ágil.</p>
                            </div>
                            <div style="display:flex; gap:0.5rem; align-items:center; flex-wrap: wrap;">
                                <button class="btn-secondary" id="btn-show-inactive-sectors" style="width:auto; padding:0.6rem 1.2rem;"><i class="fa-solid fa-eye"></i> Exibir Inativos c/ Dados</button>
                                <button class="btn-secondary" id="btn-delete-all-sectors" style="padding:0.6rem 1.2rem; background:#fee2e2; color:#b91c1c; border-color:#fecaca;"><i class="fa-solid fa-trash-can"></i> Excluir Todos</button>
                                <button class="btn-primary" id="btn-add-sector" style="width:auto; padding:0.6rem 1.2rem;"><i class="fa-solid fa-plus"></i> Novo Setor</button>
                            </div>
                        </div>
                        <div class="card-body p-3">
                            <!-- Filtros e Busca de Setores -->
                            <div class="flex-center" style="justify-content: space-between; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem;">
                                <div class="search-box" style="flex: 1; min-width: 280px; position: relative;">
                                    <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--text-secondary);"></i>
                                    <input type="text" id="sector-search-input" class="form-control" placeholder="Buscar por nome ou sigla do setor..." style="width: 100%; padding-left: 2.5rem; height: 42px;">
                                </div>
                                <div class="flex-center" style="flex-wrap: wrap; gap: 0.5rem; width: auto;">
                                    <select id="sector-filter-type" class="form-control" style="width: auto; padding: 0.5rem 1rem; height: 42px; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                                        <option value="all">Todos os Tipos (Interno/Externo)</option>
                                        <option value="internal">Somente Internos SMF</option>
                                        <option value="external">Somente Externos</option>
                                    </select>
                                    <select id="sector-filter-level" class="form-control" style="width: auto; padding: 0.5rem 1rem; height: 42px; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                                        <option value="all">Todos os Níveis (Pai/Filho)</option>
                                        <option value="parent">Setor Pai (Raiz)</option>
                                        <option value="child">Setor Filho (Subsetor)</option>
                                    </select>
                                </div>
                            </div>
                            
                            <!-- Lista de Setores Ativos -->
                            <div class="table-responsive" style="border: 1px solid var(--border-color); border-radius: var(--radius-lg); overflow: hidden; background: var(--bg-surface);">
                                <table class="data-table" style="margin-bottom:0; width:100%;">
                                    <thead>
                                        <tr>
                                            <th style="padding: 1rem; background: #f8fafc; font-weight: 700; color: var(--text-primary);">Nome do Setor / Sigla</th>
                                            <th style="padding: 1rem; background: #f8fafc; font-weight: 700; color: var(--text-primary); width: 140px; text-align: center;">Tipo</th>
                                            <th style="padding: 1rem; background: #f8fafc; font-weight: 700; color: var(--text-primary); width: 220px; text-align: center;">Hierarquia (Pai/Filho)</th>
                                            <th style="padding: 1rem; background: #f8fafc; font-weight: 700; color: var(--text-primary); text-align: center;">Auditor Responsável</th>
                                            <th style="padding: 1rem; background: #f8fafc; font-weight: 700; color: var(--text-primary); width: 120px; text-align: center;">Movimentações</th>
                                            <th style="padding: 1rem; background: #f8fafc; font-weight: 700; color: var(--text-primary); width: 220px; text-align: center;">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody id="grid-sectors">
                                        <tr>
                                            <td colspan="6" class="text-center p-4 text-secondary">
                                                <i class="fa-solid fa-circle-notch fa-spin fa-2x mb-1" style="color: var(--primary);"></i>
                                                <p>Carregando setores ativos...</p>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div id="card-inactive-sectors" class="card mb-1" style="display:none;">
                        <div class="card-header border-bottom">
                            <h3 style="color: var(--text-secondary);">Setores Inativos (com histórico)</h3>
                            <p>Estes setores não aparecem nas buscas, mas possuem registros vinculados. Recomendamos mesclá-los com setores ativos.</p>
                        </div>
                        <div class="card-body p-3">
                            <div class="table-responsive" style="border: 1px solid var(--border-color); border-radius: var(--radius-lg); overflow: hidden; background: var(--bg-surface);">
                                <table class="data-table" style="margin-bottom:0; width:100%;">
                                    <thead>
                                        <tr>
                                            <th style="padding: 1rem; background: #f8fafc; font-weight: 700; color: var(--text-primary);">Nome do Setor / Sigla</th>
                                            <th style="padding: 1rem; background: #f8fafc; font-weight: 700; color: var(--text-primary); width: 140px; text-align: center;">Tipo</th>
                                            <th style="padding: 1rem; background: #f8fafc; font-weight: 700; color: var(--text-primary); width: 220px; text-align: center;">Hierarquia (Pai/Filho)</th>
                                            <th style="padding: 1rem; background: #f8fafc; font-weight: 700; color: var(--text-primary); text-align: center;">Auditor Responsável</th>
                                            <th style="padding: 1rem; background: #f8fafc; font-weight: 700; color: var(--text-primary); width: 120px; text-align: center;">Movimentações</th>
                                            <th style="padding: 1rem; background: #f8fafc; font-weight: 700; color: var(--text-primary); width: 220px; text-align: center;">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody id="grid-inactive-sectors">
                                        <tr>
                                            <td colspan="6" class="text-center p-4 text-secondary">
                                                Nenhum sector inativo encontrado.
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                ` : ''}

                <!-- RESPONSAVEIS TAB -->
                ${activeTab === 'responsaveis' ? `
                <div class="tab-content active" id="tab-responsaveis">
                    <div class="card mb-1">
                        <div class="card-header flex-center" style="justify-content: space-between;">
                            <div>
                                <h3>Responsáveis</h3>
                                <p>Gerencie os Auditores Fiscais e demais responsáveis pelos processos.</p>
                            </div>
                             <div style="display:flex; gap:0.5rem;">
                                <button class="btn-primary" id="btn-add-responsible" style="width:auto; padding:0.6rem 1.2rem;"><i class="fa-solid fa-user-plus"></i> Novo Responsável</button>
                             </div>
                        </div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="data-table">
                                    <thead><tr><th>Nome</th><th>Setor</th><th class="text-center">Ações</th></tr></thead>
                                    <tbody id="tbody-responsibles"><tr><td colspan="3" class="text-center">Carregando...</td></tr></tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                ` : ''}

                <!-- COLABORADORES TAB -->
                ${activeTab === 'colaboradores' && isAdmin ? `
                <div class="tab-content active" id="tab-colaboradores">
                    <div class="card mb-1">
                        <div class="card-header flex-center" style="justify-content: space-between;">
                            <div>
                                <h3>Colaboradores</h3>
                                <p>Gerencie quem tem acesso ao sistema SUBFIS.</p>
                            </div>
                            <button class="btn-primary" id="btn-add-user" style="width:auto; padding:0.6rem 1.2rem;"><i class="fa-solid fa-user-plus"></i> Novo Colaborador</button>
                        </div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="data-table">
                                    <thead><tr><th>Nome</th><th>E-mail</th><th>Secretaria</th><th>Setor</th><th>Função</th><th class="text-center">Ações</th></tr></thead>
                                    <tbody id="tbody-users"><tr><td colspan="6" class="text-center">Carregando...</td></tr></tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                ` : ''}

                <!-- IMPORTACAO TAB -->
                ${activeTab === 'importacao' && isAdmin ? `
                <div class="tab-content active" id="tab-importacao">
                    
                    <!-- Side-by-Side Dual Column Grid -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;" class="import-columns-grid">
                        
                        <!-- CARD 1: Spreadsheet Import & Template Download -->
                        <div class="card mb-0" style="display: flex; flex-direction: column;">
                            <div class="card-header border-bottom" style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem;">
                                <div>
                                    <h3 style="display: flex; align-items: center; gap: 8px;"><i class="fa-solid fa-file-excel" style="color: #10b981;"></i> Importar Planilha (Excel/CSV)</h3>
                                    <p>Envie sua planilha de controle para migrar os dados para o sistema de forma integrada e segura.</p>
                                </div>
                                <button class="btn-primary" id="btn-download-template" style="background: #10b981; border-color: #059669; width: auto; padding: 0.5rem 1rem; font-size: 0.85rem; display: flex; align-items: center; gap: 6px; white-space: nowrap;" title="Baixar modelo excel estruturado">
                                    <i class="fa-solid fa-download"></i> Modelo de Dados
                                </button>
                            </div>
                            <div class="card-body" style="flex-grow: 1; display: flex; flex-direction: column; justify-content: space-between;">
                                <div>
                                    <!-- Drag & Drop Dropzone area -->
                                    <div class="import-dropzone" onclick="document.getElementById('input-import-excel').click()">
                                        <i class="fa-solid fa-cloud-arrow-up" style="color: #10b981;"></i>
                                        <h4>Arraste ou Selecione sua Planilha de Controle</h4>
                                        <p>Formatos suportados: planilhas Excel (.xlsx, .xls)</p>
                                    </div>

                                    <input type="file" id="input-import-excel" accept=".xlsx, .xls" style="display:none;">

                                    <!-- Version Label (gorgeous style) -->
                                    <div class="version-tag-wrapper" id="version-tag-container" style="display: none;">
                                        <label class="custom-input-label" for="input-version-label"><i class="fa-solid fa-tag"></i> Nome / Marcador de Versão (Opcional)</label>
                                        <input type="text" id="input-version-label" class="version-tag-input" placeholder="Ex: v2.1 - Importação consolidada do encerramento de Abril">
                                        <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.5rem; margin-bottom: 0;"><i class="fa-solid fa-circle-info"></i> Rotular com o nome do arquivo ajuda a rastrear no histórico de snapshots.</p>
                                    </div>
                                </div>

                                <div class="import-actions flex-center" style="gap:1rem; flex-wrap: wrap; justify-content: flex-start; display: none; margin-top: 1.5rem;" id="import-actions-bar">
                                    <button class="btn-primary" id="btn-process-import" style="width: auto; padding: 0.75rem 1.5rem;" disabled>
                                        <i class="fa-solid fa-upload"></i> Processar e Importar
                                    </button>
                                    <button class="btn-secondary" id="btn-cancel-import" style="width: auto; padding: 0.75rem 1.5rem;">
                                        <i class="fa-solid fa-xmark"></i> Cancelar
                                    </button>
                                </div>

                                <div id="import-preview" class="mt-2" style="display:none;">
                                    <div id="import-validation-summary"></div>
                                    <div class="table-responsive mt-1" style="max-height: 250px; border: 1px solid var(--border-color); border-radius: 6px;">
                                        <table class="data-table">
                                            <thead><tr id="preview-header"></tr></thead>
                                            <tbody id="preview-body"></tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- CARD 2: Legacy Database Import (.SQL) -->
                        <div class="card mb-0" style="display: flex; flex-direction: column;">
                            <div class="card-header border-bottom" style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem;">
                                <div>
                                    <h3 style="display: flex; align-items: center; gap: 8px;"><i class="fa-solid fa-database" style="color: #4f46e5;"></i> Importar Base Legada (.sql)</h3>
                                    <p>Restaure um arquivo de dump MySQL/MariaDB (.sql) para restabelecer versões antigas ou sincronizar.</p>
                                </div>
                            </div>
                            <div class="card-body" style="flex-grow: 1; display: flex; flex-direction: column; justify-content: space-between; gap: 1.25rem;">
                                
                                <!-- Server Local SQL Quick Actions -->
                                <div style="background: rgba(79, 70, 229, 0.04); border: 1px dashed rgba(79, 70, 229, 0.2); padding: 1rem; border-radius: var(--radius-md); display: flex; flex-direction: column; gap: 0.75rem;">
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <i class="fa-solid fa-server" style="color: #4f46e5; font-size: 1.1rem;"></i>
                                        <div>
                                            <div style="font-weight: 700; font-size: 0.9rem; color: var(--text-primary);">Banco de Dados Legado no Servidor</div>
                                            <div style="font-size: 0.75rem; color: var(--text-secondary); word-break: break-all;">Caminho: /database/migrations/u489835785_subfisprocdb.sql</div>
                                        </div>
                                    </div>
                                    <button class="btn-primary" id="btn-restore-server-legacy" style="background: #4f46e5; border-color: #4338ca; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 600; padding: 0.65rem 1rem;">
                                        <i class="fa-solid fa-arrows-spin"></i> Restaurar Base Legada Local
                                    </button>
                                </div>

                                <!-- Drag & Drop SQL Dropzone area -->
                                <div style="flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
                                    <div class="import-dropzone" id="sql-dropzone" onclick="document.getElementById('input-import-sql').click()" style="padding: 1.25rem 1rem; border-color: rgba(79, 70, 229, 0.3);">
                                        <i class="fa-solid fa-file-code" style="color: #4f46e5; font-size: 2rem; margin-bottom: 0.5rem;"></i>
                                        <h4 style="font-size: 0.95rem;">Arraste ou Selecione outro Arquivo .sql</h4>
                                        <p style="font-size: 0.75rem;">Carregar e restaurar um dump externo</p>
                                    </div>
                                    <input type="file" id="input-import-sql" accept=".sql" style="display:none;">
                                </div>

                                <!-- SQL Version Label & Action Bar -->
                                <div id="sql-actions-container" style="display: none; border-top: 1px solid var(--border-color); padding-top: 1rem;">
                                    <div class="version-tag-wrapper" style="margin-bottom: 0.75rem;">
                                        <label class="custom-input-label" for="input-sql-version-label" style="font-size: 0.8rem;"><i class="fa-solid fa-tag"></i> Marcador de Versão para este Dump</label>
                                        <input type="text" id="input-sql-version-label" class="version-tag-input" style="padding: 0.45rem 0.75rem; font-size: 0.85rem;" placeholder="Ex: Dump Legado Subfisproc antigo">
                                    </div>
                                    <div class="import-actions flex-center" style="gap:0.75rem; justify-content: flex-start; display: flex;">
                                        <button class="btn-primary" id="btn-process-sql-import" style="width: auto; padding: 0.55rem 1.25rem; font-size: 0.85rem; background: #4f46e5; border-color: #4338ca;">
                                            <i class="fa-solid fa-upload"></i> Enviar e Restaurar
                                        </button>
                                        <button class="btn-secondary" id="btn-cancel-sql-import" style="width: auto; padding: 0.55rem 1.25rem; font-size: 0.85rem;">
                                            <i class="fa-solid fa-xmark"></i> Cancelar
                                        </button>
                                    </div>
                                </div>

                            </div>
                        </div>

                    </div>

                    <div class="card">
                        <div class="card-header border-bottom flex-center" style="justify-content: space-between;">
                            <div>
                                <h3>Histórico de Versões e Backups (Snapshots)</h3>
                                <p>Gerencie o histórico de importações completas, analise logs ou reverta dados com segurança.</p>
                            </div>
                             <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
                                <button class="btn-primary" id="btn-create-snapshot" style="background:#4f46e5; border-color:#4338ca; width:auto; padding:0.6rem 1.2rem; font-weight: 600;">
                                    <i class="fa-solid fa-shield-halved"></i> Criar Snapshot de Segurança
                                </button>
                                <button class="btn-primary" id="btn-upload-snapshot" style="background:#10b981; border-color:#059669; width:auto; padding:0.6rem 1.2rem; font-weight: 600;" onclick="document.getElementById('input-upload-snapshot').click()">
                                    <i class="fa-solid fa-cloud-arrow-up"></i> Enviar Snapshot (.sql)
                                </button>
                                <input type="file" id="input-upload-snapshot" accept=".sql" style="display:none;">
                                ${isSuperAdmin ? `
                                <button class="btn-secondary" id="btn-wipe-database" style="background:#fee2e2; color:#b91c1c; border-color:#fecaca; width:auto; padding:0.6rem 1.2rem; font-weight: 600;">
                                    <i class="fa-solid fa-radiation"></i> Zerar Base de Dados (DANGER)
                                </button>
                                ` : ''}
                            </div>
                        </div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="data-table">
                                    <thead>
                                        <tr>
                                            <th>Identificador / Marcador</th>
                                            <th>Data / Autor</th>
                                            <th>Status</th>
                                            <th>Snapshot de Segurança</th>
                                            <th>Registros Adicionados</th>
                                            <th class="text-center">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody id="tbody-import-history">
                                        <tr><td colspan="6" class="text-center">Carregando...</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                ` : ''}
            </div>
            <div id="modal-root"></div>
        `;

        // Safe attachment of listeners
        const btnAddSector = document.getElementById('btn-add-sector');
        if (btnAddSector) btnAddSector.onclick = () => this.showSectorModal();

        const btnDeleteAllSectors = document.getElementById('btn-delete-all-sectors');
        if (btnDeleteAllSectors) btnDeleteAllSectors.onclick = () => this.deleteAllSectors();

        const btnAddResponsible = document.getElementById('btn-add-responsible');
        if (btnAddResponsible) btnAddResponsible.onclick = () => this.showResponsibleModal();

        const btnClearAllResponsibleSectors = document.getElementById('btn-clear-all-responsible-sectors');
        if (btnClearAllResponsibleSectors) btnClearAllResponsibleSectors.onclick = () => this.clearAllResponsibleSectors();
        
        // Listeners para Busca e Filtros de Setores Ativos
        const searchInput = document.getElementById('sector-search-input');
        const filterType = document.getElementById('sector-filter-type');
        const filterLevel = document.getElementById('sector-filter-level');

        if (searchInput) searchInput.oninput = () => this.filterAndRenderSectors();
        if (filterType) filterType.onchange = () => this.filterAndRenderSectors();
        if (filterLevel) filterLevel.onchange = () => this.filterAndRenderSectors();

        // Toggle Inativos
        const btnShowInactive = document.getElementById('btn-show-inactive-sectors');
        if (btnShowInactive) {
            btnShowInactive.onclick = () => {
                this.showInactive = !this.showInactive;
                btnShowInactive.innerHTML = this.showInactive ? '<i class="fa-solid fa-eye-slash"></i> Ocultar Inativos' : '<i class="fa-solid fa-eye"></i> Exibir Inativos c/ Dados';
                document.getElementById('card-inactive-sectors').style.display = this.showInactive ? 'block' : 'none';
                this.loadSectors();
            };
        }

        if (isAdmin) {
            const btnAddUser = document.getElementById('btn-add-user');
            if (btnAddUser) btnAddUser.onclick = () => this.showUserModal();

            const btnWipeDatabase = document.getElementById('btn-wipe-database');
            if (btnWipeDatabase) btnWipeDatabase.onclick = () => this.wipeDatabase();

            const btnCreateSnapshot = document.getElementById('btn-create-snapshot');
            if (btnCreateSnapshot) btnCreateSnapshot.onclick = () => this.createManualSnapshot();

            const inputUploadSnapshot = document.getElementById('input-upload-snapshot');
            if (inputUploadSnapshot) {
                inputUploadSnapshot.onchange = async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    
                    const extension = file.name.split('.').pop().toLowerCase();
                    if (extension !== 'sql') {
                        window.app.toast('Por favor, selecione apenas arquivos de backup com extensão .sql', 'error');
                        return;
                    }
                    
                    if (!confirm(`Deseja realmente carregar o snapshot de segurança "${file.name}" para o servidor?\n\nEle será registrado na lista de snapshots disponíveis para restauração a qualquer momento.`)) {
                        inputUploadSnapshot.value = '';
                        return;
                    }

                    const modal = document.createElement('div');
                    modal.id = 'loading-overlay-screen';
                    modal.style = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(15,23,42,0.85); display:flex; flex-direction:column; align-items:center; justify-content:center; color:white; z-index:9999; backdrop-filter:blur(5px);';
                    modal.innerHTML = `
                        <i class="fa-solid fa-cloud-arrow-up fa-spin fa-4x" style="color:#10b981; margin-bottom:1.5rem;"></i>
                        <h2 style="font-weight:700; margin:0; font-size:1.5rem;">Enviando Snapshot...</h2>
                        <p style="color:#94a3b8; font-size:1rem; margin:0.5rem 0 0 0; text-align:center; max-width:400px; padding:0 1rem;">Processando e salvando arquivo .sql no servidor. Aguarde...</p>
                    `;
                    document.body.appendChild(modal);

                    try {
                        const formData = new FormData();
                        formData.append('snapshot_file', file);
                        
                        await Api.import.uploadSnapshot(formData);
                        
                        document.body.removeChild(modal);
                        window.app.toast('Snapshot de segurança enviado com sucesso!');
                        await this.loadImportHistory();
                    } catch(err) {
                        if (document.getElementById('loading-overlay-screen')) {
                            document.body.removeChild(modal);
                        }
                        window.app.toast(err.message, 'error');
                    } finally {
                        inputUploadSnapshot.value = '';
                    }
                };
            }
        }

        // Fetch Data for active tab only
        if (activeTab === 'setores') {
            await this.loadSectors();
        } else if (activeTab === 'responsaveis') {
            await this.loadResponsibles();
        } else if (activeTab === 'colaboradores' && isAdmin) {
            await this.loadUsers();
        } else if (activeTab === 'importacao' && isAdmin) {
            await this.loadImportHistory();
            this.initImportLogic();
        }
    },

    attachTabEvents() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                
                e.target.closest('.tab-btn').classList.add('active');
                document.getElementById('tab-' + e.target.closest('.tab-btn').dataset.tab).classList.add('active');
            });
        });
    },

    showInactive: false,

    async loadSectors() {
        try {
            this.sectors = await Api.sectors.list(this.showInactive);
            this.filterAndRenderSectors();
        } catch (e) {
            const grid = document.getElementById('grid-sectors');
            if (grid) grid.innerHTML = `<div style="grid-column: 1 / -1;" class="text-center p-3 text-danger"><i class="fa-solid fa-triangle-exclamation fa-2x mb-1"></i><p>Erro ao carregar setores: ${e.message}</p></div>`;
        }
    },

    filterAndRenderSectors() {
        const gridActive = document.getElementById('grid-sectors');
        const gridInactive = document.getElementById('grid-inactive-sectors');
        if (!gridActive) return;

        const searchVal = (document.getElementById('sector-search-input')?.value || '').toLowerCase().trim();
        const typeFilter = document.getElementById('sector-filter-type')?.value || 'all';
        const levelFilter = document.getElementById('sector-filter-level')?.value || 'all';

        // Helper to get depth of a sector in the general sectors array
        const getDepth = (sector) => {
            let depth = 0;
            let current = sector;
            while (current && current.parent_id) {
                const nextParent = this.sectors.find(p => p.id === current.parent_id);
                if (!nextParent || nextParent.id === current.id) break;
                depth++;
                current = nextParent;
            }
            return depth;
        };

        // Helper to build a beautiful modern list row for a sector with depth-based indentation
        const buildRow = (s) => {
            const parentSector = s.parent_id ? this.sectors.find(p => p.id === s.parent_id) : null;
            
            // badges
            const isInternal = s.is_internal || s.is_internal_hierarchy;
            const typeBadgeHtml = isInternal
                ? `<span class="sector-card-badge sector-card-badge-internal" style="font-size: 0.75rem;"><i class="fa-solid fa-house-laptop"></i> Interno SMF</span>`
                : `<span class="sector-card-badge sector-card-badge-external" style="font-size: 0.75rem;"><i class="fa-solid fa-building-circle-arrow-right"></i> Externo</span>`;

            const levelBadgeHtml = s.parent_id && parentSector
                ? `<span class="sector-card-badge sector-card-badge-child" style="font-size: 0.75rem;" title="Subsetor de ${parentSector.name}"><i class="fa-solid fa-diagram-successor"></i> Subsetor de <b>${parentSector.alias || parentSector.name}</b></span>`
                : `<span class="sector-card-badge sector-card-badge-parent" style="font-size: 0.75rem;" title="Setor Raiz Principal"><i class="fa-solid fa-sitemap"></i> Setor Pai (Raiz)</span>`;

            const displayName = s.alias ? `<b>${s.alias}</b>` : `<b>${s.name}</b>`;
            const displaySub = s.alias ? s.name : 'Setor de Atuação';

            const rowOpacity = s.active == 0 ? 'opacity: 0.65; background-color: #f8fafc;' : '';
            const depth = getDepth(s);
            const indentStyle = depth > 0 ? `padding-left: ${depth * 1.5 + 1}rem;` : 'padding-left: 1rem;';

            const auditorBadges = s.responsible_names
                ? s.responsible_names.split(', ').map(name => `<span class="badge badge-success" style="margin: 2px; font-size: 0.72rem; padding: 0.2rem 0.4rem; white-space: nowrap;"><i class="fa-solid fa-user-shield"></i> ${name}</span>`).join('')
                : '<span style="color: var(--text-secondary); font-size: 0.82rem; font-style: italic;">Nenhum</span>';

            return `
                <tr class="sector-row ${s.active == 0 ? 'inactive-sector' : ''}" data-id="${s.id}" style="${rowOpacity}">
                    <td style="padding: 1rem; vertical-align: middle; ${indentStyle}">
                        <div style="display: flex; align-items: flex-start; gap: 0.5rem;">
                            ${depth > 0 ? `<span style="color: var(--primary); font-weight: 900; font-size: 1.15rem; line-height: 1.1; margin-left: -1rem; margin-right: 0.25rem;">↳</span>` : ''}
                            <div style="display: flex; flex-direction: column; gap: 0.2rem;">
                                <span style="font-size: 0.95rem; color: var(--text-primary);">${displayName}</span>
                                <span style="font-size: 0.78rem; color: var(--text-secondary);">${displaySub}</span>
                            </div>
                        </div>
                    </td>
                    <td style="padding: 1rem; text-align: center; vertical-align: middle;">
                        ${typeBadgeHtml}
                    </td>
                    <td style="padding: 1rem; text-align: center; vertical-align: middle;">
                        ${levelBadgeHtml}
                    </td>
                    <td style="padding: 1rem; text-align: center; vertical-align: middle;">
                        <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 0.2rem; max-width: 250px; margin: 0 auto;">
                            ${auditorBadges}
                        </div>
                    </td>
                    <td style="padding: 1rem; text-align: center; vertical-align: middle;">
                        <span class="badge" style="background: #f1f5f9; color: #334155; font-weight: 700; font-size: 0.82rem; padding: 0.3rem 0.6rem; border-radius: var(--radius-md); border: 1px solid #e2e8f0; display: inline-flex; align-items: center; gap: 4px;">
                            <i class="fa-solid fa-exchange-alt" style="color: var(--text-secondary);"></i> ${s.movement_count || 0}
                        </span>
                    </td>
                    <td style="padding: 1rem; text-align: center; vertical-align: middle;">
                        <div style="display: flex; gap: 0.4rem; justify-content: center; align-items: center;">
                            <button class="btn-secondary" style="padding: 0.35rem 0.65rem; font-size: 0.8rem; border-radius: var(--radius-md);" onclick="configView.showSectorModal(${s.id})">
                                <i class="fa-solid fa-pen"></i> Editar
                            </button>
                            <button class="btn-secondary" style="padding: 0.35rem 0.65rem; font-size: 0.8rem; background: var(--bg-secondary); color: var(--primary); border-radius: var(--radius-md);" onclick="configView.showMergeSectorModal(${s.id}, '${s.name.replace(/'/g, "\\'")}')" title="Mesclar histórico com outro setor">
                                <i class="fa-solid fa-code-merge"></i> Mesclar
                            </button>
                            ${s.active == 1 ? `
                            <button class="btn-secondary" style="padding: 0.35rem 0.65rem; font-size: 0.8rem; background: #fee2e2; color: #b91c1c; border-color: #fecaca; border-radius: var(--radius-md);" onclick="configView.deleteSector(${s.id})">
                                <i class="fa-solid fa-trash"></i>
                            </button>` : ''}
                        </div>
                    </td>
                </tr>
            `;
        };

        // Separar ativos e inativos
        const activeSectors = this.sectors.filter(s => s.active == 1);
        const inactiveSectors = this.sectors.filter(s => s.active == 0);

        // Filter active sectors in memory
        const filteredActive = activeSectors.filter(s => {
            const matchesSearch = s.name.toLowerCase().includes(searchVal) || (s.alias && s.alias.toLowerCase().includes(searchVal));
            if (!matchesSearch) return false;

            const isInternal = s.is_internal || s.is_internal_hierarchy;
            if (typeFilter === 'internal' && !isInternal) return false;
            if (typeFilter === 'external' && isInternal) return false;

            const isChild = !!s.parent_id;
            if (levelFilter === 'parent' && isChild) return false;
            if (levelFilter === 'child' && !isChild) return false;

            return true;
        });

        // Filter inactive sectors in memory
        const filteredInactive = inactiveSectors.filter(s => {
            const matchesSearch = s.name.toLowerCase().includes(searchVal) || (s.alias && s.alias.toLowerCase().includes(searchVal));
            return matchesSearch;
        });

        // Alphabetical & Hierarchical sorting logic
        const getSortedHierarchicalList = (sectorsList) => {
            const sorted = [];
            const visited = new Set();

            const getSortName = (sec) => (sec.alias || sec.name).toLowerCase();
            const sortAlpha = (a, b) => getSortName(a).localeCompare(getSortName(b));

            const traverse = (sec) => {
                if (visited.has(sec.id)) return;
                visited.add(sec.id);
                sorted.push(sec);

                // Find and recursively sort children of this sector
                const children = sectorsList.filter(c => c.parent_id === sec.id).sort(sortAlpha);
                children.forEach(child => traverse(child));
            };

            // Identify root elements (either no parent, or parent is not present in the filtered list)
            const sectorIds = new Set(sectorsList.map(item => item.id));
            const roots = sectorsList.filter(item => !item.parent_id || !sectorIds.has(item.parent_id)).sort(sortAlpha);

            roots.forEach(root => traverse(root));

            // Guard for orphans or circular refs
            sectorsList.forEach(item => {
                if (!visited.has(item.id)) {
                    sorted.push(item);
                }
            });

            return sorted;
        };

        const sortedActive = getSortedHierarchicalList(filteredActive);
        const sortedInactive = getSortedHierarchicalList(filteredInactive);

        // Render Active
        if (sortedActive.length === 0) {
            gridActive.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center p-4 text-secondary">
                        <i class="fa-solid fa-folder-open fa-2x mb-1" style="opacity: 0.5; display: block; margin: 0 auto 0.5rem;"></i>
                        Nenhum setor ativo correspondente aos filtros foi encontrado.
                    </td>
                </tr>
            `;
        } else {
            gridActive.innerHTML = sortedActive.map(s => buildRow(s)).join('');
        }

        // Render Inactive
        if (gridInactive) {
            if (sortedInactive.length === 0) {
                gridInactive.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center p-4 text-secondary">
                            Nenhum setor inativo encontrado.
                        </td>
                    </tr>
                `;
            } else {
                gridInactive.innerHTML = sortedInactive.map(s => buildRow(s)).join('');
            }
        }
    },

    async loadResponsibles() {
        try {
            if (!this.sectors || this.sectors.length === 0) {
                this.sectors = await Api.sectors.list(true);
            }
            this.responsibles_list = await Api.responsibles.list();
            const tbody = document.getElementById('tbody-responsibles');
            if (!tbody) return;
            if (this.responsibles_list.length === 0) {
                tbody.innerHTML = `<tr><td colspan="3" class="text-center">Nenhum responsável cadastrado</td></tr>`;
                return;
            }
            tbody.innerHTML = this.responsibles_list.map(r => {
                const sectorBadges = r.sector_name 
                    ? r.sector_name.split(', ').map(s => `<span class="badge badge-neutral" style="margin-right:2px;">${s}</span>`).join('')
                    : '<span class="badge badge-neutral" style="color:var(--text-secondary)">Sem setor</span>';
                return `
                <tr>
                    <td><strong>${r.name}</strong></td>
                    <td>${sectorBadges}</td>
                    <td class="text-center">
                        <button class="btn-secondary" style="padding: 0.3rem 0.6rem; font-size:0.8rem;" onclick="configView.showResponsibleModal(${r.id}, '${r.name.replace(/'/g, "\\'")}', '${r.sector_ids || ''}')"><i class="fa-solid fa-pen"></i> Editar</button>
                        <button class="btn-secondary" style="padding: 0.3rem 0.6rem; font-size:0.8rem; background:var(--bg-secondary); color:var(--primary); margin-left:5px;" onclick="configView.showMergeResponsibleModal(${r.id}, '${r.name.replace(/'/g, "\\'")}')" title="Mesclar auditor duplicado"><i class="fa-solid fa-code-merge"></i> Mesclar</button>
                        <button class="btn-secondary" style="padding: 0.3rem 0.6rem; font-size:0.8rem; background:#fee2e2; color:#b91c1c; margin-left:5px;" onclick="configView.deleteResponsible(${r.id})"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>`;
            }).join('');
        } catch (e) {
            const tbody = document.getElementById('tbody-responsibles');
            if (tbody) tbody.innerHTML = `<tr><td colspan="3" class="text-center text-danger">Erro ao carregar responsáveis: ${e.message}</td></tr>`;
        }
    },

    async clearAllResponsibleSectors() {
        if (!confirm('ATENÇÃO: Isso irá remover TODOS os vínculos de setores de TODOS os responsáveis (Auditores). Esta ação não pode ser desfeita. Deseja continuar?')) return;
        
        try {
            await Api.responsibles.clearAllSectors();
            window.app.toast('Vínculos de setores removidos com sucesso!');
            this.loadResponsibles();
        } catch (e) {
            window.app.toast(e.message, 'error');
        }
    },

    showMergeResponsibleModal(sourceId, sourceName) {
        const otherResponsibles = this.responsibles_list.filter(r => r.id !== sourceId);
        const html = `
            <div class="alert alert-warning mb-1">
                <i class="fa-solid fa-triangle-exclamation"></i>
                Esta ação moverá <strong>toda a história</strong> (movimentações onde este auditor foi citado) do auditor "<b>${sourceName}</b>" para o auditor selecionado abaixo. O auditor antigo será desativado.
            </div>
            <div class="form-group">
                <label>Auditor de Destino (Onde os dados serão consolidados)</label>
                <select id="merge-resp-target" required>
                    <option value="">Selecione o auditor correto...</option>
                    ${otherResponsibles.map(r => `<option value="${r.id}">${r.name}</option>`).join('')}
                </select>
            </div>
        `;
        this.showModal('Mesclar Auditores', html, async () => {
            try {
                const targetId = document.getElementById('merge-resp-target').value;
                if (!targetId) throw new Error('Selecione um auditor de destino');

                await Api.responsibles.merge(sourceId, targetId);

                window.app.toast('Auditores mesclados com sucesso!');
                this.loadResponsibles();
            } catch(e) {
                window.app.toast(e.message, 'error');
                throw e;
            }
        });
    },

    async loadUsers() {
        try {
            const users = await Api.users.list();
            const tbody = document.getElementById('tbody-users');
            
            if (users.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" class="text-center">Nenhum colaborador cadastrado</td></tr>`;
                return;
            }

            tbody.innerHTML = users.map(u => `
                <tr>
                    <td>
                        <div style="font-weight: 500">${u.name}</div>
                        <div style="font-size: 0.75rem; color:var(--text-secondary)">CPF: ${u.cpf}</div>
                    </td>
                    <td>${u.email}</td>
                    <td>${u.department || '-'}</td>
                    <td><span class="badge badge-neutral">${u.sector_name || 'N/A'}</span></td>
                    <td><span class="badge ${u.role === 'Admin' ? 'badge-primary' : (u.role === 'Gestor' ? 'badge-success' : 'badge-warning')}">${u.role}</span></td>
                    <td class="text-center" style="display: flex; justify-content: center; gap: 5px;">
                        <button class="btn-secondary" style="padding: 0.3rem 0.6rem; font-size:0.8rem; background:#f1f5f9; color:#475569;" title="Editar" onclick="configView.showEditUserModal(${JSON.stringify(u).replace(/"/g, '&quot;')})"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn-secondary" style="padding: 0.3rem 0.6rem; font-size:0.8rem; background:#f1f5f9; color:#475569;" title="Resetar Senha" onclick="configView.resetUserPassword(${u.id}, '${u.name}')"><i class="fa-solid fa-key"></i></button>
                        <button class="btn-secondary" style="padding: 0.3rem 0.6rem; font-size:0.8rem; background:#fee2e2; color:#b91c1c;" title="Remover" onclick="configView.deleteUser(${u.id})"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>
            `).join('');
        } catch (e) {
            const tbody = document.getElementById('tbody-users');
            if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Erro ao carregar colaboradores: ${e.message}</td></tr>`;
        }
    },

    // Modal Helpers
    showModal(title, htmlContent, onSave) {
        const root = document.getElementById('modal-root');
        root.innerHTML = `
            <div class="modal-overlay" id="custom-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>${title}</h3>
                        <button class="modal-close" onclick="document.getElementById('custom-modal').remove()"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <form id="modal-form">
                        ${htmlContent}
                        <div class="flex-end" style="gap:10px; margin-top:1.5rem;">
                            <button type="button" class="btn-secondary" onclick="document.getElementById('custom-modal').remove()">Cancelar</button>
                            <button type="submit" class="btn-primary" style="width:auto;"><i class="fa-solid fa-save"></i> Salvar</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.getElementById('modal-form').onsubmit = async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            const originalHtml = btn.innerHTML;
            
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            
            try {
                await onSave();
                document.getElementById('custom-modal').remove();
            } catch (err) {
                btn.disabled = false;
                btn.innerHTML = originalHtml;
                // Toast is usually handled inside onSave, but just in case:
                if (err.message && !document.querySelector('.toast-error')) {
                    window.app.toast(err.message, 'error');
                }
            }
        };
    },

    showResponsibleModal(id = null, currentName = '', currentSectorIds = '') {
        let selectedSectors = [];
        if (currentSectorIds) {
            const ids = currentSectorIds.split(',').map(s => s.trim());
            selectedSectors = this.sectors.filter(s => ids.includes(String(s.id)));
        }

        const html = `
            <div class="form-group mb-1">
                <label>Nome do Responsável</label>
                <input type="text" id="resp-name" required value="${currentName.replace(/"/g, '&quot;')}" placeholder="Ex: João da Silva">
            </div>
            <div class="form-group mb-1">
                <label>Adicionar Setor de Atuação</label>
                <select id="resp-add-sector">
                    <option value="">Selecione um setor para adicionar...</option>
                    ${this.sectors.map(s => `<option value="${s.id}">${s.alias || s.name}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Setores Selecionados</label>
                <div id="resp-badge-container" style="display: flex; flex-wrap: wrap; gap: 0.5rem; min-height: 44px; padding: 0.5rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: #f8fafc;">
                    <!-- Badges injected here -->
                </div>
            </div>
        `;

        this.showModal(id ? 'Editar Responsável' : 'Novo Responsável', html, async () => {
            const name = document.getElementById('resp-name').value;
            const sector_ids = selectedSectors.map(s => s.id);
            if (id) {
                await Api.responsibles.update(id, name, sector_ids);
            } else {
                await Api.responsibles.create(name, sector_ids);
            }
            window.app.toast('Responsável salvo!');
            this.loadResponsibles();
        });

        // Initialize UI logic after Modal is rendered
        const container = document.getElementById('resp-badge-container');
        const select = document.getElementById('resp-add-sector');

        const renderBadges = () => {
            if (selectedSectors.length === 0) {
                container.innerHTML = '<span class="text-secondary" style="font-size: 0.85rem; padding: 0.2rem 0.5rem;">Nenhum setor selecionado</span>';
                return;
            }

            container.innerHTML = selectedSectors.map(s => `
                <span class="badge badge-neutral badge-removable" data-id="${s.id}" style="cursor: pointer;">
                    ${s.alias || s.name}
                    <i class="fa-solid fa-xmark badge-remove-btn"></i>
                </span>
            `).join('');

            // Attach individual remove events
            container.querySelectorAll('.badge-removable').forEach(badge => {
                badge.onclick = () => {
                    const sid = badge.dataset.id;
                    selectedSectors = selectedSectors.filter(s => String(s.id) !== String(sid));
                    renderBadges();
                };
            });
        };

        select.onchange = () => {
            const sid = select.value;
            if (!sid) return;
            if (!selectedSectors.some(s => String(s.id) === String(sid))) {
                const sector = this.sectors.find(s => String(s.id) === String(sid));
                if (sector) selectedSectors.push(sector);
                renderBadges();
            }
            select.value = ''; // Reset
        };

        renderBadges();
    },

    async showSectorModal(id = null) {
        // Defensive load of responsibles list in memory
        if (!this.responsibles_list || this.responsibles_list.length === 0) {
            this.responsibles_list = await Api.responsibles.list();
        }

        const sector = id ? this.sectors.find(s => s.id === id) : null;
        const currentName = sector ? sector.name : '';
        const currentAlias = sector ? sector.alias : '';
        const isInternal = sector ? (sector.is_internal || sector.is_internal_hierarchy) : 1;
        const parentId = sector ? sector.parent_id : null;

        // Fetch current linked auditors/responsibles
        let selectedResponsibles = [];
        if (sector && sector.responsible_ids) {
            const rids = sector.responsible_ids.split(',').map(rid => parseInt(rid.trim(), 10));
            selectedResponsibles = this.responsibles_list.filter(r => rids.includes(parseInt(r.id, 10)));
        }

        const parentOptions = this.sectors
            .filter(s => s.id !== id)
            .map(s => `<option value="${s.id}" ${s.id === parentId ? 'selected' : ''}>${s.alias || s.name}</option>`)
            .join('');

        const html = `
            <div class="grid-form mb-1" style="grid-template-columns: 2fr 1fr; gap: 10px;">
                <div class="form-group">
                    <label>Nome do Setor</label>
                    <input type="text" id="sec-name" required value="${currentName.replace(/"/g, '&quot;')}" placeholder="Ex: Protocolo Central">
                </div>
                <div class="form-group">
                    <label>Apelido / Sigla</label>
                    <input type="text" id="sec-alias" value="${(currentAlias || '').replace(/"/g, '&quot;')}" placeholder="Ex: PROT">
                </div>
            </div>
            <div class="form-group mb-1">
                <label>Setor Pai (Opcional)</label>
                <select id="sec-parent">
                    <option value="">Nenhum (Setor Raiz)</option>
                    ${parentOptions}
                </select>
                <small class="text-secondary">Selecione apenas se este for um subsetor de outro setor já existente.</small>
            </div>
            <div class="form-group mb-1">
                <label>Tipo de Setor (Interno / Externo)</label>
                <select id="sec-internal">
                    <option value="1" ${isInternal ? 'selected' : ''}>Setor Interno SMF</option>
                    <option value="0" ${!isInternal ? 'selected' : ''}>Externo Não SMF</option>
                </select>
                <small class="text-secondary">
                    <strong>Setor Interno SMF:</strong> As movimentações entre este setor e subsetores serão tratadas como tramitação interna. <strong>Externo Não SMF:</strong> Trata de movimentações de saída para órgãos fora da administração ou outras secretarias.
                </small>
            </div>
            <div class="form-group mb-1">
                <label>Adicionar Auditor Responsável por este Setor</label>
                <select id="sec-add-resp">
                    <option value="">Selecione um auditor para vincular...</option>
                    ${this.responsibles_list.map(r => `<option value="${r.id}">${r.name}</option>`).join('')}
                </select>
                <small class="text-secondary">Selecione os auditores/responsáveis associados a este setor.</small>
            </div>
            <div class="form-group">
                <label>Auditores Responsáveis Vinculados</label>
                <div id="sec-badge-container" style="display: flex; flex-wrap: wrap; gap: 0.5rem; min-height: 44px; padding: 0.5rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: #f8fafc;">
                    <!-- Badges injected here -->
                </div>
            </div>
        `;

        this.showModal(id ? 'Editar Setor' : 'Novo Setor', html, async () => {
            try {
                const name = document.getElementById('sec-name').value;
                const alias = document.getElementById('sec-alias').value;
                const is_internal = parseInt(document.getElementById('sec-internal').value, 10);
                const parent_id = document.getElementById('sec-parent').value || null;
                const responsible_ids = selectedResponsibles.map(r => parseInt(r.id, 10));
                
                const bodyData = { name, alias, is_internal, parent_id, responsible_ids };
                if (id) {
                    bodyData.id = id;
                    await fetch('api/sectors.php', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(bodyData)
                    }).then(r => r.json());
                } else {
                    await fetch('api/sectors.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(bodyData)
                    }).then(r => r.json());
                }
                
                window.app.toast('Setor salvo!');
                this.loadSectors();
            } catch(e) {
                window.app.toast(e.message, 'error');
            }
        });

        // Initialize UI logic
        const container = document.getElementById('sec-badge-container');
        const select = document.getElementById('sec-add-resp');

        const renderBadges = () => {
            if (selectedResponsibles.length === 0) {
                container.innerHTML = '<span class="text-secondary" style="font-size: 0.85rem; padding: 0.2rem 0.5rem;">Nenhum auditor selecionado</span>';
                return;
            }

            container.innerHTML = selectedResponsibles.map(r => `
                <span class="badge badge-neutral badge-removable" data-id="${r.id}" style="cursor: pointer;">
                    ${r.name}
                    <i class="fa-solid fa-xmark badge-remove-btn"></i>
                </span>
            `).join('');

            // Attach individual remove events
            container.querySelectorAll('.badge-removable').forEach(badge => {
                badge.onclick = () => {
                    const rid = badge.dataset.id;
                    selectedResponsibles = selectedResponsibles.filter(r => String(r.id) !== String(rid));
                    renderBadges();
                };
            });
        };

        select.onchange = () => {
            const rid = select.value;
            if (!rid) return;
            if (!selectedResponsibles.some(r => String(r.id) === String(rid))) {
                const responsible = this.responsibles_list.find(r => String(r.id) === String(rid));
                if (responsible) selectedResponsibles.push(responsible);
                renderBadges();
            }
            select.value = ''; // Reset select
        };

        renderBadges();
    },

    showMergeSectorModal(sourceId, sourceName) {
        const otherSectors = this.sectors.filter(s => s.id !== sourceId);
        const html = `
            <div class="alert alert-warning mb-1">
                <i class="fa-solid fa-triangle-exclamation"></i>
                Esta ação moverá <strong>toda a história</strong> (movimentações, usuários e responsáveis) do setor "<b>${sourceName}</b>" para o setor selecionado abaixo. O setor antigo será desativado.
            </div>
            <div class="form-group">
                <label>Setor de Destino (Onde os dados serão consolidados)</label>
                <select id="merge-target" required>
                    <option value="">Selecione o setor correto...</option>
                    ${otherSectors.map(s => `<option value="${s.id}">${s.alias || s.name}</option>`).join('')}
                </select>
            </div>
        `;
        this.showModal('Mesclar Setores', html, async () => {
            try {
                const targetId = document.getElementById('merge-target').value;
                if (!targetId) throw new Error('Selecione um setor de destino');

                const res = await fetch('api/sectors.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'merge',
                        source_id: sourceId,
                        target_id: targetId
                    })
                });
                const data = await res.json();
                if (data.error) throw new Error(data.error);

                window.app.toast('Setores mesclados com sucesso!');
                this.loadSectors();
                this.loadResponsibles();
                if (this.loadUsers) this.loadUsers();
            } catch(e) {
                window.app.toast(e.message, 'error');
                throw e;
            }
        });
    },

    showUserModal() {
        const sectorsOpts = this.sectors.map(s => `<option value="${s.id}">${s.alias || s.name}</option>`).join('');
        const html = `
            <div class="form-group mb-1">
                <label>Nome Completo</label>
                <input type="text" id="usr-name" required>
            </div>
            <div class="grid-form mb-1" style="grid-template-columns: 1fr 1fr;">
                <div class="form-group col-span-1">
                    <label>CPF (Apenas números)</label>
                    <input type="text" id="usr-cpf" required placeholder="Ex: 12345678901" maxlength="11">
                </div>
                <div class="form-group col-span-1">
                    <label>E-mail</label>
                    <input type="email" id="usr-email" required>
                </div>
            </div>
            <div class="form-group mb-1">
                <label>Secretaria</label>
                <input type="text" id="usr-dept" placeholder="Ex: Secretaria de Fazenda">
            </div>
            <div class="grid-form mb-1" style="grid-template-columns: 1fr 1fr;">
                <div class="form-group col-span-1">
                    <label>Função</label>
                    <select id="usr-role" required>
                        <option value="Assistente Operacional">Assistente Operacional</option>
                        <option value="Estagiario">Estagiário</option>
                        <option value="Gestor">Gestor</option>
                        <option value="Admin">Administrador</option>
                    </select>
                </div>
                <div class="form-group col-span-1">
                    <label>Setor</label>
                    <select id="usr-sec" required>
                        <option value="">Selecione...</option>
                        ${sectorsOpts}
                    </select>
                </div>
            </div>
            <div class="form-group">
                <p class="text-secondary" style="font-size: 0.85rem;">
                    <i class="fa-solid fa-circle-info"></i> A senha inicial será os 6 últimos dígitos do CPF informado.
                </p>
                <input type="hidden" id="usr-pass" value="">
            </div>
        `;
        this.showModal('Novo Colaborador', html, async () => {
            try {
                await Api.users.create({
                    name: document.getElementById('usr-name').value,
                    cpf: document.getElementById('usr-cpf').value,
                    email: document.getElementById('usr-email').value,
                    role: document.getElementById('usr-role').value,
                    department: document.getElementById('usr-dept').value,
                    sector_id: document.getElementById('usr-sec').value,
                    password: document.getElementById('usr-pass').value,
                });
                window.app.toast('Colaborador adicionado!');
                this.loadUsers();
            } catch(e) {
                window.app.toast(e.message, 'error');
            }
        });
    },

    showEditUserModal(user) {
        const sectorsOpts = this.sectors.map(s => `<option value="${s.id}" ${s.id == user.sector_id ? 'selected' : ''}>${s.alias || s.name}</option>`).join('');
        const html = `
            <div class="form-group mb-1">
                <label>Nome Completo</label>
                <input type="text" id="usr-name" value="${user.name}" required>
            </div>
            <div class="grid-form mb-1" style="grid-template-columns: 1fr 1fr;">
                <div class="form-group col-span-1">
                    <label>CPF (Apenas números)</label>
                    <input type="text" id="usr-cpf" value="${user.cpf}" required maxlength="11">
                </div>
                <div class="form-group col-span-1">
                    <label>E-mail</label>
                    <input type="email" id="usr-email" value="${user.email}" required>
                </div>
            </div>
            <div class="form-group mb-1">
                <label>Secretaria</label>
                <input type="text" id="usr-dept" value="${user.department || ''}" placeholder="Ex: Secretaria de Fazenda">
            </div>
            <div class="grid-form mb-1" style="grid-template-columns: 1fr 1fr;">
                <div class="form-group col-span-1">
                    <label>Função</label>
                    <select id="usr-role" required>
                        <option value="Assistente Operacional" ${user.role === 'Assistente Operacional' ? 'selected' : ''}>Assistente Operacional</option>
                        <option value="Estagiario" ${user.role === 'Estagiario' ? 'selected' : ''}>Estagiário</option>
                        <option value="Gestor" ${user.role === 'Gestor' ? 'selected' : ''}>Gestor</option>
                        <option value="Admin" ${user.role === 'Admin' ? 'selected' : ''}>Administrador</option>
                    </select>
                </div>
                <div class="form-group col-span-1">
                    <label>Setor</label>
                    <select id="usr-sec" required>
                        <option value="">Selecione...</option>
                        ${sectorsOpts}
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Alterar Senha (Opcional)</label>
                <input type="password" id="usr-pass" placeholder="Deixe em branco para manter a atual">
            </div>
        `;
        this.showModal('Editar Colaborador', html, async () => {
            const data = {
                id: user.id,
                name: document.getElementById('usr-name').value,
                cpf: document.getElementById('usr-cpf').value,
                email: document.getElementById('usr-email').value,
                department: document.getElementById('usr-dept').value,
                role: document.getElementById('usr-role').value,
                sector_id: document.getElementById('usr-sec').value,
                password: document.getElementById('usr-pass').value
            };
            await Api.users.update(data);
            window.app.toast('Colaborador atualizado com sucesso!');
            this.loadUsers();
        });
    },

    async deleteResponsible(id) {
        if (!confirm('Deseja realmente remover este responsável?')) return;
        try {
            await Api.responsibles.delete(id);
            window.app.toast('Responsável removido!');
            this.loadResponsibles();
        } catch(e) { window.app.toast(e.message, 'error'); }
    },

    async deleteSector(id) {
        if (!confirm('Deseja realmente excluir este setor? O histórico será mantido.')) return;
        try {
            await Api.sectors.delete(id);
            window.app.toast('Setor excluído!');
            this.loadSectors();
        } catch(e) { window.app.toast(e.message, 'error'); }
    },

    async deleteAllSectors() {
        if (!confirm('CUIDADO: Deseja realmente excluir TODOS os setores? Esta ação não tem volta e afeta os relatórios atuais.')) return;
        try {
            await Api.sectors.delete('all');
            window.app.toast('Todos os setores foram excluídos!');
            this.loadSectors();
        } catch(e) { window.app.toast(e.message, 'error'); }
    },

    async deleteUser(id) {
        if (!confirm('Deseja desativar este colaborador? Ele perderá o acesso.')) return;
        try {
            await Api.users.delete(id);
            window.app.toast('Colaborador desativado!');
            this.loadUsers();
        } catch(e) { window.app.toast(e.message, 'error'); }
    },

    async resetUserPassword(id, name) {
        if (!confirm(`Deseja resetar a senha de "${name}"? \n\nA senha voltará para o padrão (6 últimos dígitos do CPF) e o usuário será obrigado a trocá-la no próximo acesso.`)) return;
        try {
            await Api.users.resetPassword(id);
            window.app.toast('Senha resetada com sucesso!');
        } catch(e) { window.app.toast(e.message, 'error'); }
    },

    async loadImportHistory() {
        try {
            const history = await Api.import.history();
            const tbody = document.getElementById('tbody-import-history');
            if (!tbody) return;
            
            if (!history || history.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center" style="padding: 2.5rem; color: var(--text-secondary);"><i class="fa-solid fa-clock-rotate-left fa-3x" style="display:block; margin: 0 auto 1rem auto; opacity: 0.4; color: var(--primary);"></i> Nenhuma importação ou versão de backup registrada ainda.</td></tr>';
                return;
            }

            tbody.innerHTML = history.map(h => {
                // Status mapping with beautiful glowing badges
                let statusBadge = '';
                switch (h.status) {
                    case 'completed':
                        statusBadge = '<span class="badge-custom badge-success-glow" style="font-weight: 700; font-size: 0.75rem;"><i class="fa-solid fa-circle-check"></i> Ativo</span>';
                        break;
                    case 'rolled_back':
                        statusBadge = '<span class="badge-custom" style="background: rgba(148, 163, 184, 0.12); color: #475569; font-weight: 700; font-size: 0.75rem;"><i class="fa-solid fa-rotate-left"></i> Desfeito</span>';
                        break;
                    case 'failed':
                        statusBadge = '<span class="badge-custom" style="background: rgba(239, 68, 68, 0.1); color: #b91c1c; font-weight: 700; font-size: 0.75rem;"><i class="fa-solid fa-circle-xmark"></i> Falhou</span>';
                        break;
                    case 'running':
                        statusBadge = '<span class="badge-custom" style="background: rgba(245, 158, 11, 0.1); color: #d97706; font-weight: 700; font-size: 0.75rem;"><i class="fa-solid fa-spinner fa-spin"></i> Executando</span>';
                        break;
                    case 'pending':
                    default:
                        statusBadge = '<span class="badge-custom" style="background: rgba(100, 116, 139, 0.1); color: #475569; font-weight: 700; font-size: 0.75rem;"><i class="fa-solid fa-clock"></i> Pendente</span>';
                }

                // Snapshots backup state
                const hasSnapshot = !!h.snapshot_file;
                const snapshotBadge = hasSnapshot 
                    ? `<span class="badge-custom badge-success-glow" style="font-size: 0.75rem; font-weight: 600;"><i class="fa-solid fa-shield-halved"></i> snap_${h.batch_id.slice(-6)}.sql</span>`
                    : '<span style="font-size: 0.8rem; color: var(--text-secondary); font-style: italic;"><i class="fa-solid fa-ban"></i> Não disponível</span>';

                // Rich Stats formatting
                let statsHtml = '';
                if (h.status === 'completed' && h.stats) {
                    const s = h.stats;
                    statsHtml = `
                        <div class="flex-center" style="gap: 0.4rem; justify-content: flex-start; flex-wrap: wrap;">
                            <span class="badge-item" title="Movimentações"><i class="fa-solid fa-arrow-right-arrow-left"></i> ${s.movements_created || 0} movs</span>
                            <span class="badge-item" title="Processos"><i class="fa-solid fa-file-invoice"></i> ${s.processes_created || 0} procs</span>
                            ${s.sectors_created ? `<span class="badge-item" title="Setores"><i class="fa-solid fa-sitemap"></i> ${s.sectors_created} set</span>` : ''}
                            ${s.responsibles_created ? `<span class="badge-item" title="Auditores"><i class="fa-solid fa-user-tie"></i> ${s.responsibles_created} aud</span>` : ''}
                        </div>
                    `;
                } else if (h.status === 'rolled_back' && h.stats) {
                    statsHtml = `<span style="font-size: 0.8rem; color: var(--text-secondary); font-weight:500;"><i class="fa-solid fa-trash-can"></i> Removidos: ${h.stats.movements || 0} movs, ${h.stats.processes || 0} procs</span>`;
                } else if (h.status === 'failed' && h.error_message) {
                    statsHtml = `<span style="font-size: 0.8rem; color: var(--danger); display: inline-block; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight:500;" title="${h.error_message}"><i class="fa-solid fa-triangle-exclamation"></i> ${h.error_message}</span>`;
                } else {
                    statsHtml = '<span style="color: var(--text-secondary); font-size: 0.85rem;">-</span>';
                }

                // Warnings and errors indicator
                const warningsAndErrors = [];
                if (h.error_count > 0) {
                    warningsAndErrors.push(`<span style="color: var(--danger); font-weight: bold; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-circle-exclamation"></i> ${h.error_count} erros</span>`);
                }
                if (h.warning_count > 0) {
                    warningsAndErrors.push(`<span style="color: var(--warning); font-weight: bold; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-triangle-exclamation"></i> ${h.warning_count} avisos</span>`);
                }
                const warningsHtml = warningsAndErrors.length > 0 
                    ? `<div style="margin-top: 0.4rem; display: flex; gap: 0.6rem; align-items: center;">${warningsAndErrors.join('')}</div>`
                    : '';

                // Actions Buttons
                let actionsHtml = '';
                const formatLabel = h.version_label.replace(/'/g, "\\'");
                if (h.status === 'completed') {
                    actionsHtml = `
                        <div style="display: flex; gap: 0.4rem; justify-content: center;">
                            <button class="btn-action-round view-logs-btn" style="color: var(--primary); background: rgba(37,99,235,0.06); border-color: rgba(37,99,235,0.12);" title="Ver Console de Logs" onclick="configView.showImportLogsModal('${h.batch_id}', '${formatLabel}')">
                                <i class="fa-solid fa-terminal"></i>
                            </button>
                            ${hasSnapshot ? `
                            <button class="btn-action-round download-btn" style="color: #10b981; background: rgba(16,185,129,0.06); border-color: rgba(16,185,129,0.12);" title="Baixar este arquivo de Snapshot (.sql)" onclick="configView.downloadSnapshot('${h.batch_id}', '${formatLabel}')">
                                <i class="fa-solid fa-download"></i>
                            </button>
                            <button class="btn-action-round restore-btn" style="color: #4f46e5; background: rgba(79,70,229,0.06); border-color: rgba(79,70,229,0.12);" title="Restaurar este Snapshot de Segurança" onclick="configView.restoreSnapshot('${h.batch_id}', '${formatLabel}')">
                                <i class="fa-solid fa-history"></i>
                            </button>
                            ` : ''}
                            <button class="btn-action-round delete-btn" style="color: var(--danger); background: rgba(239,68,68,0.06); border-color: rgba(239,68,68,0.12);" title="Desfazer Lote (Remover Registros)" onclick="configView.deleteImportBatch('${h.batch_id}')">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    `;
                } else {
                    actionsHtml = `
                        <div style="display: flex; gap: 0.4rem; justify-content: center;">
                            <button class="btn-action-round view-logs-btn" style="color: var(--primary); background: rgba(37,99,235,0.06); border-color: rgba(37,99,235,0.12);" title="Ver Console de Logs" onclick="configView.showImportLogsModal('${h.batch_id}', '${formatLabel}')">
                                <i class="fa-solid fa-terminal"></i>
                            </button>
                        </div>
                    `;
                }

                return `
                    <tr class="version-row">
                        <td style="padding: 1.1rem 1rem; vertical-align: middle;">
                            <div style="font-weight: 700; color: var(--text-primary); font-size: 0.95rem;">${h.version_label}</div>
                            <div style="font-family: monospace; font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.25rem;">ID Lote: ${h.batch_id}</div>
                        </td>
                        <td style="padding: 1.1rem 1rem; vertical-align: middle; font-size: 0.85rem;">
                            <div style="font-weight: 600; color: var(--text-primary);">${new Date(h.started_at).toLocaleString('pt-BR')}</div>
                            <div style="color: var(--text-secondary); font-size: 0.8rem; margin-top: 0.2rem;"><i class="fa-regular fa-user"></i> ${h.user_name || 'Usuário'}</div>
                        </td>
                        <td style="padding: 1.1rem 1rem; vertical-align: middle;">
                            ${statusBadge}
                        </td>
                        <td style="padding: 1.1rem 1rem; vertical-align: middle;">
                            ${snapshotBadge}
                        </td>
                        <td style="padding: 1.1rem 1rem; vertical-align: middle;">
                            ${statsHtml}
                            ${warningsHtml}
                        </td>
                        <td style="padding: 1.1rem 1rem; vertical-align: middle;" class="text-center">
                            ${actionsHtml}
                        </td>
                    </tr>
                `;
            }).join('');
        } catch(e) {
            console.error('Erro ao carregar historico', e);
            const tbody = document.getElementById('tbody-import-history');
            if (tbody) {
                tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger" style="color:var(--danger); padding: 2rem;">Erro ao carregar histórico: ${e.message}</td></tr>`;
            }
        }
    },

    async deleteImportBatch(id) {
        if (!confirm('ATENÇÃO EXTREMA !!!\n\nDeseja realmente DESFAZER este lote de importação?\n\nIsso irá:\n1. Remover todos os processos, movimentações, responsáveis e setores que foram criados EXCLUSIVAMENTE por este lote.\n2. Preservar registros associados a outros lotes ou inseridos manualmente.\n\nEsta operação é definitiva e transacional. Deseja prosseguir?')) return;
        
        // Show spinner overlay
        const modal = document.createElement('div');
        modal.id = 'loading-overlay-screen';
        modal.style = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(15,23,42,0.85); display:flex; flex-direction:column; align-items:center; justify-content:center; color:white; z-index:9999; backdrop-filter:blur(5px);';
        modal.innerHTML = `
            <i class="fa-solid fa-rotate-left fa-spin fa-4x" style="color:#f87171; margin-bottom:1.5rem;"></i>
            <h2 style="font-weight:700; margin:0; font-size:1.5rem;">Desfazendo Importações...</h2>
            <p style="color:#94a3b8; font-size:1rem; margin:0.5rem 0 0 0; text-align:center; max-width:400px; padding:0 1rem;">Processando a remoção transacional de registros do lote no banco de dados. Aguarde...</p>
        `;
        document.body.appendChild(modal);

        try {
            await Api.import.undo(id);
            document.body.removeChild(modal);
            window.app.toast('Lote de importação desfeito com sucesso!');
            await Promise.all([this.loadSectors(), this.loadUsers(), this.loadResponsibles(), this.loadImportHistory()]);
        } catch(e) {
            document.body.removeChild(modal);
            window.app.toast(e.message, 'error');
        }
    },

    async wipeDatabase() {
        if (!confirm('!!! ALERTA NUCLEAR DE SEGURANÇA !!!\n\nEsta ação irá APAGAR PERMANENTEMENTE:\n- Todas as movimentações registradas\n- Todos os processos cadastrados\n- Todos os Auditores e Responsáveis\n- Todos os setores criados (exceto os que possuem colaboradores vinculados)\n\nEsta ação é irreversível (embora um snapshot seja gerado automaticamente antes do reset).\n\nDeseja realmente zerar a base de dados inteira?')) return;
        
        if (!confirm('CONFIRMAÇÃO FINAL: Você tem certeza ABSOLUTA de que deseja resetar o sistema inteiro?')) return;

        // Show nuclear spinner overlay
        const modal = document.createElement('div');
        modal.id = 'loading-overlay-screen';
        modal.style = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(15,23,42,0.85); display:flex; flex-direction:column; align-items:center; justify-content:center; color:white; z-index:9999; backdrop-filter:blur(5px);';
        modal.innerHTML = `
            <i class="fa-solid fa-radiation fa-spin fa-4x" style="color:#ef4444; margin-bottom:1.5rem;"></i>
            <h2 style="font-weight:700; margin:0; font-size:1.5rem;">Limpando Todo o Sistema...</h2>
            <p style="color:#94a3b8; font-size:1rem; margin:0.5rem 0 0 0; text-align:center; max-width:400px; padding:0 1rem;">Criando snapshot de segurança e efetuando a limpeza total da base de dados. Não feche o navegador.</p>
        `;
        document.body.appendChild(modal);

        try {
            await Api.import.wipe();
            document.body.removeChild(modal);
            window.app.toast('Base de dados limpa com sucesso!');
            await Promise.all([
                this.loadSectors(), 
                this.loadUsers(), 
                this.loadResponsibles(), 
                this.loadImportHistory()
            ]);
        } catch(e) {
            document.body.removeChild(modal);
            window.app.toast(e.message, 'error');
        }
    },

    async createManualSnapshot() {
        // Show spinner overlay
        const modal = document.createElement('div');
        modal.id = 'loading-overlay-screen';
        modal.style = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(15,23,42,0.85); display:flex; flex-direction:column; align-items:center; justify-content:center; color:white; z-index:9999; backdrop-filter:blur(5px);';
        modal.innerHTML = `
            <i class="fa-solid fa-shield-halved fa-spin fa-4x" style="color:#6366f1; margin-bottom:1.5rem;"></i>
            <h2 style="font-weight:700; margin:0; font-size:1.5rem;">Gerando Snapshot de Segurança...</h2>
            <p style="color:#94a3b8; font-size:1rem; margin:0.5rem 0 0 0; text-align:center; max-width:400px; padding:0 1rem;">Efetuando backup completo de todas as tabelas transacionais em arquivo SQL. Aguarde...</p>
        `;
        document.body.appendChild(modal);

        try {
            const res = await Api.import.createSnapshot();
            document.body.removeChild(modal);
            window.app.toast('Snapshot de segurança criado com sucesso!');
            await this.loadImportHistory();
        } catch(e) {
            document.body.removeChild(modal);
            window.app.toast('Erro ao criar snapshot: ' + e.message, 'error');
        }
    },

    async restoreSnapshot(batchId, label) {
        if (!confirm(`!!! ATENÇÃO CRÍTICA !!!\n\nVocê está prestes a RESTAURAR a base de dados inteira para o estado estável da versão:\n"${label}".\n\nIsso irá:\n1. Criar um snapshot de segurança do estado ATUAL do sistema.\n2. Sobrescrever todo o banco atual de processos e movimentos com o backup correspondente.\n\nEsta ação é segura, mas afetará todos os dados de processos ativos e movimentações. Deseja prosseguir?`)) return;
        
        if (!confirm('Confirmação Final: Tem certeza absoluta?')) return;

        // Show spinner overlay
        const modal = document.createElement('div');
        modal.id = 'loading-overlay-screen';
        modal.style = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(15,23,42,0.85); display:flex; flex-direction:column; align-items:center; justify-content:center; color:white; z-index:9999; backdrop-filter:blur(5px);';
        modal.innerHTML = `
            <i class="fa-solid fa-database fa-spin fa-4x" style="color:#38bdf8; margin-bottom:1.5rem;"></i>
            <h2 style="font-weight:700; margin:0; font-size:1.5rem;">Restaurando Base de Dados...</h2>
            <p style="color:#94a3b8; font-size:1rem; margin:0.5rem 0 0 0; text-align:center; max-width:400px; padding:0 1rem;">Efetuando a substituição da base ativa pelo snapshot estável. Por favor, aguarde e não mude de tela...</p>
        `;
        document.body.appendChild(modal);

        try {
            await Api.import.restore(batchId);
            document.body.removeChild(modal);
            window.app.toast('Base de dados restaurada com sucesso para o snapshot selecionado!');
            await Promise.all([this.loadSectors(), this.loadUsers(), this.loadResponsibles(), this.loadImportHistory()]);
        } catch(e) {
            document.body.removeChild(modal);
            window.app.toast('Falha ao restaurar: ' + e.message, 'error');
        }
    },

    downloadSnapshot(batchId, label) {
        try {
            window.location.href = `api/import/snapshot/download?batch_id=${batchId}`;
            window.app.toast(`Iniciando download de: ${label}...`);
        } catch(e) {
            window.app.toast('Erro ao baixar snapshot: ' + e.message, 'error');
        }
    },

    async showImportLogsModal(batchId, label) {
        try {
            window.app.toast('Carregando logs do lote...');
            const data = await Api.import.logs(batchId);
            
            const logsHtml = data.logs && data.logs.length > 0 ? data.logs.map(log => {
                const timeStr = new Date(log.created_at).toLocaleTimeString('pt-BR');
                const lvlClass = `log-lvl-${log.log_level.toLowerCase()}`;
                const rowIndicator = log.row_number ? `<span style="color:#a78bfa; font-weight:700;">[Linha ${log.row_number}]</span>` : '';
                return `
                    <div class="log-line">
                        <span class="log-time">[${timeStr}]</span>
                        <span class="${lvlClass}">[${log.log_level}]</span>
                        <span class="log-phase">[${log.phase.toUpperCase()}]</span>
                        <span class="log-text">${rowIndicator} ${log.message}</span>
                    </div>
                `;
            }).join('') : '<div style="color:#64748b; text-align:center; padding:2rem; font-style:italic;">Nenhum log de execução encontrado para este lote.</div>';

            const sum = data.summary || { info: 0, warning: 0, error: 0 };
            
            const root = document.getElementById('modal-root');
            root.innerHTML = `
                <div class="modal-overlay" id="custom-modal" style="z-index: 1000;">
                    <div class="modal-content" style="max-width: 900px; width: 95%;">
                        <div class="modal-header" style="padding-bottom: 1rem; border-bottom: 1px solid var(--border-color);">
                            <div>
                                <h3 style="margin:0; font-size:1.25rem;"><i class="fa-solid fa-terminal" style="color:var(--primary)"></i> Console de Execução: ${label}</h3>
                                <div style="display:flex; gap:10px; margin-top:0.4rem; font-size:0.8rem; color:var(--text-secondary);">
                                    <span>Lote: <code>${batchId}</code></span>
                                </div>
                            </div>
                            <button class="modal-close" onclick="document.getElementById('custom-modal').remove()"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                        <div style="padding:1.5rem 0 0 0;">
                            <!-- Summary Bar -->
                            <div style="display:flex; gap:10px; margin-bottom:1rem; flex-wrap:wrap;">
                                <span class="badge-custom badge-success-glow" style="font-size:0.8rem;"><i class="fa-solid fa-circle-info"></i> ${sum.info || 0} Infos</span>
                                <span class="badge-custom badge-warning-glow" style="font-size:0.8rem;"><i class="fa-solid fa-triangle-exclamation"></i> ${sum.warning || 0} Avisos</span>
                                <span class="badge-custom" style="background: rgba(239, 68, 68, 0.1); color: #b91c1c; font-size:0.8rem;"><i class="fa-solid fa-circle-xmark"></i> ${sum.error || 0} Erros</span>
                            </div>
                            
                            <!-- Terminal -->
                            <div class="logs-terminal-container">
                                ${logsHtml}
                            </div>
                        </div>
                        <div class="flex-end" style="gap:10px; margin-top:1.5rem; border-top:1px solid var(--border-color); padding-top:1rem;">
                            <button class="btn-primary" style="width:auto; padding: 0.6rem 1.2rem;" onclick="document.getElementById('custom-modal').remove()"><i class="fa-solid fa-circle-check"></i> Fechar Console</button>
                        </div>
                    </div>
                </div>
            `;
        } catch (e) {
            window.app.toast('Falha ao buscar logs: ' + e.message, 'error');
        }
    },

    initImportLogic() {
        const input = document.getElementById('input-import-excel');
        const btn = document.getElementById('btn-process-import');
        const cancelBtn = document.getElementById('btn-cancel-import');
        const downloadBtn = document.getElementById('btn-download-template');
        
        if (!input) return;

        input.onchange = (e) => this.handleFileSelect(e);
        btn.onclick = () => this.processImport();
        
        if (cancelBtn) {
            cancelBtn.onclick = () => {
                input.value = '';
                document.getElementById('import-preview').style.display = 'none';
                document.getElementById('version-tag-container').style.display = 'none';
                document.getElementById('import-actions-bar').style.display = 'none';
                this.importData = null;
                window.app.toast('Importação cancelada.');
            };
        }

        // Template Download Event
        if (downloadBtn) {
            downloadBtn.onclick = () => this.downloadTemplate();
        }

        // SQL Import Elements
        const sqlInput = document.getElementById('input-import-sql');
        const sqlProcessBtn = document.getElementById('btn-process-sql-import');
        const sqlCancelBtn = document.getElementById('btn-cancel-sql-import');
        const restoreServerLegacyBtn = document.getElementById('btn-restore-server-legacy');

        if (sqlInput) {
            sqlInput.onchange = (e) => this.handleSqlFileSelect(e);
        }

        if (sqlProcessBtn) {
            sqlProcessBtn.onclick = () => this.processSqlImport();
        }

        if (sqlCancelBtn) {
            sqlCancelBtn.onclick = () => this.cancelSqlImport();
        }

        if (restoreServerLegacyBtn) {
            restoreServerLegacyBtn.onclick = () => this.restoreServerLegacySql();
        }
    },

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            const data = evt.target.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            
            // Pass defval: "" so xlsx doesn't omit keys when cells (like SETOR) are empty in the first row
            const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });

            if (json.length === 0) {
                window.app.toast('Planilha vazia!', 'error');
                return;
            }

            // Map columns intuitively or fallback to absolute positions based on your file
            const headers = Object.keys(json[0]);
            const mapping = {
                process_number: headers.find(h => /processo/i.test(h)) || headers[0],
                movement_date: headers.find(h => /data/i.test(h) || (/movimentação/i.test(h) && !/tipo/i.test(h))) || headers[1],
                action: headers.find(h => /tipo/i.test(h)) || headers.find(h => /ação/i.test(h) && !/data/i.test(h)) || headers[2],
                responsible: headers.find(h => /auditor|responsável/i.test(h)) || headers[3],
                subject: headers.find(h => /assunto/i.test(h)) || headers[4],
                destination_sector: headers.find(h => /setor/i.test(h)) || headers[5]
            };

            // Detect if format is MM/DD/YYYY (US Format) by scanning the first 100 rows
            let isUSFormat = false;
            for (let i = 0; i < Math.min(json.length, 100); i++) {
                const dateVal = json[i][mapping.movement_date];
                if (typeof dateVal === 'string') {
                    const parts = dateVal.split(/[\/\-]/).map(p => p.trim());
                    if (parts.length === 3) {
                        // If first part is > 12, it must be DD/MM
                        if (parseInt(parts[0]) > 12) {
                            isUSFormat = false;
                            break;
                        }
                        // If second part is > 12, it must be MM/DD
                        if (parseInt(parts[1]) > 12) {
                            isUSFormat = true;
                            break;
                        }
                    }
                }
            }

            this.importData = json.map(row => {
                const procData = this.normalizeProcessStr(row[mapping.process_number]);
                return {
                    process_number: procData.main,
                    attached_processes: procData.attached,
                    movement_date: this.formatExcelDate(row[mapping.movement_date], isUSFormat),
                    action: row[mapping.action],
                    responsible: row[mapping.responsible],
                    subject: row[mapping.subject],
                    destination_sector: row[mapping.destination_sector]
                };
            }).filter(r => r.process_number);

            this.renderImportPreview(mapping, this.importData.slice(0, 5));
            
            // Debug missing columns
            let missing = [];
            const requiredFields = ['process_number', 'movement_date', 'action', 'responsible', 'subject'];
            for (let k of requiredFields) {
                if (!mapping[k]) missing.push(k);
            }

            // Exibir loading enquanto faz a validação rigorosa no backend
            const summaryDiv = document.getElementById('import-validation-summary');
            summaryDiv.innerHTML = `
                <div class="alert alert-info" style="border-left: 4px solid var(--primary); background: rgba(37,99,235,0.03); color: var(--text-primary);">
                    <i class="fa-solid fa-spinner fa-spin"></i> Efetuando validação rigorosa da planilha com o servidor...
                </div>
            `;
            document.getElementById('import-preview').style.display = 'block';
            document.getElementById('version-tag-container').style.display = 'block';
            document.getElementById('import-actions-bar').style.display = 'flex';
            
            const processBtn = document.getElementById('btn-process-import');
            processBtn.disabled = true;

            try {
                // Chamar o novo validador transacional MVC no backend!
                const validationReport = await Api.import.validate(this.importData);
                
                let msg = `<h4 style="margin: 0 0 0.5rem 0; font-weight: 700; color: var(--text-primary); font-size:1.05rem;"><i class="fa-solid fa-list-check"></i> Relatório de Integridade da Planilha</h4>`;
                msg += `Detectamos <b>${this.importData.length} registros</b> qualificados para importação no arquivo.<br><br>`;
                msg += `<b>Mapeamento de Cabeçalhos:</b> ${headers.map(h => `<code>${h}</code>`).join(', ')}<br>`;

                if (missing.length > 0) {
                    msg += `<div style="color:var(--danger); margin-top:0.6rem; font-weight:600;"><i class="fa-solid fa-circle-xmark"></i> Erro Crítico: Colunas obrigatórias não identificadas: ${missing.join(', ')}</div>`;
                    summaryDiv.innerHTML = `<div class="alert alert-danger" style="background:rgba(239,68,68,0.03); border-left:4px solid var(--danger); color:var(--text-primary);">${msg}</div>`;
                    processBtn.disabled = true;
                    return;
                }

                const totalErrors = validationReport.errors ? validationReport.errors.length : 0;
                const totalWarnings = validationReport.warnings ? validationReport.warnings.length : 0;

                if (totalErrors > 0) {
                    msg += `<div style="color: #b91c1c; margin-top: 0.8rem; font-weight: 700;"><i class="fa-solid fa-circle-exclamation"></i> Encontramos ${totalErrors} erros graves na planilha:</div>`;
                    msg += `<ul style="margin: 0.4rem 0 0 1rem; padding: 0; font-size: 0.85rem; max-height: 150px; overflow-y:auto; color: #b91c1c;">`;
                    validationReport.errors.slice(0, 15).forEach(e => {
                        msg += `<li>Linha ${e.row}: Campo <code>${e.field}</code> - ${e.message}</li>`;
                    });
                    if (totalErrors > 15) msg += `<li>... e mais ${totalErrors - 15} erros.</li>`;
                    msg += `</ul><div style="font-weight:600; margin-top:0.5rem; color:#b91c1c;">A importação está bloqueada até que esses erros sejam corrigidos na planilha Excel.</div>`;
                    
                    summaryDiv.innerHTML = `<div class="alert alert-danger" style="background:rgba(239,68,68,0.03); border-left:4px solid var(--danger); color:var(--text-primary);">${msg}</div>`;
                    processBtn.disabled = true;
                } else if (totalWarnings > 0) {
                    msg += `<div style="color: #d97706; margin-top: 0.8rem; font-weight: 700;"><i class="fa-solid fa-triangle-exclamation"></i> Encontramos ${totalWarnings} inconsistências (Avisos resolvidos automaticamente):</div>`;
                    msg += `<ul style="margin: 0.4rem 0 0 1rem; padding: 0; font-size: 0.85rem; max-height: 120px; overflow-y:auto; color: #b91c1c;">`;
                    validationReport.warnings.slice(0, 10).forEach(w => {
                        msg += `<li>Linha ${w.row}: ${w.message}</li>`;
                    });
                    if (totalWarnings > 10) msg += `<li>... e mais ${totalWarnings - 10} avisos.</li>`;
                    msg += `</ul><div style="font-weight:600; margin-top:0.5rem; color: #059669;"><i class="fa-solid fa-circle-check"></i> Tudo pronto! As inconsistências serão tratadas de forma segura (por exemplo, aplicando valores padrões). O lote pode ser importado agora.</div>`;

                    summaryDiv.innerHTML = `<div class="alert alert-warning" style="background:rgba(245,158,11,0.03); border-left:4px solid var(--warning); color:var(--text-primary);">${msg}</div>`;
                    processBtn.disabled = false;
                } else {
                    msg += `<div style="color: #059669; margin-top: 0.8rem; font-weight: 700;"><i class="fa-solid fa-circle-check"></i> Validação impecável! Nenhum erro ou aviso encontrado. A estrutura do arquivo está 100% íntegra e em conformidade.</div>`;
                    summaryDiv.innerHTML = `<div class="alert alert-info" style="background:rgba(16,185,129,0.03); border-left:4px solid #10b981; color:var(--text-primary);">${msg}</div>`;
                    processBtn.disabled = false;
                }
            } catch (err) {
                summaryDiv.innerHTML = `
                    <div class="alert alert-danger" style="background:rgba(239,68,68,0.03); border-left:4px solid var(--danger); color:var(--text-primary);">
                        <i class="fa-solid fa-triangle-exclamation"></i> Erro ao validar planilha no servidor: ${err.message}
                    </div>
                `;
            }
        };
        reader.readAsBinaryString(file);
    },

    formatExcelDate(val, isUSFormat = false) {
        if (!val) return null;
        if (typeof val === 'number') {
            // Excel serial date format
            const date = new Date((val - 25569) * 86400 * 1000);
            return date.toISOString().split('T')[0];
        }
        // Try to parse string DD/MM/YYYY or YYYY-MM-DD
        if (typeof val === 'string') {
            const parts = val.split(/[\/\-]/).map(p => p.trim());
            if (parts.length === 3) {
                if (parts[0].length === 4) return val.trim(); // YYYY-MM-DD
                
                let day, month;
                if (isUSFormat) {
                    month = parts[0].padStart(2, '0');
                    day = parts[1].padStart(2, '0');
                } else {
                    day = parts[0].padStart(2, '0');
                    month = parts[1].padStart(2, '0');
                }
                
                let year = parts[2];
                
                // Fix for 2 digit or malformed years (e.g. 24 -> 2024, 024 -> 2024)
                if (year.length === 2) {
                    year = parseInt(year) > 50 ? `19${year}` : `20${year}`;
                } else if (year.length < 4) {
                    year = `20` + year.slice(-2).padStart(2, '0');
                } else if (year.length > 4) {
                    year = year.substring(0, 4);
                }
                
                if (!day || !month || !year || day === '00' || month === '00') return null;
                
                return `${year}-${month}-${day}`; // YYYY-MM-DD
            }
        }
        return String(val).trim();
    },

    renderImportPreview(mapping, rows) {
        const headerRow = document.getElementById('preview-header');
        const bodyRows = document.getElementById('preview-body');
        if (!headerRow || !bodyRows) return;

        const cols = ['process_number', 'movement_date', 'action', 'responsible', 'subject', 'destination_sector'];
        headerRow.innerHTML = cols.map(c => `<th>${c.toUpperCase()}</th>`).join('');
        
        bodyRows.innerHTML = rows.map(row => {
            const cells = cols.map(k => {
                if (k === 'process_number') {
                    const attached = row.attached_processes && row.attached_processes.length
                        ? `<br><small style="color:var(--text-secondary);"><i class="fa-solid fa-link"></i> ${row.attached_processes.join(', ')}</small>`
                        : '';
                    return `<td>${row.process_number || '-'}${attached}</td>`;
                }
                return `<td>${row[k] || '-'}</td>`;
            }).join('');
            return `<tr>${cells}</tr>`;
        }).join('');
    },

    normalizeProcessStr(val) {
        if (!val) return { main: '', attached: [] };
        // Normalize "ap" variations into " AP " for splitting
        // matches 'ap ', 'ap.', 'AP', 'ap' followed by digit
        let str = String(val).replace(/ap\./ig, ' AP ').replace(/ap([0-9\s])/ig, ' AP $1');
        // If they miss spacing
        str = str.replace(/ \/\s/g, '/');
        
        const parts = str.split(/ AP /i).map(s => s.trim()).filter(Boolean);
        
        const formatProcess = (pStr) => {
            if (!pStr) return '';
            // Remove everything except numbers and slashes
            let clean = pStr.replace(/[^\d/]/g, '').trim();
            
            // SECURITY: If it has too many slashes or is too long, it's garbage
            const slashCount = (clean.match(/\//g) || []).length;
            if (slashCount > 4 || clean.length > 30) {
                console.warn('Lixo detectado no número do processo:', pStr);
                return '';
            }

            let segs = clean.split('/');
            if (segs.length === 3) {
                let part1 = segs[0].padStart(3, '0');
                let part2 = segs[1].padStart(6, '0');
                let part3 = segs[2]; // year
                if (part3.length === 2) {
                    part3 = parseInt(part3) > 50 ? `19${part3}` : `20${part3}`;
                } else if (part3.length === 3 && part3.startsWith('0')) {
                    part3 = `2${part3}`;
                } else if (part3.length > 4) {
                    part3 = part3.substring(0, 4);
                }
                return `${part1}/${part2}/${part3}`;
            }
            return clean;
        };

        if (parts.length === 0) return { main: '', attached: [] };
        
        const mainProcess = formatProcess(parts[0]);
        const attachedList = parts.slice(1).map(p => formatProcess(p)).filter(Boolean);
        
        return { main: mainProcess, attached: attachedList };
    },

    async processImport() {
        if (!this.importData || this.importData.length === 0) return;
        
        const btn = document.getElementById('btn-process-import');
        const labelInput = document.getElementById('input-version-label');
        const label = labelInput ? labelInput.value.trim() : '';

        const total = this.importData.length;
        const batchId = 'imp_' + Date.now();

        // Show elegant secure importing overlay screen
        const modal = document.createElement('div');
        modal.id = 'loading-overlay-screen';
        modal.style = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(15,23,42,0.85); display:flex; flex-direction:column; align-items:center; justify-content:center; color:white; z-index:9999; backdrop-filter:blur(5px);';
        modal.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin fa-4x" style="color:#10b981; margin-bottom:1.5rem;"></i>
            <h2 style="font-weight:700; margin:0; font-size:1.5rem;">Importando Lote Transacional...</h2>
            <p style="color:#94a3b8; font-size:1rem; margin:0.5rem 0 0 0; text-align:center; max-width:420px; padding:0 1rem;">Efetuando snapshot de segurança preventivo e gravando os ${total} registros de forma íntegra. Por favor, aguarde...</p>
        `;
        document.body.appendChild(modal);

        try {
            // Executa a importação completa de uma única vez no novo MVC backend transacional!
            const res = await Api.import.execute(this.importData, batchId, label);
            
            document.body.removeChild(modal);
            window.app.toast(`Importação de ${total} registros e snapshot concluídos com absoluto sucesso!`);
            
            // Reset UI elements
            document.getElementById('input-import-excel').value = '';
            document.getElementById('import-preview').style.display = 'none';
            document.getElementById('version-tag-container').style.display = 'none';
            document.getElementById('import-actions-bar').style.display = 'none';
            if (labelInput) labelInput.value = '';
            this.importData = null;

            // Refresh all data caches & UI history lists
            await Promise.all([this.loadSectors(), this.loadUsers(), this.loadResponsibles(), this.loadImportHistory()]);
        } catch(e) {
            if (document.getElementById('loading-overlay-screen')) {
                document.body.removeChild(modal);
            }
            window.app.toast('Falha catastrófica na importação: ' + e.message, 'error');
        }
    },

    downloadTemplate() {
        const templateData = [
            {
                'Número do Processo': '001/000123/2026',
                'Data da Movimentação': '05/05/2026',
                'Tipo de Ação': 'ENTRADA',
                'Responsável': 'Carlos Alberto Souza',
                'Assunto': 'Apuração de Infração Fiscal de ISS',
                'Setor Destino': 'FISCALIZAÇÃO'
            },
            {
                'Número do Processo': '002/000456/2026 AP 002/000457/2026',
                'Data da Movimentação': '05/05/2026',
                'Tipo de Ação': 'ENTRADA',
                'Responsável': 'Ana Beatriz Cavalcanti',
                'Assunto': 'Recurso Voluntário Contra Auto de Infração',
                'Setor Destino': 'SUBFIS'
            },
            {
                'Número do Processo': '003/000789/2025',
                'Data da Movimentação': '04/05/2026',
                'Tipo de Ação': 'SAIDA',
                'Responsável': 'Carlos Alberto Souza',
                'Assunto': 'Solicitação de Isenção de IPTU',
                'Setor Destino': 'GABINETE'
            }
        ];

        try {
            if (typeof XLSX === 'undefined') {
                throw new Error('Biblioteca XLSX (SheetJS) não está carregada.');
            }
            const ws = XLSX.utils.json_to_sheet(templateData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Modelo de Dados');
            
            // Auto-fit column widths
            const maxLen = {};
            templateData.forEach(row => {
                Object.keys(row).forEach(key => {
                    const cellLen = String(row[key]).length;
                    const headerLen = key.length;
                    maxLen[key] = Math.max(maxLen[key] || 0, cellLen, headerLen);
                });
            });
            ws['!cols'] = Object.keys(maxLen).map(key => ({ wch: maxLen[key] + 3 }));

            XLSX.writeFile(wb, 'Modelo_Controle_SUBFIS.xlsx');
            window.app.toast('Modelo de planilha baixado com sucesso!');
        } catch (e) {
            window.app.toast('Erro ao baixar modelo de dados: ' + e.message, 'error');
        }
    },

    handleSqlFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.name.endsWith('.sql')) {
            window.app.toast('Por favor, selecione um arquivo válido com extensão .sql', 'error');
            e.target.value = '';
            return;
        }

        this.selectedSqlFile = file;

        const actionsContainer = document.getElementById('sql-actions-container');
        if (actionsContainer) {
            actionsContainer.style.display = 'block';
        }
        const labelInput = document.getElementById('input-sql-version-label');
        if (labelInput) {
            labelInput.value = file.name.replace(/\.sql$/i, '');
        }
        window.app.toast('Arquivo SQL carregado com sucesso!');
    },

    cancelSqlImport() {
        const sqlInput = document.getElementById('input-import-sql');
        if (sqlInput) sqlInput.value = '';
        
        const actionsContainer = document.getElementById('sql-actions-container');
        if (actionsContainer) actionsContainer.style.display = 'none';

        this.selectedSqlFile = null;
        window.app.toast('Envio de arquivo SQL cancelado.');
    },

    async processSqlImport() {
        if (!this.selectedSqlFile) return;

        const labelInput = document.getElementById('input-sql-version-label');
        const label = labelInput ? labelInput.value.trim() : '';

        const formData = new FormData();
        formData.append('sql_file', this.selectedSqlFile);
        formData.append('label', label);

        const modal = document.createElement('div');
        modal.id = 'loading-overlay-screen';
        modal.style = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(15,23,42,0.85); display:flex; flex-direction:column; align-items:center; justify-content:center; color:white; z-index:9999; backdrop-filter:blur(5px);';
        modal.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin fa-4x" style="color:#4f46e5; margin-bottom:1.5rem;"></i>
            <h2 style="font-weight:700; margin:0; font-size:1.5rem;">Importando Base Legada (.sql)...</h2>
            <p style="color:#94a3b8; font-size:1rem; margin:0.5rem 0 0 0; text-align:center; max-width:420px; padding:0 1rem;">O sistema está criando um snapshot preventivo e restaurando o dump SQL. Por favor, aguarde...</p>
        `;
        document.body.appendChild(modal);

        try {
            const response = await fetch('api/import/legacy-sql', {
                method: 'POST',
                body: formData
            });

            const res = await response.json();
            document.body.removeChild(modal);

            if (!response.ok || res.status === 'error') {
                throw new Error(res.message || 'Erro desconhecido');
            }

            window.app.toast(`Base legada importada e restaurada com sucesso! Lote: ${res.batch_id}`);
            
            const sqlInput = document.getElementById('input-import-sql');
            if (sqlInput) sqlInput.value = '';
            
            const actionsContainer = document.getElementById('sql-actions-container');
            if (actionsContainer) actionsContainer.style.display = 'none';
            
            this.selectedSqlFile = null;

            await Promise.all([this.loadSectors(), this.loadUsers(), this.loadResponsibles(), this.loadImportHistory()]);
        } catch (e) {
            if (document.getElementById('loading-overlay-screen')) {
                document.body.removeChild(modal);
            }
            window.app.toast('Falha ao restaurar dump SQL: ' + e.message, 'error');
        }
    },

    async restoreServerLegacySql() {
        if (!confirm('!!! RESTAURAÇÃO DE BASE LEGADA !!!\n\nVocê está prestes a restaurar a base de dados legado a partir do arquivo salvo no servidor:\n"/home/ebastos/subfisproc/database/migrations/u489835785_subfisprocdb.sql".\n\nIsso irá:\n1. Gerar automaticamente um snapshot de segurança com o estado atual da base.\n2. Sobrescrever todo o banco de processos, movimentos, setores e auditores com a estrutura e registros da base legado.\n\nDeseja realmente prosseguir?')) return;

        if (!confirm('Confirmação Final: Tem certeza absoluta?')) return;

        const modal = document.createElement('div');
        modal.id = 'loading-overlay-screen';
        modal.style = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(15,23,42,0.85); display:flex; flex-direction:column; align-items:center; justify-content:center; color:white; z-index:9999; backdrop-filter:blur(5px);';
        modal.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin fa-4x" style="color:#4f46e5; margin-bottom:1.5rem;"></i>
            <h2 style="font-weight:700; margin:0; font-size:1.5rem;">Restaurando Base Legada...</h2>
            <p style="color:#94a3b8; font-size:1rem; margin:0.5rem 0 0 0; text-align:center; max-width:420px; padding:0 1rem;">O servidor está efetuando snapshot de segurança preventivo e executando o dump local. Por favor, aguarde...</p>
        `;
        document.body.appendChild(modal);

        try {
            const res = await Api.import.restoreFile('/home/ebastos/subfisproc/database/migrations/u489835785_subfisprocdb.sql');
            document.body.removeChild(modal);

            window.app.toast('Base legada restaurada do servidor com sucesso!');
            await Promise.all([this.loadSectors(), this.loadUsers(), this.loadResponsibles(), this.loadImportHistory()]);
        } catch (e) {
            if (document.getElementById('loading-overlay-screen')) {
                document.body.removeChild(modal);
            }
            window.app.toast('Falha ao restaurar base legada local do servidor: ' + e.message, 'error');
        }
    }
};

window.configView = configView;
