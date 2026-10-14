# Portal Tela: autenticação

Telas de **login, cadastro e recuperação de senha** do Portal Tela, implementadas a partir do Figma
(`V4 Design`, nó `3:11`) com React + TypeScript. Tudo é **mockado** (sem backend), mas se comporta como
produto real: todos os estados do Figma, validação, bloqueio por tentativas, animações e ilustração viva.

## Rodar

```bash
npm install
npm run dev          # gera os tokens e sobe o Vite
npm run test         # vitest (unidade + jornada de cada fluxo)
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
| `src/features/auth` | Fluxos (`login`, depois `recovery` e `signup`), `mock/` (backend simulado) e schemas de validação (Zod). |

Estilo: CSS Modules + CSS Variables (sem Tailwind: o `tokens.css` funciona sozinho, conforme o padrão do DS §8).
Nomes de props espelham as variants do Figma (`variant` é o `Style`, pois `style` é reservado do React).

## Cenários de demonstração (mock)

| Ação | Resultado |
|---|---|
| `ana.souza@email.com` + `Senha@123` | Entra |
| Qualquer outra combinação | "E-mail ou senha incorretos"; a **3ª** errada bloqueia por 15 min (persiste ao recarregar) |
| `erro@email.com` (qualquer senha) | Falha de rede (erro do sistema, não do usuário) |
| Botão **Google** | Entra após 1,6 s |
| Botão **Apple** | Falha do provedor após 1,6 s |

## Decisões e pendências para o design

Ver `docs/decisions.md`.
