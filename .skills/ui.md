# Skill: Design de Interface e Estilo (UI/Style)

Esta skill define as diretrizes visuais, tokens de cor e padrões de experiência do usuário (UX) do projeto SUBFIS, alinhados à identidade oficial da Prefeitura de Duque de Caxias (PMDC).

## 1. Design System e Tokens de Cor

O sistema utiliza variáveis CSS centralizadas para manter a coerência visual e permitir alto contraste e legibilidade.

```css
:root {
    /* Color Palette - Portal do Contribuinte PMDC official branding scheme */
    --bg-base: #e0f2fe;          /* Azul Claro Mais Vivo para Contraste */
    --bg-surface: #ffffff;       /* Fundo das superfícies/cards (Branco Puro) */
    --text-primary: #1e293b;     /* Texto Principal Escuro */
    --text-secondary: #64748b;   /* Texto Secundário Cinza */
    
    --primary: #0072bc;          /* Azul PMDC Oficial */
    --primary-hover: #005fa3;    /* Azul PMDC Escurecido */
    --primary-light: #e6f1f8;    /* Azul Claro de Destaque */
    
    --accent: #004aad;           /* Azul Escuro PMDC */
    
    --success: #28a745;          /* Verde de Crescimento/Sucesso */
    --warning: #ffc107;          /* Amarelo de Alerta */
    --danger: #dc3545;           /* Vermelho de Inconsistência/Erro */
    
    --border-color: #e2e8f0;     /* Cor padrão de bordas */
}
```

## 2. Regra de Ouro do Contraste (White-on-Blue)

Para garantir que a interface seja moderna, limpa e de fácil leitura para os auditores e gestores:
- **Fundo da Aplicação (`--bg-base`)**: Deve ser sempre o tom de azul claro vivo (`#e0f2fe`). Ele serve como base para toda a área de conteúdo (`.main-content` e `.content-scroll`).
- **Módulos e Cards (`--bg-surface`)**: Devem ter fundo branco puro (`#ffffff`) e bordas leves (`1px solid var(--border-color)`), criando uma divisão clara e tridimensional em relação ao fundo azul claro.
- **Evite Placeholders Cinzas**: Use sempre o contraste definido entre o fundo azul claro vivo e as caixas brancas puras.

## 3. Padrão de Componentes Visuais

Todos os novos elementos de interface devem herdar as classes do arquivo [components.css](file:///home/ebastos/subfisproc/public/css/components.css):
- **Cards Analíticos (`.stat-card` ou `.premium-stat-card`)**: Usar sombras leves (`var(--shadow-sm)`) e micro-interações de hover (`transform: translateY(-4px)`).
- **Tabelas de Dados (`.data-table`)**: Cabeçalho com fundo claro e texto em caixa alta; linhas com efeito de hover suave (`#f1f5f9` ou `rgba(241, 245, 249, 0.6)`).
- **Badges de Status (`.badge`)**: Utilizar cores suaves de fundo com texto de alta saturação (ex: `.badge-success` com fundo esmeralda claro e texto verde escuro).

## 4. Tipografia e Micro-animações

- **Fonte**: A fonte oficial do sistema é a **Outfit** (do Google Fonts), que deve ser carregada no cabeçalho e aplicada globalmente.
- **Transições**: Toda mudança de estado (hover em botões, abertura de drawers, ativação de abas) deve utilizar a transição suave: `all 0.3s cubic-bezier(0.4, 0, 0.2, 1)`.
- **Animações de Entrada**: Seções carregadas dinamicamente devem usar a animação `.view-section` com keyframe `fadeUp` para suavizar a renderização.

## 5. Roteamento por Hash e Fluxo de Tramitação (Sem Popups)

Para manter uma UX limpa, fluida e robusta, evite popups ou modais flutuantes para formulários de preenchimento complexo (como a realização de trâmites):
- **Telas Dedicadas**: Redirecione o usuário usando rotas dinâmicas em hash (ex: `#movements/[NÚMERO_DO_PROCESSO]`).
- **Retorno Automático**: Após registrar a movimentação com sucesso, o sistema deve redirecionar o usuário de volta para a tela de consulta (`#search/[NÚMERO_DO_PROCESSO]`) para recarregar a timeline atualizada do processo.
- **Navegação Exclusiva**: O acesso ao formulário de trâmite deve ser feito exclusivamente a partir da verificação de custódia do processo no setor do usuário logado. Não exponha o atalho de movimentações na barra lateral (sidebar).

## 6. Formatador de Ações Dinâmicas e Badges Contextuais

Nunca exiba os valores puros de ações do banco (como "ENTRADA" ou "SAIDA") de forma estática. Utilize sempre o método auxiliar global `window.app.formatAction(action, destination_sector)` para exibir termos técnicos claros:
- **ENTRADA**: Exibir **"Tramitação: Entrada no Setor"**.
- **SAIDA (para Setores Externos ou contendo o termo "Arquivo")**: Exibir **"Tramitação: Saída Órgão Externo"**.
- **SAIDA (para Setores Internos gerais)**: Exibir **"Tramitação: Saída do Setor"**.
- **Coerência de Badges**: Aplique classes de cores (`badge-success`, `badge-warning`, `badge-success-glow`, etc.) correspondentes à natureza da operação de forma integrada com o design system do projeto.
