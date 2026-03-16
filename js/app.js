class AppManager {
    constructor() {
        this.container = document.getElementById('app-container');
        this.user = null;
        this.views = {}; // Registered view instances
        
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
        
        // Update Date Display
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('current-date').textContent = new Date().toLocaleDateString('pt-BR', options);

        // Events
        document.getElementById('btn-logout').addEventListener('click', () => this.logout());
        
        // Trigger routing
        if (!window.location.hash) window.location.hash = '#dashboard';
        this.handleRoute();
    }

    async logout(callApi = true) {
        if (callApi) {
            try { await Api.auth.logout(); } catch(e) {}
        }
        this.user = null;
        window.location.hash = '';
        this.renderLogin();
    }

    handleRoute() {
        if (!this.user) return;
        
        const hash = window.location.hash.substring(1) || 'dashboard';
        const viewParts = hash.split('/');
        const viewName = viewParts[0];
        
        // Update nav active state
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        const navItem = document.querySelector(`.nav-item[data-view="${viewName}"]`);
        if (navItem) navItem.classList.add('active');

        // Render view
        const viewContainer = document.getElementById('view-container');
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
            'config': 'Configurações do Sistema'
        };
        return titles[view] || 'SUBFIS Gestão';
    }

    toast(msg, type = 'success') {
        const container = document.getElementById('toast-container');
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
