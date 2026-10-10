/**
 * 地区分组生成器。
 *
 * 从节点名里识别地区、聚合成 url-test 组，并把地区组挂进相关代理组。
 *
 * 与原始实现相比，这里修正了两个容易踩的问题：
 *
 * 1. `noproxies` 的语义是「本轮还没被任何地区 matcher 收走的剩余节点」，
 *    必须持续收敛；原实现遇到第一个无 matcher 的兜底桶就直接 break，
 *    导致其后的地区永远收不到节点。
 * 2. 地区组插入位置与「地区选择」组的插入位置需要按名字定位，
 *    不能依赖固定下标 —— 下标会随代理组数量变化而漂移。
 */

import { groupBaseOption, testInterval, testTolerance } from "../config/settings.js";
import { regionConfig } from "../config/regions.js";

const WORLD_MAP_ICON =
  "https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/World_Map.png";

/** 地区组统一的构造参数。 */
const regionGroupBase = {
  ...groupBaseOption,
  type: "url-test",
  interval: testInterval,
  tolerance: testTolerance,
};

/**
 * 基于「订阅链接模式」（proxy-providers）生成地区组。
 * 此时节点在运行时才拉取，只能用 use + filter 表达。
 */
function buildFromProviders(config) {
  const providers = config["proxy-providers"];
  if (!providers || typeof providers !== "object") return [];
  const keys = Object.keys(providers);
  if (keys.length === 0) return [];

  const groups = [];
  const collected = [];
  // 按顺序累积「已占用」的 matcher，兜底桶用 exclude-filter 排除它们
  let excludeFilter = "";

  for (const region of regionConfig) {
    if (!region.name) continue;
    if (region.matcher) {
      excludeFilter += excludeFilter === "" ? region.matcher : `|${region.matcher}`;
      groups.push({
        ...regionGroupBase,
        name: region.name,
        use: keys,
        filter: region.matcher,
        icon: region.icon,
      });
    } else {
      groups.push({
        ...regionGroupBase,
        name: region.name,
        use: keys,
        ...(excludeFilter ? { "exclude-filter": excludeFilter } : {}),
        icon: region.icon,
      });
    }
    collected.push(region.name);
  }
  return collected.length > 0 ? groups : [];
}

/**
 * 基于「内联节点模式」（config.proxies）生成地区组。
 * 此时节点名已知，直接筛出名单填进 proxies。
 */
function buildFromProxies(config) {
  const names = (config.proxies || []).map((p) => p.name).filter(Boolean);
  if (names.length === 0) return [];

  const groups = [];
  const collected = [];
  // pool 逐步收缩：每命中一个地区就从池子里移除，避免同一节点进多个地区组
  let pool = [...names];

  for (const region of regionConfig) {
    if (!region.name) continue;

    let matched = [];
    if (!region.matcher) {
      // 兜底桶：收走剩余全部
      matched = [...pool];
    } else {
      const patterns = region.matcher.split("|").filter(Boolean);
      matched = pool.filter((name) => patterns.some((p) => name.includes(p)));
    }
    if (matched.length === 0) continue;

    // 从池中移除已归属的节点（用 Set 做 O(1) 查找）
    const taken = new Set(matched);
    pool = pool.filter((n) => !taken.has(n));

    groups.push({
      ...regionGroupBase,
      name: region.name,
      proxies: matched,
      icon: region.icon,
    });
    collected.push(region.name);
  }

  return groups;
}

/**
 * 生成地区组并挂载。
 *
 * 挂载规则：
 * - 「地区选择」新建一个 select 组，作为全部地区组的入口，插在索引 1 处
 * - 「节点选择」把「地区选择」插到第 3 位（延迟选优、手动选择 之后）
 * - 「全局直连」追加「地区选择」到末尾
 * - 其余 select 且非 include-all 的组，追加全部地区组
 *
 * @param {object} config 就地修改的配置对象
 * @param {object} logger
 * @returns {string[]} 已生成的地区组名
 */
export function addRegions(config, logger) {
  const groups = config["proxy-groups"] || [];
  const generated = config.proxies && config.proxies.length > 0
    ? buildFromProxies(config)
    : buildFromProviders(config);

  if (generated.length === 0) {
    logger?.warn("未能识别任何地区分组，跳过地区组挂载");
    return [];
  }

  const regions = generated.map((g) => g.name);
  groups.push(...generated);

  // ── 把地区组挂进既有代理组 ──
  for (const entry of groups) {
    if (!entry || !Array.isArray(entry.proxies)) continue;

    if (entry.name === "节点选择") {
      // 只在有实际可选内容时才插，避免把只有一个成员的组撑开
      if (entry.type === "select" && entry.proxies.length > 1 && !entry.proxies.includes("地区选择")) {
        entry.proxies.splice(2, 0, "地区选择");
      }
    } else if (entry.name === "全局直连") {
      if (!entry.proxies.includes("地区选择")) entry.proxies.push("地区选择");
    } else if (entry.type === "select" && !Object.prototype.hasOwnProperty.call(entry, "include-all")) {
      for (const r of regions) {
        if (!entry.proxies.includes(r)) entry.proxies.push(r);
      }
    }
  }

  // ── 新建「地区选择」入口组 ──
  if (!groups.some((g) => g && g.name === "地区选择")) {
    const entryGroup = {
      ...groupBaseOption,
      name: "地区选择",
      type: "select",
      proxies: regions,
      icon: WORLD_MAP_ICON,
    };
    groups.splice(1, 0, entryGroup);
  }

  config["proxy-groups"] = groups;
  logger?.log(`已生成 ${regions.length} 个地区分组`);
  return regions;
}
