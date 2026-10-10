/**
 * 规则集（rule-providers）定义。
 *
 * 数据源以 MetaCubeX/meta-rules-dat 的 mrs 二进制为主 ——
 * 相比传统 yaml 文本规则集，mrs 体积小一个数量级，解析更快、内存占用更低。
 * 少数国内不覆盖的类别（ai、games-cn）由 DustinWin/ruleset_geodata 补齐。
 */

import { ruleProviderCommon } from "./settings.js";

const META_RULES = "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo";
const DUSTINWIN = "https://github.com/DustinWin/ruleset_geodata/releases/download/mihomo-ruleset";
// jsdelivr 加速指向同一份数据，用于国内网络下首次拉取 geoip 大文件
const JSDELIVR = "https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo";

/** 断言：任何规则集都必须同时具备 behavior 与 url，否则渲染阶段直接报错。 */
const define = (provider) => {
  if (!provider.behavior || !provider.url) {
    throw new Error(`规则集定义不完整，缺少 behavior 或 url: ${JSON.stringify(provider)}`);
  }
  return { ...ruleProviderCommon, ...provider };
};

export const ruleProviders = {
  // ── CIDR 类 ──
  ipdirect: define({
    behavior: "ipcidr",
    url: `${JSDELIVR}/geoip/cn.mrs`,
    path: "./ruleset/cncidr.mrs",
  }),
  ipprivate: define({
    behavior: "ipcidr",
    url: `${JSDELIVR}/geoip/private.mrs`,
    path: "./ruleset/lancidr.mrs",
  }),
  telegramcidr: define({
    behavior: "ipcidr",
    url: `${META_RULES}/geoip/telegram.mrs`,
    path: "./ruleset/telegramcidr.mrs",
  }),
  netflix_ip: define({
    behavior: "ipcidr",
    url: `${META_RULES}/geoip/netflix.mrs`,
    path: "./ruleset/netflix-ip.mrs",
  }),

  // ── 基础域名类 ──
  direct: define({
    behavior: "domain",
    url: `${JSDELIVR}/geosite/cn.mrs`,
    path: "./ruleset/direct.mrs",
  }),
  private: define({
    behavior: "domain",
    url: `${JSDELIVR}/geosite/private.mrs`,
    path: "./ruleset/private.mrs",
  }),

  // ── 服务分项 ──
  google: define({
    behavior: "domain",
    url: `${META_RULES}/geosite/google.mrs`,
    path: "./ruleset/google.mrs",
  }),
  microsoft: define({
    behavior: "domain",
    url: `${META_RULES}/geosite/microsoft.mrs`,
    path: "./ruleset/microsoft.mrs",
  }),
  apple: define({
    behavior: "domain",
    url: `${META_RULES}/geosite/apple.mrs`,
    path: "./ruleset/apple.mrs",
  }),
  bing: define({
    behavior: "domain",
    url: `${META_RULES}/geosite/bing.mrs`,
    path: "./ruleset/bing.mrs",
  }),
  github: define({
    behavior: "domain",
    url: `${META_RULES}/geosite/github.mrs`,
    path: "./ruleset/github.mrs",
  }),
  onedrive: define({
    behavior: "domain",
    url: `${META_RULES}/geosite/onedrive.mrs`,
    path: "./ruleset/onedrive.mrs",
  }),
  youtube: define({
    behavior: "domain",
    url: `${META_RULES}/geosite/youtube.mrs`,
    path: "./ruleset/youtube.mrs",
  }),
  pornhub: define({
    behavior: "domain",
    url: `${META_RULES}/geosite/pornhub.mrs`,
    path: "./ruleset/pornhub.mrs",
  }),
  netflix_site: define({
    behavior: "domain",
    url: `${META_RULES}/geosite/netflix.mrs`,
    path: "./ruleset/netflix-site.mrs",
  }),
  adobe: define({
    behavior: "domain",
    url: `${META_RULES}/geosite/adobe.mrs`,
    path: "./ruleset/adobe.mrs",
  }),
  bilibili: define({
    behavior: "domain",
    url: `${META_RULES}/geosite/bilibili.mrs`,
    path: "./ruleset/bilibili.mrs",
  }),
  tiktok: define({
    behavior: "domain",
    url: `${META_RULES}/geosite/tiktok.mrs`,
    path: "./ruleset/tiktok.mrs",
  }),
  spotify: define({
    behavior: "domain",
    url: `${META_RULES}/geosite/spotify.mrs`,
    path: "./ruleset/spotify.mrs",
  }),
  speedtest: define({
    behavior: "domain",
    url: `${META_RULES}/geosite/speedtest.mrs`,
    path: "./ruleset/speedtest.mrs",
  }),

  // ── 第三方补充：AI 与国服游戏 ──
  ai: define({
    behavior: "domain",
    url: `${DUSTINWIN}/ai.mrs`,
    path: "./ruleset/ai.mrs",
  }),
  games: define({
    behavior: "domain",
    url: `${DUSTINWIN}/games-cn.mrs`,
    path: "./ruleset/games.mrs",
  }),

  // ── 兜底代理类 ──
  proxy: define({
    behavior: "domain",
    url: `${META_RULES.replace("/geo", "/geo-lite")}/geosite/proxy.mrs`,
    path: "./ruleset/proxy.mrs",
  }),
  gfw: define({
    behavior: "domain",
    url: `${META_RULES}/geosite/gfw.mrs`,
    path: "./ruleset/gfw.mrs",
  }),
  "tld-not-cn": define({
    behavior: "domain",
    url: `${META_RULES}/geosite/tld-!cn.mrs`,
    path: "./ruleset/tld-not-cn.mrs",
  }),
};
