const movementsView = {
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
                                    <input type="text" id="mov-processo" required placeholder="Ex: 12345/2026">
                                </div>
                                <div class="form-group">
                                    <label>Data da Movimentação *</label>
                                    <input type="date" id="mov-data" required value="${new Date().toISOString().split('T')[0]}">
                                </div>
                                <div class="form-group">
                                    <label>Ação *</label>
                                    <select id="mov-acao" required>
                                        <option value="">Selecione...</option>
                                        <option value="ENTRADA">ENTRADA (Subfis)</option>
                                        <option value="SAIDA">SAÍDA (Outro Setor)</option>
                                    </select>
                                </div>
                                <div class="form-group col-span-2" id="div-destino" style="display:none;">
                                    <label>Destino do Processo *</label>
                                    <select id="mov-destino">
                                        <option value="">Carregando setores...</option>
                                    </select>
                                </div>
                            </div>
                            
                            <hr class="my-2">
                            <h4>Dados do Processo</h4>
                            <p class="text-secondary mb-1" style="font-size:0.85rem;">(Preenchimento obrigatório para o primeiro registro do processo)</p>
                            
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

        // Event listeners
        const form = document.getElementById('movement-form');
        const acaoSelect = document.getElementById('mov-acao');
        const destinoDiv = document.getElementById('div-destino');
        const destinoSelect = document.getElementById('mov-destino');

        acaoSelect.addEventListener('change', async (e) => {
            if (e.target.value === 'SAIDA') {
                destinoDiv.style.display = 'block';
                destinoSelect.required = true;
                if (destinoSelect.options.length <= 1) {
                    try {
                        const sectors = await Api.sectors.list();
                        destinoSelect.innerHTML = '<option value="">Selecione o setor...</option>' + 
                            sectors.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
                    } catch(err) {
                        window.app.toast('Erro ao carregar setores', 'error');
                    }
                }
            } else {
                destinoDiv.style.display = 'none';
                destinoSelect.required = false;
                destinoSelect.value = '';
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
                subject: document.getElementById('mov-assunto').value,
                requester: document.getElementById('mov-requerente').value,
                document_number: document.getElementById('mov-doc').value,
                observations: document.getElementById('mov-obs').value
            };

            try {
                await Api.movements.register(data);
                window.app.toast('Movimentação registrada com sucesso!');
                form.reset();
                document.getElementById('mov-data').value = new Date().toISOString().split('T')[0];
                acaoSelect.dispatchEvent(new Event('change'));
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
