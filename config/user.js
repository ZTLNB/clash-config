/**
 * 用户扩展层（Hook 机制）。
 *
 * 这是整份配置「可维护」的关键：所有个性化改动集中在本文件，
 * 不进入 config/ 下的数据结构定义。升级上游规则或分组时，
 * 只需合并 config/ 目录，本文件的改动不会冲突。
 *
 * 执行顺序（由 src/apply.js 保证）：
 *
 *   preprocess      → 拿到原始订阅配置，可做任意改写
 *      ↓
 *   configure       → 注入 DNS / 嗅探 / 规则 / 代理组
 *      ↓
 *   injectProxies   → 动态增删节点（补自建节点、剔除失效节点）
 *      ↓
 *   injectGroups    → 动态增删代理组
 *      ↓
 *   postprocess     → 最终校验与兜底
 *
 * 声明式入口在文件末尾的 `userHooks`，运行时入口是 `applyUserLayer`。
 */

// ══════════════════════════════════════════════════════════
// 一、自定义规则（声明式，最常用）
// ══════════════════════════════════════════════════════════

/**
 * 规则级覆盖：插在所有 RULE-SET 之前，优先级最高。
 * 用途：修正上游规则集里你不认可的分流结果。
 *
 * 例：
 *   "DOMAIN-SUFFIX,openai.com,AI"         强制某域名走 AI 组
 *   "DOMAIN-KEYWORD,telegram,电报消息"      关键词兜底
 *   "IP-CIDR,203.0.113.0/24,全局直连,no-resolve"
 */
export const customRules = [];

/**
 * 单域名快捷写法：不想手写完整规则语法时用这个。
 *
 * 例：
 *   { domain: "example.com", target: "全局直连" }
 *   → 展开为 DOMAIN-SUFFIX,example.com,全局直连
 *
 * target 省略时默认走「节点选择」。
 */
export const customDomains = [
  // { domain: "example.com", target: "全局直连" },
];

/** 域名快捷写法 → 标准规则语法的展开函数。 */
export function expandCustomDomains(list = customDomains) {
  return list
    .filter((item) => item && item.domain)
    .map((item) => `DOMAIN-SUFFIX,${item.domain},${item.target || "节点选择"}`);
}

// ══════════════════════════════════════════════════════════
// 二、脚本注入（命令式，能力最强）
// ══════════════════════════════════════════════════════════

/** 额外挂载的自建节点。会被插入到 proxies 数组末尾。 */
export const extraProxies = [
  // { name: "🏠 家宽", type: "ss", server: "1.2.3.4", port: 8388, cipher: "aes-128-gcm", password: "xxx" },
];

/** 需要剔除的节点名（精确匹配）。用于过滤订阅里不想要的落地。 */
export const excludeProxies = [
  // "剩余流量", "到期时间",
];

/** 需要额外创建的代理组。会追加到 proxy-groups 末尾。 */
export const extraGroups = [
  // { name: "自建优先", type: "select", proxies: ["🏠 家宽", "节点选择"] },
];

// ══════════════════════════════════════════════════════════
// 三、Hook 函数
// ══════════════════════════════════════════════════════════

export const userHooks = {
  /**
   * 预处理：在注入任何内置配置之前拿到原始配置。
   * 适合做「先修正再说」的操作，例如关掉机场自带的分流规则。
   */
  preprocess(config) {
    // 例：机场订阅常自带一堆 rules，先清空避免顺序错乱
    // config.rules = [];
    return config;
  },

  /**
   * 后处理：在内置配置全部注入并校验完成之后执行。
   * 此处拥有最终决定权，适合做收尾兜底。
   */
  postprocess(config) {
    return config;
  },
};

// ══════════════════════════════════════════════════════════
// 四、运行时入口
// ══════════════════════════════════════════════════════════

/**
 * 把用户扩展层套用到配置上。
 * 由渲染器（静态 YAML）与扩展脚本（全局脚本）共同调用，保证两条链路行为一致。
 *
 * @param {object} config  已完成内置注入的配置对象
 * @param {object} api     宿主能力（校验、去重等），见 src/validate.js
 * @returns {object} 处理后的配置
 */
export function applyUserLayer(config, api) {
  // ── 节点注入：先剔除，后追加 ──
  if (excludeProxies.length > 0 && Array.isArray(config.proxies)) {
    const drop = new Set(excludeProxies);
    const before = config.proxies.length;
    config.proxies = config.proxies.filter((p) => !drop.has(p.name));
    const removed = before - config.proxies.length;
    if (removed > 0) api?.log?.(`剔除黑名单节点 ${removed} 个`);
  }
  if (extraProxies.length > 0) {
    config.proxies = [...(config.proxies || []), ...extraProxies];
    api?.log?.(`注入自建节点 ${extraProxies.length} 个`);
  }

  // ── 代理组注入 ──
  if (extraGroups.length > 0) {
    config["proxy-groups"] = [...(config["proxy-groups"] || []), ...extraGroups];
  }

  // ── 用户 Hook ──
  if (typeof userHooks.postprocess === "function") {
    config = userHooks.postprocess(config) || config;
  }

  return config;
}
