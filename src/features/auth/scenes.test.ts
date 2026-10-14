import { SCENES, SCENE_IDS, isSceneId, sceneForPath } from './scenes'

describe('scenes', () => {
  it('cada tela tem a sua cena padrão: Cadastro na Person 2; Login e Recuperação na Person 4', () => {
    expect(sceneForPath('/cadastro')).toBe('person-2')
    expect(sceneForPath('/entrar')).toBe('person-4')
    expect(sceneForPath('/recuperar-senha')).toBe('person-4')
  })

  it('o fundo escolhido na demonstração vale para qualquer tela', () => {
    for (const path of ['/entrar', '/cadastro', '/recuperar-senha']) {
      expect(sceneForPath(path, 'person-1')).toBe('person-1')
      expect(sceneForPath(path, 'person-3')).toBe('person-3')
    }
    expect(sceneForPath('/cadastro', null)).toBe('person-2')
  })

  it('reconhece só os ids das cenas', () => {
    expect(SCENE_IDS.every(isSceneId)).toBe(true)
    expect(isSceneId('person-5')).toBe(false)
    expect(isSceneId('balcony')).toBe(false)
    expect(isSceneId(null)).toBe(false)
  })

  it('toda cena tem as 3 camadas e o recorte da animação dentro da arte', () => {
    for (const id of SCENE_IDS) {
      const scene = SCENES[id]
      expect(scene.id).toBe(id)
      expect([scene.plate, scene.character, scene.motion].every(Boolean)).toBe(true)
      const { x, y, width, height } = scene.motionBox
      expect(x + width).toBeLessThanOrEqual(scene.width)
      expect(y + height).toBeLessThanOrEqual(scene.height)
    }
  })
})
