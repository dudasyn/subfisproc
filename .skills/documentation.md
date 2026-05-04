# Skill: Documentação e Comentários (Documentation)

Esta skill define o padrão de documentação de código e comentários para garantir que o projeto SUBFIS seja sustentável e compreensível por qualquer desenvolvedor.

## 1. Habilidade de Análise e Refatoração de Comentários
- O agente deve ser capaz de ler um arquivo de código existente, identificar trechos de lógica complexa sem explicação e **proativamente** sugerir ou aplicar comentários de esclarecimento.
- **Auditoria de Dívida Técnica**: Verifique se variáveis com nomes genéricos (ex: `$res`, `$data`) possuem comentários explicando seu conteúdo real conforme o contexto do banco de dados.

## 2. Comentários de Cabeçalho (Docblocks)
- Toda **Classe** deve ter um comentário explicativo sobre sua responsabilidade.
- Todo **Método** deve ter um Docblock (PHPDoc) contendo:
  - Descrição clara do que o método faz.
  - Explicação dos parâmetros (`@param`).
  - Explicação do retorno (`@return`).
  - Exceções que podem ser lançadas (`@throws`).

## 2. Documentação de Lógica Complexa
- **O Porquê, não o Quê**: Evite comentários óbvios como `// Incrementa i`. Em vez disso, explique a regra de negócio ou o motivo de uma decisão técnica.
- **Queries SQL**: Queries complexas dentro dos Models devem conter comentários explicando o propósito dos joins e filtros aplicados.
- **Regex e Algoritmos**: Qualquer lógica não trivial (como manipuladores de CPF ou cálculos de datas) deve ser detalhada passo a passo.

## 3. Idioma e Tom
- Utilize **Português** para todos os comentários e documentações internas (conforme padrão do projeto).
- Mantenha um tom profissional e técnico.

## 4. Atualização de Documentação Externa
- Ao realizar mudanças estruturais (novas pastas, alteração de fluxo de deploy), o arquivo `SETUP_DEV.md` deve ser atualizado imediatamente.
- Mantenha o `walkthrough.md` atualizado para que o progresso do projeto seja rastreável.

## 5. Exemplo de Padrão Aceitável
```php
/**
 * Realiza o login do usuário validando as credenciais.
 * 
 * @param string $email E-mail fornecido no login.
 * @param string $password Senha em texto puro.
 * @return array Dados do usuário logado.
 * @throws Exception Caso as credenciais sejam inválidas.
 */
public function login($email, $password) {
    // Busca usuário pelo e-mail para validar existência
    $user = $this->userModel->findByEmail($email);
    
    // ... lógica de validação ...
}
```
