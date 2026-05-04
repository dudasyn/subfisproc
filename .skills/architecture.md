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
