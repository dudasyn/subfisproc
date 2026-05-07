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
        list: (include_inactive = false) => Api.request(`sectors.php${include_inactive ? '?include_inactive=1' : ''}`, 'GET'),
        create: (name) => Api.request('sectors.php', 'POST', { name }),
        update: (id, name) => Api.request('sectors.php', 'PUT', { id, name }),
        delete: (id) => Api.request(`sectors.php?id=${id}`, 'DELETE')
    },
    responsibles: {
        list: () => Api.request('responsibles.php', 'GET'),
        create: (name, sector_ids) => Api.request('responsibles.php', 'POST', { name, sector_ids }),
        update: (id, name, sector_ids) => Api.request('responsibles.php', 'PUT', { id, name, sector_ids }),
        delete: (id) => Api.request(`responsibles.php?id=${id}`, 'DELETE'),
        clearAllSectors: () => Api.request('responsibles.php', 'POST', { action: 'clear_all_sectors' }),
        merge: (source_id, target_id) => Api.request('responsibles.php', 'POST', { action: 'merge', source_id, target_id })
    },
    users: {
        list: () => Api.request('users.php', 'GET'),
        create: (data) => Api.request('users.php', 'POST', data),
        update: (data) => Api.request('users.php', 'PUT', data),
        delete: (id) => Api.request(`users.php?id=${id}`, 'DELETE'),
        changePassword: (old_password, new_password) => Api.request('users.php', 'POST', { action: 'change-password', old_password, new_password }),
        resetPassword: (userId) => Api.request('users.php', 'POST', { action: 'reset-password', user_id: userId })
    },
    processes: {
        delete: (id) => Api.request(`processes.php?id=${id}`, 'DELETE'),
        update: (data) => Api.request('processes.php', 'POST', { action: 'update', ...data }),
        attach: (parentId, childNumber) => Api.request('processes.php', 'POST', { action: 'attach', parent_id: parentId, child_number: childNumber }),
        detach: (childId) => Api.request('processes.php', 'POST', { action: 'detach', child_id: childId })
    },
    reports: {
        movements: (start, end, action, sector_id) => {
            let url = `reports.php?type=movements&start=${start}&end=${end}`;
            if (action && action !== 'Todas') url += `&action=${action}`;
            if (sector_id) url += `&sector_id=${sector_id}`;
            return Api.request(url, 'GET');
        },
        stagnant: (days, sector_id) => {
            let url = `reports.php?type=stagnant&days=${days || 15}`;
            if (sector_id) url += `&sector_id=${sector_id}`;
            return Api.request(url, 'GET');
        },
        auditorStats: () => Api.request('reports.php?type=auditors', 'GET'),
        auditorProcesses: (responsible_id) => Api.request(`reports.php?type=auditor_processes&responsible_id=${responsible_id}`, 'GET'),
        sectorStats: (start, end) => Api.request(`reports.php?type=sector_stats&start=${start}&end=${end}`, 'GET'),
    },
    import: {
        validate: (data) => Api.request('import/validate', 'POST', data),
        execute: (data, batchId, label = '') => {
            let url = 'import/execute';
            const params = [];
            if (batchId) params.push(`batch_id=${batchId}`);
            if (label) params.push(`label=${encodeURIComponent(label)}`);
            if (params.length > 0) url += `?${params.join('&')}`;
            return Api.request(url, 'POST', data);
        },
        undo: (batchId) => Api.request(`import/batch?batch=${batchId}`, 'DELETE'),
        restore: (batchId) => Api.request('import/restore', 'POST', { batch_id: batchId }),
        restoreFile: (file) => Api.request('import/restore', 'POST', { snapshot_file: file }),
        snapshots: () => Api.request('import/snapshots', 'GET'),
        logs: (batchId, level = '') => Api.request(`import/logs?batch=${batchId}${level ? '&level=' + level : ''}`, 'GET'),
        wipe: () => Api.request('import/wipe', 'DELETE'),
        createSnapshot: () => Api.request('import/snapshot', 'POST'),
        uploadSnapshot: async (formData) => {
            try {
                const response = await fetch('api/import/snapshot/upload', {
                    method: 'POST',
                    body: formData
                });
                
                if (response.status === 401) {
                    window.app.logout(false);
                    throw new Error('Sessão expirada. Faça login novamente.');
                }
                
                const result = await response.json();
                if (!response.ok) {
                    throw new Error(result.error || 'Erro ao enviar snapshot');
                }
                return result;
            } catch (error) {
                console.error('API Error:', error);
                throw error;
            }
        },
        history: () => Api.request('import/history', 'GET')
    },
    movements: {
        listAll: () => Api.request('movements.php', 'GET'),
        listLatest: () => Api.request('movements.php?latest=1', 'GET'),
        listByProcess: (procId) => Api.request(`movements.php?process_id=${procId}`, 'GET'),
        getByNumber: (number) => Api.request(`movements.php?process_number=${encodeURIComponent(number)}`, 'GET'),
        search: (query, sector_id = '', only_current = false, responsible_id = '', page = 1, limit = 50) => {
            let url = `movements.php?search=${encodeURIComponent(query)}`;
            if (sector_id) url += `&sector_id=${sector_id}`;
            if (only_current) url += `&only_current=1`;
            if (responsible_id) url += `&responsible_id=${responsible_id}`;
            if (page) url += `&page=${page}`;
            if (limit) url += `&limit=${limit}`;
            return Api.request(url, 'GET');
        },
        register: (data) => Api.request('movements.php', 'POST', data)
    },
    dashboard: {
        getStats: (start = '', end = '') => {
            let url = 'dashboard';
            const params = [];
            if (start) params.push(`start=${start}`);
            if (end) params.push(`end=${end}`);
            if (params.length > 0) url += `?${params.join('&')}`;
            return Api.request(url, 'GET');
        }
    },
    
    // Novo motorzinho Web Scraper
    scraper: {
        async fetch(processNumber) {
            try {
                const response = await fetch(`${Api.baseUrl}scraper.php?process=${encodeURIComponent(processNumber)}`);
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
