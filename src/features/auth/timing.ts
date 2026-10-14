/**
 * Tempos das transições entre telas dos fluxos (ms). Mutável de propósito: os testes zeram.
 *  - result: quanto uma tela de resultado ("Código enviado") fica antes de seguir sozinha
 *  - successBar: quanto a barra com check do código fica antes da tela "Código confirmado"
 *  - redirect: quanto "Senha atualizada" fica antes de levar ao portal
 */
export const timing = { result: 1800, successBar: 1100, redirect: 2600 }
