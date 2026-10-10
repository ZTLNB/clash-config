/**
 * DNS 与域名嗅探配置。
 *
 * fake-ip 模式下必须同时配置 `proxy-server-nameserver`：
 * 内核解析代理服务器域名时走真实 DNS，否则会拿到 fake-ip 导致连不上节点。
 */

import { domesticNameservers, foreignNameservers } from "./settings.js";

export const dnsConfig = {
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
  /**
   * 以下域名返回真实 IP 而非 fake-ip：
   * —— 局域网与 mDNS 域名走了 fake-ip 会直接解析失败；
   * —— 微软连通性探测域名若被 fake-ip 污染，会误报「无网络」；
   * —— 腾讯/企业微信的 localhost 回调依赖真实解析。
   */
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
  nameserver: [...domesticNameservers],
  "proxy-server-nameserver": [...foreignNameservers, ...domesticNameservers],
  "nameserver-policy": {},
};

export const snifferConfig = {
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
