import { describe, expect, it } from 'vitest'
import { translateText } from '@/utils/host/translate/translate-text'

describe('translate-text', () => {
  it('translate empty word', async () => {
    expect(await translateText('')).toBe('')
    expect(await translateText(' ')).toBe('')
    expect(await translateText('\n')).toBe('')
    expect(await translateText(' \n ')).toBe('')
    expect(await translateText(' \n \t')).toBe('')
  })
})
