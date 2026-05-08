# Documentação de Negócio: Regras de Contabilização de Trâmites

Esta documentação descreve a inteligência computacional e as regras de negócio aplicadas na contabilização e classificação automática de movimentações de processos no sistema **SUBFISPROC**.

---

## 1. Contexto e Motivação

O sistema necessita diferenciar de forma autônoma se um trâmite de processo é uma **movimentação de rotina interna** (onde o processo permanece dentro do escopo de influência direta ou familiar do setor detentor) ou se trata de uma **saída externa do ecossistema do setor** (transferência para outros órgãos ou secretarias totalmente independentes).

Essa classificação dita diretamente:
1. Se o processo continua aparecendo na contagem ativa do setor original como pendente ou sob fiscalização.
2. Como as métricas de produtividade do painel de controle contabilizam o fluxo de entrada e saída.

---

## 2. A Matriz de Relações Hierárquicas

O cálculo é feito com base nas conexões declaradas na tabela `sectors` através da coluna `parent_id` (auto-relacionamento). O sistema avalia a relação de vizinhança entre o **Setor de Origem** ($S_{\text{origem}}$) e o **Setor de Destino** ($S_{\text{destino}}$).

Existem quatro relações lógicas possíveis para classificar a movimentação:

```mermaid
graph TD
    classDef internal fill:#e0f2fe,stroke:#0284c7,stroke-width:2px;
    classDef external fill:#fef2f2,stroke:#ef4444,stroke-width:2px;
    classDef current fill:#f0fdf4,stroke:#16a34a,stroke-width:2px;

    S_Origem["Setor Origem (S_origem)"] :::current
    
    S_Pai["Setor Pai (S_pai)"] :::internal
    S_Irmao["Setor Irmão (S_irmão)"] :::internal
    S_Filho["Setor Filho (S_filho)"] :::internal
    S_Externo["Setor Externo / Desconhecido"] :::external

    S_Origem -->|parent_id| S_Pai
    S_Origem -->|Mesmo parent_id| S_Irmao
    S_Filho -->|parent_id = S_origem| S_Origem
    S_Origem -.->|Nenhuma relação familiar| S_Externo
```

### 1. Relação de Setor Filho (Subsetor)
Ocorre quando o setor de destino foi criado diretamente "abaixo" do setor de origem.
*   **Fórmula:** $\text{parent\_id}(S_{\text{destino}}) = \text{id}(S_{\text{origem}})$
*   **Classificação:** **Tramitação Interna** (`'ENTRADA'`).

### 2. Relação de Setor Irmão (Coparticipante)
Ocorre quando ambos os setores pertencem ao mesmo setor pai direto na hierarquia.
*   **Fórmula:** $\text{parent\_id}(S_{\text{origem}}) = \text{parent\_id}(S_{\text{destino}})$ e $\text{parent\_id} \neq \text{null}$
*   **Classificação:** **Tramitação Interna** (`'ENTRADA'`).

### 3. Relação de Setor Pai (Supervisão)
Ocorre quando o processo é devolvido para a gerência ou coordenação imediatamente superior.
*   **Fórmula:** $\text{id}(S_{\text{destino}}) = \text{parent\_id}(S_{\text{origem}})$
*   **Classificação:** **Tramitação Interna** (`'ENTRADA'`).

### 4. Relação Externa (Saída Física)
Ocorre quando o setor de destino não possui nenhuma das três relações de parentesco acima com o setor de origem.
*   **Fórmula:** $\text{Nenhuma das condições de parentesco é satisfeita}$
*   **Classificação:** **Saída de Escopo** (`'SAIDA'`).

---

## 3. Fluxo de Classification de Dados (Tabela de Estados)

A tabela abaixo resume o impacto das movimentações nos estados do processo:

| Relação Setorial | Ação Registrada no Banco | Estado do Processo | Contabilização de Produtividade |
| :--- | :---: | :---: | :--- |
| **Pai $\rightarrow$ Filho** | `ENTRADA` | Ativo (Custódia) | Registra como trâmite de cooperação setorial interna. |
| **Filho $\rightarrow$ Pai** | `ENTRADA` | Ativo (Custódia) | Registra como devolução/conclusão interna. |
| **Irmão $\rightarrow$ Irmão** | `ENTRADA` | Ativo (Custódia) | Registra como transferência horizontal de apoio. |
| **Setores Sem Parentesco** | `SAIDA` | Inativo (Histórico) | Registra como saída de escopo físico do departamento. |

---

## 4. Implementação de Código (Garantia de Integridade)

Para evitar manipulação ou preenchimento incorreto de dados pelo usuário no frontend, toda a lógica de determinação foi centralizada diretamente no backend PHP em [api/movements.php](file:///home/ebastos/subfisproc/api/movements.php#L356-L378) durante a gravação do registro:

```php
// CALCULAR REGRA DE RELACIONAMENTO HIERÁRQUICO AUTOMATICAMENTE
$current_sector_id = $last_mov['destination_sector_id'];

// Pai do setor atual (Origem)
$stmt_cur = $pdo->prepare('SELECT parent_id FROM sectors WHERE id = ?');
$stmt_cur->execute([$current_sector_id]);
$cur_parent_id = $stmt_cur->fetchColumn();

// Pai do setor de destino
$stmt_dest = $pdo->prepare('SELECT parent_id FROM sectors WHERE id = ?');
$stmt_dest->execute([$destination_sector_id]);
$dest_parent_id = $stmt_dest->fetchColumn();

// Avaliação lógica das relações familiares
$is_child = ($dest_parent_id == $current_sector_id);
$is_sibling = ($cur_parent_id !== null && $dest_parent_id == $cur_parent_id);
$is_parent = ($destination_sector_id == $cur_parent_id);

if ($is_child || $is_sibling || $is_parent) {
    $action = 'ENTRADA'; // Tramitação interna na família de setores
} else {
    $action = 'SAIDA';   // Setor fora da estrutura direta da família
}
```

> [!IMPORTANT]
> **Consistência do Status:** Ao manter trâmites internos classificados como `'ENTRADA'`, garantimos que o processo continue visível na **Área 1 (Processos em Análise)** dos setores autorizados daquela família, assegurando que o processo não "desapareça" do fluxo fiscalizador enquanto estiver sob a guarda de subsetores ou parceiros de coordenação.

---

## 5. Regras de Visibilidade e Trâmite por Nível de Lotação

Além da classificação automática da movimentação, o sistema implementa restrições baseadas na hierarquia setorial da lotação do usuário ativo:

### A. Lotação do Superadmin (Setores AFT e SUBFIS)
*   **Regra:** O usuário de sistema `Superadmin` pertence concorrentemente aos dois principais departamentos estratégicos: **Núcleo Administrativo Auditoria Fiscal (AFT)** e **Gabinete da Subsecretaria de Fiscalização (SUBFIS)**.
*   **Comportamento:** O sistema injeta automaticamente esses dois setores nas listas autorizadas dele, listando todos os processos sob análise desses setores na **Área 1** do seu painel e permitindo o trâmite imediato deles.

### B. Lotação em Setor Pai (Hierarquia Descendente)
*   **Regra:** Usuários lotados em um setor classificado como **Pai** na hierarquia (ex: Subsecretaria de Receita) herdam por herança descendente a visibilidade e o direito de gerência de todos os seus **Setores Filhos** (subsetores).
*   **Comportamento:**
    1.  **Visualização:** Conseguem listar na **Área 1** (Processos em Análise) todos os processos que estejam ativamente com seu próprio setor ou com qualquer um de seus setores filhos.
    2.  **Trâmite:** Podem iniciar e realizar o encaminhamento de processos que estejam sob custódia física de qualquer um dos setores filhos, agindo como guardiões da coordenação.

### C. Lotação em Setor Filho (Restrição estrita)
*   **Regra:** Um usuário lotado em um setor classificado como **Filho** (subsetor) tem poderes restritos à sua respectiva unidade.
*   **Comportamento:** Só pode listar e tramitar processos se o processo estiver fisicamente em posse ativa de sua unidade (**seu próprio setor**). Ele é terminantemente bloqueado de tramitar processos em posse de seu setor pai ou de setores irmãos.

### Resumo de Matriz de Permissões

| Perfil de Lotação | Pode Ver/Listar Filhos? | Pode Tramitar Filhos? | Pode Tramitar Pai/Irmãos se na posse deles? |
| :--- | :---: | :---: | :---: |
| **Superadmin (AFT / SUBFIS)** | Sim | Sim | Sim (dentro de AFT/SUBFIS) |
| **Usuário em Setor Pai** | Sim | Sim | Não (apenas se for o próprio setor ou filhos) |
| **Usuário em Setor Filho** | Não | Não | Não (apenas se estiver com ele mesmo) |
