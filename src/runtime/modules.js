/**
 * 运行时模块集合（扩展脚本专用）。
 *
 * 本文件在构建时会被 src/build.js 内联进 dist/script.js ——
 * 因此它必须保持「零 import、自包含」，所有依赖在本文件内定义。
 * 逻辑与 config/、src/ 下的模块保持一致，但刻意不去引用它们：
 * 扩展脚本要在客户端沙箱里独立运行，不能依赖打包器解析模块关系。
 */

// ══════════════════════════════════════════════════════════
// 1. 可调参数
// ══════════════════════════════════════════════════════════

var TEST_URL = "http://www.google.com/generate_204";
var TEST_INTERVAL = 240;
var TEST_TOLERANCE = 80;

var DOMESTIC_NAMESERVERS = ["tls://223.5.5.5"];
var FOREIGN_NAMESERVERS = ["tls://dns.opendns.com"];

var RULE_PROVIDER_COMMON = { type: "http", format: "mrs", interval: 86400 };

var GROUP_BASE_OPTION = {
  interval: 300,
  timeout: 3000,
  url: TEST_URL,
  lazy: true,
  hidden: false,
  "disable-udp": false,
};

/** 功能开关：置 false 可单独关闭某项增强，便于排查问题。 */
var FEATURES = {
  dedupeRules: true,
  validateGroupRefs: true,
  injectGlobalUa: true,
  tcpConcurrent: true,
  unifiedDelay: true,
  enableRegionGroups: true,
  sniffEnabled: true,
  logSummary: true,
};

// ══════════════════════════════════════════════════════════
// 2. 常量
// ══════════════════════════════════════════════════════════

var META_RULES = "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo";
var DUSTINWIN = "https://github.com/DustinWin/ruleset_geodata/releases/download/mihomo-ruleset";
var JSDELIVR = "https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo";

var ICON_AIRPORT = "https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color";
var ICON_VERGE =
  "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons";
var ICON_FLAG =
  "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags";

// ══════════════════════════════════════════════════════════
// 3. 规则集定义
// ══════════════════════════════════════════════════════════

function ruleProvider(behavior, url, path) {
  return { type: "http", format: "mrs", interval: 86400, behavior: behavior, url: url, path: path };
}

function buildRuleProviders() {
  return {
    ipdirect: ruleProvider("ipcidr", JSDELIVR + "/geoip/cn.mrs", "./ruleset/cncidr.mrs"),
    ipprivate: ruleProvider("ipcidr", JSDELIVR + "/geoip/private.mrs", "./ruleset/lancidr.mrs"),
    telegramcidr: ruleProvider("ipcidr", META_RULES + "/geoip/telegram.mrs", "./ruleset/telegramcidr.mrs"),
    netflix_ip: ruleProvider("ipcidr", META_RULES + "/geoip/netflix.mrs", "./ruleset/netflix-ip.mrs"),

    direct: ruleProvider("domain", JSDELIVR + "/geosite/cn.mrs", "./ruleset/direct.mrs"),
    private: ruleProvider("domain", JSDELIVR + "/geosite/private.mrs", "./ruleset/private.mrs"),

    google: ruleProvider("domain", META_RULES + "/geosite/google.mrs", "./ruleset/google.mrs"),
    microsoft: ruleProvider("domain", META_RULES + "/geosite/microsoft.mrs", "./ruleset/microsoft.mrs"),
    apple: ruleProvider("domain", META_RULES + "/geosite/apple.mrs", "./ruleset/apple.mrs"),
    bing: ruleProvider("domain", META_RULES + "/geosite/bing.mrs", "./ruleset/bing.mrs"),
    github: ruleProvider("domain", META_RULES + "/geosite/github.mrs", "./ruleset/github.mrs"),
    onedrive: ruleProvider("domain", META_RULES + "/geosite/onedrive.mrs", "./ruleset/onedrive.mrs"),
    youtube: ruleProvider("domain", META_RULES + "/geosite/youtube.mrs", "./ruleset/youtube.mrs"),
    pornhub: ruleProvider("domain", META_RULES + "/geosite/pornhub.mrs", "./ruleset/pornhub.mrs"),
    netflix_site: ruleProvider("domain", META_RULES + "/geosite/netflix.mrs", "./ruleset/netflix-site.mrs"),
    adobe: ruleProvider("domain", META_RULES + "/geosite/adobe.mrs", "./ruleset/adobe.mrs"),
    bilibili: ruleProvider("domain", META_RULES + "/geosite/bilibili.mrs", "./ruleset/bilibili.mrs"),
    tiktok: ruleProvider("domain", META_RULES + "/geosite/tiktok.mrs", "./ruleset/tiktok.mrs"),
    spotify: ruleProvider("domain", META_RULES + "/geosite/spotify.mrs", "./ruleset/spotify.mrs"),
    speedtest: ruleProvider("domain", META_RULES + "/geosite/speedtest.mrs", "./ruleset/speedtest.mrs"),

    ai: ruleProvider("domain", DUSTINWIN + "/ai.mrs", "./ruleset/ai.mrs"),
    games: ruleProvider("domain", DUSTINWIN + "/games-cn.mrs", "./ruleset/games.mrs"),

    proxy: ruleProvider(
      "domain",
      "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo-lite/geosite/proxy.mrs",
      "./ruleset/proxy.mrs"
    ),
    gfw: ruleProvider("domain", META_RULES + "/geosite/gfw.mrs", "./ruleset/gfw.mrs"),
    "tld-not-cn": ruleProvider("domain", META_RULES + "/geosite/tld-!cn.mrs", "./ruleset/tld-not-cn.mrs"),
  };
}

// ══════════════════════════════════════════════════════════
// 4. 分流规则
// ══════════════════════════════════════════════════════════

function buildRules(customRules) {
  return [].concat(
    customRules || [],
    [
      "RULE-SET,ipdirect,全局直连,no-resolve",
      "RULE-SET,ipprivate,全局直连,no-resolve",
      "RULE-SET,telegramcidr,电报消息,no-resolve",
      "RULE-SET,direct,全局直连",
      "RULE-SET,private,全局直连",
      "RULE-SET,google,谷歌服务",
      "RULE-SET,apple,苹果服务",
      "RULE-SET,bing,Bing",
      "RULE-SET,github,Github",
      "RULE-SET,onedrive,Onedrive",
      "RULE-SET,microsoft,微软服务",
      "RULE-SET,ai,AI",
      "RULE-SET,youtube,YouTube",
      "RULE-SET,netflix_ip,Netflix",
      "RULE-SET,netflix_site,Netflix",
      "RULE-SET,tiktok,TikTok",
      "RULE-SET,adobe,Adobe",
      "RULE-SET,pornhub,Pornhub",
      "RULE-SET,spotify,Spotify",
      "RULE-SET,games,游戏服务",
      "RULE-SET,speedtest,网速测试",
      "RULE-SET,bilibili,Bilibili",
      "RULE-SET,proxy,节点选择",
      "RULE-SET,gfw,节点选择",
      "RULE-SET,tld-not-cn,节点选择",
      "MATCH,漏网之鱼",
    ]
  );
}

// ══════════════════════════════════════════════════════════
// 5. 代理组定义
// ══════════════════════════════════════════════════════════

function buildProxyGroups() {
  function group(name, type, proxies, icon, extra) {
    var g = {
      interval: GROUP_BASE_OPTION.interval,
      timeout: GROUP_BASE_OPTION.timeout,
      url: GROUP_BASE_OPTION.url,
      lazy: GROUP_BASE_OPTION.lazy,
      hidden: GROUP_BASE_OPTION.hidden,
      "disable-udp": GROUP_BASE_OPTION["disable-udp"],
      name: name,
      type: type,
      icon: icon,
    };
    if (proxies) g.proxies = proxies;
    if (extra) {
      for (var k in extra) {
        if (Object.prototype.hasOwnProperty.call(extra, k)) g[k] = extra[k];
      }
    }
    return g;
  }

  var MAIN = "节点选择";
  var MANUAL = "手动选择";
  var DIRECT = "全局直连";
  var AUTO = "延迟选优";
  var FALLBACK = "故障转移";

  var proxyFirst = [MAIN, MANUAL, DIRECT, AUTO, FALLBACK];
  var directFirst = [DIRECT, MAIN, MANUAL, AUTO, FALLBACK];
  var proxyOnly = [MAIN, MANUAL, AUTO, FALLBACK];

  return [
    group(MAIN, "select", [AUTO, MANUAL, FALLBACK, "负载均衡(散列)", "负载均衡(轮询)"], ICON_AIRPORT + "/Airport.png"),
    group(MANUAL, "select", null, ICON_VERGE + "/adjust.svg", { "include-all": true }),
    group("漏网之鱼", "select", [DIRECT, MAIN, MANUAL, AUTO, FALLBACK], ICON_VERGE + "/fish.svg"),
    group("Bing", "select", directFirst, "https://www.bing.com/favicon.ico"),
    group("Github", "select", proxyFirst, "https://www.clashverge.dev/assets/icons/github.svg"),
    group("谷歌服务", "select", proxyFirst, "https://www.clashverge.dev/assets/icons/google.svg"),
    group("苹果服务", "select", directFirst, "https://www.clashverge.dev/assets/icons/apple.svg"),
    group("微软服务", "select", directFirst, ICON_VERGE + "/microsoft.svg"),
    group("Onedrive", "select", directFirst, ICON_AIRPORT + "/OneDrive.png"),
    group("AI", "select", directFirst, "https://www.clashverge.dev/assets/icons/chatgpt.svg"),
    // Bilibili 国内 CDN 完善，固定直连
    group("Bilibili", "select", [DIRECT], "https://fastly.jsdelivr.net/gh/Orz-3/mini@master/Color/Bili.png"),
    group("YouTube", "select", proxyOnly, ICON_VERGE + "/youtube.svg"),
    group("Netflix", "select", proxyOnly, "https://www.clashverge.dev/assets/icons/netflix.svg"),
    group("TikTok", "select", proxyOnly, "https://fastly.jsdelivr.net/gh/shindgewongxj/WHATSINStash@master/icon/tiktok.png"),
    group("Pornhub", "select", proxyOnly, ICON_AIRPORT + "/Pornhub_1.png"),
    group("Spotify", "select", directFirst, ICON_AIRPORT + "/Spotify.png"),
    // 保留 REJECT 出口，可直接屏蔽 Adobe 授权校验
    group("Adobe", "select", [DIRECT, "REJECT", MAIN], "https://www.adobe.com/favicon.ico"),
    group("游戏服务", "select", directFirst, "https://www.clashverge.dev/assets/icons/steam.svg"),
    group("电报消息", "select", proxyOnly, ICON_VERGE + "/telegram.svg"),
    group("网速测试", "select", [DIRECT], ICON_AIRPORT + "/Speedtest.png", { "include-all": true }),
    group("负载均衡(轮询)", "load-balance", null, ICON_VERGE + "/balance.svg", {
      strategy: "round-robin",
      "include-all": true,
    }),
    group("负载均衡(散列)", "load-balance", null, ICON_VERGE + "/merry_go.svg", {
      strategy: "consistent-hashing",
      "include-all": true,
    }),
    group(FALLBACK, "fallback", null, ICON_VERGE + "/ambulance.svg", { "include-all": true }),
    group(DIRECT, "select", ["DIRECT", "REJECT", MAIN, MANUAL], ICON_VERGE + "/link.svg"),
    group(AUTO, "url-test", null, ICON_VERGE + "/speed.svg", {
      interval: TEST_INTERVAL,
      tolerance: TEST_TOLERANCE,
      "include-all": true,
    }),
  ];
}

// ══════════════════════════════════════════════════════════
// 6. 地区配置
// ══════════════════════════════════════════════════════════

function buildRegionConfig() {
  return [
    { name: "🇺🇸 美国 📶", matcher: "美国|🇺🇸|US|United States|America", icon: ICON_FLAG + "/us.svg" },
    { name: "🇯🇵 日本 📶", matcher: "日本|🇯🇵|JP|Japan", icon: ICON_FLAG + "/jp.svg" },
    { name: "🇰🇷 韩国 📶", matcher: "韩|🇰🇷|kr|korea", icon: ICON_FLAG + "/kr.svg" },
    { name: "🇸🇬 新加坡 📶", matcher: "新加坡|🇸🇬|SG|狮城|Singapore", icon: ICON_FLAG + "/sg.svg" },
    { name: "🇭🇰 香港 📶", matcher: "香港|🇭🇰|HK|Hong Kong|HongKong", icon: ICON_FLAG + "/hk.svg" },
    { name: "🇨🇳 台湾 📶", matcher: "台湾|🇹🇼|tw|taiwan|tai wan", icon: ICON_FLAG + "/tw.svg" },
    { name: "🇬🇧 英国 📶", matcher: "英|🇬🇧|uk|united kingdom|great britain", icon: ICON_FLAG + "/gb.svg" },
    { name: "🇫🇷 法国 📶", matcher: "法国|🇫🇷|FR|France", icon: ICON_FLAG + "/fr.svg" },
    { name: "🇩🇪 德国 📶", matcher: "德国|🇩🇪|DE|germany", icon: ICON_FLAG + "/de.svg" },
    { name: "🇵🇱 波兰 📶", matcher: "波兰|🇵🇱|Poland|PL", icon: ICON_FLAG + "/pl.svg" },
    { name: "🇳🇱 荷兰 📶", matcher: "荷兰|🇳🇱|NL|Netherlands", icon: ICON_FLAG + "/nl.svg" },
    { name: "🇮🇪 爱尔兰 📶", matcher: "爱尔兰|🇮🇪|IE|Ireland", icon: ICON_FLAG + "/ie.svg" },
    { name: "🇸🇪 瑞典 📶", matcher: "瑞典|🇸🇪|SE|Sweden", icon: ICON_FLAG + "/se.svg" },
    { name: "🇷🇺 俄罗斯 📶", matcher: "俄罗斯|🇷🇺|RU|Russia", icon: ICON_FLAG + "/ru.svg" },
    { name: "🇮🇹 意大利 📶", matcher: "意大利|🇮🇹|IT|Italy", icon: ICON_FLAG + "/it.svg" },
    { name: "🇪🇸 西班牙 📶", matcher: "西班牙|🇪🇸|ES|Spain", icon: ICON_FLAG + "/es.svg" },
    { name: "🇵🇹 葡萄牙 📶", matcher: "葡萄牙|🇵🇹|PT|Portugal", icon: ICON_FLAG + "/pt.svg" },
    { name: "🇹🇷 土耳其 📶", matcher: "土耳其|🇹🇷|TR|Turkey", icon: ICON_FLAG + "/tr.svg" },
    { name: "🇦🇷 阿根廷 📶", matcher: "阿根廷|🇦🇷|AR|Argentina", icon: ICON_FLAG + "/ar.svg" },
    { name: "🇨🇦 加拿大 📶", matcher: "加拿大|🇨🇦|CA|Canada", icon: ICON_FLAG + "/ca.svg" },
    { name: "🇦🇺 澳大利亚 📶", matcher: "澳大利亚|🇦🇺|AU|Australia", icon: ICON_FLAG + "/au.svg" },
    { name: "🇮🇷 伊朗 📶", matcher: "伊朗|🇮🇷|IR|Iran", icon: ICON_FLAG + "/ir.svg" },
    { name: "🇮🇩 印度尼西亚 📶", matcher: "印度尼西亚|印尼|🇮🇩|ID|Indonesia", icon: ICON_FLAG + "/id.svg" },
    { name: "🇲🇾 马来西亚 📶", matcher: "马来|🇲🇾|MY|Malaysia", icon: ICON_FLAG + "/my.svg" },
    { name: "🇵🇭 菲律宾 📶", matcher: "菲律宾|🇵🇭|PH|Philippines", icon: ICON_FLAG + "/ph.svg" },
    { name: "🇮🇳 印度 📶", matcher: "印度|🇮🇳|IN|India", icon: ICON_FLAG + "/in.svg" },
    { name: "🇻🇳 越南 📶", matcher: "越南|🇻🇳|VN|Vietnam", icon: ICON_FLAG + "/vn.svg" },
    { name: "🇹🇭 泰国 📶", matcher: "泰国|🇹🇭|TH|Thailand", icon: ICON_FLAG + "/th.svg" },
    { name: "🇨🇳 中国 📶", matcher: "中国|🇨🇳|CN|china", icon: ICON_FLAG + "/cn.svg" },
    { name: "🌐 其他 📶", icon: ICON_AIRPORT + "/Global.png" },
  ];
}

// ══════════════════════════════════════════════════════════
// 7. DNS 与嗅探
// ══════════════════════════════════════════════════════════

function buildDnsConfig() {
  return {
    enable: true,
    ipv6: true,
    "prefer-h3": false,
    "use-hosts": false,
    "use-system-hosts": true,
    listen: "0.0.0.0:1053",
    "cache-algorithm": "arc",
    "enhanced-mode": "fake-ip",
    "fake-ip-range": "198.18.0.1/16",
    "fake-ip-filter-mode": "blacklist",
    "fake-ip-filter": [
      "+.lan",
      "+.local",
      "+.msftconnecttest.com",
      "+.msftncsi.com",
      "localhost.ptlogin2.qq.com",
      "localhost.sec.qq.com",
      "localhost.work.weixin.qq.com",
      "*.localdomain",
      "*.example",
      "*.invalid",
      "*.localhost",
      "*.test",
      "*.local",
      "*.home.arpa",
    ],
    nameserver: DOMESTIC_NAMESERVERS.slice(),
    "proxy-server-nameserver": FOREIGN_NAMESERVERS.concat(DOMESTIC_NAMESERVERS),
    "nameserver-policy": {},
  };
}

function buildSnifferConfig() {
  return {
    enable: true,
    "force-dns-mapping": true,
    "parse-pure-ip": true,
    "override-destination": true,
    sniff: {
      TLS: { ports: [443, 8443] },
      HTTP: { ports: [80, "8080-8880"], "override-destination": true },
      QUIC: { ports: [443, 8443] },
    },
  };
}

// ══════════════════════════════════════════════════════════
// 8. 工具函数
// ══════════════════════════════════════════════════════════

function dedupeRules(rules) {
  var seen = {};
  var out = [];
  var dup = 0;
  for (var i = 0; i < rules.length; i++) {
    var r = rules[i];
    if (seen[r]) {
      dup++;
      continue;
    }
    seen[r] = true;
    out.push(r);
  }
  return { rules: out, duplicates: dup };
}

function collectRuleTargets(rules) {
  var targets = {};
  for (var i = 0; i < rules.length; i++) {
    var parts = rules[i].split(",");
    if (parts.length < 2) continue;
    var type = parts[0].trim().toUpperCase();
    if (type === "MATCH") {
      targets[parts[1].trim()] = true;
    } else if (parts.length >= 3) {
      targets[parts[2].trim()] = true;
    }
  }
  return targets;
}

function validateConfig(config) {
  var errors = [];
  var groups = config["proxy-groups"] || [];
  var groupNames = {};
  var proxyNames = { DIRECT: true, REJECT: true, "REJECT-DROP": true, PASS: true, GLOBAL: true };

  for (var i = 0; i < groups.length; i++) {
    if (groupNames[groups[i].name]) {
      errors.push("代理组名重复：" + groups[i].name);
    }
    groupNames[groups[i].name] = true;
  }
  var proxies = config.proxies || [];
  for (var j = 0; j < proxies.length; j++) {
    if (proxies[j] && proxies[j].name) proxyNames[proxies[j].name] = true;
  }

  var targets = collectRuleTargets(config.rules || []);
  for (var t in targets) {
    if (!groupNames[t] && !proxyNames[t]) {
      errors.push("规则引用了不存在的策略：" + t);
    }
  }

  for (var k = 0; k < groups.length; k++) {
    var g = groups[k];
    var refs = g.proxies || [];
    if (g.type === "select" && !g["include-all"] && !g.use && refs.length === 0) {
      errors.push("代理组「" + g.name + "」既无 include-all / use，也没有成员");
    }
    for (var m = 0; m < refs.length; m++) {
      if (!groupNames[refs[m]] && !proxyNames[refs[m]]) {
        errors.push("代理组「" + g.name + "」引用了未定义的成员：" + refs[m]);
      }
    }
  }
  return errors;
}

/**
 * 地区组生成。
 *
 * 修正点：pool 必须持续收缩，且无 matcher 的兜底桶不能提前 break ——
 * 否则它之后的地区永远分不到节点。
 */
function addRegions(config, log) {
  if (!FEATURES.enableRegionGroups) return [];

  var regionConfig = buildRegionConfig();
  var groups = config["proxy-groups"] || [];
  var generated = [];
  var regions = [];

  if (config.proxies && config.proxies.length > 0) {
    // ── 内联节点模式 ──
    var pool = [];
    for (var i = 0; i < config.proxies.length; i++) {
      if (config.proxies[i] && config.proxies[i].name) pool.push(config.proxies[i].name);
    }
    if (pool.length === 0) return [];

    for (var r = 0; r < regionConfig.length; r++) {
      var region = regionConfig[r];
      if (!region.name) continue;

      var matched = [];
      if (!region.matcher) {
        matched = pool.slice();
      } else {
        var patterns = region.matcher.split("|");
        for (var p = 0; p < pool.length; p++) {
          for (var q = 0; q < patterns.length; q++) {
            if (patterns[q] && pool[p].indexOf(patterns[q]) !== -1) {
              matched.push(pool[p]);
              break;
            }
          }
        }
      }
      if (matched.length === 0) continue;

      var taken = {};
      for (var s = 0; s < matched.length; s++) taken[matched[s]] = true;
      var rest = [];
      for (var u = 0; u < pool.length; u++) {
        if (!taken[pool[u]]) rest.push(pool[u]);
      }
      pool = rest;

      generated.push({
        interval: GROUP_BASE_OPTION.interval,
        timeout: GROUP_BASE_OPTION.timeout,
        url: GROUP_BASE_OPTION.url,
        lazy: GROUP_BASE_OPTION.lazy,
        hidden: GROUP_BASE_OPTION.hidden,
        "disable-udp": GROUP_BASE_OPTION["disable-udp"],
        name: region.name,
        type: "url-test",
        interval: TEST_INTERVAL,
        tolerance: TEST_TOLERANCE,
        proxies: matched,
        icon: region.icon,
      });
      regions.push(region.name);
    }
  } else {
    // ── proxy-providers 模式 ──
    var providers = config["proxy-providers"];
    if (!providers || typeof providers !== "object") return [];
    var keys = [];
    for (var k in providers) {
      if (Object.prototype.hasOwnProperty.call(providers, k)) keys.push(k);
    }
    if (keys.length === 0) return [];

    var exclude = "";
    for (var r2 = 0; r2 < regionConfig.length; r2++) {
      var reg = regionConfig[r2];
      if (!reg.name) continue;
      var g = {
        interval: GROUP_BASE_OPTION.interval,
        timeout: GROUP_BASE_OPTION.timeout,
        url: GROUP_BASE_OPTION.url,
        lazy: GROUP_BASE_OPTION.lazy,
        hidden: GROUP_BASE_OPTION.hidden,
        "disable-udp": GROUP_BASE_OPTION["disable-udp"],
        name: reg.name,
        type: "url-test",
        interval: TEST_INTERVAL,
        tolerance: TEST_TOLERANCE,
        use: keys,
        icon: reg.icon,
      };
      if (reg.matcher) {
        exclude += exclude === "" ? reg.matcher : "|" + reg.matcher;
        g.filter = reg.matcher;
      } else if (exclude !== "") {
        g["exclude-filter"] = exclude;
      }
      generated.push(g);
      regions.push(reg.name);
    }
  }

  if (generated.length === 0) return [];
  groups = groups.concat(generated);

  // ── 挂载到既有代理组 ──
  for (var gi = 0; gi < groups.length; gi++) {
    var entry = groups[gi];
    if (!entry || !entry.proxies) continue;

    if (entry.name === "节点选择" && entry.type === "select" && entry.proxies.length > 1) {
      if (entry.proxies.indexOf("地区选择") === -1) entry.proxies.splice(2, 0, "地区选择");
    } else if (entry.name === "全局直连") {
      if (entry.proxies.indexOf("地区选择") === -1) entry.proxies.push("地区选择");
    } else if (entry.type === "select" && !Object.prototype.hasOwnProperty.call(entry, "include-all")) {
      for (var ri = 0; ri < regions.length; ri++) {
        if (entry.proxies.indexOf(regions[ri]) === -1) entry.proxies.push(regions[ri]);
      }
    }
  }

  // ── 新建「地区选择」入口 ──
  var hasEntry = false;
  for (var hi = 0; hi < groups.length; hi++) {
    if (groups[hi] && groups[hi].name === "地区选择") hasEntry = true;
  }
  if (!hasEntry) {
    groups.splice(1, 0, {
      interval: GROUP_BASE_OPTION.interval,
      timeout: GROUP_BASE_OPTION.timeout,
      url: GROUP_BASE_OPTION.url,
      lazy: GROUP_BASE_OPTION.lazy,
      hidden: GROUP_BASE_OPTION.hidden,
      "disable-udp": GROUP_BASE_OPTION["disable-udp"],
      name: "地区选择",
      type: "select",
      proxies: regions,
      icon: ICON_AIRPORT + "/World_Map.png",
    });
  }

  config["proxy-groups"] = groups;
  log("已生成 " + regions.length + " 个地区分组");
  return regions;
}
