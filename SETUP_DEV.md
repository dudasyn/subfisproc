# Configuração e Deploy: Sistema SUBFIS

Este guia descreve as etapas para configurar o ambiente de desenvolvimento local e para subir a aplicação de gestão da SUBFIS em produção na Hostinger.

## 1. Ambiente Local de Desenvolvimento

### Requisitos
- PHP 8+
- MySQL Server

### Passo 1: Banco de Dados
1. No seu cliente MySQL local (DBeaver, phpMyAdmin, ou linha de comando), execute o script `database.sql` localizado na raiz deste projeto.
2. Ele fará a criação do banco de dados chamado `subfisproc` e de suas respectivas tabelas.

### Passo 2: Configuração do Backend
1. Editaremos o arquivo `api/config.php` (será criado em breve) com as credenciais do seu banco local. Por padrão, deixaremos root / senha vazia que é comum em muitos ambientes, mas você poderá alterar.

### Passo 3: Rodar o Servidor
Abra o seu terminal na pasta do projeto e inicie o servidor embutido do PHP:
```powershell
php -S localhost:8000
```
Depois disso, é só abrir o navegador em `http://localhost:8000`.

---

## 2. Deploy na Hostinger

Quando o sistema estiver pronto para produção, o deploy na Hostinger é bem simples:

### Passo 1: Configurar Banco de Dados
1. No **hPanel** da Hostinger, vá até a seção de bancos de dados e crie um novo **Banco de Dados MySQL**.
2. Anote o Nome do Banco, o Usuário e a Senha que você configurar lá.
3. Abra o **phpMyAdmin** na Hostinger e importe o arquivo `database.sql` para criar as tabelas da SUBFIS.

### Passo 2: Configurar Credenciais
No arquivo `api/config.php` do projeto, você deve alterar as informações de conexão para as do banco que você recém criou na Hostinger:
```php
$db_host = 'localhost'; // Na Hostinger normalmente o host é localhost
$db_user = 'u123456789_usuario_db';
$db_pass = 'SuaSenhaForte@123';
$db_name = 'u123456789_nome_db';
```
*(Importante: lembre-se de nunca comitar no Github ou versionar sua senha de produção de verdade!)*

### Passo 3: Envio dos Arquivos
1. Acesse o **Gerenciador de Arquivos** no hPanel.
2. Navegue até a pasta correspondente ao domínio ou subdomínio (normalmente `public_html`).
3. Faça o upload de todos os arquivos do projeto (as pastas `api`, `css`, `js`, e o arquivo `index.html`) para dentro dessa pasta.
4. Pronto! Seu sistema já estará no ar.
