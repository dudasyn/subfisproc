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
            await Promise.all([this.loadSectors(), this.loadUsers(), this.loadResponsibles()]);
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
                    <td><strong>${s.name}</strong></td>
                    <td class="text-center">
                        <button class="btn-secondary" style="padding: 0.3rem 0.6rem; font-size:0.8rem;" onclick="configView.showSectorModal(${s.id}, '${s.name}')"><i class="fa-solid fa-pen"></i> Editar</button>
                        <button class="btn-secondary" style="padding: 0.3rem 0.6rem; font-size:0.8rem; background:#fee2e2; color:#b91c1c; margin-left:5px;" onclick="configView.deleteSector(${s.id})"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>
            `).join('');
        } catch (e) {
            document.getElementById('tbody-sectors').innerHTML = `<tr><td colspan="3" class="text-center text-danger">Erro ao carregar setores</td></tr>`;
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
            tbody.innerHTML = this.responsibles_list.map(r => `
                <tr>
                    <td><strong>${r.name}</strong></td>
                    <td><span class="badge badge-neutral">${r.sector_name || 'N/A'}</span></td>
                    <td class="text-center">
                        <button class="btn-secondary" style="padding: 0.3rem 0.6rem; font-size:0.8rem;" onclick="configView.showResponsibleModal(${r.id}, '${r.name.replace(/'/g, "\\'")}')"><i class="fa-solid fa-pen"></i> Editar</button>
                        <button class="btn-secondary" style="padding: 0.3rem 0.6rem; font-size:0.8rem; background:#fee2e2; color:#b91c1c; margin-left:5px;" onclick="configView.deleteResponsible(${r.id})"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>
            `).join('');
        } catch (e) {
            const tbody = document.getElementById('tbody-responsibles');
            if (tbody) tbody.innerHTML = `<tr><td colspan="3" class="text-center text-danger">Erro ao carregar responsáveis</td></tr>`;
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
            document.getElementById('tbody-users').innerHTML = `<tr><td colspan="5" class="text-center text-danger">Erro ao carregar colaboradores</td></tr>`;
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

    showResponsibleModal(id = null, currentName = '') {
        const sectorsOpts = this.sectors.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
        const currentResp = id ? this.responsibles_list.find(r => r.id === id) : null;
        const currentSectorId = currentResp ? currentResp.sector_id : '';
        const html = `
            <div class="form-group mb-1">
                <label>Nome do Responsável</label>
                <input type="text" id="resp-name" required value="${currentName}" placeholder="Ex: João da Silva">
            </div>
            <div class="form-group">
                <label>Setor</label>
                <select id="resp-sector" required>
                    <option value="">Selecione o setor...</option>
                    ${this.sectors.map(s => `<option value="${s.id}" ${s.id == currentSectorId ? 'selected' : ''}>${s.name}</option>`).join('')}
                </select>
            </div>
        `;
        this.showModal(id ? 'Editar Responsável' : 'Novo Responsável', html, async () => {
            try {
                const name = document.getElementById('resp-name').value;
                const sector_id = document.getElementById('resp-sector').value;
                if (id) await Api.responsibles.update(id, name, sector_id);
                else await Api.responsibles.create(name, sector_id);
                window.app.toast('Responsável salvo!');
                this.loadResponsibles();
            } catch(e) {
                window.app.toast(e.message, 'error');
                throw e;
            }
        });
    },

    showSectorModal(id = null, currentName = '') {
        const html = `
            <div class="form-group">
                <label>Nome do Setor</label>
                <input type="text" id="sec-name" required value="${currentName}" placeholder="Ex: Protocolo">
            </div>
        `;
        this.showModal(id ? 'Renomear Setor' : 'Novo Setor', html, async () => {
            try {
                const name = document.getElementById('sec-name').value;
                if (id) await Api.sectors.update(id, name);
                else await Api.sectors.create(name);
                window.app.toast('Setor salvo!');
                this.loadSectors();
            } catch(e) {
                window.app.toast(e.message, 'error');
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
    }
};

window.configView = configView;
