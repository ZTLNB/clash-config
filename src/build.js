#!/usr/bin/env node
/**
 * 构建入口。
 *
 * 产出：
 *   dist/config.yaml     —— 完整 YAML 配置（含占位节点，可直接订阅）
 *   dist/config.min.yaml —— 去注释紧凑版
 *   dist/script.js       —— 全局扩展脚本（自包含，无 import 依赖）
 *
 * 用法：
 *   node src/build.js              # 全量构建
 *   node src/build.js --check      # 仅校验，不写文件（CI 门禁用）
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { applyBuiltinConfig } from "./apply.js";
import { createLogger, validateConfig } from "./validate.js";
import { toYaml } from "./yaml.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DIST = join(ROOT, "dist");

const args = process.argv.slice(2);
const CHECK_ONLY = args.includes("--check");
const logger = createLogger();

/**
 * 占位节点。
 *
 * 生成静态 YAML 时无法得知你的真实订阅，若 proxies 为空则会触发
 * applyBuiltinConfig 的「未找到任何代理」保护。因此用一个明显不可用的
 * 占位节点让配置结构完整、可被客户端加载，同时提示用户替换。
 */
const PLACEHOLDER_PROXIES = [
  {
    name: "🔴 请替换为你的订阅节点",
    type: "ss",
    server: "127.0.0.1",
    port: 8388,
    cipher: "aes-128-gcm",
    password: "placeholder-must-be-replaced",
  },
];

/** 生成配置对象（两条链路共用） */
function buildConfig(usePlaceholder) {
  const base = {
    proxies: usePlaceholder ? PLACEHOLDER_PROXIES : [],
    "proxy-groups": [],
  };
  return applyBuiltinConfig(base, { logger });
}

/** 生成自包含的扩展脚本：内联全部运行时依赖，避免依赖解析地狱。 */
function buildScript() {
  const sources = [
    "src/runtime/modules.js",
    "src/runtime/script-entry.js",
  ];
  const parts = [];
  for (const rel of sources) {
    const text = readFileSync(join(ROOT, rel), "utf8");
    parts.push(text);
  }
  // 剥离 import/export 语句：脚本需要是单文件、无模块语法
  const inlined = parts
    .join("\n")
    .replace(/^\s*import\s+.+?from\s+["'][^"']+["'];?\s*$/gm, "")
    .replace(/^\s*export\s+(?=(?:const|let|var|function|class)\b)/gm, "");
  return inlined;
}

function main() {
  // ── YAML 链路 ──
  logger.log("开始构建 YAML 配置…");
  const config = buildConfig(true);

  const errors = validateConfig(config);
  if (errors.length > 0) {
    logger.error(`配置校验未通过：\n  - ${errors.join("\n  - ")}`);
    process.exit(1);
  }
  logger.log("配置校验通过");

  const header = [
    "本文件由 src/build.js 自动生成，请勿手动编辑。",
    "修改配置请编辑 config/ 目录下的模块，然后重新构建。",
    `生成时间：${new Date().toISOString()}`,
  ];
  const yaml = toYaml(config, header);

  if (CHECK_ONLY) {
    logger.log("--check 模式：校验通过，未写入文件");
    return;
  }

  if (!existsSync(DIST)) mkdirSync(DIST, { recursive: true });
  writeFileSync(join(DIST, "config.yaml"), yaml, "utf8");
  writeFileSync(join(DIST, "config.min.yaml"), toYaml(config), "utf8");
  logger.log(`已写入 dist/config.yaml（${(yaml.length / 1024).toFixed(1)} KB）`);

  // ── 脚本链路 ──
  logger.log("开始构建扩展脚本…");
  const script = buildScript();
  writeFileSync(join(DIST, "script.js"), script, "utf8");
  logger.log(`已写入 dist/script.js（${(script.length / 1024).toFixed(1)} KB）`);
}

main();
