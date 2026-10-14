# Decisões e pendências

## Decisões

1. **Sem Tailwind.** O padrão do DS (§8 do `design-token-standard`) diz que `tokens.css` funciona sozinho; CSS Modules consomem as variáveis.
2. **Botão desabilitado continua focável** (`aria-disabled`, não o atributo nativo). O visual é o do Figma (Entrar cinza quando vazio), mas o clique mostra o que falta, conforme a skill de formulários.
3. **Validação ao sair do campo** (`onTouched`), nunca a cada tecla; revalida no envio.
4. **Erro de credencial marca os dois campos sem dizer qual errou** (descrição do `LoginForm` no Figma: não revela se a conta existe).
5. **Uma ilustração por fluxo** (o Figma troca de cena entre estados do Login).
6. **GIF da personagem carrega depois do `load`** da página, com fade, e some com "reduzir movimento".
7. **Foco vai para o `h1`** a cada troca de tela/etapa (regra de SPA do `keyboard-and-focus`).

8. **O cadastro nunca diz que o e-mail já existe** (descrição do `SignUpForm`: anti-enumeração de contas) e nunca altera uma conta existente. Mesmo princípio da recuperação: a resposta é sempre a mesma.
9. **Anel dos campos cortado como no Figma.** O DS documenta o anel de 2,2px "cobrindo a borda", mas o frame do campo tem *clip content*: o que o Figma renderiza é a borda cinza de 1,2px mais ~1px de cor por dentro (medido pixel a pixel). O campo corta o anel igual, para bater com o que o stakeholder vê.
10. **Códigos mockados:** `123456` correto, `000000` expirado, qualquer outro errado (3 erros bloqueiam por 15 min), 3 reenvios no máximo, 30 s entre reenvios. Contas persistem na sessão: a senha redefinida e a conta criada passam a valer no login.
11. **Campo de código = um único `<input>`** (autocomplete `one-time-code`, colar funciona, leitor de tela lê o valor); as casas são só desenho.
12. **`aria-disabled` em vez de `disabled`** nos botões de envio: o Playwright e leitores de tela os tratam como desabilitados, mas o clique mostra o que falta.

13. **Guia de demonstração só com `?demo`** (e preso à sessão): a interface padrão fica idêntica ao Figma.
14. **Acessibilidade medida, não presumida:** o E2E roda o axe-core (WCAG 2.1 A/AA) em ~20 telas e estados (padrão, erros, bloqueios, carregando, resultados). Zero violações.

## Pendências para o design (achados na leitura do Figma)

- `LoginFilledScreen` mostra o botão "Entrar" cinza com os dois campos preenchidos; nos frames Loading e Error o botão está ativo. Implementado: ativo.
- `Link`: o estado Hover é idêntico ao Default (sem sublinhado nem mudança de cor). Implementado fiel ao DS; sugere-se um sinal de hover.
- `LoginBlockedScreen` usa o placeholder `[X] minutos`: implementado com contagem regressiva real (15 min).
- Cenas diferentes entre estados do mesmo fluxo (Login: varanda x escadaria; Recuperação: terraço e escadaria).
- Descrição do `StepIndicator` diz que etapas futuras usam `surface/base/muted`, mas o render usa `surface/brand/default` (implementado como o render).
- Estado Error do `Text Input` mostra o texto de exemplo em cor primária mesmo vazio; implementado com placeholder cinza (comportamento real).
- `VerifyCodeForm` Success cita "botão em Success", mas o estado Success do `Button` não tem ícone exportável nas telas; hoje o botão fica desabilitado durante a barra com check.
- Frame `SignUpDone` (`3385:16078`) é uma anotação ("[jornada final] ... onboarding"), não uma tela; o destino final é a tela inicial provisória.
- O estado Hover do `Link` é idêntico ao Default.

## Otimização feita

- Ilustrações em WebP (22,6 MB para 3,2 MB; primeiro paint de 216 a 251 kB). Originais do Figma em `design-source/`; reprodutível com `node scripts/optimize-images.mjs`.
