# Portal Tela: autenticação

Telas de **login, cadastro e recuperação de senha** do Portal Tela, implementadas a partir do Figma
(`V4 Design`, nó `3:11`) com React + TypeScript. Tudo é **mockado** (sem backend), mas se comporta como
produto real: todos os estados do Figma, validação, bloqueio por tentativas, animações e ilustração viva.

## Rodar

```bash
npm install
npm run dev          # gera os tokens e sobe o Vite
npm run test         # vitest (unidade + jornada de cada fluxo)
npm run test:e2e     # playwright: jornadas, layout sem rolagem (49 estados x 8 janelas) e acessibilidade (axe, WCAG 2.1 AA)
npm run typecheck && npm run lint
npm run build
```

## Arquitetura

| Pasta | O que é |
|---|---|
| `tokens/figma-tokens.json` | **Fonte da verdade** dos tokens, exportada do arquivo do DS (cor Light/Dark, espaço, raio, borda, motion, tipografia, elevação). |
| `scripts/generate-tokens.mjs` | Gera `src/styles/tokens.css` (CSS Variables). Nome mecânico: `text/base/primary` vira `--text-base-primary`. **Nunca editar `tokens.css` à mão.** |
| `src/components/ui` | Componentes do DS: `Button`, `TextField`, `PasswordField`, `Checkbox`, `TextLink`, `SocialButton`, `InlineMessage`, `NavButton`, `Divider`, `Logo`, `Icon`. Cada um com os estados lidos do Component Set (hover, pressed, focus, disabled, loading). |
| `src/components/auth` | Composições do DS: `AuthLayout`, `AuthHeader`, `AccountPrompt`, `SocialLogin`. |
| `src/features/auth` | Fluxos `login`, `recovery` e `signup`, etapas compartilhadas (`shared/`: código e nova senha), `mock/` (backend simulado) e schemas de validação (Zod). |
| `e2e/` | Testes Playwright em navegador real (clique, foco, tabulação, mídia animada). |

Estilo: CSS Modules + CSS Variables (sem Tailwind: o `tokens.css` funciona sozinho, conforme o padrão do DS §8).
Nomes de props espelham as variants do Figma (`variant` é o `Style`, pois `style` é reservado do React).

## Apresentando (guia de demonstração)

Abra qualquer tela com `?demo` na URL (ex.: `/entrar?demo`). Aparece o botão **Demo** no canto inferior esquerdo.
Sem `?demo` a interface é exatamente a do produto.

- **Navegador de estados:** os **49 estados** (45 do Figma + 4 que o produto real teria) abrem direto, sem precisar
  provocá-los. Cada um tem link: `/entrar?demo&state=login.blocked`, `/cadastro?demo&state=signup.code-expired`,
  `/recuperar-senha?demo&state=recovery.password-mismatch`.
- **Percorrer tudo:** botões **Anterior / Próximo**, atalho **Alt + ← / →** e **Passeio automático** (um estado a cada 3,5 s).
- Os estados abrem fixos (nada avança sozinho) para dar tempo de olhar, mas campos e botões continuam funcionando.
- **Modo rápido:** respostas em ~0,2 s, reenvio em 3 s e bloqueio de 20 s (a demonstração nunca fica presa).
- **Reiniciar demonstração:** zera bloqueios, contas criadas e sessão.

## Cenários de demonstração (mock)

| Ação | Resultado |
|---|---|
| `test@gmail.com` + `test@2026` | Entra (conta principal) |
| Qualquer outra combinação | "E-mail ou senha incorretos"; a **3ª** errada bloqueia por 15 min (persiste ao recarregar) |
| `erro@email.com` (qualquer senha) | Falha de rede (erro do sistema, não do usuário) |
| Botão **Google** | Entra após 1,6 s |
| Botão **Apple** | Falha do provedor após 1,6 s |
| Código de verificação `123456` | Correto (segue o fluxo) |
| Código `111111` (ou qualquer outro) | Incorreto; o 3º erro bloqueia (15 min; 20 s no modo rápido) |
| Código `000000` | Expirado (libera o reenvio) |
| `erro@email.com` no cadastro ou na recuperação | Falha de rede ao enviar o código |

## Decisões e pendências para o design

Ver `docs/decisions.md`.
