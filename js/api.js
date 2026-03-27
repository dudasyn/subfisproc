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
    responsibles: {
        list: () => Api.request('responsibles.php', 'GET'),
        create: (name, sector_id) => Api.request('responsibles.php', 'POST', { name, sector_id }),
        update: (id, name, sector_id) => Api.request('responsibles.php', 'PUT', { id, name, sector_id }),
        delete: (id) => Api.request(`responsibles.php?id=${id}`, 'DELETE')
    },
    users: {
        list: () => Api.request('users.php', 'GET'),
        create: (data) => Api.request('users.php', 'POST', data),
        update: (data) => Api.request('users.php', 'PUT', data),
        delete: (id) => Api.request(`users.php?id=${id}`, 'DELETE'),
        changePassword: (old_password, new_password) => Api.request('users.php', 'POST', { action: 'change-password', old_password, new_password })
    },
    processes: {
        delete: (id) => Api.request(`processes.php?id=${id}`, 'DELETE')
    },
    reports: {
        movements: (start, end, action) => 
            Api.request(`reports.php?type=movements&start=${start}&end=${end}${action && action !== 'Todas' ? '&action='+action : ''}`, 'GET'),
        stagnant: (days) => Api.request(`reports.php?type=stagnant&days=${days || 15}`, 'GET')
    },
    import: {
        upload: (data, batchId) => Api.request(`import.php${batchId ? '?batch_id=' + batchId : ''}`, 'POST', data),
        undo: (batchId) => Api.request(`import.php?batch=${batchId}`, 'DELETE'),
        history: () => Api.request('import.php?action=history', 'GET')
    },
    movements: {
        listAll: () => Api.request('movements.php', 'GET'),
        listLatest: () => Api.request('movements.php?latest=1', 'GET'),
        listByProcess: (procId) => Api.request(`movements.php?process_id=${procId}`, 'GET'),
        getByNumber: (number) => Api.request(`movements.php?process_number=${encodeURIComponent(number)}`, 'GET'),
        search: (query) => Api.request(`movements.php?search=${encodeURIComponent(query)}`, 'GET'),
        register: (data) => Api.request('movements.php', 'POST', data)
    },
    dashboard: {
        getStats: () => Api.request('dashboard.php', 'GET')
    }
};
