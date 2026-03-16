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
        
        // Redirect only if NO hash is present (initial login/load)
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
            'search': 'Buscar Processo',
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
}

// Global App Instance
window.addEventListener('DOMContentLoaded', () => {
    window.app = new AppManager();
});
