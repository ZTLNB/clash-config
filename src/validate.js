/**
 * 校验与规范化工具。
 *
 * 这些检查在渲染阶段执行，目的是把「配置错误」提前到构建期暴露，
 * 而不是等到客户端加载时才报错 —— 后者往往只给一行难以定位的日志。
 */

/**
 * 规则去重。
 * 保留首次出现的位置：因为规则自上而下匹配，
 * 先出现的优先级更高，保留后者会静默改变分流语义。
 */
export function dedupeRules(rules) {
  const seen = new Set();
  const out = [];
  const duplicates = [];
  for (const rule of rules) {
    if (seen.has(rule)) {
      duplicates.push(rule);
      continue;
    }
    seen.add(rule);
    out.push(rule);
  }
  return { rules: out, duplicates };
}

/** 校验规则语法：至少要有 类型,值,策略 三段；MATCH 只允许两段。 */
export function validateRules(rules) {
  const errors = [];
  const builtinTargets = new Set(["DIRECT", "REJECT", "PASS", "REJECT-DROP"]);

  rules.forEach((rule, i) => {
    if (typeof rule !== "string" || rule.trim() === "") {
      errors.push(`第 ${i + 1} 条规则为空或不是字符串`);
      return;
    }
    const parts = rule.split(",");
    const type = parts[0].trim().toUpperCase();

    if (type === "MATCH") {
      if (parts.length !== 2) {
        errors.push(`MATCH 规则格式应为 MATCH,策略名 —— 实际为「${rule}」`);
      }
      return;
    }
    if (parts.length < 3) {
      errors.push(`规则缺少策略段（至少需要 类型,值,策略）—— 「${rule}」`);
      return;
    }
    const target = parts[2].trim();
    if (target === "") {
      errors.push(`规则策略名为空 —— 「${rule}」`);
    }
    // RULE-SET 的策略指向代理组名，无法在此处静态判断，交由 validateGroupRefs
    if (type !== "RULE-SET" && !builtinTargets.has(target) && !target) {
      errors.push(`规则策略无效 —— 「${rule}」`);
    }
  });

  return errors;
}

/** 收集所有规则里被引用的代理组名（RULE-SET 第三段 / 普通规则目标）。 */
export function collectRuleTargets(rules) {
  const targets = new Set();
  for (const rule of rules) {
    const parts = rule.split(",");
    if (parts.length < 2) continue;
    const type = parts[0].trim().toUpperCase();
    if (type === "MATCH") {
      targets.add(parts[1].trim());
    } else if (parts.length >= 3) {
      targets.add(parts[2].trim());
    }
  }
  return targets;
}

/**
 * 校验引用完整性。
 * 三处引用必须都能落到实处，否则客户端会因为「组不存在」而拒绝加载整份配置：
 *   1. 规则 → 代理组
 *   2. 代理组 → 子代理组
 *   3. 代理组 → 节点名（仅对显式 proxies 列表、且该组不是 include-all）
 */
export function validateGroupRefs(config) {
  const errors = [];
  const groups = config["proxy-groups"] || [];
  const groupNames = new Set(groups.map((g) => g.name));
  const proxyNames = new Set([
    ...(config.proxies || []).map((p) => p.name),
    "DIRECT",
    "REJECT",
    "REJECT-DROP",
    "PASS",
    "GLOBAL",
  ]);

  // 组名唯一性：重名会导致客户端只认其中一个，难以排查
  const nameCount = new Map();
  for (const g of groups) {
    nameCount.set(g.name, (nameCount.get(g.name) || 0) + 1);
  }
  for (const [name, count] of nameCount) {
    if (count > 1) errors.push(`代理组名重复 ${count} 次：「${name}」`);
  }

  // 1. 规则引用的组是否存在
  for (const target of collectRuleTargets(config.rules || [])) {
    if (!groupNames.has(target) && !proxyNames.has(target)) {
      errors.push(`规则引用了不存在的策略：「${target}」`);
    }
  }

  // 2 & 3. 组内引用
  for (const g of groups) {
    const refs = g.proxies || [];
    if (g.type === "select" && !g["include-all"] && !g.use && refs.length === 0) {
      errors.push(`代理组「${g.name}」既无 include-all / use，也没有任何成员`);
    }
    for (const ref of refs) {
      if (groupNames.has(ref) || proxyNames.has(ref)) continue;
      // 未显式定义的引用可能是运行时才出现的节点（订阅侧），标记但不阻断
      errors.push(`代理组「${g.name}」引用了未定义的成员：「${ref}」`);
    }
  }

  return errors;
}

/** 渲染前对配置做整体体检，返回错误数组（空数组 = 通过）。 */
export function validateConfig(config) {
  const errors = [];
  errors.push(...validateRules(config.rules || []));
  errors.push(...validateGroupRefs(config));
  if (!config["proxy-groups"] || config["proxy-groups"].length === 0) {
    errors.push("配置中没有任何代理组");
  }
  return errors;
}

/** 简易日志器，与扩展脚本的 console 解耦。 */
export function createLogger(prefix = "[clash-config]") {
  return {
    log: (msg) => console.log(`${prefix} ${msg}`),
    warn: (msg) => console.warn(`${prefix} ⚠️  ${msg}`),
    error: (msg) => console.error(`${prefix} ❌ ${msg}`),
  };
}
