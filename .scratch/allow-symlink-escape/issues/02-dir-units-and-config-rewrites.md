# 02: 目录单元与 config 重写写穿

**What to build:** 同一开关下，**目录单元写入**与 **config 重写**全部跟随放行：skills 目录整体（`SKILL.md` + supporting files，executable bit 语义保持）写穿外逃链接；commands 输出重写、Hermes project plugin activation 的 configRoot 判定、Antigravity plugin manifest 写守卫（rebase 后的新上游特性）使用同一门控。"目录中任一文件外逃则整目录作为单元处理"的既有语义保持——开关开时整目录写穿，关时整目录持有不变。

**Blocked by:** 01（开关管道与守卫 opt-in 参数）

**Status:** resolved

- [x] 外逃 skills 目录：开关开 → 整目录（含支撑文件）写穿落点；关 → 整目录持有 + 现有警告
- [x] commands 配置重写、Hermes activation 判定与文件写入同结果（开写穿 / 关拒绝）
- [x] co-located 单测对照组（开/关），先例沿用现有 "Refusing to write … resolves outside" 系列用例

## Answer

目录单元经 `DirFeatureProcessor` 统一门控：`refusesAnyWriteOutsideRoot` 携带开关，`refusesDirWriteOntoRoot`（落点恰为 root 自身）保持严格——那不属于逃逸，开关不适用，且它排在逃逸守卫之后，链接环先被前一守卫拦下。commands 重写与 Hermes activation 走同一守卫。对照组用例见 `src/types/dir-feature-processor.test.ts`。
