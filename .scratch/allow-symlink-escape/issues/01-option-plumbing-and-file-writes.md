# 01: 开关管道 + 文件写入写穿（tracer bullet）

**What to build:** 开启 `allowSymlinkEscape`（`rulesync.jsonc` / `rulesync.local.jsonc`）或 CLI `--allow-symlink-escape` 后，`rulesync generate --global` 对经符号链接解析到 output root（即 home）之外的**单文件输出**（规则、MCP、permissions、hooks 等文件写入）放行写穿至真实落点；默认关闭时行为与现状逐字节一致。术语：**逃逸** = 可写路径 realpath 落在 output root 之外；判定复用现有 `writablePathEscapesRoot`，开关只改变"逃逸 → 拒绝"这一步。选项经既有构造参数管道传入 processor，不引入全局状态。

> **Rebase 后状态**：工作树已含部分实现（schema 键、ConfigResolver 解析与非 global warn+ignore、CLI 双旗标、守卫函数 opt-in 参数、dry-run 落点显示）。缺口是最后一公里——已解析的开关没有接到任何 processor 构造点，旗标永远以 `false` 到达守卫；测试、schema 再生成、docs 也全缺。本 ticket 补完接线并验证整条 tracer 路径。

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] 伪 home（`HOME_DIR` / `setupTestDirectory` 约定）+ 工具路径外逃链接：开关开 → 文件写入链接落点
- [ ] 开关经 processor 构造参数到达守卫：CLI → resolver → Config → processors 全链路有单测（rebase 后 WIP 缺的正是这一段）
- [ ] 开关关 → 现状 warn + skip，警告文案不变
- [ ] 非 global 运行下设置开关 → warn 一次后忽略，写入行为不变
- [ ] 悬空链接与链接环：开关开仍按逃逸拒绝
- [ ] 优先级 CLI > local > base 有 config-resolver 用例
- [ ] JSON schema 再生成收录新键，无 CI drift
- [ ] `file-formats.md` Symlinks 节、`cli-commands.md`、configuration 指南同步核心条目（项目模式立场不变）
