# Spec Delta

## Purpose

定义 rulesync 生成写入何时允许跟随解析到 output root 之外的符号链接（"逃逸"），让跨分区 dotfiles 布局在 global 模式可用，同时保持项目模式针对恶意 checkout 的安全边界不变。

## ADDED Requirements

### Requirement: 逃逸放行开关

系统 SHALL 提供布尔开关控制 global 生成写入是否放行逃逸：配置键 `allowSymlinkEscape`（`rulesync.jsonc` 与 `rulesync.local.jsonc` 均可设置）与 CLI 旗标 `--allow-symlink-escape`。默认关闭；解析优先级为 CLI > local > base。

#### Scenario: 开关开启时写穿外逃链接

- **WHEN** global 生成运行且开关开启，某输出路径经符号链接解析到 output root 之外
- **THEN** 该输出写入链接的真实落点

#### Scenario: 默认关闭时保持现状

- **WHEN** 开关未设置
- **THEN** 逃逸写入被跳并发出与现状一致的警告，警告文案不变

#### Scenario: CLI 覆盖配置文件

- **WHEN** 配置文件设置 `allowSymlinkEscape: true` 而运行时传入 `--allow-symlink-escape=false`
- **THEN** 该次运行按关闭处理

### Requirement: 仅 global scope 生效

开关 SHALL 仅在 global scope 运行时生效。project scope 运行下被设置时，系统 SHALL 发出一次警告后忽略之，项目模式的写入守卫行为不得变化。

#### Scenario: 项目模式下设置被警告并忽略

- **WHEN** project scope 生成运行且开关被设置
- **THEN** 输出一条说明开关无效的警告，写入与清扫行为与未设置时完全一致

### Requirement: 单文件输出写穿

开关开启且 global 运行时，单文件输出（规则、MCP、permissions、hooks 等文件写入）SHALL 写穿逃逸链接至真实落点；判定 SHALL 复用"可写路径 realpath 落点是否在 output root 之外"这一定义，不引入第二套路径判定。

#### Scenario: 规则文件经外逃链接落点

- **WHEN** 伪 home 中工具目录是指向 home 之外目录的符号链接，开关开启并执行 global 生成
- **THEN** 生成的配置文件出现在链接目标目录中

### Requirement: 目录单元与配置重写同门控

目录单元写入（skills 目录整体，含 supporting files 与可执行位语义）与配置重写类写入（commands 输出、Hermes activation 的 configRoot 判定、Antigravity plugin manifest 写守卫等输出面守卫）SHALL 使用与单文件写入相同的门控。"目录中任一文件外逃则作为整目录单元处理"的既有语义 SHALL 保持。

#### Scenario: skills 目录整体写穿

- **WHEN** 开关开启且某 skills 目录位于逃逸链接之下
- **THEN** 整个目录连同支撑文件写入链接落点

#### Scenario: 关闭时整目录持有

- **WHEN** 开关关闭且某 skills 目录中任一文件路径外逃
- **THEN** 整个目录被持有不写，并发出既有警告

### Requirement: orphan sweep 跟随放行

`--delete` 的 orphan sweep SHALL 与写入门控一致：开关开启且 global 运行时，清扫 SHALL 跟随逃逸链接在真实落点删除 stale 生成物——覆盖 skills 的各 sweep 层（root 载入层、逐 skill 目录层、flat-file 层）、目录单元基类的 sweep 断言与 subagents 的 sweep 断言。被跟随的链接本身 SHALL NOT 被删除。项目模式的 sweep 拒绝行为 SHALL 不变。

#### Scenario: 穿链清扫 stale skill

- **WHEN** 开关开启、global 运行 `--delete`，skills root 是指向 home 之外的链接且其下存在 stale skill 目录
- **THEN** stale skill 目录在链接落点被删除，skills root 链接本身保留

#### Scenario: 项目模式清扫拒绝不回归

- **WHEN** project scope 运行 `--delete` 且 skills root 是符号链接
- **THEN** 行为与现状一致（拒绝穿链清扫），无论开关是否设置

### Requirement: 不可解析链接始终拒绝

悬空链接与链接环（落点无法解析）SHALL 无论开关状态均按逃逸拒绝，系统不得写出落点无法确定的文件。

#### Scenario: 悬空链接在开关开启时仍拒绝

- **WHEN** 开关开启且输出路径经过一个目标不存在的符号链接
- **THEN** 该写入被拒绝并警告，不创建任何文件

### Requirement: 开关是许可不是触发器

配置文件中的 `allowSymlinkEscape: true` SHALL NOT 自行启用 global scope；global scope 的启用规则（配置文件的 `global: true` 需 CLI 显式 `--global`）保持不变。

#### Scenario: 仅靠配置无法触发放行

- **WHEN** 外来仓库的 committed 配置同时设置 `global: true` 与 `allowSymlinkEscape: true`，用户未传 `--global`
- **THEN** 运行为 project scope，开关被警告并忽略

### Requirement: 环境变量覆盖 root 的判定基准

对以环境变量覆盖输出 root 的工具（`HERMES_HOME`、`KIMI_CODE_HOME`、`DEEPAGENTS_HOME`），逃逸判定 SHALL 以覆盖后的 root 为基准，语义与其他工具一致。

#### Scenario: 覆盖 root 下的外逃链接

- **WHEN** `HERMES_HOME` 指向的 root 内存在逃逸链接且开关开启执行 global 生成
- **THEN** 写穿判定相对覆盖后的 root 进行

### Requirement: 可观测性

放行后的写穿 SHALL 以 debug 级记录落点；dry-run 与 `--check` 预览 SHALL 展示穿链后的真实落点路径。

#### Scenario: verbose 可审计写穿

- **WHEN** 开关开启且发生写穿，运行带 `--verbose`
- **THEN** 每次写穿在 debug 日志中可见

#### Scenario: dry-run 显示真实落点

- **WHEN** 开关开启且运行 `--dry-run`
- **THEN** 预览输出中的路径为穿链后的真实落点

### Requirement: JSON schema 收录新键

生成的 JSON schema SHALL 收录 `allowSymlinkEscape`，使编辑器校验与补全可用。

#### Scenario: schema 校验通过

- **WHEN** 配置文件包含 `allowSymlinkEscape` 布尔值并以生成的 schema 校验
- **THEN** 校验通过且类型正确
