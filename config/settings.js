/**
 * 全局可调参数。
 *
 * 这一层刻意与「数据结构层」分离：调参只需要改这里，
 * 不必进入 rules / proxyGroups / ruleProviders 的具体定义。
 */

/** 延迟测试地址。generate_204 返回体极小，适合高频探测。 */
export const testUrl = "http://www.google.com/generate_204";

/** 延迟测试间隔（秒）。越大越省流量，越小节点切换越灵敏。 */
export const testInterval = 240;

/** 切换容差（毫秒）。差值超过该值才切换节点；调小则切换更频繁。 */
export const testTolerance = 80;

/**
 * 国内 DNS。
 * 只保留最快的一个 —— 配置多个会带来并行查询开销，
 * 表现为访问变慢与内核内存占用上升。
 */
export const domesticNameservers = [
  "tls://223.5.5.5", // 阿里云公共 DNS
];

/** 国外 DNS。同样遵循「只写最快的一个」原则。 */
export const foreignNameservers = [
  "tls://dns.opendns.com", // OpenDNS
];

/** 规则集通用配置：远程拉取、mrs 二进制格式、一天刷新一次。 */
export const ruleProviderCommon = {
  type: "http",
  format: "mrs",
  interval: 86400,
};

/** 代理组通用配置。 */
export const groupBaseOption = {
  interval: 300,
  timeout: 3000,
  url: testUrl,
  lazy: true,
  hidden: false,
  "disable-udp": false,
};

/**
 * 自定义代理规则。
 * 会在所有 RULE-SET 之前优先生效，用于覆盖默认分流结果。
 * 例如把某个域名强制走直连：`DOMAIN-SUFFIX,example.com,全局直连`
 */
export const customRules = [
  // 在此添加自定义代理规则
];

/** 全局扩展脚本的开关集合。渲染静态 YAML 时这些开关同样生效。 */
export const features = {
  /** 规则去重（保留先出现的一条，因为它优先级更高） */
  dedupeRules: true,
  /** 渲染时校验代理组引用是否都有指向 */
  validateGroupRefs: true,
  /** 给未声明 ua 的代理补一个统一 UA */
  injectGlobalUa: true,
  /** 开启 TCP 并发握手 */
  tcpConcurrent: true,
  /** 统一延迟口径 */
  unifiedDelay: true,
};
