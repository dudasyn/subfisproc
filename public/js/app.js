class AppManager {
    constructor() {
        this.container = document.getElementById('app-container');
        this.user = null;
        this.views = {}; // Registered view instances
        this.lastPasswordUsed = ''; // Store password for force change if needed
        
        window.addEventListener('hashchange', () => this.handleRoute());
        this.init();
    }

    async init() {
        try {
            const res = await Api.auth.check();
            if (res.authenticated) {
                this.user = res.user;
                this.renderMain();
            } else {
                this.renderLogin();
            }
        } catch (e) {
            this.renderLogin();
        }
    }

    renderLogin() {
        const tpl = document.getElementById('tpl-login').content.cloneNode(true);
        this.container.innerHTML = '';
        this.container.appendChild(tpl);
        
        const form = document.getElementById('login-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btn-login');
            const errDiv = document.getElementById('login-error');
            const email = document.getElementById('login-email').value;
            const pass = document.getElementById('login-password').value;
            
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Entrando...';
            btn.disabled = true;
            errDiv.textContent = '';
            
            try {
                const res = await Api.auth.login(email, pass);
                this.user = res.user;
                this.lastPasswordUsed = pass; // Store for force change
                this.toast('Login realizado com sucesso', 'success');
                this.renderMain();
            } catch (err) {
                errDiv.textContent = err.message;
                btn.innerHTML = '<span>Entrar</span><i class="fa-solid fa-arrow-right"></i>';
                btn.disabled = false;
            }
        });
    }

    renderMain() {
        const tpl = document.getElementById('tpl-main').content.cloneNode(true);
        this.container.innerHTML = '';
        this.container.appendChild(tpl);
        
        // Update UI with user info
        document.getElementById('ui-user-name').textContent = this.user.name;
        document.getElementById('ui-user-role').textContent = this.user.role;
        
        const dashNav = document.querySelector('.nav-item[data-view="dashboard"]');
        if (dashNav) dashNav.style.display = 'flex';
        
        // Update Date Display
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('current-date').textContent = new Date().toLocaleDateString('pt-BR', options);

        // Events
        document.getElementById('btn-logout').addEventListener('click', () => this.logout());
        
        // Trigger routing
        if (!window.location.hash) {
            const isStaff = this.user.role === 'Admin' || this.user.role === 'Gestor';
            window.location.hash = isStaff ? '#dashboard' : '#movements';
        }
        this.handleRoute();

        // Mandatory password change check
        if (this.user.force_password_change) {
            this.showForcePasswordChange();
        }
    }

    showForcePasswordChange() {
        const modalId = 'modal-force-pass';
        
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.id = modalId;
        overlay.style.zIndex = '9999';
        overlay.innerHTML = `
            <div class="modal-content" style="max-width: 400px; text-align: center;">
                <div class="logo-icon" style="background: var(--warning); margin-bottom:1rem;"><i class="fa-solid fa-key"></i></div>
                <h3 class="mb-1">Primeiro Acesso</h3>
                <p class="text-secondary mb-2">Por segurança, você deve alterar sua senha inicial agora.</p>
                <form id="form-force-pass">
                    <div class="form-group mb-1" style="text-align: left;">
                        <label>Nova Senha</label>
                        <input type="password" id="new-pass-force" required minlength="6" placeholder="Mínimo 6 caracteres">
                    </div>
                    <div class="form-group mb-2" style="text-align: left;">
                        <label>Confirmar Nova Senha</label>
                        <input type="password" id="confirm-pass-force" required minlength="6">
                    </div>
                    <button type="submit" class="btn-primary" id="btn-save-force-pass">
                        <span>Alterar e Entrar</span>
                    </button>
                </form>
            </div>
        `;
        document.body.appendChild(overlay);

        document.getElementById('form-force-pass').onsubmit = async (e) => {
            e.preventDefault();
            const pass = document.getElementById('new-pass-force').value;
            const confirm = document.getElementById('confirm-pass-force').value;
            const btn = document.getElementById('btn-save-force-pass');

            if (pass !== confirm) {
                this.toast('As senhas não coincidem', 'error');
                return;
            }

            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Alterando...';

            try {
                // Use lastPasswordUsed as old_password
                await Api.users.changePassword(this.lastPasswordUsed, pass);
                this.toast('Senha alterada com sucesso!');
                overlay.remove();
                this.user.force_password_change = false;
                this.lastPasswordUsed = '';
            } catch (err) {
                this.toast(err.message, 'error');
                btn.disabled = false;
                btn.innerHTML = '<span>Alterar e Entrar</span>';
            }
        };
    }

    async logout(callApi = true) {
        if (callApi) {
            try { await Api.auth.logout(); } catch(e) {}
        }
        this.user = null;
        this.lastPasswordUsed = '';
        window.location.hash = '';
        this.renderLogin();
    }

    handleRoute() {
        if (!this.user) return;
        
        const isStaff = this.user.role === 'Admin' || this.user.role === 'Gestor';
        let hash = window.location.hash.substring(1);
        
        if (!hash) {
            window.location.hash = isStaff ? '#dashboard' : '#movements';
            return;
        }

        const viewParts = hash.split('/');
        const viewName = viewParts[0];
        
        // Update nav active state
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        const navItem = document.querySelector(`.nav-item[data-view="${viewName}"]`);
        if (navItem) navItem.classList.add('active');

        // Render view
        const viewContainer = document.getElementById('view-container');
        if (!viewContainer) return;
        viewContainer.innerHTML = ''; // Clear current view
        
        document.getElementById('page-title').textContent = this.getViewTitle(viewName);

        if (window[viewName + 'View']) { // e.g., dashboardView
            window[viewName + 'View'].render(viewContainer, this.user, viewParts);
        } else {
            viewContainer.innerHTML = '<div class="view-section"><h2>Módulo em desenvolvimento</h2></div>';
        }
    }

    getViewTitle(view) {
        const titles = {
            'dashboard': 'Dashboard',
            'movements': 'Nova Movimentação',
            'search': 'Listar Processos',
            'reports': 'Relatórios e Estatísticas',
            'config': 'Configurações do Sistema'
        };
        return titles[view] || 'SUBFIS Gestão';
    }

    toast(msg, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const d = document.createElement('div');
        d.className = `toast toast-${type}`;
        d.innerHTML = `
            <i class="fa-solid ${type === 'success' ? 'fa-check-circle' : 'fa-circle-exclamation'}"></i>
            <span>${msg}</span>
        `;
        container.appendChild(d);
        setTimeout(() => {
            d.style.animation = 'slideOutRight 0.3s forwards';
            setTimeout(() => d.remove(), 300);
        }, 3000);
    }

    formatDate(dateStr) {
        if (!dateStr) return '-';
        if (dateStr.includes(' ')) {
            const d = new Date(dateStr.replace(' ', 'T'));
            return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
        }
        return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR');
    }

    async showAuditorDrawer(responsibleId, name) {
        const drawer = document.getElementById('auditor-drawer');
        const backdrop = document.getElementById('drawer-backdrop');
        const exportActions = document.getElementById('drawer-export-actions');
        if (!drawer || !backdrop) return;
        
        const title = document.getElementById('drawer-title');
        const subtitle = document.getElementById('drawer-subtitle');
        const body = document.getElementById('drawer-body');

        title.innerHTML = `<i class="fa-solid fa-user-tie" style="color: var(--primary);"></i> ${name}`;
        subtitle.textContent = 'Carregando processos...';
        if (exportActions) exportActions.style.display = 'none'; // reset visibility

        body.innerHTML = `
            <div style="text-align:center; padding:3rem 0; color:var(--text-secondary);">
                <i class="fa-solid fa-spinner fa-spin fa-2x" style="color:var(--primary); margin-bottom:1rem; display:block;"></i>
                <span>Buscando carga do auditor...</span>
            </div>
        `;
        
        drawer.style.right = '0';
        backdrop.style.display = 'block';

        try {
            const data = await Api.reports.auditorProcesses(responsibleId);
            subtitle.textContent = `${data.length} processo(s) em carga`;

            if (data.length === 0) {
                if (exportActions) exportActions.style.display = 'none';
                body.innerHTML = `
                    <div style="text-align:center; padding:4rem 1.5rem; color:var(--text-secondary);">
                        <i class="fa-solid fa-folder-open fa-3x" style="color:var(--border-color); margin-bottom:1.25rem; display:block;"></i>
                        <span style="font-weight:700; font-size:1.05rem; color:var(--text-primary); display:block; margin-bottom:0.35rem;">Nenhum Processo em Carga</span>
                        <span style="font-size:0.85rem; color:var(--text-secondary);">Este auditor não possui nenhum processo sob sua responsabilidade técnica no momento.</span>
                    </div>
                `;
                return;
            }

            // Save for exports
            this.currentDrawerData = data;
            this.currentDrawerAuditorName = name;
            if (exportActions) exportActions.style.display = 'flex';

            body.innerHTML = `
                <div style="display:flex; flex-direction:column; gap:0.75rem;">
                    ${data.map(p => `
                        <div style="
                            padding: 1rem;
                            background: #ffffff;
                            border: 1px solid var(--border-color);
                            border-radius: var(--radius-md);
                            box-shadow: var(--shadow-sm);
                            display:flex; align-items:center; justify-content:space-between; gap:1rem;
                            transition: var(--transition);
                        ">
                            <div style="flex:1; min-width:0;">
                                <div style="display:flex; align-items:center; gap:0.6rem; margin-bottom:0.4rem; flex-wrap:wrap;">
                                    <strong
                                        style="color:var(--primary); cursor:pointer; font-size:1rem; font-weight:750;"
                                        onclick="window.app.showProcessModal('${p.process_number}')"
                                        title="Ver histórico deste processo"
                                    >${p.process_number}</strong>
                                    <span class="badge ${p.idle_days >= 30 ? 'badge-danger' : p.idle_days >= 15 ? 'badge-warning' : 'badge-secondary'}" style="font-size:0.7rem; padding:0.15rem 0.45rem; font-weight:600;">${p.idle_days}d parado</span>
                                </div>
                                <div style="font-size:0.85rem; color:var(--text-primary); font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:0.25rem;">
                                    ${p.subject || 'Sem assunto cadastrado'}
                                </div>
                                <div style="font-size:0.75rem; color:var(--text-secondary); display:flex; align-items:center; gap:8px;">
                                    <span><i class="fa-solid fa-building" style="margin-right:3px;"></i>${p.current_sector}</span>
                                    <span>&bull;</span>
                                    <span><i class="fa-solid fa-calendar" style="margin-right:3px;"></i>${this.formatDate(p.last_movement)}</span>
                                </div>
                            </div>
                            <button onclick="window.app.showProcessModal('${p.process_number}')" style="background:var(--primary-light); border:none; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:var(--primary); cursor:pointer; transition:var(--transition);" title="Ver Histórico">
                                <i class="fa-solid fa-chevron-right" style="font-size:0.8rem;"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
            `;
        } catch (e) {
            if (exportActions) exportActions.style.display = 'none';
            body.innerHTML = `
                <div style="text-align:center; padding:3rem 1.5rem; color:var(--danger);">
                    <i class="fa-solid fa-triangle-exclamation fa-3x" style="margin-bottom:1rem;"></i>
                    <span style="font-weight:600; display:block;">Erro ao Carregar</span>
                    <span style="font-size:0.85rem;">${e.message}</span>
                </div>
            `;
        }
    }

    closeAuditorDrawer() {
        const drawer = document.getElementById('auditor-drawer');
        const backdrop = document.getElementById('drawer-backdrop');
        if (drawer) drawer.style.right = '-540px';
        if (backdrop) backdrop.style.display = 'none';
    }

    exportDrawerXLSX() {
        if (!this.currentDrawerData || this.currentDrawerData.length === 0) return;
        const tempTable = document.createElement('table');
        tempTable.innerHTML = `
            <thead>
                <tr>
                    <th>Número do Processo</th>
                    <th>Assunto</th>
                    <th>Setor Atual</th>
                    <th>Última Movimentação</th>
                    <th>Dias Parado</th>
                </tr>
            </thead>
            <tbody>
                ${this.currentDrawerData.map(p => `
                    <tr>
                        <td>${p.process_number}</td>
                        <td>${p.subject || 'Sem assunto'}</td>
                        <td>${p.current_sector}</td>
                        <td>${this.formatDate(p.last_movement)}</td>
                        <td>${p.idle_days} dias</td>
                    </tr>
                `).join('')}
            </tbody>
        `;
        const wb = XLSX.utils.table_to_book(tempTable);
        XLSX.writeFile(wb, `Processos_${this.currentDrawerAuditorName.replace(/ /g, '_')}.xlsx`);
    }

    exportDrawerPDF() {
        if (!this.currentDrawerData || this.currentDrawerData.length === 0) return;
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.setFontSize(16);
        doc.text(`Processos em Carga - ${this.currentDrawerAuditorName}`, 14, 20);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 27);
        doc.text(`Total: ${this.currentDrawerData.length} processo(s)`, 14, 33);
        
        const headers = [['Número do Processo', 'Assunto', 'Setor Atual', 'Última Mov.', 'Dias Parado']];
        const rows = this.currentDrawerData.map(p => [
            p.process_number,
            p.subject || 'Sem assunto',
            p.current_sector,
            this.formatDate(p.last_movement),
            `${p.idle_days} dias`
        ]);
        
        doc.autoTable({
            head: headers,
            body: rows,
            startY: 40,
            theme: 'grid',
            headStyles: { fillColor: [0, 114, 188], textColor: 255 },
            styles: { fontSize: 9 }
        });
        
        doc.save(`Processos_${this.currentDrawerAuditorName.replace(/ /g, '_')}.pdf`);
    }

    async showProcessModal(processNumber) {
        const existing = document.getElementById('process-detail-modal');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'process-detail-modal';
        overlay.style.cssText = `
            position:fixed; inset:0; background:rgba(15, 23, 42, 0.4);
            backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
            z-index:10000; display:flex; align-items:center; justify-content:center; padding:1rem;
        `;
        overlay.innerHTML = `
            <div style="
                background:#ffffff; border-radius:var(--radius-lg); width:100%; max-width:780px;
                max-height:90vh; display:flex; flex-direction:column;
                box-shadow:var(--shadow-lg); border:1px solid var(--border-color); overflow:hidden;
                animation: zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            ">
                <div style="padding:1.5rem; border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center; flex-shrink:0; background:#ffffff;">
                    <div>
                        <h3 style="margin:0; font-size:1.25rem; font-weight:750; color:var(--accent); display:flex; align-items:center; gap:8px;">
                            <i class="fa-solid fa-file-invoice" style="color:var(--primary);"></i> ${processNumber}
                        </h3>
                        <p style="margin:0.25rem 0 0; font-size:0.85rem; color:var(--text-secondary); font-weight:500;" id="pdm-subtitle">Carregando...</p>
                    </div>
                    <button onclick="document.getElementById('process-detail-modal').remove()" style="background:rgba(0,0,0,0.03); border:none; cursor:pointer; font-size:1.1rem; color:var(--text-secondary); width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; transition: var(--transition);">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div id="pdm-body" style="flex:1; overflow-y:auto; padding:1.5rem; background:#fafbfc;">
                    <div style="text-align:center; padding:3rem; color:var(--text-secondary);">
                        <i class="fa-solid fa-spinner fa-spin fa-2x" style="color:var(--primary); margin-bottom:1rem; display:block;"></i> 
                        <span>Carregando dados do processo...</span>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

        try {
            const data = await Api.movements.getByNumber(processNumber);
            if (!data || !data.exists) {
                document.getElementById('pdm-body').innerHTML = `
                    <div style="text-align:center; padding:3rem 1.5rem; color:var(--danger);">
                        <i class="fa-solid fa-triangle-exclamation fa-3x" style="margin-bottom:1rem;"></i>
                        <span style="font-weight:600; display:block;">Processo Não Encontrado</span>
                        <span style="font-size:0.85rem;">Não foi possível localizar o histórico do processo solicitado no banco de dados.</span>
                    </div>
                `;
                return;
            }
            const process = data.process;
            const history = await Api.movements.listByProcess(process.id);
            const lastMov = history[0];
            const statusText = lastMov
                ? (lastMov.action === 'ENTRADA' ? 'Em posse de ' + lastMov.destination_sector : 'Enviado para ' + lastMov.destination_sector)
                : 'Sem movimentação';

            document.getElementById('pdm-subtitle').innerHTML = `
                <span style="font-weight:600; color:var(--text-primary);">${process.subject || 'Sem assunto cadastrado'}</span> 
                <span style="color:var(--border-color); margin:0 4px;">&bull;</span> 
                <span style="font-weight:500; color:var(--text-secondary);">${statusText}</span>
            `;

            let parentBadgeHtml = '';
            if (process.parent_id) {
                parentBadgeHtml = `
                    <div style="background:rgba(0,114,188,0.03); border: 1px dashed rgba(0,114,188,0.2); padding: 0.75rem 1rem; border-radius: var(--radius-md); margin-bottom: 1.25rem; display: flex; align-items: center; justify-content: space-between;">
                        <span style="font-size: 0.82rem; color: var(--text-secondary); font-weight: 500; display:flex; align-items:center; gap:6px;">
                            <i class="fa-solid fa-paperclip" style="color:var(--primary);"></i> Anexo ao processo principal:
                        </span>
                        <strong style="color: var(--primary); cursor: pointer; font-size: 0.9rem; font-weight:750;" onclick="window.app.showProcessModal('${process.parent_number}')">${process.parent_number}</strong>
                    </div>
                `;
            }

            let attachmentsHtml = '';
            if (process.attachments && process.attachments.length > 0) {
                attachmentsHtml = `
                    <div style="margin-top: 1.5rem; background: #ffffff; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1.25rem; box-shadow: var(--shadow-sm);">
                        <h4 style="margin: 0 0 0.85rem 0; font-size: 0.9rem; font-weight: 750; color: var(--accent); text-transform: uppercase; letter-spacing: 0.5px; display:flex; align-items:center; gap:6px;">
                            <i class="fa-solid fa-link" style="color: var(--primary);"></i> Processos Anexados (${process.attachments.length})
                        </h4>
                        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                            ${process.attachments.map(att => `
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0.85rem; background: #fafbfc; border: 1px solid var(--border-color); border-radius: var(--radius-md); transition: var(--transition);">
                                    <strong style="color: var(--primary); cursor: pointer; font-size: 0.88rem; font-weight:750;" onclick="window.app.showProcessModal('${att.process_number}')">${att.process_number}</strong>
                                    <span style="font-size: 0.82rem; color: var(--text-secondary); max-width: 60%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight:500;">${att.subject || 'Sem assunto'}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }

            document.getElementById('pdm-body').innerHTML = `
                <div style="display:flex; flex-direction:column; gap:0;">
                    ${parentBadgeHtml}
                    
                    <div style="background:#ffffff; border:1px solid var(--border-color); border-radius:var(--radius-md); box-shadow:var(--shadow-sm); overflow:hidden;">
                        <div style="padding:1rem 1.25rem; border-bottom:1px solid var(--border-color); background:#fafbfc; display:flex; justify-content:space-between; align-items:center;">
                            <span style="font-size:0.82rem; font-weight:750; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px;">Linha do Tempo de Tramitação</span>
                            <span style="font-size:0.8rem; color:var(--text-secondary); font-weight:550;">${history.length} trâmite(s)</span>
                        </div>
                        <div style="padding:1.5rem; position:relative;">
                            <div style="position:absolute; top:2rem; bottom:2rem; left:3.2rem; width:2px; background:var(--border-color); z-index:1;"></div>
                            
                            <div style="display:flex; flex-direction:column; gap:1.25rem; position:relative; z-index:2;">
                                ${history.map((h, i) => {
                                    const isFirst = i === 0;
                                    const dateFormatted = this.formatDate(h.movement_date);
                                    const actionBadgeClass = h.action === 'ENTRADA' ? 'badge-primary' : 'badge-secondary';
                                    const actionIcon = h.action === 'ENTRADA' ? 'fa-arrow-right-to-bracket' : 'fa-arrow-right-from-bracket';
                                    const actionColor = h.action === 'ENTRADA' ? 'var(--primary)' : 'var(--text-secondary)';
                                    
                                    return `
                                        <div style="display:flex; gap:1.25rem; align-items:flex-start;">
                                            <div style="width:3.5rem; flex-shrink:0; text-align:right;">
                                                <div style="font-size:0.75rem; font-weight:700; color:var(--text-primary);">${dateFormatted.split(' ')[0]}</div>
                                                <div style="font-size:0.7rem; color:var(--text-secondary); margin-top:2px;">${dateFormatted.split(' ')[1] || ''}</div>
                                            </div>
                                            <div style="
                                                width:24px; height:24px; border-radius:50%; background:${isFirst ? 'var(--primary-light)' : '#ffffff'};
                                                border:2px solid ${isFirst ? 'var(--primary)' : 'var(--border-color)'};
                                                display:flex; align-items:center; justify-content:center; flex-shrink:0;
                                                color:${isFirst ? 'var(--primary)' : 'var(--text-secondary)'}; font-size:0.7rem;
                                            }">
                                                <i class="fa-solid ${actionIcon}"></i>
                                            </div>
                                            <div style="
                                                flex:1; background:${isFirst ? 'rgba(0,114,188,0.02)' : '#ffffff'};
                                                border:1px solid ${isFirst ? 'rgba(0,114,188,0.1)' : 'var(--border-color)'};
                                                border-radius:var(--radius-md); padding:1rem;
                                                box-shadow:${isFirst ? 'var(--shadow-sm)' : 'none'};
                                            ">
                                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem; flex-wrap:wrap; gap:0.5rem;">
                                                    <span style="font-size:0.88rem; font-weight:750; color:var(--text-primary);">${h.action === 'ENTRADA' ? 'Entrada no Setor' : 'Saída/Despacho'}</span>
                                                    <span class="badge ${actionBadgeClass}" style="font-size:0.7rem; font-weight:700; text-transform:uppercase; padding:0.15rem 0.45rem;">${h.action}</span>
                                                </div>
                                                <div style="font-size:0.82rem; color:var(--text-secondary); margin-bottom:0.25rem; font-weight:500;">
                                                    <strong style="color:var(--text-primary); font-weight:600;">Setor:</strong> ${h.destination_sector}
                                                </div>
                                                ${h.responsible_name ? `
                                                    <div style="font-size:0.82rem; color:var(--text-secondary); margin-bottom:0.25rem; font-weight:500;">
                                                        <strong style="color:var(--text-primary); font-weight:600;">Responsável:</strong> ${h.responsible_name}
                                                    </div>
                                                ` : ''}
                                                <div style="font-size:0.75rem; color:#94a3b8; display:flex; align-items:center; gap:4px; margin-top:0.5rem; border-top:1px solid #f8fafc; padding-top:0.4rem; font-weight:500;">
                                                    <i class="fa-solid fa-user" style="font-size:0.7rem;"></i> Registrado por ${h.user_name}
                                                </div>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    </div>
                    
                    ${attachmentsHtml}
                </div>
            `;
        } catch (e) {
            document.getElementById('pdm-body').innerHTML = `
                <div style="text-align:center; padding:3rem 1.5rem; color:var(--danger);">
                    <i class="fa-solid fa-triangle-exclamation fa-3x" style="margin-bottom:1rem;"></i>
                    <span style="font-weight:600; display:block;">Erro ao Carregar</span>
                    <span style="font-size:0.85rem;">${e.message}</span>
                </div>
            `;
        }
    }
}

// Global App Instance
window.addEventListener('DOMContentLoaded', () => {
    window.app = new AppManager();
});
