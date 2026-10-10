/**
 * 全局扩展脚本入口。
 *
 * 加载方式（mihomo / Clash Verge Rev）：
 *   「配置」→「扩展脚本」→ 选择本文件
 * 客户端会在配置加载前调用 main(config)，用返回值替换原配置。
 *
 * 与静态 YAML 的关系：
 *   两者共用同一套规则、代理组、DNS 定义，行为一致。
 *   脚本方式的优势是「非破坏性」——原订阅仍可正常更新，
 *   所有增强在加载瞬间套用，不需要每次同步手工改配置。
 */

// ══════════════════════════════════════════════════════════
// 用户自定义区（改这里，不要改下面的 main）
// ══════════════════════════════════════════════════════════

/**
 * 自定义规则：插在最前面，优先级高于所有内置规则集。
 * 常用语法：
 *   "DOMAIN-SUFFIX,openai.com,AI"
 *   "DOMAIN-KEYWORD,telegram,电报消息"
 *   "DOMAIN,example.com,全局直连"
 *   "IP-CIDR,203.0.113.0/24,节点选择,no-resolve"
 *   "PROCESS-NAME,Telegram.exe,电报消息"
 */
var CUSTOM_RULES = [
  // "DOMAIN-SUFFIX,openai.com,AI",
];

/** 单域名快捷写法，自动展开为 DOMAIN-SUFFIX。 */
var CUSTOM_DOMAINS = [
  // { domain: "example.com", target: "全局直连" },
];

/** 额外节点：自建服务器可写在这里，会和订阅节点合并。 */
var EXTRA_PROXIES = [
  // { name: "🏠 家宽", type: "ss", server: "1.2.3.4", port: 8388, cipher: "aes-128-gcm", password: "xxx" },
];

/** 剔除节点：精确匹配节点名，用于过滤机场塞进来的「剩余流量」等信息节点。 */
var EXCLUDE_PROXIES = [
  // "剩余流量", "到期时间", "官网地址",
];

/** 额外代理组。 */
var EXTRA_GROUPS = [
  // { name: "自建优先", type: "select", proxies: ["🏠 家宽", "节点选择"] },
];

// ══════════════════════════════════════════════════════════
// 脚本注入 Hook
// ══════════════════════════════════════════════════════════

/** 前置 Hook：拿到原始订阅配置，可先做任意修改。 */
function preprocess(config) {
  // 例：机场自带规则往往与内置规则冲突，可先清空
  // config.rules = [];
  return config;
}

/** 后置 Hook：所有处理完成后调用，拥有最终决定权。 */
function postprocess(config) {
  return config;
}

// ══════════════════════════════════════════════════════════
// 主流程
// ══════════════════════════════════════════════════════════

function main(config) {
  var log = function (msg) {
    if (FEATURES.logSummary) console.log("[clash-script] " + msg);
  };

  // ── 0. 前置检查 ──
  var proxyCount = (config && config.proxies && config.proxies.length) || 0;
  var providerCount =
    config && typeof config["proxy-providers"] === "object" && config["proxy-providers"]
      ? Object.keys(config["proxy-providers"]).length
      : 0;
  if (proxyCount === 0 && providerCount === 0) {
    throw new Error("[clash-script] 配置中未找到任何代理：proxies 与 proxy-providers 均为空");
  }

  // ── 1. 用户前置 Hook ──
  config = preprocess(config) || config;

  // ── 2. 节点增删 ──
  var proxies = config.proxies || [];
  if (EXCLUDE_PROXIES.length > 0) {
    var drop = {};
    for (var d = 0; d < EXCLUDE_PROXIES.length; d++) drop[EXCLUDE_PROXIES[d]] = true;
    var kept = [];
    for (var p = 0; p < proxies.length; p++) {
      if (!drop[proxies[p].name]) kept.push(proxies[p]);
    }
    if (kept.length !== proxies.length) {
      log("剔除黑名单节点 " + (proxies.length - kept.length) + " 个");
    }
    proxies = kept;
  }
  if (EXTRA_PROXIES.length > 0) {
    proxies = proxies.concat(EXTRA_PROXIES);
    log("注入自建节点 " + EXTRA_PROXIES.length + " 个");
  }
  if (proxies.length > 0) config.proxies = proxies;

  // ── 3. 基础档案 ──
  config.profile = { "store-selected": true, "store-fake-ip": true };

  // ── 4. Geo 设置 ──
  config["geodata-loader"] = "standard";
  config["geosite-matcher"] = "mph";

  // ── 5. 全局指纹 ──
  config["global-client-fingerprint"] = "chrome";
  if (FEATURES.injectGlobalUa) config["global-ua"] = "chrome";

  // ── 6. 性能开关 ──
  if (FEATURES.unifiedDelay) config["unified-delay"] = true;
  if (FEATURES.tcpConcurrent) config["tcp-concurrent"] = true;

  // ── 7. DNS 与嗅探 ──
  config.foreign_nameservers = FOREIGN_NAMESERVERS;
  config.domestic_nameservers = DOMESTIC_NAMESERVERS;
  config.dns = buildDnsConfig();
  if (FEATURES.sniffEnabled) config.sniffer = buildSnifferConfig();

  // ── 8. 规则（自定义规则 + 快捷域名 + 内置规则集） ──
  var expanded = [];
  for (var cd = 0; cd < CUSTOM_DOMAINS.length; cd++) {
    var item = CUSTOM_DOMAINS[cd];
    if (item && item.domain) {
      expanded.push("DOMAIN-SUFFIX," + item.domain + "," + (item.target || "节点选择"));
    }
  }
  var mergedRules = CUSTOM_RULES.concat(expanded).concat(buildRules([]));
  if (FEATURES.dedupeRules) {
    var result = dedupeRules(mergedRules);
    if (result.duplicates > 0) log("规则去重：移除 " + result.duplicates + " 条重复项");
    config.rules = result.rules;
  } else {
    config.rules = mergedRules;
  }
  config["rule-providers"] = buildRuleProviders();

  // ── 9. 代理组 ──
  config["proxy-groups"] = buildProxyGroups();
  addRegions(config, log);

  // ── 10. 额外代理组 ──
  if (EXTRA_GROUPS.length > 0) {
    config["proxy-groups"] = config["proxy-groups"].concat(EXTRA_GROUPS);
  }

  // ── 11. 用户后置 Hook ──
  config = postprocess(config) || config;

  // ── 12. 终检 ──
  if (FEATURES.validateGroupRefs) {
    var errors = validateConfig(config);
    if (errors.length > 0) {
      throw new Error("[clash-script] 配置校验失败：\n  - " + errors.join("\n  - "));
    }
  }

  log(
    "装配完成：" +
      config.rules.length +
      " 条规则 / " +
      config["proxy-groups"].length +
      " 个代理组"
  );
  return config;
}
