# 01: 开关管道 + 文件写入写穿（tracer bullet）

**What to build:** 开启 `allowSymlinkEscape`（`rulesync.jsonc` / `rulesync.local.jsonc`）或 CLI `--allow-symlink-escape` 后，`rulesync generate --global` 对经符号链接解析到 output root（即 home）之外的**单文件输出**（规则、MCP、permissions、hooks 等文件写入）放行写穿至真实落点；默认关闭时行为与现状逐字节一致。术语：**逃逸** = 可写路径 realpath 落在 output root 之外；判定复用现有 `writablePathEscapesRoot`，开关只改变"逃逸 → 拒绝"这一步。选项经既有构造参数管道传入 processor，不引入全局状态。

> **Rebase 后状态**：工作树已含部分实现（schema 键、ConfigResolver 解析与非 global warn+ignore、CLI 双旗标、守卫函数 opt-in 参数、dry-run 落点显示）。缺口是最后一公里——已解析的开关没有接到任何 processor 构造点，旗标永远以 `false` 到达守卫；测试、schema 再生成、docs 也全缺。本 ticket 补完接线并验证整条 tracer 路径。

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] 伪 home（`HOME_DIR` / `setupTestDirectory` 约定）+ 工具路径外逃链接：开关开 → 文件写入链接落点
- [x] 开关经 processor 构造参数到达守卫：CLI → resolver → Config → processors 全链路有单测（rebase 后 WIP 缺的正是这一段）
- [x] 开关关 → 现状 warn + skip，警告文案不变
- [x] 非 global 运行下设置开关 → warn 一次后忽略，写入行为不变
- [x] 悬空链接与链接环：开关开仍按逃逸拒绝
- [x] 优先级 CLI > local > base 有 config-resolver 用例
- [x] JSON schema 再生成收录新键，无 CI drift
- [x] `file-formats.md` Symlinks 节、`cli-commands.md`、configuration 指南同步核心条目（项目模式立场不变）

## Answer

集成分支 `feat/allow-symlink-escape`。判定复用 `writablePathEscapesRoot`，开关只改变「逃逸 → 拒绝」这一步；解析优先级 CLI > local > base（`src/config/config-resolver.ts`），非 global 运行 warn 一次后忽略。

code review 修复：开关开启时悬空链接与链接环曾被一并放行——两者的逃逸判定同样为真，守卫无从区分。新增 `writePathResolves`（`src/utils/file.ts`），仅在链接链可解析时放行，并把落点写进 debug 日志；`assertSweepPathInsideRoot` 同步收口。用例见 `src/types/feature-processor.test.ts` 的 dangling 与 cycle 两例。

JSON schema 由 config 的 zod schema 生成，已收录新键；`src/generated/docs-content.ts` 无 drift。
