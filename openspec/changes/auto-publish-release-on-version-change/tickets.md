# Tickets

## 01-新增 push-to-main 自动发布工作流

- 创建新 workflow 文件，触发条件为 push 到 `main` 且 `package.json` 版本号变化
- Release 直接发布（非 draft）
- Release 内容与上游一致（binaries、schemas、repomix XML、SHA256SUMS 等）
- 参考现有 `publish-assets.yml` 的构建步骤
