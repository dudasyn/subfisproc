const movementsView = {
    responsibles: [],
    async render(container, user, viewParts) {
        // Detecta se está rodando dentro do modal de tramitação rápida
        const isModal = document.getElementById('tramitar-processo-modal') !== null;

        // Injeta os estilos CSS premium se não existirem
        if (!document.getElementById('style-mov-premium')) {
            const style = document.createElement('style');
            style.id = 'style-mov-premium';
            style.innerHTML = `
                .mov-card-section {
                    background: #ffffff;
                    border: 1px solid rgba(226, 232, 240, 0.8);
                    border-radius: var(--radius-lg);
                    padding: 1.5rem;
                    margin-bottom: 1.5rem;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.01), 0 2px 4px -1px rgba(0, 0, 0, 0.01);
                    transition: all 0.3s ease;
                }
                .mov-card-section:hover {
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.03), 0 4px 6px -2px rgba(0, 0, 0, 0.01);
                    border-color: rgba(121, 185, 71, 0.18);
                }
                .mov-section-title {
                    font-size: 1rem;
                    font-weight: 750;
                    color: var(--accent);
                    margin-bottom: 1.25rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    border-bottom: 1px solid #f1f5f9;
                    padding-bottom: 0.75rem;
                }
                .mov-input-icon-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                    width: 100%;
                }
                .mov-input-icon-wrapper i:first-child {
                    position: absolute;
                    left: 1rem;
                    color: var(--text-secondary);
                    opacity: 0.75;
                    font-size: 0.95rem;
                    pointer-events: none;
                }
                .mov-input-icon-wrapper input, .mov-input-icon-wrapper select, .mov-input-icon-wrapper textarea {
                    padding-left: 2.6rem !important;
                }
                .btn-stpd-search {
                    width: auto;
                    height: 46px;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: linear-gradient(135deg, var(--primary-color), #5c9e2b);
                    border: none;
                    padding: 0 1.25rem;
                    border-radius: var(--radius-md);
                    color: white;
                    font-weight: 700;
                    font-size: 0.85rem;
                    cursor: pointer;
                    box-shadow: 0 4px 6px rgba(121, 185, 71, 0.15);
                    transition: all 0.2s ease;
                }
                .btn-stpd-search:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 6px 12px rgba(121, 185, 71, 0.3);
                    filter: brightness(1.05);
                }
                .btn-stpd-search:active {
                    transform: translateY(1px);
                }
                @keyframes pulse-chevron {
                    0% { transform: scale(1) translateX(0); opacity: 0.6; }
                    50% { transform: scale(1.2) translateX(4px); opacity: 1; }
                    100% { transform: scale(1) translateX(0); opacity: 0.6; }
                }
                .anim-chevron {
                    animation: pulse-chevron 1.5s infinite ease-in-out;
                }
            `;
            document.head.appendChild(style);
        }

        container.innerHTML = `
            <div class="view-section" style="${isModal ? 'padding: 0;' : ''}">
                <div class="${isModal ? '' : 'card'}" style="${isModal ? 'border:none; box-shadow:none; background:transparent;' : ''}">
                    ${isModal ? '' : `
                    <div class="card-header border-bottom">
                        <h3>Registrar Nova Movimentação</h3>
                        <p class="text-secondary">O coração do sistema. Insira os processos que entram e saem.</p>
                    </div>
                    `}
                    <div class="${isModal ? '' : 'card-body'}" style="${isModal ? 'padding: 0;' : ''}">
                        <form id="movement-form">
                            <!-- Seção 1: Tramitação e Destino -->
                            <div class="mov-card-section">
                                <div class="mov-section-title">
                                    <i class="fa-solid fa-route" style="color: var(--primary-color);"></i> Dados de Tramitação e Destino
                                </div>
                                <div class="grid-form">
                                    <div class="form-group col-span-2">
                                        <label>Número do Processo *</label>
                                        <div style="display: flex; gap: 0.5rem; width: 100%;">
                                            <div class="mov-input-icon-wrapper" style="flex: 1;">
                                                <i class="fa-solid fa-file-signature"></i>
                                                <input type="text" id="mov-processo" required placeholder="Ex: 009/000345/2026" autocomplete="off" style="width: 100%;">
                                            </div>
                                            <button type="button" id="btn-search-portal" class="btn-stpd-search" title="Buscar informações detalhadas no STPD Caxias">
                                                <i class="fa-solid fa-wand-magic-sparkles"></i> Puxar do STPD
                                            </button>
                                        </div>
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
                                        <div class="mov-input-icon-wrapper">
                                            <i class="fa-solid fa-calendar-alt"></i>
                                            <input type="datetime-local" id="mov-data" required value="${new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}">
                                        </div>
                                    </div>
                                    <div class="form-group">
                                        <label>Ação *</label>
                                        <div class="mov-input-icon-wrapper">
                                            <i class="fa-solid fa-exchange-alt"></i>
                                            <select id="mov-acao" required style="background-color: var(--bg-secondary); cursor: not-allowed; pointer-events: none;">
                                                <option value="ENTRADA" selected>Tramitação: Entrada no Setor</option>
                                                <option value="SAIDA">Tramitação: Saída do Setor</option>
                                                <option value="SAIDA_EXTERNO">Saída Órgão Externo</option>
                                            </select>
                                        </div>
                                        <small class="text-secondary" style="display:block; margin-top:0.25rem;">Calculada automaticamente com base no Setor.</small>
                                    </div>
                                    <div class="form-group col-span-2" id="div-destino">
                                        <label>Setor Destino *</label>
                                        <div class="mov-input-icon-wrapper">
                                            <i class="fa-solid fa-building"></i>
                                            <select id="mov-destino" required>
                                                <option value="">Nenhum / Não definido</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="form-group col-span-2">
                                        <label>Auditor Responsável</label>
                                        <div class="mov-input-icon-wrapper">
                                            <i class="fa-solid fa-user-tie"></i>
                                            <select id="mov-responsavel">
                                                <option value="">Nenhum / Não definido</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Seção 2: Dados Complementares do Processo -->
                            <div class="mov-card-section" style="background: rgba(121, 185, 71, 0.015); border: 1px dashed rgba(121, 185, 71, 0.18);">
                                <div class="mov-section-title" style="color: #79b947; border-bottom-color: rgba(121, 185, 71, 0.12);">
                                    <i class="fa-solid fa-folder-open"></i> Metadados do Processo (Sincronização via STPD)
                                </div>
                                
                                <!-- Container para exibir a última tramitação puxada do STPD com design premium -->
                                <div id="mov-ultima-tramitacao-container" style="display:none; margin-bottom: 1.5rem; transition: all 0.3s ease;"></div>
                                
                                <div class="grid-form">
                                    <div class="form-group col-span-2">
                                        <label>Assunto</label>
                                        <div class="mov-input-icon-wrapper">
                                            <i class="fa-solid fa-heading"></i>
                                            <input type="text" id="mov-assunto" placeholder="Assunto do processo">
                                        </div>
                                    </div>
                                    <div class="form-group">
                                        <label>Requerente</label>
                                        <div class="mov-input-icon-wrapper">
                                            <i class="fa-solid fa-user"></i>
                                            <input type="text" id="mov-requerente" placeholder="Nome do Requerente">
                                        </div>
                                    </div>
                                    <div class="form-group">
                                        <label>CPF/CNPJ</label>
                                        <div class="mov-input-icon-wrapper">
                                            <i class="fa-solid fa-id-card"></i>
                                            <input type="text" id="mov-doc" placeholder="000.000.000-00">
                                        </div>
                                    </div>
                                    <div class="form-group col-span-4">
                                        <label>Observações</label>
                                        <div class="mov-input-icon-wrapper" style="align-items: flex-start;">
                                            <i class="fa-solid fa-align-left" style="top: 1.1rem;"></i>
                                            <textarea id="mov-obs" rows="4" placeholder="Informações adicionais obtidas do STPD ou notas da nova movimentação..." style="padding-top: 0.75rem; resize: vertical; min-height: 100px;"></textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="flex-end mt-2" style="margin-bottom: ${isModal ? '0' : '1.5rem'};">
                                <button type="submit" class="btn-primary" id="btn-save-mov" style="width:auto; padding: 0.8rem 2.5rem; font-size: 0.95rem; font-weight: 700; background: linear-gradient(135deg, #79b947, #5c9e2b); border: none; box-shadow: 0 4px 10px rgba(121, 185, 71, 0.3); display: flex; align-items: center; gap: 0.5rem; transition: all 0.25s ease;">
                                    <i class="fa-solid fa-paper-plane"></i> Registrar Movimentação
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

        // Renderiza o card premium da última tramitação
        const showUltimaTramitacao = (tramitacao) => {
            const container = document.getElementById('mov-ultima-tramitacao-container');
            if (!container) return;
            
            if (!tramitacao) {
                container.style.display = 'none';
                container.innerHTML = '';
                return;
            }
            
            container.innerHTML = `
                <div style="background: linear-gradient(135deg, rgba(30, 41, 59, 0.04), rgba(121, 185, 71, 0.03)); border: 1px solid rgba(148, 163, 184, 0.2); border-radius: var(--radius-lg); padding: 1.25rem; box-shadow: var(--shadow-sm); position: relative; overflow: hidden; backdrop-filter: blur(8px); margin-top: 0.5rem; animation: fadeIn 0.4s ease-out;">
                    <div style="position: absolute; right: -15px; bottom: -15px; font-size: 5rem; color: rgba(121, 185, 71, 0.03); pointer-events: none;">
                        <i class="fa-solid fa-route"></i>
                    </div>
                    <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px dashed rgba(148, 163, 184, 0.3); padding-bottom: 0.75rem; margin-bottom: 0.75rem;">
                        <span style="font-weight: 700; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--primary-color);">
                            <i class="fa-solid fa-clock-rotate-left" style="margin-right: 0.35rem;"></i> Última Tramitação (STPD Caxias)
                        </span>
                        <span style="font-size: 0.75rem; background: rgba(121, 185, 71, 0.12); color: #79b947; padding: 0.25rem 0.6rem; border-radius: 50px; font-weight: 600;">
                            <i class="fa-solid fa-check-double"></i> Sincronizado do STPD
                        </span>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 1rem; position: relative;">
                        <!-- Origem -->
                        <div style="background: rgba(255, 255, 255, 0.5); border-radius: var(--radius-md); padding: 0.75rem; border: 1px solid rgba(148, 163, 184, 0.15); box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                            <span style="display: block; font-size: 0.7rem; text-transform: uppercase; color: var(--text-secondary); font-weight: 700; letter-spacing: 0.02em;">Origem</span>
                            <strong style="display: block; font-size: 0.95rem; color: var(--text-primary); margin-top: 0.2rem; font-family: 'Outfit', sans-serif;">${tramitacao.secretaria_origem}/${tramitacao.setor_origem}</strong>
                            <span style="display: block; font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.35rem; font-weight: 500;">
                                <i class="fa-regular fa-clock" style="margin-right: 0.25rem; color: var(--primary-color);"></i> Envio: ${tramitacao.data_envio}
                            </span>
                        </div>
                        
                        <!-- Conector Visual -->
                        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 2;">
                            <i class="fa-solid fa-circle-chevron-right anim-chevron" style="font-size: 1.5rem; color: var(--primary-color);"></i>
                        </div>
                        
                        <!-- Destino -->
                        <div style="background: rgba(255, 255, 255, 0.5); border-radius: var(--radius-md); padding: 0.75rem; border: 1px solid rgba(148, 163, 184, 0.15); box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                            <span style="display: block; font-size: 0.7rem; text-transform: uppercase; color: var(--text-secondary); font-weight: 700; letter-spacing: 0.02em;">Destino</span>
                            <strong style="display: block; font-size: 0.95rem; color: var(--text-primary); margin-top: 0.2rem; font-family: 'Outfit', sans-serif;">${tramitacao.secretaria_destino}/${tramitacao.setor_destino}</strong>
                            <span style="display: block; font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.35rem; font-weight: 500;">
                                <i class="fa-regular fa-calendar-check" style="margin-right: 0.25rem; color: #79b947;"></i> Recebimento: ${tramitacao.data_recebimento || 'Pendente'}
                            </span>
                        </div>
                    </div>
                </div>
            `;
            container.style.display = 'block';
        };

        // Algoritmo Regex para extração de CPF ou CNPJ
        const extractDocument = (scraped) => {
            const searchPool = [
                scraped.observacao || '',
                scraped.requerente || '',
                scraped.interessado || ''
            ].join(' ');

            // Regex de CNPJ: XX.XXX.XXX/XXXX-XX ou XXXXXXXXXXXXXX
            const cnpjRegex = /\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b|\b\d{14}\b/;
            const cnpjMatch = searchPool.match(cnpjRegex);
            if (cnpjMatch) return cnpjMatch[0];

            // Regex de CPF: XXX.XXX.XXX-XX ou XXXXXXXXXXX
            const cpfRegex = /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b|\b\d{11}\b/;
            const cpfMatch = searchPool.match(cpfRegex);
            if (cpfMatch) return cpfMatch[0];

            return '';
        };

        // Função de formatação para as observações locais concatenadas
        const formatObservations = (scraped) => {
            const parts = [];
            
            parts.push(`[DADOS DO STPD DA PREFEITURA]`);
            if (scraped.situacao) parts.push(`• Situação: ${scraped.situacao}`);
            if (scraped.data_abertura) parts.push(`• Data de Abertura: ${scraped.data_abertura}`);
            if (scraped.interessado) parts.push(`• Interessado: ${scraped.interessado}`);
            if (scraped.assunto_original) parts.push(`• Assunto Original: ${scraped.assunto_original}`);
            
            if (scraped.ultima_tramitacao) {
                const t = scraped.ultima_tramitacao;
                parts.push(`• Última Tramitação no STPD:`);
                parts.push(`  - Origem: ${t.secretaria_origem}/${t.setor_origem} em ${t.data_envio}`);
                parts.push(`  - Destino: ${t.secretaria_destino}/${t.setor_destino} em ${t.data_recebimento}`);
            }
            
            if (scraped.observacao) {
                parts.push(``);
                parts.push(`[OBSERVAÇÃO DO STPD]`);
                parts.push(scraped.observacao);
            }
            
            return parts.join('\n');
        };

        // Função compartilhada para buscar no portal
        const performScraping = async (processNumber) => {
            try {
                const btnSave = document.getElementById('btn-save-mov');
                if (btnSave) btnSave.disabled = true;
                searchPortalBtn.disabled = true;
                searchPortalBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Buscando no STPD...';
                
                const result = await Api.scraper.fetch(processNumber);
                
                if (result.success) {
                    const scraped = result.data;
                    
                    // Libera campos se estiverem bloqueados
                    requerenteInput.disabled = false;
                    assuntoInput.disabled = false;
                    docInput.disabled = false;
                    
                    // Captura os valores atualmente preenchidos nos campos locais
                    const originalSubjectValue = assuntoInput.value.trim();
                    const originalRequesterValue = requerenteInput.value.trim();
                    const originalDocValue = docInput.value.trim();

                    // Valores extraídos do STPD
                    const finalSubject = scraped.assunto || scraped.assunto_original || '';
                    const finalRequester = scraped.requerente || scraped.interessado || '';
                    const finalDoc = extractDocument(scraped) || '';

                    // Array para armazenar informações desviadas do STPD para as Observações
                    const stpdDivertedInfo = [];

                    // Assunto: se já estiver preenchido localmente, preserva e desvia o do STPD
                    if (originalSubjectValue !== '') {
                        if (finalSubject && finalSubject !== originalSubjectValue) {
                            stpdDivertedInfo.push(`• Assunto retornado do STPD: ${finalSubject}`);
                        }
                    } else {
                        assuntoInput.value = finalSubject;
                    }
                    
                    // Requerente: se já estiver preenchido localmente, preserva e desvia o do STPD
                    if (originalRequesterValue !== '') {
                        if (finalRequester && finalRequester !== originalRequesterValue) {
                            stpdDivertedInfo.push(`• Requerente retornado do STPD: ${finalRequester}`);
                        }
                    } else {
                        requerenteInput.value = finalRequester;
                    }
                    
                    // CPF/CNPJ: se já estiver preenchido localmente, preserva e desvia o do STPD
                    if (originalDocValue !== '') {
                        if (finalDoc && finalDoc !== originalDocValue) {
                            stpdDivertedInfo.push(`• CPF/CNPJ retornado do STPD: ${finalDoc}`);
                        }
                    } else {
                        docInput.value = finalDoc;
                    }
                    
                    // Formata a observação vinda do STPD
                    let baseObs = formatObservations(scraped);
                    if (stpdDivertedInfo.length > 0) {
                        baseObs = `[DADOS DO STPD PRESERVADOS (CAMPOS LOCAIS JÁ PREENCHIDOS)]\n` + 
                                  stpdDivertedInfo.join('\n') + 
                                  `\n\n` + 
                                  baseObs;
                    }

                    // Preserva qualquer observação que o usuário já tenha digitado localmente no formulário
                    const originalObs = obsInput.value.trim();
                    if (originalObs !== '') {
                        obsInput.value = originalObs + `\n\n` + baseObs;
                    } else {
                        obsInput.value = baseObs;
                    }
                    
                    // Exibe a Última Tramitação de forma premium
                    if (scraped.ultima_tramitacao) {
                        showUltimaTramitacao(scraped.ultima_tramitacao);
                    } else {
                        const container = document.getElementById('mov-ultima-tramitacao-container');
                        if (container) {
                            container.style.display = 'none';
                            container.innerHTML = '';
                        }
                    }
                    
                    window.app.toast('Dados do STPD carregados!', 'success');
                } else {
                    window.app.toast(result.message || 'Não foram encontrados dados no STPD.', 'warning');
                    console.error('Scraping Error:', result.message);
                }
            } catch (err) {
                console.error(err);
                window.app.toast('Erro ao buscar dados no STPD.', 'error');
            } finally {
                const btnSave = document.getElementById('btn-save-mov');
                if (btnSave) btnSave.disabled = false;
                searchPortalBtn.disabled = false;
                searchPortalBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Puxar do STPD';
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

            const sectorName = (sector.name || '').toLowerCase();
            const isArchive = sectorName.includes('arquivo');
            const isExternal = !sector.is_internal && !sector.is_internal_hierarchy;

            if (isArchive) {
                acaoSelect.value = 'SAIDA';
            } else if (isExternal) {
                acaoSelect.value = 'SAIDA_EXTERNO';
            } else {
                acaoSelect.value = 'ENTRADA';
            }
        };

        destinoSelect.addEventListener('change', updateActionAutomatically);

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
            if (btnSave) btnSave.disabled = false;
            
            const utContainer = document.getElementById('mov-ultima-tramitacao-container');
            if (utContainer) {
                utContainer.style.display = 'none';
                utContainer.innerHTML = '';
            }

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
                        if (btnSave) btnSave.disabled = true;
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
                    }

                    // WARNING: Process has attachments
                    if (process.attachments_count > 0) {
                        attachmentsAlert.style.display = 'block';
                        attachmentsAlert.innerHTML = `
                            <i class="fa-solid fa-triangle-exclamation" style="color:#f97316;"></i> 
                            <strong>Atenção:</strong> Este processo possui <strong>${process.attachments_count} apenso(s)</strong> vinculados: 
                            <div style="margin-top:5px; font-weight:600; color:var(--primary);">${process.attached_processes.join(', ')}</div>
                            Ao registrar esta ação, todos os apensos serão movimentados automaticamente para o mesmo destino.
                        `;
                    }

                    // Lock fields if process exists
                    assuntoInput.disabled = true;
                    requerenteInput.disabled = true;
                    docInput.disabled = true;

                    // Lógica especial de ENRIQUECIMENTO:
                    // Se o processo veio de importação (nome genérico), mostra aviso mas NÃO puxa automático agora
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

            let actionValue = document.getElementById('mov-acao').value;
            if (actionValue === 'SAIDA_EXTERNO') {
                actionValue = 'SAIDA';
            }
            const data = {
                process_number: document.getElementById('mov-processo').value,
                movement_date: document.getElementById('mov-data').value,
                action: actionValue,
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
                const utContainer = document.getElementById('mov-ultima-tramitacao-container');
                if (utContainer) {
                    utContainer.style.display = 'none';
                    utContainer.innerHTML = '';
                }

                // Fechamento inteligente do modal se estiver rodando dentro de um
                const modal = document.getElementById('tramitar-processo-modal');
                if (modal) {
                    modal.remove();
                    // Como fechou, recarrega a listagem ou detalhes da busca
                    const searchInput = document.getElementById('search-input');
                    if (searchInput && searchInput.value.trim()) {
                        if (window.searchView && window.searchView.loadProcessDetails) {
                            window.searchView.loadProcessDetails(searchInput.value.trim());
                        }
                    } else {
                        if (window.searchView && window.searchView.loadSectorProcesses) {
                            window.searchView.loadSectorProcesses();
                        }
                    }
                } else {
                    // Redirecionamento amigável para a tela de detalhes do processo após registrar
                    setTimeout(() => {
                        window.location.hash = `#search/${data.process_number}`;
                    }, 500);
                }
            } catch (err) {
                window.app.toast(err.message, 'error');
            } finally {
                btn.innerHTML = '<i class="fa-solid fa-save"></i> Registrar';
                btn.disabled = false;
            }
        });

        // Auto-preenchimento e pesquisa automática se o número do processo foi passado na rota/hash
        let processNumberFromUrl = '';
        if (viewParts && viewParts.length > 1) {
            processNumberFromUrl = viewParts.slice(1).join('/');
        }
        if (processNumberFromUrl) {
            processInput.value = processNumberFromUrl;
            setTimeout(() => {
                processInput.dispatchEvent(new Event('blur'));
            }, 150);
        }
    }
};

window.movementsView = movementsView;
