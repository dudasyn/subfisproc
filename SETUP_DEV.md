# Guia do Desenvolvedor: Sistema SUBFIS

Este documento centraliza as instruções essenciais para desenvolvedores que atuam no projeto SUBFIS, cobrindo o novo padrão arquitetural (MVC) e o fluxo de execução local com Docker.

## 1. Arquitetura do Sistema

A aplicação foi inteiramente refatorada e não utiliza mais as abordagens procedurais antigas, tendo adotado o padrão **MVC (Model-View-Controller)** puro e nativo (PHP).

### Estrutura de Diretórios
```text
/subfisproc
├── .skills/                # Agent Skills (Instruções para IAs)
├── src/                    # Lógica de Backend (Acesso Restrito)
│   ├── Config/             # Configurações globais e Conexão Singleton
│   ├── Core/               # Estruturas base (Router)
│   ├── Utils/              # Helpers e Respostas JSON
│   ├── Models/             # Lógica de Banco e Entidades
│   └── Controllers/        # Controle de Requisições HTTP
├── public/                 # Document Root (Pasta Pública)
│   ├── index.php           # Front Controller e Autoloader PSR-4
│   └── ...                 # Frontend (HTML, CSS, JS)
├── database/               # Scripts SQL e Migrations
├── docker/                 # Configurações de containers
└── docker-compose.yml      # Orquestração do ambiente
```

### Regras do Padrão MVC Adotado
- **Nenhum arquivo dentro de `src/` deve ser exposto publicamente.**
- O roteamento é feito via **Front Controller** (`public/index.php`) usando a classe `Router`.
- **Autoloader PSR-4**: Não utilize `require` manuais para classes em `src/`. O sistema utiliza um autoloader que mapeia o namespace `App\` para a pasta `src/`.
- **Data Access**: Utilize os Models e Prepared Statements conforme definido na Skill de Database.

---

## 2. Agent Skills (Estratégia Anthropic)

Este projeto utiliza "Skills" para guiar assistentes de IA (como o Cursor ou o Claude) a manterem a integridade da arquitetura. Antes de qualquer grande alteração, as seguintes skills na pasta `.skills/` devem ser consultadas:

- `database.md`: Padrões de banco de dados e persistência.
- `architecture.md`: Padrões MVC, namespaces e organização.
- `deploy.md`: Docker, Nginx e ambiente de execução.
- `documentation.md`: Padrões de comentários e documentação técnica.

---

## 2. Deploy e Execução Local (Docker)

O ambiente foi dockerizado para garantir paridade em qualquer máquina de desenvolvimento.

### Pré-requisitos
- Docker Engine
- Docker Compose

### Subindo o Ambiente

Na raiz do repositório, basta executar o comando:

```bash
docker compose up -d --build
```
*(Nota: dependendo da sua versão do Docker, o comando pode ser `docker-compose`)*.

Isso provisionará três contêineres:
1. **db**: Banco de Dados MariaDB contendo o sistema na porta 3306.
2. **app**: Motor PHP 8.2-fpm configurado.
3. **web**: Servidor Nginx que responde na porta **8080** (mapeado para evitar conflitos na máquina hospedeira).

A aplicação web estará disponível em:
**http://localhost:8080**

### Banco de Dados Local
Os arquivos de script (como `database.sql` ou o gigantesco dump de produção `.sql`) podem ser importados para dentro do container do MariaDB caso deseje resetar o estado inicial:
```bash
# Entrando no container DB
docker exec -it subfisproc-db-1 bash
# Importando dados (o arquivo deve estar na pasta database/migrations)
mysql -u root -p root subfisproc < database/migrations/u489835785_subfisprocdb.sql
```

---

## 3. Credenciais de Acesso Úteis

Após restaurar o banco de dados principal de produção localmente, os perfis com acesso `Admin` mapeados no sistema são:

* **Administrador Padrão do Sistema**:
  - **Login:** `admin@subfis.gov` ou `000.000.000-00`
  - **Senha:** `admin123`
  - **Função:** Admin / Cargo Chefe

* **Felipe Alves Bento**:
  - **Login:** `felipealvesbento@gmail.com` ou `11333777779`
  - **Função:** Admin

> [!TIP]
> Caso necessite redefinir senhas, a aplicação contém uma mecânica de fallback para usuários sem senha, onde os **últimos 6 dígitos numéricos do CPF** atuarão como a senha provisória de login.
