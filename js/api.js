const Api = {
    baseUrl: 'api/',
    
    async request(endpoint, method = 'GET', data = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        if (data) options.body = JSON.stringify(data);
        
        try {
            const response = await fetch(this.baseUrl + endpoint, options);
            
            // Handle HTTP 401 globally (Unauthorized)
            if (response.status === 401 && endpoint !== 'auth.php' && endpoint !== 'auth.php?action=logout') {
                window.app.logout(false);
                throw new Error('Sessão expirada. Faça login novamente.');
            }
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Erro na requisição da API');
            }
            return result;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },
    
    auth: {
        login: (email, password) => Api.request('auth.php', 'POST', { email, password }),
        logout: () => Api.request('auth.php', 'POST', { action: 'logout' }),
        check: () => Api.request('auth.php', 'GET')
    },
    sectors: {
        list: () => Api.request('sectors.php', 'GET'),
        create: (name) => Api.request('sectors.php', 'POST', { name }),
        update: (id, name) => Api.request('sectors.php', 'PUT', { id, name }),
        delete: (id) => Api.request(`sectors.php?id=${id}`, 'DELETE')
    },
    users: {
        list: () => Api.request('users.php', 'GET'),
        create: (data) => Api.request('users.php', 'POST', data),
        update: (data) => Api.request('users.php', 'PUT', data),
        delete: (id) => Api.request(`users.php?id=${id}`, 'DELETE')
    },
    movements: {
        listAll: () => Api.request('movements.php', 'GET'),
        listByProcess: (procId) => Api.request(`movements.php?process_id=${procId}`, 'GET'),
        register: (data) => Api.request('movements.php', 'POST', data)
    },
    dashboard: {
        getStats: () => Api.request('dashboard.php', 'GET')
    }
};
