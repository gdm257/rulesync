# 04: convert 表面 + 文档收口

**What to build:** `rulesync convert --global` 接受同一旗标，import+generate round-trip 在外逃链接布局下完成（import 侧本就跟随链接，generate 侧由开关放行）；watch 模式持续生效验证；文档把安全立场收口成文：**项目模式严格 / global 模式可显式 opt-in**，并说明 env 覆盖三工具（`HERMES_HOME` / `KIMI_CODE_HOME` / `DEEPAGENTS_HOME`）以覆盖后 root 为判定基准。

**Blocked by:** 01, 02, 03

**Status:** ready-for-agent

- [ ] `convert --global` + 开关：外逃链接布局下 round-trip 完成
- [ ] watch 再生成行为与 one-shot 一致（复用同一管道，验证即可）
- [ ] `file-formats.md` Symlinks 节完整表述最终立场（含 env 覆盖三工具说明），CLI/配置文档无遗留
- [ ] `pnpm cicheck` 全绿（含 content 检查）
