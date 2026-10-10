/**
 * 分流规则。
 *
 * 顺序即优先级 —— 自上而下第一条命中即生效，因此这里的排列不是随意的：
 *
 * 1. 自定义规则      —— 用户覆盖层，必须最先
 * 2. ipdirect/ipprivate —— CIDR 判断，no-resolve 避免无谓 DNS
 * 3. telegramcidr    —— Telegram 走独立组
 * 4. direct/private  —— 国内与私有域名收敛到直连
 * 5. 各服务分项      —— Google / Apple / AI / 流媒体等
 * 6. proxy/gfw/tld   —— 兜底的代理类规则集
 * 7. MATCH           —— 最终漏网之鱼
 */

import { customRules } from "./settings.js";

export const rules = [
  // ── 1. 自定义规则（用户覆盖层） ──
  ...customRules,

  // ── 2. 网络层 CIDR 判断 ──
  "RULE-SET,ipdirect,全局直连,no-resolve",
  "RULE-SET,ipprivate,全局直连,no-resolve",
  "RULE-SET,telegramcidr,电报消息,no-resolve",

  // ── 3. 国内与私有域名 ──
  "RULE-SET,direct,全局直连",
  "RULE-SET,private,全局直连",

  // ── 4. 按服务分流 ──
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

  // ── 5. 兜底代理类规则集 ──
  "RULE-SET,proxy,节点选择",
  "RULE-SET,gfw,节点选择",
  "RULE-SET,tld-not-cn,节点选择",

  // ── 6. 未匹配 ──
  "MATCH,漏网之鱼",
];
