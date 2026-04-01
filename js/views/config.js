// configView v1.1
const configView = {
    async render(container, user, params) {
        const isAdmin = user.role === 'Admin' || user.role === 'Gestor';
        
        container.innerHTML = `
            <div class="view-section">
                <div class="tabs-header">
                    <button class="tab-btn active" data-tab="setores"><i class="fa-solid fa-building"></i> Setores</button>
                    <button class="tab-btn" data-tab="responsaveis"><i class="fa-solid fa-user-tie"></i> Responsáveis</button>
                    ${isAdmin ? '<button class="tab-btn" data-tab="colaboradores"><i class="fa-solid fa-users"></i> Colaboradores</button>' : ''}
                    ${isAdmin ? '<button class="tab-btn" data-tab="importacao"><i class="fa-solid fa-file-import"></i> Importação</button>' : ''}
                </div>

                <!-- SETORES TAB -->
                <div class="tab-content active" id="tab-setores">
                    <div class="card mb-1">
                        <div class="card-header flex-center" style="justify-content: space-between;">
                            <div>
                                <h3>Setores Ativos</h3>
                                <p>Gerencie os setores de destino dos processos.</p>
                            </div>
                            <button class="btn-primary" id="btn-add-sector" style="width:auto; padding:0.6rem 1.2rem;"><i class="fa-solid fa-plus"></i> Novo Setor</button>
                        </div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="data-table">
                                    <thead><tr><th>ID</th><th>Nome do Setor</th><th class="text-center">Ações</th></tr></thead>
                                    <tbody id="tbody-sectors"><tr><td colspan="3" class="text-center">Carregando...</td></tr></tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- RESPONSAVEIS TAB -->
                <div class="tab-content" id="tab-responsaveis">
                    <div class="card mb-1">
                        <div class="card-header flex-center" style="justify-content: space-between;">
                            <div>
                                <h3>Responsáveis</h3>
                                <p>Gerencie os Auditores Fiscais e demais responsáveis pelos processos.</p>
                            </div>
                            <button class="btn-primary" id="btn-add-responsible" style="width:auto; padding:0.6rem 1.2rem;"><i class="fa-solid fa-user-plus"></i> Novo Responsável</button>
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

                <!-- COLABORADORES TAB -->
                ${isAdmin ? `
                <div class="tab-content" id="tab-colaboradores">
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
                                    <thead><tr><th>Nome</th><th>E-mail</th><th>Setor</th><th>Função</th><th class="text-center">Ações</th></tr></thead>
                                    <tbody id="tbody-users"><tr><td colspan="5" class="text-center">Carregando...</td></tr></tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                ` : ''}
                <!-- IMPORTACAO TAB -->
                ${isAdmin ? `
                <div class="tab-content" id="tab-importacao">
                    <div class="card mb-1">
                        <div class="card-header border-bottom">
                            <h3>Importar Planilha (Excel)</h3>
                            <p>Envie sua planilha de controle para migrar os dados para o sistema.</p>
                        </div>
                        <div class="card-body">
                            <div class="import-actions flex-center" style="gap:1rem; flex-wrap: wrap;">
                                <div class="file-input-wrapper">
                                    <input type="file" id="input-import-excel" accept=".xlsx, .xls" style="display:none;">
                                    <button class="btn-secondary" onclick="document.getElementById('input-import-excel').click()">
                                        <i class="fa-solid fa-file-excel"></i> Selecionar Arquivo
                                    </button>
                                </div>
                                <button class="btn-primary" id="btn-process-import" disabled>
                                    <i class="fa-solid fa-upload"></i> Processar e Importar
                                </button>
                            </div>
                            <div id="import-preview" class="mt-2" style="display:none;">
                                <div class="alert alert-info">
                                    <i class="fa-solid fa-info-circle"></i> 
                                    <span id="import-info-text">Detectamos X registros para importação.</span>
                                </div>
                                <div class="table-responsive mt-1">
                                    <table class="data-table">
                                        <thead><tr id="preview-header"></tr></thead>
                                        <tbody id="preview-body"></tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header border-bottom">
                            <h3>Histórico de Importações</h3>
                            <p>Desfaça importações em lote se necessário.</p>
                        </div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="data-table">
                                    <thead>
                                        <tr>
                                            <th>ID Lote</th>
                                            <th>Data</th>
                                            <th>Registros</th>
                                            <th class="text-center">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody id="tbody-import-history">
                                        <tr><td colspan="4" class="text-center">Carregando...</td></tr>
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

        this.attachTabEvents();
        
        // Add listeners
        document.getElementById('btn-add-sector').onclick = () => this.showSectorModal();
        document.getElementById('btn-add-responsible').onclick = () => this.showResponsibleModal();
        if (isAdmin) {
            document.getElementById('btn-add-user').onclick = () => this.showUserModal();
        }
        
        // Fetch Data
        if (isAdmin) {
            await Promise.all([
                this.loadSectors(), 
                this.loadUsers(), 
                this.loadResponsibles(),
                this.loadImportHistory()
            ]);
            this.initImportLogic();
        } else {
            await Promise.all([this.loadSectors(), this.loadResponsibles()]);
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

    sectors: [],
    responsibles_list: [],
    
    async loadSectors() {
        try {
            this.sectors = await Api.sectors.list();
            const tbody = document.getElementById('tbody-sectors');
            
            if (this.sectors.length === 0) {
                tbody.innerHTML = `<tr><td colspan="3" class="text-center">Nenhum setor cadastrado</td></tr>`;
                return;
            }

            tbody.innerHTML = this.sectors.map(s => `
                <tr>
                    <td>#${s.id}</td>
                    <td>
                        <strong>${s.name}</strong>
                        ${s.is_internal ? '<span class="badge badge-primary" style="margin-left:8px; font-size:0.7rem; padding: 0.2rem 0.5rem;">Interno</span>' : '<span class="badge badge-neutral" style="margin-left:8px; font-size:0.7rem; padding: 0.2rem 0.5rem;">Externo</span>'}
                    </td>
                    <td class="text-center">
                        <button class="btn-secondary" style="padding: 0.3rem 0.6rem; font-size:0.8rem;" onclick="configView.showSectorModal(${s.id}, '${s.name.replace(/'/g, "\\'")}', ${s.is_internal})"><i class="fa-solid fa-pen"></i> Editar</button>
                        <button class="btn-secondary" style="padding: 0.3rem 0.6rem; font-size:0.8rem; background:var(--bg-secondary); color:var(--primary); margin-left:5px;" onclick="configView.showMergeSectorModal(${s.id}, '${s.name.replace(/'/g, "\\'")}')" title="Mesclar histórico com outro setor"><i class="fa-solid fa-code-merge"></i> Mesclar</button>
                        <button class="btn-secondary" style="padding: 0.3rem 0.6rem; font-size:0.8rem; background:#fee2e2; color:#b91c1c; margin-left:5px;" onclick="configView.deleteSector(${s.id})"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>
            `).join('');
        } catch (e) {
            const tbody = document.getElementById('tbody-sectors');
            if (tbody) tbody.innerHTML = `<tr><td colspan="3" class="text-center text-danger">Erro ao carregar setores: ${e.message}</td></tr>`;
        }
    },

    async loadResponsibles() {
        try {
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
                        <button class="btn-secondary" style="padding: 0.3rem 0.6rem; font-size:0.8rem; background:#fee2e2; color:#b91c1c; margin-left:5px;" onclick="configView.deleteResponsible(${r.id})"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>`;
            }).join('');
        } catch (e) {
            const tbody = document.getElementById('tbody-responsibles');
            if (tbody) tbody.innerHTML = `<tr><td colspan="3" class="text-center text-danger">Erro ao carregar responsáveis: ${e.message}</td></tr>`;
        }
    },

    async loadUsers() {
        try {
            const users = await Api.users.list();
            const tbody = document.getElementById('tbody-users');
            
            if (users.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" class="text-center">Nenhum colaborador cadastrado</td></tr>`;
                return;
            }

            tbody.innerHTML = users.map(u => `
                <tr>
                    <td>
                        <div style="font-weight: 500">${u.name}</div>
                        <div style="font-size: 0.75rem; color:var(--text-secondary)">CPF: ${u.cpf}</div>
                    </td>
                    <td>${u.email}</td>
                    <td><span class="badge badge-neutral">${u.sector_name || 'N/A'}</span></td>
                    <td><span class="badge ${u.role === 'Admin' ? 'badge-primary' : (u.role === 'Gestor' ? 'badge-success' : 'badge-warning')}">${u.role}</span></td>
                    <td class="text-center">
                        <button class="btn-secondary" style="padding: 0.3rem 0.6rem; font-size:0.8rem; background:#fee2e2; color:#b91c1c;" onclick="configView.deleteUser(${u.id})"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>
            `).join('');
        } catch (e) {
            const tbody = document.getElementById('tbody-users');
            if (tbody) tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Erro ao carregar colaboradores: ${e.message}</td></tr>`;
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
                    ${this.sectors.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
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
                await fetch('api/responsibles.php', { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ id, name, sector_ids }) }).then(r => r.json());
            } else {
                await fetch('api/responsibles.php', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ name, sector_ids }) }).then(r => r.json());
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
                    ${s.name}
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

    showSectorModal(id = null, currentName = '', isInternal = 1) {
        const html = `
            <div class="form-group mb-1">
                <label>Nome do Setor</label>
                <input type="text" id="sec-name" required value="${currentName.replace(/"/g, '&quot;')}" placeholder="Ex: Protocolo">
            </div>
            <div class="form-group">
                <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer; font-weight: 500;">
                    <input type="checkbox" id="sec-internal" ${isInternal ? 'checked' : ''}>
                    Este setor faz parte da estrutura interna da SUBFIS?
                </label>
                <small class="text-secondary" style="margin-left: 1.5rem; display:block;">Isso permite tramitações consecutivas entre subsetores.</small>
            </div>
        `;
        this.showModal(id ? 'Editar Setor' : 'Novo Setor', html, async () => {
            try {
                const name = document.getElementById('sec-name').value;
                const is_internal = document.getElementById('sec-internal').checked ? 1 : 0;
                
                if (id) {
                    await fetch('api/sectors.php', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id, name, is_internal })
                    });
                } else {
                    await fetch('api/sectors.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name, is_internal })
                    });
                }
                
                window.app.toast('Setor salvo!');
                this.loadSectors();
            } catch(e) {
                window.app.toast(e.message, 'error');
            }
        });
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
                    ${otherSectors.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
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
        const sectorsOpts = this.sectors.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
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

    async deleteUser(id) {
        if (!confirm('Deseja desativar este colaborador? Ele perderá o acesso.')) return;
        try {
            await Api.users.delete(id);
            window.app.toast('Colaborador desativado!');
            this.loadUsers();
        } catch(e) { window.app.toast(e.message, 'error'); }
    },

    async loadImportHistory() {
        try {
            const history = await Api.import.history();
            const tbody = document.getElementById('tbody-import-history');
            if (!tbody) return;
            
            if (history.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="text-center">Nenhuma importação encontrada.</td></tr>';
                return;
            }

            tbody.innerHTML = history.map(h => `
                <tr>
                    <td><code>${h.id}</code></td>
                    <td>${new Date(h.date).toLocaleString('pt-BR')}</td>
                    <td>${h.movements_count} mov. / ${h.processes_count} proc.</td>
                    <td class="text-center">
                        <button class="btn-icon text-danger" title="Desfazer Importação" onclick="configView.deleteImportBatch('${h.id}')">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        } catch(e) {
            console.error('Erro ao carregar historico', e);
            const tbody = document.getElementById('tbody-import-history');
            if (tbody) {
                tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger" style="color:var(--danger)">Erro ao carregar histórico: ${e.message}</td></tr>`;
            }
        }
    },

    async deleteImportBatch(id) {
        if (!confirm('ATENÇÃO: Deseja realmente DESFAZER esta importação? Isso removerá todos os processos, movimentações, responsáveis e setores que foram criados EXCLUSIVAMENTE por este lote. Esta ação não pode ser desfeita.')) return;
        
        try {
            await Api.import.undo(id);
            window.app.toast('Importação desfeita com sucesso!');
            await Promise.all([this.loadSectors(), this.loadUsers(), this.loadResponsibles(), this.loadImportHistory()]);
        } catch(e) { window.app.toast(e.message, 'error'); }
    },

    initImportLogic() {
        const input = document.getElementById('input-import-excel');
        const btn = document.getElementById('btn-process-import');
        if (!input) return;

        input.onchange = (e) => this.handleFileSelect(e);
        btn.onclick = () => this.processImport();
    },

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
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
            
            // Debug missing columns (destination_sector is optional, backend defaults to SUBFIS)
            let missing = [];
            const requiredFields = ['process_number', 'movement_date', 'action', 'responsible', 'subject'];
            for (let k of requiredFields) {
                if (!mapping[k]) missing.push(k);
            }

            let msg = `Detectamos ${this.importData.length} registros para importação.<br><br><b>Cabeçalhos Lidos da Planilha:</b> ${headers.join(', ')}<br>`;
            if (missing.length > 0) {
                msg += `<b style="color:var(--danger)">Campos essenciais não encontrados:</b> ${missing.join(', ')} (verifique os nomes no Excel)`;
            }
            if (!mapping.destination_sector) {
                msg += `<br><span class="text-secondary"><i class="fa-solid fa-circle-info"></i> Coluna SETOR ausente. Todos os registros serão direcionados para SUBFIS por padrão.</span>`;
            }

            document.getElementById('import-info-text').innerHTML = msg;
            document.getElementById('import-preview').style.display = 'block';
            document.getElementById('btn-process-import').disabled = missing.length > 0;
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
        const originalHtml = btn.innerHTML;
        const total = this.importData.length;
        btn.disabled = true;

        const batchId = 'imp_' + Date.now();
        const chunkSize = 2000;

        try {
            for (let i = 0; i < total; i += chunkSize) {
                const chunk = this.importData.slice(i, i + chunkSize);
                const current = Math.min(i + chunkSize, total);
                btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Salvando lote ${current} de ${total}...`;
                await Api.import.upload(chunk, batchId);
            }

            window.app.toast(`Importação de ${total} registros concluída!`);
            
            // Reset UI
            document.getElementById('input-import-excel').value = '';
            document.getElementById('import-preview').style.display = 'none';
            btn.innerHTML = originalHtml;
            btn.disabled = true;
            this.importData = null;

            // Refresh all data
            await Promise.all([this.loadSectors(), this.loadUsers(), this.loadResponsibles(), this.loadImportHistory()]);
        } catch(e) {
            window.app.toast(e.message, 'error');
            btn.innerHTML = originalHtml;
            btn.disabled = false;
        }
    }
};

window.configView = configView;
