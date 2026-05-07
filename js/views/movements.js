const movementsView = {
    responsibles: [],
    async render(container, user, viewParts) {
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
                                    <div id="mov-attachments-alert" style="display:none; background:#fff7ed; border:1px solid #ffedd5; color:#9a3412; padding:0.8rem; margin-top:0.5rem; border-radius:var(--radius-md); font-size:0.85rem; line-height:1.4;">
                                        <i class="fa-solid fa-triangle-exclamation" style="color:#f97316;"></i> 
                                        <strong>Atenção:</strong> Este processo possui <strong>apensos</strong> vinculados. Ao registrar esta ação, todos os apensos serão movimentados automaticamente para o mesmo destino.
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label>Data e Hora da Movimentação *</label>
                                    <input type="datetime-local" id="mov-data" required value="${new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}">
                                </div>
                                <div class="form-group">
                                    <label>Ação *</label>
                                    <select id="mov-acao" required style="background-color: var(--bg-secondary); cursor: not-allowed;">
                                        <option value="ENTRADA" selected>ENTRADA (Tramitação)</option>
                                        <option value="SAIDA">SAÍDA</option>
                                    </select>
                                    <small class="text-secondary" style="display:block; margin-top:0.25rem;">Calculada automaticamente com base no Setor.</small>
                                </div>
                                <div class="form-group col-span-2" id="div-destino">
                                    <label>Setor *</label>
                                    <select id="mov-destino" required>
                                        <option value="">Nenhum / Não definido</option>
                                    </select>
                                </div>
                                <div class="form-group col-span-2">
                                    <label>Auditor Responsável</label>
                                    <select id="mov-responsavel">
                                        <option value="">Nenhum / Não definido</option>
                                    </select>
                                    <small id="mov-fiscal-warning" style="color:var(--warning-color, #eab308); font-weight: 500; display:none; margin-top:0.25rem;">
                                        <i class="fa-solid fa-triangle-exclamation"></i> <strong>Atenção:</strong> Auditor não lotado no setor selecionado.
                                    </small>
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
                this.sectors_data.map(s => `<option value="${s.id}">${s.alias || s.name}</option>`).join('');
            
            // Auto-select user's sector by default since initial action is ENTRADA
            if (user && user.sector_id) {
                destinoSelect.value = user.sector_id;
                // Manually trigger the action update since changing value via JS doesn't fire 'change' event
                setTimeout(() => updateActionAutomatically(), 100);
            }
        } catch(err) {
            window.app.toast('Erro ao carregar setores', 'error');
        }

        // Variable to hold process state for action calculation
        let currentProcessState = {
            isNew: true,
            lastAction: null
        };

        const updateActionAutomatically = () => {
            const sectorId = destinoSelect.value;
            if (!sectorId) return;

            const sector = this.sectors_data.find(s => String(s.id) === String(sectorId));
            if (!sector) return;

            if (sector.is_internal_hierarchy || sector.is_internal) {
                acaoSelect.value = 'ENTRADA';
            } else {
                acaoSelect.value = 'SAIDA';
            }
        };

        const validateFiscalSector = () => {
            const sectorId = destinoSelect.value;
            const respId = responsavelSelect.value;
            const warningEl = document.getElementById('mov-fiscal-warning');
            
            if (!sectorId || !respId) {
                warningEl.style.display = 'none';
                return;
            }
            
            const resp = this.responsibles.find(r => String(r.id) === String(respId));
            if (!resp) {
                warningEl.style.display = 'none';
                return;
            }
            
            const allowedSectors = resp.sector_ids ? resp.sector_ids.split(',') : [];
            if (!allowedSectors.includes(String(sectorId))) {
                warningEl.style.display = 'block';
            } else {
                warningEl.style.display = 'none';
            }
        };

        destinoSelect.addEventListener('change', () => {
            updateActionAutomatically();
            validateFiscalSector();
        });
        responsavelSelect.addEventListener('change', validateFiscalSector);

        // Format verification warning (non-blocking)
        processInput.addEventListener('input', () => {
            const processNumber = processInput.value.trim();
            const warningEl = document.getElementById('mov-processo-warning');
            
            // Regex to match XXX/XXXX.../XXXX (Letters or digits)
            if (processNumber && !/^[A-Z0-9]{1,10}\/[A-Z0-9]{1,10}\/[A-Z0-9]{1,10}$/i.test(processNumber)) {
                warningEl.style.display = 'block';
            } else {
                warningEl.style.display = 'none';
            }
        });

        // Search process and auto-fill
        processInput.addEventListener('blur', async () => {
            const processNumber = processInput.value.trim();
            if (!processNumber) return;

            const attachmentsAlert = document.getElementById('mov-attachments-alert');
            const btnSave = document.getElementById('btn-save-mov');

            // Limpa dados prévios antes de buscar
            attachmentsAlert.style.display = 'none';
            attachmentsAlert.className = 'mt-1';
            attachmentsAlert.style.background = '#fff7ed';
            attachmentsAlert.style.borderColor = '#ffedd5';
            attachmentsAlert.style.color = '#9a3412';
            
            assuntoInput.value = '';
            requerenteInput.value = '';
            docInput.value = '';
            obsInput.value = '';
            responsavelSelect.value = '';
            btnSave.disabled = false;

            try {
                const data = await Api.movements.getByNumber(processNumber);
                if (data && data.exists) {
                    const process = data.process;
                    
                    // BLOCK: Process is an attachment
                    if (process.parent_id) {
                        attachmentsAlert.style.display = 'block';
                        attachmentsAlert.style.background = '#fef2f2';
                        attachmentsAlert.style.borderColor = '#fecaca';
                        attachmentsAlert.style.color = '#991b1b';
                        attachmentsAlert.innerHTML = `
                            <i class="fa-solid fa-ban" style="color:#ef4444;"></i> 
                            <strong>Bloqueado:</strong> Este processo está APENSADO ao processo <strong>${process.parent_process_number}</strong>. 
                            Para tramitá-lo, você deve realizar a movimentação do processo principal.
                        `;
                        btnSave.disabled = true;
                        window.app.toast('Tramitação individual bloqueada para apensos.', 'error');
                        return;
                    }

                    assuntoInput.value = process.subject || '';
                    requerenteInput.value = process.requester || '';
                    docInput.value = process.document_number || '';
                    obsInput.value = process.observations || '';
                    
                    // Auto-fill Auditor Responsável
                    if (process.last_responsible_id) {
                        responsavelSelect.value = process.last_responsible_id;
                        validateFiscalSector();
                    }

                    // WARNING: Process has attachments
                    if (process.attachments_count > 0) {
                        attachmentsAlert.style.display = 'block';
                        attachmentsAlert.innerHTML = `
                            <i class="fa-solid fa-triangle-exclamation" style="color:#f97316;"></i> 
                            <strong>Atenção:</strong> Este processo possui <strong>${process.attachments_count} apenso(s)</strong> vinculados: 
                            <div style="margin-top:5px; font-weight:600; color:var(--primary-color);">${process.attached_processes.join(', ')}</div>
                            Ao registrar esta ação, todos os apensos serão movimentados automaticamente para o mesmo destino.
                        `;
                    }

                    // Lock fields if process exists
                    assuntoInput.disabled = true;
                    requerenteInput.disabled = true;
                    docInput.disabled = true;

                    // Lógica especial de ENRIQUECIMENTO
                    if (process.requester === 'Importação de Dados' || process.requester === 'Processo Importado') {
                        window.app.toast('Processo com dados genéricos. Use "Puxar do Portal" se necessário.', 'info');
                    } else {
                        window.app.toast('Dados do processo carregados!', 'success');
                    }
                    
                    currentProcessState = {
                        isNew: false,
                        lastAction: process.last_action
                    };
                    updateActionAutomatically();
                } else {
                    // New process
                    currentProcessState = { isNew: true, lastAction: null };
                    assuntoInput.disabled = false;
                    requerenteInput.disabled = false;
                    docInput.disabled = false;
                    updateActionAutomatically();
                    window.app.toast('Novo processo identificado.', 'info');
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
                currentProcessState = { isNew: true, lastAction: null };
                assuntoInput.disabled = false;
                requerenteInput.disabled = false;
                docInput.disabled = false;
                
                document.getElementById('mov-data').value = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                acaoSelect.value = 'ENTRADA';
                destinoSelect.value = user && user.sector_id ? user.sector_id : '';
                document.getElementById('mov-attachments-alert').style.display = 'none';
                responsavelSelect.value = '';
                validateFiscalSector();
            } catch (err) {
                window.app.toast(err.message, 'error');
            } finally {
                btn.innerHTML = '<i class="fa-solid fa-save"></i> Registrar';
                btn.disabled = false;
            }
        });
        // Auto-fill if process number is in URL (e.g. #movements/009/A/2026)
        const preload = viewParts.slice(1).join('/');
        if (preload) {
            processInput.value = preload;
            // Trigger blur logic manually
            processInput.dispatchEvent(new Event('blur'));
        }
    }
};

window.movementsView = movementsView;
