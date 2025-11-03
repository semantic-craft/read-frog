# Extension App 部分开源策略

本文档说明如何将 Read Frog extension app 开源，同时保持核心代码私有。

## 目标

1. ✅ Extension app 完全开源，接受社区贡献
2. ✅ 依赖的包（orpc, definitions）通过 NPM 提供，不暴露实现
3. ✅ 私有仓库保持完整 monorepo
4. ✅ 双向同步：私有仓库改动 → 公开仓库，社区 PR → 私有仓库

## 方案：Git Subtree + NPM Packages

### 仓库架构

```
私有仓库 (read-frog)              公开仓库 (read-frog-extension)
├── apps/                         ├── src/
│   ├── extension/  ──────────────┼─► [整个 extension app]
│   └── website/                  ├── public/
├── packages/                     ├── package.json
│   ├── orpc/  ──┐                ├── wxt.config.ts
│   ├── definitions/ ─┤           └── README.md
│   ├── db/           │
│   └── auth/         │
                      │
                      ├──► NPM Packages
                      │    @read-frog/orpc
                      └──► @read-frog/definitions
```

## 实施步骤

### 1. 准备依赖包（orpc & definitions）

#### 1.1 配置 orpc 包（隐藏服务端实现）

**packages/orpc/package.json:**

```json
{
  "name": "@read-frog/orpc",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": [
    "dist/**/*.js",
    "dist/**/*.d.ts"
  ],
  "scripts": {
    "build": "tsup src/client/index.ts --format esm,cjs --dts",
    "prepublish": "pnpm build"
  },
  "publishConfig": {
    "access": "public"
  }
}
```

**packages/orpc/src/client/index.ts:**

```typescript
// 只导出客户端代码和类型
export { createClient } from './client'
export type { Router, Procedures } from './types'

// ❌ 不导出服务端实现
// export { createRouter } from '../server'
```

**构建配置 (tsup.config.ts):**

```typescript
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/client/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: false, // 不提供 sourcemap，隐藏实现
  minify: true,     // 混淆代码
})
```

#### 1.2 配置 definitions 包

**packages/definitions/package.json:**

```json
{
  "name": "@read-frog/definitions",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "tsup src/index.ts --format esm,cjs --dts"
  },
  "publishConfig": {
    "access": "public"
  }
}
```

#### 1.3 发布到 NPM

```bash
# 在私有仓库中
cd packages/orpc
pnpm build
pnpm publish

cd ../definitions
pnpm build
pnpm publish
```

### 2. 初始化公开仓库

#### 2.1 创建公开仓库

在 GitHub 创建新的公开仓库：`read-frog-extension`

#### 2.2 使用 Git Subtree 分离 extension

```bash
cd /Users/leonz/Github/read-frog

# 1. 创建只包含 extension 的分支
git subtree split --prefix=apps/extension -b extension-public

# 2. 添加公开仓库 remote
git remote add public git@github.com:your-org/read-frog-extension.git

# 3. 推送到公开仓库
git push public extension-public:main

# 4. 清理临时分支
git branch -D extension-public
```

#### 2.3 修改公开仓库的依赖

克隆公开仓库并修改 `package.json`:

```bash
git clone git@github.com:your-org/read-frog-extension.git
cd read-frog-extension
```

**修改 package.json:**

```json
{
  "name": "@read-frog/extension",
  "dependencies": {
    // 从 workspace 依赖改为 npm 依赖
    "@read-frog/orpc": "^1.0.0",           // was: "workspace:*"
    "@read-frog/definitions": "^1.0.0"     // was: "workspace:*"
  }
}
```

**添加说明 README:**

```markdown
# Read Frog Extension

> This repository is automatically synced from our private monorepo.
> For the complete project including backend and website, see the private repository.

## Development

This extension depends on published npm packages:
- `@read-frog/orpc` - ORPC client library
- `@read-frog/definitions` - Shared type definitions

...
```

提交并推送：

```bash
git add .
git commit -m "chore: configure for standalone public repository"
git push origin main
```

### 3. 设置自动化同步

#### 3.1 私有仓库 → 公开仓库（自动推送）

**创建同步脚本 `scripts/sync-to-public.sh`:**

```bash
#!/bin/bash
set -e

echo "🔄 Syncing extension to public repository..."

# 1. Ensure we're on main branch
git checkout main

# 2. Pull latest changes
git pull origin main

# 3. Create subtree split
git subtree split --prefix=apps/extension -b temp-public-sync

# 4. Push to public repo
git push public temp-public-sync:main --force

# 5. Cleanup
git branch -D temp-public-sync

echo "✅ Sync completed!"
```

**设置执行权限:**

```bash
chmod +x scripts/sync-to-public.sh
```

**GitHub Actions (.github/workflows/sync-to-public.yml):**

```yaml
name: Sync Extension to Public Repo

on:
  push:
    branches: [main]
    paths:
      - 'apps/extension/**'
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history needed for subtree

      - name: Setup Git
        run: |
          git config user.name "GitHub Action Bot"
          git config user.email "bot@github.com"

      - name: Add public remote
        env:
          PUBLIC_REPO_TOKEN: ${{ secrets.PUBLIC_REPO_TOKEN }}
        run: |
          git remote add public https://x-access-token:${PUBLIC_REPO_TOKEN}@github.com/your-org/read-frog-extension.git

      - name: Sync to public
        run: |
          git subtree split --prefix=apps/extension -b temp-sync
          git push public temp-sync:main --force
          git branch -D temp-sync

      - name: Notify
        run: echo "✅ Extension synced to public repository"
```

**设置 GitHub Secret:**

在私有仓库的 Settings → Secrets and variables → Actions 中添加：
- `PUBLIC_REPO_TOKEN`: Personal Access Token with `repo` permission

#### 3.2 公开仓库 → 私有仓库（手动同步社区 PR）

**手动方式：**

```bash
# 在私有仓库中
cd /Users/leonz/Github/read-frog

# 拉取公开仓库的改动
git fetch public

# 方式 1: Cherry-pick 特定 commit
git cherry-pick <commit-hash>

# 方式 2: Subtree pull (合并所有改动)
git subtree pull --prefix=apps/extension public main --squash
```

**创建同步脚本 `scripts/sync-from-public.sh`:**

```bash
#!/bin/bash
set -e

echo "🔄 Syncing changes from public repository..."

# 1. Fetch from public
git fetch public

# 2. Subtree pull with squash
git subtree pull --prefix=apps/extension public main --squash -m "chore: sync changes from public repository"

echo "✅ Sync completed! Review the changes and push to main."
```

**GitHub Actions - 通知有新 PR (.github/workflows/notify-private.yml in public repo):**

```yaml
name: Notify Private Repo on PR

on:
  pull_request:
    types: [opened, synchronize, closed]

jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - name: Create notification issue
        if: github.event.pull_request.merged == true
        uses: actions/github-script@v7
        with:
          github-token: ${{ secrets.PRIVATE_REPO_TOKEN }}
          script: |
            const prTitle = context.payload.pull_request.title;
            const prUrl = context.payload.pull_request.html_url;
            const prNumber = context.payload.pull_request.number;

            github.rest.issues.create({
              owner: 'your-private-org',
              repo: 'read-frog',
              title: `[Public PR #${prNumber}] ${prTitle}`,
              body: `A PR has been merged in the public repository and needs to be synced.\n\n` +
                    `**PR:** ${prUrl}\n\n` +
                    `**Action required:**\n` +
                    `\`\`\`bash\n` +
                    `./scripts/sync-from-public.sh\n` +
                    `\`\`\``,
              labels: ['sync-required', 'public-contribution']
            });
```

### 4. 依赖包更新流程

当 orpc 或 definitions 有更新时：

```bash
# 1. 在私有仓库更新代码
cd packages/orpc
# ... make changes ...

# 2. 构建并发布新版本
pnpm build
pnpm version patch  # or minor, major
pnpm publish

# 3. 在 extension 中更新依赖
cd ../../apps/extension
pnpm update @read-frog/orpc

# 4. Commit 并推送（会自动触发同步到公开仓库）
git add .
git commit -m "chore: update @read-frog/orpc to v1.0.1"
git push origin main
```

公开仓库会自动获得更新的 `package.json`。

### 5. 日常工作流程

#### 5.1 在私有仓库开发新功能

```bash
# 正常开发
cd apps/extension
# ... make changes ...

# Commit and push
git add .
git commit -m "feat(extension): add new feature"
git push origin main

# ✅ GitHub Action 自动同步到公开仓库
```

#### 5.2 处理社区贡献的 PR

1. **在公开仓库 Review PR**
   - 在 `read-frog-extension` 仓库查看 PR
   - Review 代码，提供反馈
   - 满意后合并到 main

2. **同步到私有仓库**
   ```bash
   cd /Users/leonz/Github/read-frog
   ./scripts/sync-from-public.sh

   # Review changes
   git log
   git diff

   # Push to private main
   git push origin main
   ```

3. **（可选）回同步到公开仓库**
   - GitHub Action 会自动处理，无需手动操作

#### 5.3 更新依赖包

```bash
# 更新 orpc
cd packages/orpc
# ... changes ...
pnpm version patch
pnpm publish

# 更新 extension 依赖
cd ../../apps/extension
pnpm update @read-frog/orpc
git add package.json pnpm-lock.yaml
git commit -m "chore: update @read-frog/orpc"
git push

# ✅ 自动同步到公开仓库
```

## 注意事项

### ⚠️ Git Subtree 注意事项

- **历史记录**: Subtree 会保留完整的 git 历史
- **合并冲突**: 使用 `--squash` 减少冲突
- **Force push**: 私有→公开的同步使用 `--force`，确保公开仓库接受

### ⚠️ 安全考虑

- **环境变量**: 确保 `.env` 文件在 `.gitignore` 中
- **Secrets**: 不要在 extension 代码中硬编码 secrets
- **API Keys**: 所有 API keys 应该由用户配置

### ⚠️ 贡献者体验

在公开仓库的 `CONTRIBUTING.md` 中说明：

```markdown
# Contributing

This repository is automatically synced from our private monorepo.

- Your PR will be reviewed here
- Once merged, it will be synced to the private repository
- Changes in the private repo will sync back automatically

## Dependencies

Some packages are distributed via npm:
- `@read-frog/orpc` - You don't need to modify this
- `@read-frog/definitions` - Type definitions (read-only)

If you need changes to these packages, please open an issue.
```

### ⚠️ CI/CD

需要在两个仓库都设置 CI/CD：

**私有仓库：**
- 完整的测试、构建、lint
- 发布 npm 包
- 同步到公开仓库

**公开仓库：**
- 基础的测试、构建、lint
- PR 检查
- 通知私有仓库

## 替代方案

### 方案 B: Git Submodule（不推荐）

使用 submodule 会让公开仓库依赖私有仓库，不符合需求。

### 方案 C: 完全手动复制（不推荐）

手动复制文件容易出错，难以维护双向同步。

## 总结

这个方案提供了：

✅ **完全开源的 extension app** - 社区可以完整查看和贡献
✅ **隐藏的实现细节** - orpc 服务端代码不会暴露
✅ **自动双向同步** - 减少手动操作
✅ **统一的开发体验** - 私有仓库保持 monorepo 优势
✅ **清晰的边界** - NPM 包作为依赖边界

## 快速参考命令

```bash
# 发布依赖包
cd packages/orpc && pnpm version patch && pnpm publish

# 同步到公开仓库（手动）
./scripts/sync-to-public.sh

# 从公开仓库同步（合并社区 PR）
./scripts/sync-from-public.sh

# 检查同步状态
git fetch public
git log public/main
```
