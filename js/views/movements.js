const movementsView = {
    responsibles: [],
    async render(container, user) {
        container.innerHTML = `
            <div class="view-section">
                <div class="card">
                    <div class="card-header border-bottom">
                        <h3>Registrar Nova Movimentação</h3>
                        <p class="text-secondary">O coração do sistema. Insira os processos que entram e saem.</p>
                    </div>
                    <div class="card-body">
                        <form id="movement-form">
                            <div class="grid-form">
                                <div class="form-group col-span-2">
                                    <label>Número do Processo *</label>
                                    <input type="text" id="mov-processo" required placeholder="Ex: 009/000345/2026" autocomplete="off">
                                    <small id="mov-processo-warning" style="color:var(--warning-color, #eab308); font-weight: 500; display:none; margin-top:0.25rem;">
                                        <i class="fa-solid fa-triangle-exclamation"></i> Formato sugerido: 000/000000/0000
                                    </small>
                                </div>
                                <div class="form-group">
                                    <label>Data e Hora da Movimentação *</label>
                                    <input type="datetime-local" id="mov-data" required value="${new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}">
                                </div>
                                <div class="form-group">
                                    <label>Ação *</label>
                                    <select id="mov-acao" required>
                                        <option value="ENTRADA" selected>ENTRADA (Tramitação)</option>
                                        <option value="SAIDA">SAÍDA</option>
                                    </select>
                                </div>
                                <div class="form-group col-span-2" id="div-destino">
                                    <label>Setor de Destino *</label>
                                    <select id="mov-destino" required>
                                        <option value="">Nenhum / Não definido</option>
                                    </select>
                                </div>
                                <div class="form-group col-span-2">
                                    <label>Auditor Responsável *</label>
                                    <select id="mov-responsavel" required>
                                        <option value="">Nenhum / Não definido</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="flex-between my-2">
                                <h4>Dados do Processo</h4>
                                <button type="button" id="btn-search-portal" class="btn-outline-primary btn-sm">
                                    <i class="fa-solid fa-wand-magic-sparkles"></i> Puxar do Portal
                                </button>
                            </div>
                            
                            <div class="grid-form">
                                <div class="form-group col-span-2">
                                    <label>Assunto</label>
                                    <input type="text" id="mov-assunto" placeholder="Assunto do processo">
                                </div>
                                <div class="form-group">
                                    <label>Requerente</label>
                                    <input type="text" id="mov-requerente" placeholder="Nome do Requerente">
                                </div>
                                <div class="form-group">
                                    <label>CPF/CNPJ</label>
                                    <input type="text" id="mov-doc" placeholder="000.000.000-00">
                                </div>
                                <div class="form-group col-span-4">
                                    <label>Observações</label>
                                    <textarea id="mov-obs" rows="3" placeholder="Informações adicionais"></textarea>
                                </div>
                            </div>
                            
                            <div class="flex-end mt-2">
                                <button type="submit" class="btn-primary" id="btn-save-mov" style="width:auto; padding: 0.8rem 2rem;">
                                    <i class="fa-solid fa-save"></i> Registrar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        const form = document.getElementById('movement-form');
        const processInput = document.getElementById('mov-processo');
        const acaoSelect = document.getElementById('mov-acao');
        const destinoDiv = document.getElementById('div-destino');
        const destinoSelect = document.getElementById('mov-destino');
        const responsavelSelect = document.getElementById('mov-responsavel');
        const searchPortalBtn = document.getElementById('btn-search-portal');
        const assuntoInput = document.getElementById('mov-assunto');
        const requerenteInput = document.getElementById('mov-requerente');
        const docInput = document.getElementById('mov-doc');
        const obsInput = document.getElementById('mov-obs');

        // Função compartilhada para buscar no portal
        const performScraping = async (processNumber) => {
            try {
                const btnSave = document.getElementById('btn-save-mov');
                if (btnSave) btnSave.disabled = true;
                searchPortalBtn.disabled = true;
                searchPortalBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                
                const result = await Api.scraper.fetch(processNumber);
                
                if (result.success) {
                    const scraped = result.data;
                    // Libera campos para preenchimento se estiverem bloqueados
                    requerenteInput.disabled = false;
                    assuntoInput.disabled = false;
                    
                    if (!requerenteInput.value || requerenteInput.value === 'Importação de Dados' || requerenteInput.value === 'Processo Importado') {
                        requerenteInput.value = scraped.interessado || scraped.requerente || '';
                    }
                    
                    if (!assuntoInput.value || assuntoInput.value === 'Processo Importado' || assuntoInput.value === 'Assunto do processo') {
                        assuntoInput.value = scraped.assunto || scraped.assunto_original || '';
                    }
                    
                    if (!obsInput.value) {
                        obsInput.value = scraped.observacao || '';
                    }
                    
                    window.app.toast('Dados do portal carregados!', 'success');
                } else {
                    window.app.toast(result.message || 'Não foram encontrados novos dados no portal.', 'warning');
                    console.error('Scraping Error:', result.message);
                }
            } catch (err) {
                console.error(err);
            } finally {
                const btnSave = document.getElementById('btn-save-mov');
                if (btnSave) btnSave.disabled = false;
                searchPortalBtn.disabled = false;
                searchPortalBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Puxar do Portal';
            }
        };

        // Manual search button
        searchPortalBtn.addEventListener('click', () => {
            const processNumber = processInput.value.trim();
            if (processNumber) {
                performScraping(processNumber);
            } else {
                window.app.toast('Informe o número do processo primeiro.', 'warning');
            }
        });

        // Load responsibles list
        try {
            this.responsibles = await Api.responsibles.list();
            responsavelSelect.innerHTML = '<option value="">Nenhum / Não definido</option>' +
                this.responsibles.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
        } catch(e) {
            console.warn('Nao foi possivel carregar responsaveis', e);
        }

        // Load sectors list
        try {
            this.sectors_data = await Api.sectors.list();
            destinoSelect.innerHTML = '<option value="">Selecione o setor...</option>' + 
                this.sectors_data.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
            
            // Auto-select user's sector by default since initial action is ENTRADA
            if (user && user.sector_id) {
                destinoSelect.value = user.sector_id;
            }
        } catch(err) {
            window.app.toast('Erro ao carregar setores', 'error');
        }

        // Handle logical defaults changing based on Action
        acaoSelect.addEventListener('change', () => {
            if (acaoSelect.value === 'ENTRADA' && user && user.sector_id) {
                destinoSelect.value = user.sector_id;
            } else if (acaoSelect.value === 'SAIDA') {
                destinoSelect.value = ''; // Force them to pick destination for outgoing
            }
        });

        // Format verification warning (non-blocking)
        processInput.addEventListener('input', () => {
            const processNumber = processInput.value.trim();
            const warningEl = document.getElementById('mov-processo-warning');
            
            // Regex to match DDD/NNNNNN/AAAA (3 digits, 6 digits, 4 digits separated by '/')
            if (processNumber && !/^\d{3}\/\d{6}\/\d{4}$/.test(processNumber)) {
                warningEl.style.display = 'block';
            } else {
                warningEl.style.display = 'none';
            }
        });

        // Search process and auto-fill
        processInput.addEventListener('blur', async () => {
            const processNumber = processInput.value.trim();
            if (!processNumber) return;

            try {
                const data = await Api.movements.getByNumber(processNumber);
                if (data && data.exists) {
                    const process = data.process;
                    assuntoInput.value = process.subject || '';
                    requerenteInput.value = process.requester || '';
                    docInput.value = process.document_number || '';
                    obsInput.value = process.observations || '';
                    
                    // Auto-fill Auditor Responsável
                    if (process.last_responsible_id) {
                        responsavelSelect.value = process.last_responsible_id;
                    }

                    // Lock fields if process exists
                    assuntoInput.disabled = true;
                    requerenteInput.disabled = true;
                    docInput.disabled = true;

                    // Lógica especial de ENRIQUECIMENTO:
                    // Se o processo veio de importação (nome genérico), mostra aviso mas NÃO puxa automático agora
                    if (process.requester === 'Importação de Dados' || process.requester === 'Processo Importado') {
                        window.app.toast('Processo com dados genéricos. Se desejar, use o botão ao lado de Dados do Processo.', 'info');
                    } else {
                        window.app.toast('Dados do processo carregados!', 'success');
                    }
                    
                    // Restriction logic 2.0 (Tramitação)
                    if (process.last_action === 'SAIDA') {
                        acaoSelect.value = 'ENTRADA';
                        acaoSelect.querySelectorAll('option').forEach(opt => {
                            opt.disabled = (opt.value === 'SAIDA');
                        });
                    } else if (process.last_action === 'ENTRADA') {
                        acaoSelect.value = process.last_sector_is_internal ? 'ENTRADA' : 'ENTRADA';
                        acaoSelect.querySelectorAll('option').forEach(opt => {
                            opt.disabled = false;
                        });
                    } else {
                        acaoSelect.querySelectorAll('option').forEach(opt => opt.disabled = false);
                    }
                } else {
                    // New process
                    assuntoInput.disabled = false;
                    requerenteInput.disabled = false;
                    docInput.disabled = false;
                    acaoSelect.querySelectorAll('option').forEach(opt => opt.disabled = false);
                    window.app.toast('Novo processo identificado. Preencha ou use o botão Puxar do Portal.', 'info');
                }
            } catch (err) {
                console.error(err);
            }
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btn-save-mov');
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';
            btn.disabled = true;

            const data = {
                process_number: document.getElementById('mov-processo').value,
                movement_date: document.getElementById('mov-data').value,
                action: document.getElementById('mov-acao').value,
                destination_sector_id: document.getElementById('mov-destino').value || null,
                responsible_id: document.getElementById('mov-responsavel').value || null,
                subject: document.getElementById('mov-assunto').value,
                requester: document.getElementById('mov-requerente').value,
                document_number: document.getElementById('mov-doc').value,
                observations: document.getElementById('mov-obs').value
            };

            try {
                await Api.movements.register(data);
                window.app.toast('Movimentação registrada com sucesso!');
                form.reset();
                // Reset state
                assuntoInput.disabled = false;
                requerenteInput.disabled = false;
                docInput.disabled = false;
                acaoSelect.querySelectorAll('option').forEach(opt => opt.disabled = false);
                
                document.getElementById('mov-data').value = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                acaoSelect.value = 'ENTRADA';
                destinoSelect.value = user && user.sector_id ? user.sector_id : '';
                responsavelSelect.value = '';
            } catch (err) {
                window.app.toast(err.message, 'error');
            } finally {
                btn.innerHTML = '<i class="fa-solid fa-save"></i> Registrar';
                btn.disabled = false;
            }
        });
    }
};

window.movementsView = movementsView;
