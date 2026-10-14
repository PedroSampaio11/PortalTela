# Decisões e pendências

## Decisões

1. **Sem Tailwind.** O padrão do DS (§8 do `design-token-standard`) diz que `tokens.css` funciona sozinho; CSS Modules consomem as variáveis.
2. **Botão desabilitado continua focável** (`aria-disabled`, não o atributo nativo). O visual é o do Figma (Entrar cinza quando vazio), mas o clique mostra o que falta, conforme a skill de formulários.
3. **Validação ao sair do campo** (`onTouched`), nunca a cada tecla; revalida no envio.
4. **Erro de credencial marca os dois campos sem dizer qual errou** (descrição do `LoginForm` no Figma: não revela se a conta existe).
5. **Uma ilustração por fluxo** (o Figma troca de cena entre estados do Login).
6. **Ilustração sem "pisca" e em alta qualidade.** No Figma a personagem existe só no GIF (256 cores, recortado em polígono) e a cena de fundo vem sem ela; carregar o GIF depois do `load` fazia a personagem sumir e reaparecer a cada tela. Agora são 3 camadas geradas por `npm run images`: **cena** (WebP 98), **personagem** em PNG 24 bits (WebP sem perdas, aparece junto com a cena) e um **recorte animado só do cabelo, das mãos e do celular** (o que de fato se mexe), reconstruído em cores plenas e sem emenda (diferença 0 nas bordas). Tudo fica montado no `AuthShell`, uma rota de layout: a ilustração não recarrega entre Login, Cadastro e Recuperação; a troca de cena é um fade sem "buraco". Com "reduzir movimento" só ficam cena e personagem. Peso por cena: ~1,8 MB (antes 2 a 4 MB, com pior qualidade).
7. **Foco vai para o `h1`** a cada troca de tela/etapa (regra de SPA do `keyboard-and-focus`).

8. **O cadastro nunca diz que o e-mail já existe** (descrição do `SignUpForm`: anti-enumeração de contas) e nunca altera uma conta existente. Mesmo princípio da recuperação: a resposta é sempre a mesma.
9. **Anel dos campos cortado como no Figma.** O DS documenta o anel de 2,2px "cobrindo a borda", mas o frame do campo tem *clip content*: o que o Figma renderiza é a borda cinza de 1,2px mais ~1px de cor por dentro (medido pixel a pixel). O campo corta o anel igual, para bater com o que o stakeholder vê.
10. **Códigos mockados:** `123456` correto, `000000` expirado, qualquer outro errado (3 erros bloqueiam por 15 min), 3 reenvios no máximo, 30 s entre reenvios. Contas persistem na sessão: a senha redefinida e a conta criada passam a valer no login.
11. **Campo de código = um único `<input>`** (autocomplete `one-time-code`, colar funciona, leitor de tela lê o valor); as casas são só desenho.
12. **`aria-disabled` em vez de `disabled`** nos botões de envio: o Playwright e leitores de tela os tratam como desabilitados, mas o clique mostra o que falta.

13. **Guia de demonstração só com `?demo`** (e preso à sessão): a interface padrão fica idêntica ao Figma.
14. **Acessibilidade medida, não presumida:** o E2E roda o axe-core (WCAG 2.1 A/AA) em ~20 telas e estados (padrão, erros, bloqueios, carregando, resultados). Zero violações.

15. **Sem rolagem vertical, em nenhuma janela.** A tela de autenticação é um "palco" de 1024 de altura (a do frame do Figma e a do estado mais alto, o cadastro com erros) que reduz inteiro, na mesma proporção, quando a janela é menor (`useFitScale`, fator `--fit`). A partir de 1024 de altura o fator é 1 (idêntico ao Figma; em janelas mais altas o conteúdo fica centralizado). Antes, o corpo do cartão transbordava por cima do logo (`flex: 1 1 0` + `min-height: 0`) e, depois da primeira correção, a página rolava; as duas coisas acabaram. Um teste abre os 49 estados em 8 tamanhos de janela (de 900x600 a 1920x1080) e exige zero rolagem, tudo dentro da janela e nada sobreposto. **Contrapartida:** em janelas baixas o texto fica proporcionalmente menor (0,70 a 720 px de altura) em vez de rolar.
16. **Mensagens e helper texts entram e saem com animação de altura** (`Reveal`): o item recolhido ocupa zero de verdade (margem negativa igual ao gap do pai), sem "pulo" de layout. Cada etapa entra com fade e leve subida.
16b. **Barra compacta do guia:** ao iniciar o passeio o painel recolhe e sobra uma barra translúcida no canto superior esquerdo (anterior, pausar, próximo, ocultar). `Alt + D` oculta ou mostra tudo, para apresentar só com a tela.
17. **Navegador de estados (`?demo&state=...`)** para percorrer tudo numa apresentação sem provocar bloqueios nem decorar códigos. Estados abrem congelados; `Alt + ← / →` e passeio automático.
18. **Conta principal da demonstração:** `test@gmail.com` / `test@2026`. Códigos: `123456` correto, `111111` (qualquer outro) incorreto, `000000` expirado.

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
