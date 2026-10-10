/**
 * 代理组定义。
 *
 * 设计要点：
 * - 「节点选择」是给规则集引用的抽象入口，默认指向「延迟选优」，
 *   避免用户手动逐个挑节点；需要固定节点时再进「手动选择」。
 * - 「全局直连」把 DIRECT / REJECT / 节点选择 放在一起，
 *   使「本想直连但仍想临时走代理」这一类操作有明确出口。
 * - 负载均衡与故障转移都 `include-all`，因此增删节点无需改配置。
 * - 地区组不在本文件，而由 src/regions.js 在渲染时按实际节点动态生成。
 */

import { groupBaseOption, testInterval, testTolerance } from "./settings.js";

const AIRPORT = "https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color";
const VERGE =
  "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons";

/** 「全局直连」组的成员在各处反复出现，抽出常量避免笔误导致引用不上。 */
const DIRECT_GROUP = "全局直连";
const MAIN_SELECT = "节点选择";
const MANUAL = "手动选择";
const AUTO = "延迟选优";
const FALLBACK = "故障转移";

/** 需要「优先代理」视角的组（代理排第一，直连在后） */
const proxyFirst = [MAIN_SELECT, MANUAL, DIRECT_GROUP, AUTO, FALLBACK];
/** 需要「优先直连」视角的组（直连排第一） */
const directFirst = [DIRECT_GROUP, MAIN_SELECT, MANUAL, AUTO, FALLBACK];

export const proxyGroups = [
  {
    ...groupBaseOption,
    name: MAIN_SELECT,
    type: "select",
    proxies: [AUTO, MANUAL, FALLBACK, "负载均衡(散列)", "负载均衡(轮询)"],
    icon: `${AIRPORT}/Airport.png`,
  },
  {
    ...groupBaseOption,
    name: MANUAL,
    type: "select",
    "include-all": true,
    icon: `${VERGE}/adjust.svg`,
  },
  {
    ...groupBaseOption,
    name: "漏网之鱼",
    type: "select",
    proxies: [DIRECT_GROUP, MAIN_SELECT, MANUAL, AUTO, FALLBACK],
    icon: `${VERGE}/fish.svg`,
  },
  {
    ...groupBaseOption,
    name: "Bing",
    type: "select",
    proxies: directFirst,
    icon: "https://www.bing.com/favicon.ico",
  },
  {
    ...groupBaseOption,
    name: "Github",
    type: "select",
    proxies: proxyFirst,
    icon: "https://www.clashverge.dev/assets/icons/github.svg",
  },
  {
    ...groupBaseOption,
    name: "谷歌服务",
    type: "select",
    proxies: proxyFirst,
    icon: "https://www.clashverge.dev/assets/icons/google.svg",
  },
  {
    ...groupBaseOption,
    name: "苹果服务",
    type: "select",
    proxies: directFirst,
    icon: "https://www.clashverge.dev/assets/icons/apple.svg",
  },
  {
    ...groupBaseOption,
    name: "微软服务",
    type: "select",
    proxies: directFirst,
    icon: `${VERGE}/microsoft.svg`,
  },
  {
    ...groupBaseOption,
    name: "Onedrive",
    type: "select",
    proxies: directFirst,
    icon: `${AIRPORT}/OneDrive.png`,
  },
  {
    ...groupBaseOption,
    name: "AI",
    type: "select",
    proxies: directFirst,
    icon: "https://www.clashverge.dev/assets/icons/chatgpt.svg",
  },
  {
    ...groupBaseOption,
    name: "Bilibili",
    type: "select",
    // Bilibili 在国内有完整 CDN，代理只会绕远路，固定直连
    proxies: [DIRECT_GROUP],
    icon: "https://fastly.jsdelivr.net/gh/Orz-3/mini@master/Color/Bili.png",
  },
  {
    ...groupBaseOption,
    name: "YouTube",
    type: "select",
    proxies: [MAIN_SELECT, MANUAL, AUTO, FALLBACK],
    icon: `${VERGE}/youtube.svg`,
  },
  {
    ...groupBaseOption,
    name: "Netflix",
    type: "select",
    proxies: [MAIN_SELECT, MANUAL, AUTO, FALLBACK],
    icon: "https://www.clashverge.dev/assets/icons/netflix.svg",
  },
  {
    ...groupBaseOption,
    name: "TikTok",
    type: "select",
    proxies: [MAIN_SELECT, MANUAL, AUTO, FALLBACK],
    icon: "https://fastly.jsdelivr.net/gh/shindgewongxj/WHATSINStash@master/icon/tiktok.png",
  },
  {
    ...groupBaseOption,
    name: "Pornhub",
    type: "select",
    proxies: [MAIN_SELECT, MANUAL, AUTO, FALLBACK],
    icon: `${AIRPORT}/Pornhub_1.png`,
  },
  {
    ...groupBaseOption,
    name: "Spotify",
    type: "select",
    proxies: directFirst,
    icon: `${AIRPORT}/Spotify.png`,
  },
  {
    ...groupBaseOption,
    name: "Adobe",
    type: "select",
    // 保留 REJECT 出口：可直接屏蔽 Adobe 的授权校验域名
    proxies: [DIRECT_GROUP, "REJECT", MAIN_SELECT],
    icon: "https://www.adobe.com/favicon.ico",
  },
  {
    ...groupBaseOption,
    name: "游戏服务",
    type: "select",
    proxies: directFirst,
    icon: "https://www.clashverge.dev/assets/icons/steam.svg",
  },
  {
    ...groupBaseOption,
    name: "电报消息",
    type: "select",
    proxies: [MAIN_SELECT, MANUAL, AUTO, FALLBACK],
    icon: `${VERGE}/telegram.svg`,
  },
  {
    ...groupBaseOption,
    name: "网速测试",
    type: "select",
    proxies: [DIRECT_GROUP],
    "include-all": true,
    icon: `${AIRPORT}/Speedtest.png`,
  },
  {
    ...groupBaseOption,
    name: "负载均衡(轮询)",
    type: "load-balance",
    strategy: "round-robin",
    "include-all": true,
    icon: `${VERGE}/balance.svg`,
  },
  {
    ...groupBaseOption,
    name: "负载均衡(散列)",
    type: "load-balance",
    strategy: "consistent-hashing",
    "include-all": true,
    icon: `${VERGE}/merry_go.svg`,
  },
  {
    ...groupBaseOption,
    name: FALLBACK,
    type: "fallback",
    "include-all": true,
    icon: `${VERGE}/ambulance.svg`,
  },
  {
    ...groupBaseOption,
    name: DIRECT_GROUP,
    type: "select",
    proxies: ["DIRECT", "REJECT", MAIN_SELECT, MANUAL],
    icon: `${VERGE}/link.svg`,
  },
  {
    ...groupBaseOption,
    name: AUTO,
    type: "url-test",
    interval: testInterval,
    tolerance: testTolerance,
    "include-all": true,
    icon: `${VERGE}/speed.svg`,
  },
];
