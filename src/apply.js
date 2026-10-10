/**
 * 配置装配核心。
 *
 * 这是「单一事实来源」：静态 YAML 与全局扩展脚本两条交付链路
 * 都调用同一个 applyBuiltinConfig()，因此它们的分流行为必然一致 ——
 * 不会出现「订阅来的 YAML」和「本地挂的脚本」结果对不上的情况。
 */

import {
  customRules as settingsCustomRules,
  domesticNameservers,
  features,
  foreignNameservers,
} from "../config/settings.js";
import { rules as baseRules } from "../config/rules.js";
import { ruleProviders } from "../config/rule-providers.js";
import { proxyGroups } from "../config/groups.js";
import { dnsConfig, snifferConfig } from "../config/dns.js";
import { applyUserLayer, expandCustomDomains, userHooks } from "../config/user.js";
import { addRegions } from "./regions.js";
import { createLogger, dedupeRules, validateConfig } from "./validate.js";

/**
 * 把内置配置注入到订阅配置上。
 *
 * @param {object} config 原始订阅配置（会被就地修改）
 * @param {object} [options]
 * @param {object} [options.logger]
 * @returns {object} 处理后的配置
 */
export function applyBuiltinConfig(config, options = {}) {
  const logger = options.logger || createLogger();

  // ── 0. 前置校验：没有代理就说明订阅拿错了 ──
  const proxyCount = config?.proxies?.length ?? 0;
  const providerCount =
    config && typeof config["proxy-providers"] === "object"
      ? Object.keys(config["proxy-providers"]).length
      : 0;
  if (proxyCount === 0 && providerCount === 0) {
    throw new Error("配置文件中未找到任何代理：proxies 与 proxy-providers 均为空");
  }
  logger.log(`检测到 ${proxyCount} 个内联节点 / ${providerCount} 个节点提供者`);

  // ── 1. 用户预处理 Hook ──
  if (typeof userHooks.preprocess === "function") {
    config = userHooks.preprocess(config) || config;
  }

  // ── 2. 基础档案 ──
  config.profile = { "store-selected": true, "store-fake-ip": true };

  // ── 3. Geo 数据加载方式 ──
  // standard: 单文件全量加载，启动慢但查询快；配合 mrs 格式足够轻量
  config["geodata-loader"] = "standard";
  config["geosite-matcher"] = "mph";

  // ── 4. 全局指纹 ──
  // 让所有节点呈现一致的 TLS 指纹与 UA，减少被识别为代理客户端的概率
  config["global-client-fingerprint"] = "chrome";
  if (features.injectGlobalUa) config["global-ua"] = "chrome";

  // ── 5. 性能开关 ──
  if (features.unifiedDelay) config["unified-delay"] = true;
  if (features.tcpConcurrent) config["tcp-concurrent"] = true;

  // ── 6. DNS ──
  config.foreign_nameservers = foreignNameservers;
  config.domestic_nameservers = domesticNameservers;
  config.dns = dnsConfig;
  config.sniffer = snifferConfig;

  // ── 7. 规则 ──
  const mergedRules = [
    ...settingsCustomRules,
    ...expandCustomDomains(),
    ...baseRules,
  ];
  if (features.dedupeRules) {
    const { rules, duplicates } = dedupeRules(mergedRules);
    if (duplicates.length > 0) logger.warn(`规则去重：移除 ${duplicates.length} 条重复项`);
    config.rules = rules;
  } else {
    config.rules = mergedRules;
  }
  config["rule-providers"] = ruleProviders;

  // ── 8. 代理组（先建静态组，再挂地区组） ──
  config["proxy-groups"] = proxyGroups.map((g) => ({ ...g }));
  addRegions(config, logger);

  // ── 9. 用户扩展层（节点增删、额外组、后处理 Hook） ──
  config = applyUserLayer(config, {
    log: (m) => logger.log(m),
    warn: (m) => logger.warn(m),
  });

  // ── 10. 终检 ──
  if (features.validateGroupRefs) {
    const errors = validateConfig(config);
    if (errors.length > 0) {
      // 引用错误直接抛：带着错误上线的配置会让客户端整份拒绝加载
      throw new Error(`配置校验失败：\n  - ${errors.join("\n  - ")}`);
    }
  }

  logger.log(`装配完成：${config.rules.length} 条规则 / ${config["proxy-groups"].length} 个代理组`);
  return config;
}
