import { copyFile, mkdir } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const websiteRoot = resolve(__dirname, '..')
const monorepoRoot = resolve(websiteRoot, '../..')
const dataDir = join(websiteRoot, 'src/data')

async function copyChangelogs() {
  try {
    // Ensure data directory exists
    await mkdir(dataDir, { recursive: true })

    // Copy extension changelog
    await copyFile(
      join(monorepoRoot, 'apps/extension/CHANGELOG.md'),
      join(dataDir, 'extension-changelog.md'),
    )

    // Copy website changelog
    await copyFile(
      join(monorepoRoot, 'apps/website/CHANGELOG.md'),
      join(dataDir, 'website-changelog.md'),
    )

    console.log('✓ Changelogs copied successfully')
    console.log(`  → ${dataDir}`)
  }
  catch (error) {
    console.error('Failed to copy changelogs:', error)
    process.exit(1)
  }
}

copyChangelogs()
