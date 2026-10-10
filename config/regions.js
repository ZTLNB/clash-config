/**
 * 地区识别配置。
 *
 * 每个条目描述「如何从节点名称里认出这个地区」以及「用哪个图标」。
 * matcher 是正则片段，多个写法用 | 连接（大小写敏感，故显式列出各种写法）。
 * 没有 matcher 的条目是「兜底桶」，会收走所有前面的 matcher 都没命中的节点。
 *
 * 图标统一走 jsdelivr 的 clash-verge-rev / Qure 图标集。
 */

const FLAG_BASE =
  "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags";

const QURE = "https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color";

export const regionConfig = [
  { name: "🇺🇸 美国 📶", matcher: "美国|🇺🇸|US|United States|America", icon: `${FLAG_BASE}/us.svg` },
  { name: "🇯🇵 日本 📶", matcher: "日本|🇯🇵|JP|Japan", icon: `${FLAG_BASE}/jp.svg` },
  { name: "🇰🇷 韩国 📶", matcher: "韩|🇰🇷|kr|korea", icon: `${FLAG_BASE}/kr.svg` },
  { name: "🇸🇬 新加坡 📶", matcher: "新加坡|🇸🇬|SG|狮城|Singapore", icon: `${FLAG_BASE}/sg.svg` },
  { name: "🇭🇰 香港 📶", matcher: "香港|🇭🇰|HK|Hong Kong|HongKong", icon: `${FLAG_BASE}/hk.svg` },
  { name: "🇨🇳 台湾 📶", matcher: "台湾|🇹🇼|tw|taiwan|tai wan", icon: `${FLAG_BASE}/tw.svg` },
  { name: "🇬🇧 英国 📶", matcher: "英|🇬🇧|uk|united kingdom|great britain", icon: `${FLAG_BASE}/gb.svg` },
  { name: "🇫🇷 法国 📶", matcher: "法国|🇫🇷|FR|France", icon: `${FLAG_BASE}/fr.svg` },
  { name: "🇩🇪 德国 📶", matcher: "德国|🇩🇪|DE|germany", icon: `${FLAG_BASE}/de.svg` },
  { name: "🇵🇱 波兰 📶", matcher: "波兰|🇵🇱|Poland|PL", icon: `${FLAG_BASE}/pl.svg` },
  { name: "🇳🇱 荷兰 📶", matcher: "荷兰|🇳🇱|NL|Netherlands", icon: `${FLAG_BASE}/nl.svg` },
  { name: "🇮🇪 爱尔兰 📶", matcher: "爱尔兰|🇮🇪|IE|Ireland", icon: `${FLAG_BASE}/ie.svg` },
  { name: "🇸🇪 瑞典 📶", matcher: "瑞典|🇸🇪|SE|Sweden", icon: `${FLAG_BASE}/se.svg` },
  { name: "🇷🇺 俄罗斯 📶", matcher: "俄罗斯|🇷🇺|RU|Russia", icon: `${FLAG_BASE}/ru.svg` },
  { name: "🇮🇹 意大利 📶", matcher: "意大利|🇮🇹|IT|Italy", icon: `${FLAG_BASE}/it.svg` },
  { name: "🇪🇸 西班牙 📶", matcher: "西班牙|🇪🇸|ES|Spain", icon: `${FLAG_BASE}/es.svg` },
  { name: "🇵🇹 葡萄牙 📶", matcher: "葡萄牙|🇵🇹|PT|Portugal", icon: `${FLAG_BASE}/pt.svg` },
  { name: "🇹🇷 土耳其 📶", matcher: "土耳其|🇹🇷|TR|Turkey", icon: `${FLAG_BASE}/tr.svg` },
  { name: "🇦🇷 阿根廷 📶", matcher: "阿根廷|🇦🇷|AR|Argentina", icon: `${FLAG_BASE}/ar.svg` },
  { name: "🇨🇦 加拿大 📶", matcher: "加拿大|🇨🇦|CA|Canada", icon: `${FLAG_BASE}/ca.svg` },
  { name: "🇦🇺 澳大利亚 📶", matcher: "澳大利亚|🇦🇺|AU|Australia", icon: `${FLAG_BASE}/au.svg` },
  { name: "🇮🇷 伊朗 📶", matcher: "伊朗|🇮🇷|IR|Iran", icon: `${FLAG_BASE}/ir.svg` },
  { name: "🇮🇩 印度尼西亚 📶", matcher: "印度尼西亚|印尼|🇮🇩|ID|Indonesia", icon: `${FLAG_BASE}/id.svg` },
  { name: "🇲🇾 马来西亚 📶", matcher: "马来|🇲🇾|MY|Malaysia", icon: `${FLAG_BASE}/my.svg` },
  { name: "🇵🇭 菲律宾 📶", matcher: "菲律宾|🇵🇭|PH|Philippines", icon: `${FLAG_BASE}/ph.svg` },
  { name: "🇮🇳 印度 📶", matcher: "印度|🇮🇳|IN|India", icon: `${FLAG_BASE}/in.svg` },
  { name: "🇻🇳 越南 📶", matcher: "越南|🇻🇳|VN|Vietnam", icon: `${FLAG_BASE}/vn.svg` },
  { name: "🇹🇭 泰国 📶", matcher: "泰国|🇹🇭|TH|Thailand", icon: `${FLAG_BASE}/th.svg` },
  { name: "🇨🇳 中国 📶", matcher: "中国|🇨🇳|CN|china", icon: `${FLAG_BASE}/cn.svg` },
  // 兜底桶：无 matcher，收走剩余全部节点
  { name: "🌐 其他 📶", icon: `${QURE}/Global.png` },
];
