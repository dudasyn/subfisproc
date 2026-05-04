# Skill: Infraestrutura e Deploy (Deploy)

Esta skill define os procedimentos para deploy, containerização e gerenciamento de ambiente do projeto SUBFIS.

## 1. Ambiente de Desenvolvimento (Docker)
- O ambiente deve ser orquestrado via `docker-compose.yml`.
- **Serviços**:
  - `web`: Nginx (Alpine) servindo a porta 8080.
  - `app`: PHP 8.2-FPM com extensões PDO MySQL instaladas.
  - `db`: MariaDB 10.6 para persistência de dados.
- Utilize volumes para persistir os dados do banco localmente e evitar perda de informação ao reiniciar containers.

## 2. Configuração de Ambiente (.env)
- Utilize arquivos `.env` para gerenciar configurações que mudam entre ambientes.
- O arquivo `.env` **NUNCA** deve ser comitado no Git. Forneça um `.env.example` atualizado.
- Variáveis obrigatórias: `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`.

## 3. Servidor Web (Nginx)
- O Nginx deve redirecionar todas as requisições que não apontam para arquivos físicos para o `index.php` (Front Controller).
- Configure corretamente o `fastcgi_pass` para apontar para o serviço `app` na porta 9000.

## 4. Segurança de Deploy
- Em produção, garanta que a pasta `src/` e `database/` não sejam acessíveis via URL.
- O Document Root do servidor web deve ser sempre a pasta `public/`.
- Verifique permissões de escrita apenas em pastas estritamente necessárias (ex: `data/` para uploads ou logs).

## 5. Comandos Úteis
- Iniciar ambiente: `docker compose up -d`
- Reconstruir imagens: `docker compose up -d --build`
- Logs: `docker compose logs -f`
- Acesso ao DB: `docker exec -it subfisproc-db-1 mysql -u root -p`
