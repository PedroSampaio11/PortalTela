import { maskEmail } from './email'

describe('maskEmail', () => {
  it('replica o exemplo do Figma', () => {
    expect(maskEmail('ana.souza@email.com')).toBe('*****ouza@email.com')
  })

  it('mantém o domínio e protege nomes curtos', () => {
    expect(maskEmail('jo@x.com')).toBe('*o@x.com')
    expect(maskEmail('  Maria.Clara@portaltela.com ')).toBe('*******lara@portaltela.com')
  })
})
