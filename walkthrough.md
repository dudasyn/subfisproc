# Walkthrough: Restruturação de Consulta e Segurança de Processos (Listar Processos)

Todo o desenvolvimento planejado para o backend e frontend foi implementado com sucesso! A tela de **Listar Processos** foi totalmente redesenhada para atender às restrições de segurança solicitadas e às três áreas de negócio perfeitamente delimitadas, com paginação e filtros individuais integrados em tempo real ao banco de dados.

---

## 1. O que foi Implementado

### Backend (`api/movements.php`)
*   **Controle de Acesso de Custódia (`getAuthorizedSectors`)**: Restringe a visualização e trâmite de processos para usuários comuns (não-admins) apenas àqueles que estão sob a custódia do seu setor primário ou de setores onde são auditores responsáveis cadastrados.
*   **Resolução de Detalhes (`GET /api/movements?process_number=X`)**: Impede que um usuário comum acesse detalhes de processos fora do seu histórico de custódia (retorna erro `403 Forbidden`).
*   **Novos Escopos de Busca (`GET`)**: Criado suporte nativo para os escopos de listagem:
    *   `'analysis'`: Processos ativamente sob custódia do setor do usuário (`action = 'ENTRADA'`).
    *   `'tramitados'`: Histórico de processos que já passaram pelo setor do usuário mas hoje encontram-se em outros setores.
    *   `'outside'`: Busca externa para processos fora do setor atual (limitado a processos acessíveis conforme as regras de negócio).
*   **Cálculo Automático de Trâmites Internos vs Externos (`POST`)**: No momento do trâmite, o backend consulta a árvore hierárquica de setores:
    *   Se o trâmite ocorre para um **Setor Filho**, **Setor Irmão** ou **Setor Pai**, o sistema registra a ação como `'ENTRADA'` (mantendo o status do trâmite ativo).
    *   Caso contrário, é classificado como uma saída fora do ecossistema familiar (`'SAIDA'`).
    *   O usuário comum é terminantemente bloqueado de iniciar novos trâmites se o processo não estiver atualmente sob custódia ativa de seus setores autorizados.

---

### Frontend (`public/js/views/search.js`)
A tela de listagem foi transformada em um painel administrativo com design de alto padrão (vibrante e intuitivo), dividido em três seções perfeitamente delimitadas e com **enriquecimento completo de informações em tempo real**:

1.  **Área 1: Processos em Análise no Setor (Custódia Ativa)**:
    *   **Identificação Visual**: Borda esquerda azul destaque (`#0072bc`).
    *   **Informações Carregadas por Card**: Número do processo com ícones reativos para apensos, Assunto (descrição principal do processo), **Auditor Responsável** (buscado dinamicamente no banco), **Setor de Custódia Ativa**, Badge elegante de status e data do último trâmite.
    *   **Paginação**: Controles simétricos independentes que consultam o servidor.
    *   **Filtro Sensitivo**: Campo de pesquisa por número que filtra reativamente no backend com debounce integrado de 300ms.

2.  **Área 2: Processos já Tramitados**:
    *   **Identificação Visual**: Borda esquerda roxa destaque (`#8b5cf6`).
    *   **Informações Carregadas por Card**: Número do processo, Assunto, **Auditor Responsável que tramitou**, **Setor de Destino da movimentação** e data do trâmite.
    *   **Paginação**: Paginação individual que permite navegar no histórico sem afetar a Área 1 ou Área 3.
    *   **Filtro Sensitivo**: Pesquisa reativa por número com debounce integrado de 300ms.

3.  **Área 3: Buscar Processos Fora do Setor**:
    *   **Identificação Visual**: Borda esquerda laranja destaque (`#f59e0b`).
    *   **Informações Carregadas por Card**: Número do processo, Assunto, **Auditor Responsável associado**, **Setor de Localização Atual** e data da última alteração.
    *   **Funcionalidade**: Formulário de consulta que aceita filtros por Número de Processo, Setor Destino e Auditor/Responsável.
    *   **Resultados Dedicados**: Seção exclusiva que abre com botão de retorno ("Voltar") e exibe atalhos para Detalhar ou Tramitar de forma rápida.

---

---

### Painel de Detalhes: Informações Gerais do Processo (Expandido para 8 Cards)
Ao detalhar qualquer processo clicando em seu card, o painel central **"Informações Gerais do Processo"** foi ampliado para carregar **8 cards informativos independentes e coloridos** com alta densidade de dados:
1. **Número do Processo:** Badge dinâmico no cabeçalho e card exclusivo em azul escuro (`card-indigo`).
2. **Assunto:** Card em azul claro (`card-blue`) exibindo a descrição legal.
3. **Requerente:** Card em roxo (`card-purple`) com o nome do cidadão ou empresa.
4. **CPF / CNPJ:** Card em amarelo (`card-amber`) formatado.
5. **Setor de Custódia:** Card em verde (`card-emerald`) mostrando exatamente onde se encontra a posse física do processo.
6. **Auditor Responsável:** Card em ciano/azul piscina (`card-teal`) mostrando o auditor responsável atual.
7. **Último Registro:** Card em vermelho suave/rosa (`card-pink`) contendo a última ação (`ENTRADA` ou `SAÍDA`).
8. **Data do Trâmite:** Card complementar em azul (`card-blue`) exibindo a data e hora em que a última posse foi oficializada.

### Banner Inteligente de Custódia nos Detalhes
*   Ao detalhar um processo que não pertence ao usuário ativo, a tela desabilita o botão **"Realizar Tramitação"** e exibe um alerta explicativo informando o setor detentor atual do processo e a sua situação física.

---

## 2. Como Testar e Validar

Como o ambiente local do Docker está ativo e rodando perfeitamente na porta **8080**, você pode testar as melhorias imediatamente:

1.  Acesse **http://localhost:8080** no seu navegador.
2.  Faça login com a credencial desejada (ex: `superadmin` / `admin123@#` para testar com bypass total de segurança, ou com um usuário setorial para testar as restrições).
6.  Abra a tela de **Listar Processos**.
7.  Observe as 3 áreas nitidamente diferenciadas por cores e badges modernos.
8.  Interaja com os inputs de filtro e note que a lista correspondente se atualiza de forma suave e rápida via AJAX/Backend.
9.  Clique em um processo de sua custódia para abrir o detalhamento, visualizar a timeline, apensos e permissões de trâmite de alta qualidade.

---

## 3. Relatórios e Estatísticas: Custódia na Data Presente
*   **Melhoria em Totais por Setor (Entradas e Saídas):** Substituímos o cálculo textual antigo da coluna **"Saldo / Fluxo Total"** por uma métrica de negócio exata e em tempo real: **"Processos Sob Custódia (Hoje)"**.
*   **Implementação Robusta:** 
    *   No backend (`api/reports.php`), injetamos um `LEFT JOIN` com uma subquery agregada de alta performance que identifica as movimentações mais recentes (`MAX(id)`) de cada processo no banco de dados e calcula instantaneamente a quantidade de processos ativamente estacionados sob a custódia física de cada setor (`action = 'ENTRADA'`).
    *   No frontend (`public/js/views/reports.js`), ajustamos o cabeçalho da tabela e a renderização das linhas para exibir essa contagem usando um badge azul (`badge-primary`) de destaque.

---

## 4. Herança de Custódia e Auditor em Apensamentos
*   **Nova Regra de Negócio:** Quando um processo filho é apensado a um processo pai, ele agora **herda automaticamente** a custódia do setor e a atribuição de auditor do processo pai no ato do apensamento.
*   **Implementação Backend (`api/processes.php`):** 
    *   A ação `'attach'` foi ajustada para iniciar uma transação no banco.
    *   Além de registrar o `parent_id` no processo filho, o sistema busca o trâmite/custódia mais recente do processo pai (`destination_sector_id`, `responsible_id`, `action`).
    *   O backend insere de forma automática uma nova movimentação clonada para o processo filho, vinculando-o ao mesmo local e responsável do pai imediatamente.
*   **Suíte de Testes Executada:** Criamos e executamos com sucesso uma suíte de testes unitários e de integração (`test_apensamento.php`) rodando no ambiente local do Docker para verificar as seguintes regras:
    *   [✅ PASS] Criação dos processos de teste Pai e Filho.
    *   [✅ PASS] Movimentação inicial do processo pai para um setor e auditor específicos.
    *   [✅ PASS] Execução da rotina de apensamento.
    *   [✅ PASS] Validação de herança de custódia (o filho recebeu o movimento de ENTRADA para o mesmo setor e auditor do pai de forma imediata).
    *   [✅ PASS] Validação de desapensamento (o vínculo `parent_id` foi desfeito com segurança, mantendo seu histórico).
    *   *Massa de testes limpa do banco de dados de forma automatizada ao final.*

---

## 5. Cenário de Teste de Integração Real Realizado (Solicitado)
Para assegurar a perfeição operacional do sistema, implementamos e executamos a suíte de testes de cenário real (`test_cenario_apensamento.php`) sob os parâmetros exatos requisitados pelo usuário:
*   **Processo Filho (Anexo):** `009/002283/2026`
*   **Processo Pai (Principal):** `009/005469/2026`

### Fluxo Operacional Validado:
1.  **Garantia de Existência:** Criação/Limpeza dos processos reais no banco de dados.
2.  **Posição Inicial:** Movimentação do processo Pai para o setor **AFT (Setor 319)**.
3.  **Apensamento:** Processo Filho apensado ao processo Pai.
    *   [✅ PASS] Filho registrou `parent_id` vinculando ao Pai.
    *   [✅ PASS] Filho herdou instantaneamente a custódia física da **AFT (319)** no exato momento do apensamento.
4.  **Trâmite Conjunto para o IPTU:** Processo Pai tramitado para o setor **IPTU (Setor 228)**.
    *   [✅ PASS] Pai migrou para o IPTU.
    *   [✅ PASS] Filho acompanhou o Pai automaticamente na movimentação para o **IPTU (228)**.
5.  **Retorno para a AFT:** Processo Pai tramitado de volta para o setor **AFT (Setor 319)**.
    *   [✅ PASS] Pai retornou à AFT.
    *   [✅ PASS] Filho acompanhou o Pai automaticamente no retorno para a **AFT (319)**.
6.  **Desapensamento:** Processo Filho desapensado do Pai.
    *   [✅ PASS] Vínculo de subordinação foi removido (`parent_id = NULL`), mantendo intactos seus históricos de trâmite individuais.

A integridade estrutural e de fluxo está perfeitamente testada e homologada!



