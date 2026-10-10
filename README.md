# Clash 配置工程

把一份手写的 Clash 覆写脚本，重构为**可维护、可校验、可自动发布**的配置工程。

提供两条并行交付链路：

| 链路 | 产物 | 适用场景 |
| --- | --- | --- |
| **静态 YAML** | `dist/config.yaml` | 作为订阅源直接引用；配置固化，行为完全可预期 |
| **全局扩展脚本** | `dist/script.js` | 挂载到客户端扩展脚本位；非破坏性套用，原订阅照常更新 |

两条链路共用同一份规则、代理组与 DNS 定义，因此**分流结果必然一致** —— 不会出现"订阅来的配置"和"本地挂的脚本"行为对不上的情况。

---

## 一、仓库目录布局

```
clash-config/
├── config/                     # 数据层：只放「是什么」，不放「怎么算」
│   ├── settings.js             #   可调参数（延迟阈值、DNS、开关）
│   ├── rules.js                #   分流规则顺序
│   ├── rule-providers.js       #   规则集定义
│   ├── groups.js               #   代理组定义
│   ├── regions.js              #   地区识别配置
│   ├── dns.js                  #   DNS 与域名嗅探
│   └── user.js                 #   用户扩展层（Hook 机制）
│
├── src/                        # 逻辑层
│   ├── apply.js                #   装配核心 —— 单一事实来源
│   ├── regions.js              #   地区组生成器
│   ├── validate.js             #   规则语法与引用完整性校验
│   ├── yaml.js                 #   自实现 YAML 序列化器（零依赖）
│   ├── build.js                #   构建入口
│   └── runtime/
│       ├── modules.js          #   扩展脚本的模块集合
│       └── script-entry.js     #   扩展脚本入口（main 函数）
│
├── dist/                       # 产物层：由构建自动生成，不要手改
│   ├── config.yaml
│   ├── config.min.yaml
│   └── script.js
│
└── .github/workflows/
    ├── build.yml               # 构建 + 自动提交 + Release
    └── validate.yml            # PR 门禁
```

**为什么这样分层**：`config/` 与 `src/` 的边界，就是「数据」与「算法」的边界。调整分组结构不改算法，调整渲染逻辑不改数据。合并上游更新时，冲突范围被限制在单层内。

---

## 二、配置文件结构

### 2.1 规则匹配顺序

规则自上而下匹配，**第一条命中即生效**，因此顺序本身是配置的一部分：

```
自定义规则          ← 用户覆盖层，优先级最高
  ↓
ipdirect / ipprivate ← CIDR 判断，no-resolve 避免无谓 DNS 查询
  ↓
telegramcidr        ← Telegram 独立分组
  ↓
direct / private    ← 国内与私有域名收敛到直连
  ↓
各服务分项          ← Google / Apple / AI / Netflix / TikTok …
  ↓
proxy / gfw / tld   ← 兜底的代理类规则集
  ↓
MATCH               ← 漏网之鱼
```

### 2.2 代理组的两个设计取舍

**「节点选择」是抽象入口，不是节点清单。** 规则集引用的始终是「节点选择」而非具体节点，其默认指向「延迟选优」。这样增删节点、换机场都不需要改任何规则。

**「全局直连」保留代理出口。** 该组包含 `DIRECT`、`REJECT` 且挂上「节点选择」与「地区选择」。目的是让"本想直连、但需临时走代理"这类操作有明确落点，而不必去改规则。

> 与原始脚本的差异：`Bilibili`、`网速测试`、`Adobe` 三组仍固定以直连为首选（Bilibili 国内 CDN 完善，代理只会绕远路；Adobe 保留 `REJECT` 出口用于屏蔽授权校验），但都追加了地区组作为可切换项。

### 2.3 地区分组机制

地区组由 `src/regions.js` **按实际节点动态生成**，不写死在配置里。识别逻辑：节点的 `name` 命中 `matcher` 正则片段即归入该地区。

实现上修正了原版的两个缺陷：

1. **`noproxies` 未持续收敛。** 原实现遇到第一个无 `matcher` 的兜底桶即 `break`，导致其后地区永远分不到节点。现改为 `pool` 逐步收缩（已归属节点从池中移除），兜底桶只收走真正的剩余项。
2. **插入位置依赖固定下标。** 原实现用 `splice(1, 0, …)` 插入「地区选择」，下标会随代理组数量变化而漂移。现改为按名称定位。

---

## 三、脚本实现方式

### 3.1 扩展脚本如何工作

客户端在加载配置前调用 `main(config)`，用返回值替换原配置。核心结构：

```js
function main(config) {
  // ① 前置检查：无代理直接抛错，避免静默产出坏配置
  // ② 节点增删（剔除信息节点 / 注入自建节点）
  // ③ 写入 profile / geodata / 指纹 / 性能开关
  // ④ 注入 DNS 与嗅探
  // ⑤ 合并规则（自定义 + 快捷域名 + 内置规则集）并去重
  // ⑥ 重建代理组 + 生成地区组
  // ⑦ 后置 Hook：拥有最终决定权
  // ⑧ 终检：引用完整性校验，不通过即抛错
  return config;
}
```

### 3.2 三级自定义入口

按「改动力度」从轻到重排列：

**① 声明式配置（最常用，不建议改 `main`）**

```js
// 自定义规则：插在最前，优先级高于所有内置规则集
var CUSTOM_RULES = [
  "DOMAIN-SUFFIX,openai.com,AI",
  "DOMAIN-KEYWORD,telegram,电报消息",
  "IP-CIDR,203.0.113.0/24,节点选择,no-resolve",
];

// 单域名快捷写法，自动展开为 DOMAIN-SUFFIX
var CUSTOM_DOMAINS = [
  { domain: "example.com", target: "全局直连" },
];

// 剔除机场塞进来的信息节点
var EXCLUDE_PROXIES = ["剩余流量", "到期时间"];

// 注入自建节点
var EXTRA_PROXIES = [
  { name: "🏠 家宽", type: "ss", server: "1.2.3.4", port: 8388, cipher: "aes-128-gcm", password: "xxx" },
];
```

**② Hook 函数（命令式）**

```js
function preprocess(config) {
  config.rules = [];   // 机场自带规则常与内置规则冲突，先清空
  return config;
}

function postprocess(config) {
  // 收尾兜底，此处配置已通过校验
  return config;
}
```

**③ 功能开关（`FEATURES`）** —— 出现异常时可逐项关闭以定位问题：

```js
var FEATURES = {
  dedupeRules: true,        // 规则去重
  validateGroupRefs: true,  // 引用完整性校验
  injectGlobalUa: true,     // 统一 UA
  tcpConcurrent: true,      // TCP 并发握手
  unifiedDelay: true,       // 统一延迟口径
  enableRegionGroups: true, // 地区分组
  sniffEnabled: true,       // 域名嗅探
  logSummary: true,         // 控制台摘要
};
```

### 3.3 Hook 执行顺序

```
preprocess → 节点增删 → 基础配置 → DNS/嗅探 → 规则 → 代理组 → postprocess → 终检
```

`postprocess` 拥有最终决定权 —— 它拿到的配置已通过全部内置校验。

### 3.4 静态 YAML 链路

```bash
node src/build.js           # 全量构建，写入 dist/
node src/build.js --check   # 仅校验，不写文件（CI 门禁使用）
```

构建期会执行：
- 规则语法校验（类型/值/策略三段完整性）
- 引用完整性校验（规则→组、组→组、组→节点）
- 组名唯一性检查
- 重复规则剔除（保留首次出现，因其优先级更高）

**任一校验失败即中断构建**，避免带错误的配置进入发布环节。

---

## 四、自动发布

### 4.1 `build.yml` —— 构建与发布

触发方式：

| 触发 | 行为 |
| --- | --- |
| push 到 `main`（涉及 `config/**` 或 `src/**`） | 校验 → 构建 → 自动提交 `dist/` 回仓库 |
| 每周一 00:00（北京时间） | 定时重建，刷新产物时间戳 |
| 手动触发（可勾选 `release`） | 构建并创建 Release，附上全部产物 |

流水线设计要点：

- **校验前置。** `node src/build.js --check` 作为第一道门禁，不通过则不产出任何文件。
- **交叉验证。** 用第三方 `js-yaml` 解析自实现序列化器的输出，双重确认 YAML 合法。
- **脚本实测。** 在沙箱中真实调用 `main()`，并验证空代理配置会正确抛错。
- **幂等提交。** 通过 `git diff --cached --quiet` 判断产物是否变化，无变化则跳过提交，避免噪声 commit。
- **提交信息带 `[skip ci]`**，防止自动提交再次触发流水线形成死循环。
- **并发控制。** 同一分支的构建串行化，避免两次 push 争抢提交。

### 4.2 `validate.yml` —— PR 门禁

任何改动合并进 `main` 之前必须通过：静态校验、YAML 深度校验、规则集引用检查、脚本可执行性与保护性报错验证。

### 4.3 直接可用的订阅链接

产物提交回仓库后，通过 jsDelivr CDN 引用（自动缓存刷新）：

```
https://cdn.jsdelivr.net/gh/ZTLNB/clash-config@main/dist/config.min.yaml
```

或走 GitHub Raw：

```
https://raw.githubusercontent.com/ZTLNB/clash-config/main/dist/config.yaml
```

---

## 五、本地使用

```bash
# 无需 npm install，零依赖
node src/build.js

# 使用扩展脚本：打开客户端「配置」→「扩展脚本」，加载 dist/script.js
# 使用静态配置：引用 dist/config.yaml，或推送后走 CDN 链接
```

> **注意**：`dist/config.yaml` 中的节点是占位数据（`127.0.0.1:8388`）。静态链路需要你在 `config/user.js` 的 `extraProxies` 中填入真实节点，或改用扩展脚本链路 —— 后者会直接接管你现有的订阅配置，无需重复维护节点。

---

## 六、上游数据源致谢

- [MetaCubeX/meta-rules-dat](https://github.com/MetaCubeX/meta-rules-dat) —— 规则集主体
- [DustinWin/ruleset_geodata](https://github.com/DustinWin/ruleset_geodata) —— AI 与国服游戏规则补充
- [clash-verge-rev](https://github.com/clash-verge-rev/clash-verge-rev) / [Koolson/Qure](https://github.com/Koolson/Qure) —— 图标资源

## License

MIT
