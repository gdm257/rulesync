# 04: convert 表面 + 文档收口

**What to build:** `rulesync convert --global` 接受同一旗标，import+generate round-trip 在外逃链接布局下完成（import 侧本就跟随链接，generate 侧由开关放行）；watch 模式持续生效验证；文档把安全立场收口成文：**项目模式严格 / global 模式可显式 opt-in**，并说明 env 覆盖三工具（`HERMES_HOME` / `KIMI_CODE_HOME` / `DEEPAGENTS_HOME`）以覆盖后 root 为判定基准。

**Blocked by:** 01, 02, 03

**Status:** resolved

- [x] `convert --global` + 开关：外逃链接布局下 round-trip 完成
- [x] watch 再生成行为与 one-shot 一致（复用同一管道，验证即可）
- [x] `file-formats.md` Symlinks 节完整表述最终立场（含 env 覆盖三工具说明），CLI/配置文档无遗留
- [ ] `pnpm cicheck` 全绿（含 content 检查）

## Answer

`rulesync convert --global` 接受同一旗标，round-trip 在外逃链接布局下完成；watch 复用同一管道。文档在 `docs/reference/file-formats.md` 的 Symlinks 节收口安全立场（项目模式严格 / global 可显式 opt-in），并说明 `HERMES_HOME` / `KIMI_CODE_HOME` / `DEEPAGENTS_HOME` 以覆盖后的 root 为判定基准。

最后一项未勾选：`pnpm cicheck` 的 content 半程（cspell）在本机无法运行——其要求的 Node >= 22.18.0 与本机 22.17.0 不符，baseline 同样失败，非本次改动引入。
