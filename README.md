# Portal Tela: telas de autenticação

**Login, criar conta e recuperar senha** do Portal Tela, feitas a partir do Figma (`V4 Design`) com
React + TypeScript. Não há servidor nem banco: tudo é simulado, mas se comporta como produto de verdade
(validações, bloqueio por tentativas, códigos por e-mail, animações e ilustração viva).

## Como rodar (3 passos)

Precisa do **Node 22.12 ou mais novo** (`node -v`).

```bash
npm install     # só na primeira vez
npm start       # sobe o projeto e abre o navegador já na demonstração
```

Se o navegador não abrir sozinho, acesse **http://localhost:5180/entrar?demo**.

> O `?demo` no final do endereço liga o **guia de demonstração**. Sem ele a tela é exatamente a do produto.

Para parar: `Ctrl + C` no terminal.

## Como apresentar

1. Abra **http://localhost:5180/entrar?demo**.
2. Clique no botão **Demo** (canto superior esquerdo).
3. Escolha um estado na lista e ele abre na hora, ou use **Próximo** / **Anterior**.
4. Para ver tudo em sequência, clique em **Passeio automático** (um estado a cada 3,5 s). O painel **recolhe sozinho** e sobra
   só uma barra compacta no canto superior esquerdo (anterior, pausar, próximo).

| Quero | Faça |
|---|---|
| Ver **qualquer** estado direto (erro, bloqueio, carregando...) | Botão **Demo**, escolha o estado |
| Trocar o **fundo** (Pessoa 1 a 4 do Figma) | Botão **Demo** > **Fundo da tela**: cada opção mostra a prévia. **Padrão**: cada tela usa o seu. **Automático**: passa pelas 4 pessoas sozinho a cada 5, 10 ou 20 s. Vale para as 3 telas |
| Tirar o guia da frente | Arraste pela alça **⠿** ou pelo título do painel (ou foque a alça e use as setas; **Shift** anda mais; **Home** ou duplo clique voltam ao canto) |
| Passar de um para o próximo | **Alt + →** (voltar: **Alt + ←**) |
| Ver todos sozinhos | **Passeio automático** (o painel recolhe e fica só a barra) |
| Apresentar só com a tela, sem o guia por cima | **Ocultar** (ou o × da barra); **Alt + D** mostra de novo |
| Usar o fluxo de verdade (digitando) | Use as credenciais da tabela abaixo |
| Não esperar nada (reenvio e bloqueio rápidos) | Marque **Modo rápido** no guia |
| Voltar tudo ao começo | **Reiniciar demonstração** no guia |
| Esconder o guia (tela limpa, como o produto) | Abra o endereço **sem** `?demo` |

Os estados abrem **fixos** (nada avança sozinho) para dar tempo de mostrar, mas campos e botões continuam funcionando.

### Usando o fluxo de verdade

| Ação | Resultado |
|---|---|
| E-mail `test@gmail.com` + senha `test@2026` | **Entra** (conta principal). Marque **Manter-me conectado**: é obrigatório para entrar |
| Qualquer outro e-mail ou senha | Erro. A **3ª** tentativa errada **bloqueia** (15 min; 20 s no Modo rápido) |
| Código `123456` | **Certo**: segue para a próxima etapa |
| Código `111111` (ou qualquer outro) | **Errado**: 3 erros bloqueiam |
| Código `000000` | **Expirado**: libera o reenvio |
| Botão **Google** | Entra |
| Botão **Apple** | Falha (para mostrar o erro do login social) |
| E-mail `erro@email.com` | Falha de rede (qualquer senha; também no cadastro e na recuperação) |

Criar conta e recuperar senha funcionam de verdade na simulação: a conta criada e a senha nova passam a valer no login.

### Endereços diretos

| Tela | Endereço |
|---|---|
| Entrar | `/entrar` |
| Criar conta | `/cadastro` |
| Recuperar senha | `/recuperar-senha` |

Qualquer estado também tem link direto, por exemplo `/entrar?demo&state=login.blocked` ou
`/cadastro?demo&state=signup.code-expired`. A lista completa está no botão **Demo**.

## Se algo não funcionar

| Sintoma | Solução |
|---|---|
| Ficou preso num bloqueio | Botão **Demo** > **Reiniciar demonstração** (ou **Modo rápido**) |
| `Port 5180 is in use` | Algo já usa a 5180. Feche o outro processo ou rode `npx vite --port 5190` |
| Erro de versão do Node | Atualize para o Node 22.12+ |
| Imagens ou estilos esquisitos depois de atualizar | `npm install` e `npm start` de novo |
| A tela parece pequena numa janela baixa | É proposital: sem rolagem, a tela inteira se ajusta à janela (a partir de 1024 px de altura fica no tamanho do Figma) |

## Para quem desenvolve

```bash
npm run build       # gera a versão de produção (dist/)
npm run preview     # abre a versão de produção em http://localhost:5180
npm test            # testes de unidade e de jornada (vitest)
npm run test:e2e    # testes em navegador real (Playwright): jornadas, layout sem rolagem
                    #   (49 estados x 8 janelas) e acessibilidade (axe, WCAG 2.1 AA)
npm run typecheck && npm run lint
npm run images      # regenera as ilustrações (cena, personagem e a animação completa do Figma) a partir de design-source/
```

Na primeira vez que for rodar o `test:e2e`: `npx playwright install chromium`.

| Pasta | O que é |
|---|---|
| `tokens/figma-tokens.json` | **Fonte da verdade** dos tokens do design system (cor Light/Dark, espaço, raio, borda, motion, tipografia, elevação). |
| `scripts/generate-tokens.mjs` | Gera `src/styles/tokens.css` (nome mecânico: `text/base/primary` vira `--text-base-primary`). **Nunca editar o `tokens.css` à mão**; rode `npm run tokens` (já roda sozinho no `npm start`). |
| `src/components/ui` | Componentes do DS: `Button`, `TextField`, `PasswordField`, `Checkbox`, `TextLink`, `SocialButton`, `InlineMessage`, `CodeSlots`, `Reveal`, etc., com todos os estados (hover, foco, erro, carregando...). |
| `src/components/auth` | Composições: `AuthLayout`, `AuthHeader`, `StepIndicator`, `ResendCode`, `PasswordRequirements`, `SocialLogin`... |
| `src/features/auth` | Os fluxos (`login`, `recovery`, `signup`), etapas compartilhadas (`shared/`), o backend simulado (`mock/`) e as validações. |
| `src/features/demo` | O guia de demonstração e o registro dos 49 estados (`scenarios.ts`). |
| `e2e/` | Testes em navegador real. |
| `design-source/` | Camadas originais do Figma de cada cena, uma pasta por quadro (`person-1` a `person-4`: `plate`, `character`, `animation.gif`). |
| `docs/decisions.md` | Decisões técnicas e pendências para o design. |

Estilo: CSS Modules + variáveis CSS (sem Tailwind). Os nomes das propriedades dos componentes espelham as variants do Figma.
