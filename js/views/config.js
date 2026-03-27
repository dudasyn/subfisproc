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
                    <td><strong>${s.name}</strong></td>
                    <td class="text-center">
                        <button class="btn-secondary" style="padding: 0.3rem 0.6rem; font-size:0.8rem;" onclick="configView.showSectorModal(${s.id}, '${s.name}')"><i class="fa-solid fa-pen"></i> Editar</button>
                        <button class="btn-secondary" style="padding: 0.3rem 0.6rem; font-size:0.8rem; background:var(--bg-secondary); color:var(--primary); margin-left:5px;" onclick="configView.showMergeSectorModal(${s.id}, '${s.name.replace(/'/g, "\\'")}')" title="Mesclar histórico com outro setor"><i class="fa-solid fa-code-merge"></i> Mesclar</button>
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

    showResponsibleModal(id = null, currentName = '', currentSectorIds = '') {
        const selectedIds = currentSectorIds ? currentSectorIds.split(',').map(s => s.trim()) : [];
        const checkboxes = this.sectors.map(s => `
            <label style="display:flex; align-items:center; gap:0.5rem; padding:0.3rem 0; cursor:pointer;">
                <input type="checkbox" name="resp-sectors" value="${s.id}" ${selectedIds.includes(String(s.id)) ? 'checked' : ''}>
                ${s.name}
            </label>
        `).join('');
        const html = `
            <div class="form-group mb-1">
                <label>Nome do Responsável</label>
                <input type="text" id="resp-name" required value="${currentName}" placeholder="Ex: João da Silva">
            </div>
            <div class="form-group">
                <label>Setores de Atuação</label>
                <div style="max-height:200px; overflow-y:auto; border:1px solid var(--border-color); border-radius:var(--radius); padding:0.5rem 1rem;">
                    ${checkboxes}
                </div>
            </div>
        `;
        this.showModal(id ? 'Editar Responsável' : 'Novo Responsável', html, async () => {
            try {
                const name = document.getElementById('resp-name').value;
                const sector_ids = [...document.querySelectorAll('input[name="resp-sectors"]:checked')].map(cb => cb.value);
                if (id) {
                    await fetch('api/responsibles.php', { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ id, name, sector_ids }) }).then(r => r.json());
                } else {
                    await fetch('api/responsibles.php', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ name, sector_ids }) }).then(r => r.json());
                }
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
        } catch(e) { console.error('Erro ao carregar historico', e); }
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

            this.importData = json.map(row => ({
                process_number: row[mapping.process_number],
                movement_date: this.formatExcelDate(row[mapping.movement_date]),
                action: row[mapping.action],
                responsible: row[mapping.responsible],
                subject: row[mapping.subject],
                destination_sector: row[mapping.destination_sector]
            })).filter(r => r.process_number);

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

    formatExcelDate(val) {
        if (!val) return null;
        if (typeof val === 'number') {
            // Excel serial date format
            const date = new Date((val - 25569) * 86400 * 1000);
            return date.toISOString().split('T')[0];
        }
        // Try to parse string DD/MM/YYYY or YYYY-MM-DD
        if (typeof val === 'string') {
            const parts = val.split(/[\/\-]/);
            if (parts.length === 3) {
                if (parts[0].length === 4) return val; // YYYY-MM-DD
                return `${parts[2]}-${parts[1]}-${parts[0]}`; // DD/MM/YYYY
            }
        }
        return val;
    },

    renderImportPreview(mapping, rows) {
        const headerRow = document.getElementById('preview-header');
        const bodyRows = document.getElementById('preview-body');
        
        const cols = ['process_number', 'movement_date', 'action', 'responsible', 'subject', 'destination_sector'];
        headerRow.innerHTML = cols.map(c => `<th>${c}</th>`).join('');
        
        bodyRows.innerHTML = rows.map(r => `
            <tr>
                ${cols.map(c => `<td>${r[c] || '-'}</td>`).join('')}
            </tr>
        `).join('');
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
