import path from 'node:path'
import process from 'node:process'
import { defineConfig } from 'wxt'

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  imports: false,
  modules: ['@wxt-dev/module-react', '@wxt-dev/i18n/module'],
  manifestVersion: 3,
  vite: () => {
    // 环境变量控制：本地开发时使用 monorepo 源码
    const useLocalPackages = process.env.USE_LOCAL_PACKAGES === 'true'

    const alias: Record<string, string> = {
      // 保留 React 单例
      'react': path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
    }

    if (useLocalPackages) {
      // 本地开发：直接指向 monorepo 源码，文件变化立即生效
      alias['@read-frog/definitions'] = path.resolve(__dirname, '../read-frog-monorepo/packages/definitions/src')
      alias['@read-frog/ui'] = path.resolve(__dirname, '../read-frog-monorepo/packages/ui/src')
      alias['@read-frog/orpc'] = path.resolve(__dirname, '../read-frog-monorepo/packages/orpc/src')
    }

    return {
      plugins: [],
      resolve: {
        alias,
      },
    }
  },
  manifest: ({ mode, browser }) => ({
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    default_locale: 'en',
    permissions: ['storage', 'tabs', 'alarms', 'cookies'],
    host_permissions:
      mode === 'development'
        ? [
            'http://localhost:*/*',
          ]
        : [
            'https://*.readfrog.app/*',
            'https://readfrog.app/*', // Include both www and non-www versions
          ],
    // Firefox-specific settings for MV3
    ...(browser === 'firefox' && {
      browser_specific_settings: {
        gecko: {
          id: 'extension@readfrog.app',
          strict_min_version: '109.0',
        },
      },
    }),
  }),
  dev: {
    server: {
      port: 3333,
    },
  },
})
