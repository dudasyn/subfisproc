# Skill: Arquitetura MVC (Architecture)

Esta skill define a estrutura organizacional e os padrões de design de software do projeto SUBFIS.

## 1. Estrutura MVC
O projeto segue uma arquitetura Model-View-Controller rigorosa:
- **Models (`src/Models/`)**: Gerenciam os dados e a lógica de negócio.
- **Views (`public/`)**: Arquivos HTML/JS estáticos que consomem a API.
- **Controllers (`src/Controllers/`)**: Intermediam as requisições, validam dados e chamam os Models.

## 2. Fluxo de Requisição (Front Controller)
- O ponto de entrada único da aplicação é o arquivo `public/index.php`.
- Nenhuma lógica deve ser processada fora deste fluxo para rotas `/api/*`.
- O roteamento é gerenciado pela classe `App\Core\Router`.

## 3. Organização de Código
- **Namespaces**: Siga o padrão PSR-4 com o prefixo `App\` mapeado para a pasta `src/`.
- **Controllers**: Devem ser enxutos. Lógica pesada deve ir para o Model ou para classes de serviço em `src/Utils/`.
- **Respostas**: Utilize a classe `App\Utils\Response` para garantir que todas as saídas da API sejam JSON padronizado.

## 4. Padronização
- Classes: `PascalCase` (ex: `UserController`).
- Métodos e Variáveis: `camelCase` (ex: `getUserByCpf`).
- Constantes: `UPPER_SNAKE_CASE`.
- IDs de Elementos HTML: `snake_case` (ex: `input_user_name`).

## 5. Manutenção do Legado
- Arquivos na pasta `api/` (raiz) são considerados legados procedurais.
- Toda nova funcionalidade deve ser implementada no padrão MVC dentro de `src/`.
- Funcionalidades legadas devem ser migradas progressivamente para o novo padrão.

## 6. Regras de Negócio Globais e de Custódia
- **Regra de Custódia de Setor**: Um usuário só possui permissão para movimentar (tramitar) processos que estão atualmente sob a custódia/posse de seu próprio setor.
- **Implementação**:
  - **Backend**: Validar a posse checando o `destination_sector_id` da última movimentação registrada do processo antes de permitir um novo cadastro. Lançar `403 Forbidden` com mensagem de advertência clara caso o processo pertença a outrem.
  - **Frontend**: Ocultar ou desabilitar botões de tramitação caso o processo consultado não atenda à condição de posse do setor do usuário.

## 7. Sincronização e Integração com STPD (Scraper)
- A busca automatizada de processos externos junto ao STPD é gerenciada de forma isolada e integrada.
- O frontend acessa o robô scraper através de `Api.scraper.fetch(processNumber)`.
- **Boas Práticas de Integração**: Nunca utilize referências de hosts externas hardcoded ou globais não declaradas (como `API_BASE`). Utilize sempre o prefixo relativo `Api.baseUrl` para manter a integridade da conexão.
- **Metadados extraídos**: Devem ser populados os campos básicos (Número, Assunto, Requerente, CPF/CNPJ via regex no frontend) e mantido o cartão premium da "Última Tramitação" sincronizado do portal para visualização do usuário.

## 8. Estratégia de Testes Seguros (Transactions & Rollbacks)
- Testes que envolvam escrita no banco devem ser feitos dentro de blocos de transação PDO:
  1. Inicie a transação com `$pdo->beginTransaction()`.
  2. Crie e simule cenários (Sucesso e Exceção de Negócio) inserindo dados provisórios.
  3. Execute as asserções de validação em cada caso.
  4. Garanta a execução de um `$pdo->rollBack()` para retornar o banco de dados ao estado limpo original.

## 9. Governança e Mobilidade de Auditores (Regra de Negócio 0..N)
- **Desvinculação de Custódia e Alocação**: A *custódia* de um processo pertence sempre ao **setor** (obtido pelo último trâmite `destination_sector_id`), enquanto o *auditor* é uma referência histórica.
- **Livre Mobilidade**: Auditores podem migrar de setor ou pertencer a zero setores livremente, mesmo que possuam processos ativos sob sua responsabilidade histórica. Nenhuma validação no backend ou frontend deve impedir a alteração de lotações setoriais de auditores ativos.
- **Trâmite Compulsório Dinâmico (Frontend)**:
  - **0 setores**: O select de destino do trâmite é mantido destravado para escolha livre do operador.
  - **1 setor**: O select de destino é automaticamente travado e preenchido de forma compulsória com o setor do auditor selecionado.
  - **N setores**: O select de destino é mantido editável, mas filtrado dinamicamente para exibir apenas a lista restrita de setores pertencentes àquele auditor.

## 10. Gestão de Ramificações e Controle de Versionamento (Git Workflow)
- **Branch de Desenvolvimento Obrigatória**: Toda e qualquer operação de `git pull`, `git push`, criação de commits e testes de novas lógicas de custódia e modelagem de banco de dados deve ocorrer exclusivamente na branch secundária `refactor-mvc-skills`.
- **Isolamento de Segurança**: A ramificação `main` deve permanecer isolada de quaisquer atualizações de estrutura de banco ou código de governança até que a homologação completa na branch secundária seja homologada e aprovada.

