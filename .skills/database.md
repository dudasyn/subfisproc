# Skill: Gestão de Banco de Dados (Database)

Esta skill define as diretrizes para interação com o banco de dados MariaDB/MySQL no projeto SUBFIS.

## 1. Conexão e Configuração
- A conexão deve ser feita exclusivamente através da classe `App\Config\Database`, utilizando o padrão **Singleton**.
- Utilize variáveis de ambiente para credenciais (`DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`).
- O charset deve ser sempre `utf8mb4`.

## 2. Padrão de Acesso a Dados (Models)
- Toda lógica de persistência e consulta deve residir em classes dentro de `src/Models/`.
- **PROIBIDO**: Escrever consultas SQL diretamente nos Controllers.
- Utilize **Prepared Statements** com PDO para prevenir SQL Injection.
- Retorne arrays associativos ou objetos de modelo, nunca resultados brutos do PDO diretamente para a View.

## 3. Evolução de Schema (Migrations)
- Novos scripts de criação de tabelas ou alteração de dados devem ser colocados em `database/migrations/`.
- Mantenha um histórico claro de versões de banco de dados para facilitar o setup de novos ambientes.
- Scripts grandes de dump de produção devem ser mantidos isolados nesta pasta e nunca comitados se contiverem dados sensíveis (anonimizar se necessário).

## 4. Melhores Práticas e Novas Relações
- Utilize chaves estrangeiras (`FOREIGN KEY`) para garantir integridade referencial.
- Indexe colunas utilizadas frequentemente em cláusulas `WHERE` ou `JOIN` (ex: `cpf`, `process_number`).
- Evite `SELECT *`; especifique apenas as colunas necessárias para performance e clareza.

## 5. Estrutura de Governança de Auditores e Setores (Relação N:N)
- **Relação N:N (Muitos para Muitos)**: A relação entre as tabelas `responsibles` (auditores) e `sectors` (setores) é agora de muitos-para-muitos, operacionalizada através da tabela pivot `responsible_sectors` (contendo `responsible_id` e `sector_id`).
- **Única Fonte de Verdade (Single Source of Truth)**: O relacionamento de setores e auditores deve ser obtido e modificado **exclusivamente** por meio da tabela `responsible_sectors`.
- **Coluna Legada (`responsibles.sector_id`)**: A coluna `sector_id` na tabela de auditores (`responsibles`) é mantida única e exclusivamente para suporte a compatibilidade de integridade referencial legada e restrições estruturais de criação (`NOT NULL`), mas **não deve** ser usada para leitura do setor de atuação ativo de um auditor, contagem de produtividade ou regras de tramitação.
- **Consultas de Produtividade/Dashboard**: Devem sempre usar a tabela pivô `responsible_sectors` com a junção de tabelas (`JOIN`) e agregador `COUNT(DISTINCT responsible_id)` para contabilizar precisamente os auditores vinculados a cada grupo e área, evitando anomalias de contagem quando um auditor atua em múltiplos setores.
