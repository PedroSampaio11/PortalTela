import { evaluatePassword, strengthLevel } from './passwordRules'

describe('passwordRules', () => {
  it('mapeia a contagem de requisitos para o nível do DS', () => {
    expect([0, 1, 2, 3, 4, 5].map(strengthLevel)).toEqual(['none', 'weak', 'weak', 'fair', 'good', 'strong'])
  })

  it('avalia cada requisito na ordem do Figma', () => {
    expect(evaluatePassword('').met).toEqual([false, false, false, false, false])
    expect(evaluatePassword('abc').met).toEqual([false, false, false, true, false])
    expect(evaluatePassword('Abcdefg1').met).toEqual([true, true, true, true, false])
    expect(evaluatePassword('Senha@123')).toMatchObject({ metCount: 5, level: 'strong', isStrong: true })
  })

  it('aceita acentos e não conta espaço como caractere especial', () => {
    expect(evaluatePassword('Ação12345').met[1]).toBe(true)
    expect(evaluatePassword('abc def 1').met[4]).toBe(false)
    expect(evaluatePassword('abc!').met[4]).toBe(true)
  })
})
