# Decisões e pendências

## Decisões

1. **Sem Tailwind.** O padrão do DS (§8 do `design-token-standard`) diz que `tokens.css` funciona sozinho; CSS Modules consomem as variáveis.
2. **Botão desabilitado continua focável** (`aria-disabled`, não o atributo nativo). O visual é o do Figma (Entrar cinza quando vazio), mas o clique mostra o que falta, conforme a skill de formulários.
3. **Validação ao sair do campo** (`onTouched`), nunca a cada tecla; revalida no envio.
4. **Erro de credencial marca os dois campos sem dizer qual errou** (descrição do `LoginForm` no Figma: não revela se a conta existe).
5. **Uma ilustração por fluxo** (o Figma troca de cena entre estados do Login).
6. **GIF da personagem carrega depois do `load`** da página, com fade, e some com "reduzir movimento".
7. **Foco vai para o `h1`** a cada troca de tela/etapa (regra de SPA do `keyboard-and-focus`).

## Pendências para o design (achados na leitura do Figma)

- `LoginFilledScreen` mostra o botão "Entrar" cinza com os dois campos preenchidos; nos frames Loading e Error o botão está ativo. Implementado: ativo.
- `Link`: o estado Hover é idêntico ao Default (sem sublinhado nem mudança de cor). Implementado fiel ao DS; sugere-se um sinal de hover.
- `LoginBlockedScreen` usa o placeholder `[X] minutos`: implementado com contagem regressiva real (15 min).
- Cenas diferentes entre estados do mesmo fluxo (Login: varanda x escadaria).

## Otimização pendente

- As ilustrações pesam ~12,5 MB nos dois fluxos (PNG + GIF). Converter para WebP/AVIF animado sem perder fidelidade.
