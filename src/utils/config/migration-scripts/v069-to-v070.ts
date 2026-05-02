/**
 * Migration script from v069 to v070
 * - Adds `videoSubtitles.sourceCode` with a default value of `"auto"`
 *
 * IMPORTANT: All values are hardcoded inline. Migration scripts are frozen
 * snapshots — never import constants or helpers that may change.
 */

export function migrate(oldConfig: any): any {
  return {
    ...oldConfig,
    videoSubtitles: {
      ...oldConfig?.videoSubtitles,
      sourceCode: oldConfig?.videoSubtitles?.sourceCode ?? "auto",
    },
  }
}
