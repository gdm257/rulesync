# 03: orphan sweep 跟随放行

**What to build:** `rulesync generate --global --delete` 在开关开时穿链接清扫 stale 生成物：**全部 orphan sweep 守卫层**换成同一开关门控的逃逸判定，与写入门径一致——skills 的三层（root 载入层、逐 skill 目录层、flat-file 层，rebase 后新增）、目录单元基类的 sweep 断言（同为 rebase 后新增）、subagents 的 sweep 断言。链接本身永不删除（与"skill 目录本身是符号链接时不 prune"的既有文档行为对齐）；项目模式 sweep 拒绝行为不变。

**Blocked by:** 01（可与 02 并行）

**Status:** resolved

- [x] 外逃 skills root：开关开 → stale skill 目录在落点被删除、root 链接保留；关 → 现状行为
- [x] 目录单元基类 sweep 与 subagents sweep 与 skills 三层同门控（rebase 后新增守卫层）
- [x] 项目模式 sweep 拒绝行为不变（Kimi 项目模式拒绝 e2e 保持绿色；Kimi managed skills root warn+skip 用例不回归）
- [x] POSIX-only e2e 对照（`skipIf(win32)` 先例，Windows 建符号链接需特权）

## Answer

sweep 与写入门控同源：skills 三层（root 载入层、逐 skill 目录层、flat-file 层）、目录单元基类断言、subagents 断言均携带开关；`assertSweepPathInsideRoot` 仅在链接链可解析时跳过断言，被跟随的链接本身不删除。项目模式行为不变。POSIX-only e2e 沿用 `skipIf(win32)` 先例。
