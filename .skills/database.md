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

## 4. Melhores Práticas
- Utilize chaves estrangeiras (`FOREIGN KEY`) para garantir integridade referencial.
- Indexe colunas utilizadas frequentemente em cláusulas `WHERE` ou `JOIN` (ex: `cpf`, `process_number`).
- Evite `SELECT *`; especifique apenas as colunas necessárias para performance e clareza.
