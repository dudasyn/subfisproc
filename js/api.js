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
        delete: (id) => Api.request(`processes.php?id=${id}`, 'DELETE'),
        attach: (parentId, childNumber) => Api.request('processes.php', 'POST', { action: 'attach', parent_id: parentId, child_number: childNumber }),
        detach: (childId) => Api.request('processes.php', 'POST', { action: 'detach', child_id: childId })
    },
    reports: {
        movements: (start, end, action) => 
            Api.request(`reports.php?type=movements&start=${start}&end=${end}${action && action !== 'Todas' ? '&action='+action : ''}`, 'GET'),
        stagnant: (days, sectorId) => Api.request(`reports.php?type=stagnant&days=${days || 15}${sectorId ? '&sector_id=' + sectorId : ''}`, 'GET'),
        auditorStats: () => Api.request('reports.php?type=auditors', 'GET')
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
        search: (query, sector_id = '', only_current = false) => {
            let url = `movements.php?search=${encodeURIComponent(query)}`;
            if (sector_id) url += `&sector_id=${sector_id}`;
            if (only_current) url += `&only_current=1`;
            return Api.request(url, 'GET');
        },
        register: (data) => Api.request('movements.php', 'POST', data)
    },
    dashboard: {
        getStats: () => Api.request('dashboard.php', 'GET')
    },
    
    // Novo motorzinho Web Scraper
    scraper: {
        async fetch(processNumber) {
            try {
                const response = await fetch(`${API_BASE}/scraper.php?process=${encodeURIComponent(processNumber)}`);
                const result = await response.json();
                
                if (!response.ok || !result.success) {
                    console.error('Scraper Error:', result.message || 'Erro desconhecido');
                    return { success: false, message: result.message || 'Erro de rede' };
                }
                
                return { success: true, data: result.data };
            } catch (err) {
                console.error('Fetch error:', err);
                return { success: false, message: 'Erro de conexão local ou rede lenta' };
            }
        }
    }
};
