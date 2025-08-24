export function migrate(oldConfig: any): any {
  return {
    ...oldConfig,
    translate: {
      ...oldConfig.translate,
      customShortcutKey: 'bilingual',
    },
  }
}
