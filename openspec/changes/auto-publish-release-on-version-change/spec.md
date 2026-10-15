# Auto Publish Release on Version Change

## Why

当前发布流程依赖手动创建 `release/v*` 分支并触发 PR 合并。对于 fork 维护者来说，这增加了不必要的操作负担。当 `main` 分支上的 `package.json` 版本号发生变化时，系统应自动发布 GitHub Release，与上游保持相同的 release 内容。

## What

- 新增 push-to-main 触发条件：当 `main` 分支的 `package.json` 版本号变化时，自动发布 GitHub Release
- Release 直接发布（非 draft）
- Release 内容与上游 dyoshikawa/rulesync 一致（binaries、schemas、repomix XML、SHA256SUMS 等）
- 保留现有 `release/v*` 分支工作流不变
- 不需要 npm 发布

## Impact

- 新增一个独立的工作流文件，不影响现有 `publish.yml` 和 `publish-assets.yml` 的行为
- 新工作流仅在 fork 仓库中生效，不向上游贡献
