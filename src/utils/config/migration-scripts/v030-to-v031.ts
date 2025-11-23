/**
 * Migration script from v030 to v031
 * Removes 'default' prompt from patterns array as it should come from code constant
 *
 * Before (v030):
 *   promptsConfig: {
 *     prompt: 'default',
 *     patterns: [
 *       { id: 'default', name: 'default', prompt: '...' },
 *       { id: 'uuid1', name: 'Custom', prompt: '...' }
 *     ]
 *   }
 *
 * After (v031):
 *   promptsConfig: {
 *     prompt: 'default',
 *     patterns: [
 *       { id: 'uuid1', name: 'Custom', prompt: '...' }
 *     ]
 *   }
 *
 * The promptId remains unchanged - if it's 'default', getTranslatePrompt() will use the constant
 */

export function migrate(oldConfig: any): any {
  const oldPatterns = oldConfig.translate?.promptsConfig?.patterns ?? []

  return {
    ...oldConfig,
    translate: {
      ...oldConfig.translate,
      promptsConfig: {
        ...oldConfig.translate?.promptsConfig,
        patterns: oldPatterns.filter((p: any) => p.id !== 'default'),
      },
    },
  }
}
