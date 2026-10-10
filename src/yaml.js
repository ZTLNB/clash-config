/**
 * 极简 YAML 序列化器。
 *
 * 为何不引入 js-yaml：保持「零依赖」—— 免装包、免审计、免版本漂移，
 * CI 里也不需要 npm install，构建耗时几乎为零。
 *
 * 覆盖面足够本项目的需要：对象、数组、字符串、数字、布尔、null。
 * 不支持锚点、多行折叠等高级语法（此处也用不到）。
 */

const NEEDS_QUOTE = /^(?:$|[\s]|.*[:#\-?&*!|>%@`{}[\],].*|.*[\s]$)/;
/** 看起来像数字 / 布尔 / null 的字符串必须加引号，否则解析后会改变类型 */
const LOOKS_TYPED = /^(?:true|false|null|~|[-+]?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?)$/i;

function quoteIfNeeded(value) {
  const s = String(value);
  const multiline = s.includes("\n");
  if (multiline) {
    // 用字面块标量承载多行文本
    const indent = "  ";
    return "|\n" + s.split("\n").map((l) => indent + l).join("\n");
  }
  if (s === "") return '""';
  if (LOOKS_TYPED.test(s) || NEEDS_QUOTE.test(s)) {
    // 内部转义：反斜杠与双引号
    return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  }
  return s;
}

function serialize(value, indentLevel = 0) {
  const pad = "  ".repeat(indentLevel);

  if (value === null || value === undefined) return "null";
  if (typeof value === "boolean" || typeof value === "number") return String(value);
  if (typeof value === "string") return quoteIfNeeded(value);

  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    return value
      .map((item) => {
        if (item !== null && typeof item === "object" && !Array.isArray(item)) {
          // 对象数组：首行接在 "- " 之后，后续行缩进对齐
          const body = serialize(item, indentLevel + 1);
          return `${pad}- ${body.slice((indentLevel + 1) * 2)}`;
        }
        if (Array.isArray(item)) {
          return `${pad}-\n${serialize(item, indentLevel + 1)}`;
        }
        return `${pad}- ${serialize(item, 0)}`;
      })
      .join("\n");
  }

  // 对象
  const entries = Object.entries(value);
  if (entries.length === 0) return "{}";
  return entries
    .map(([key, val]) => {
      const k = quoteIfNeeded(key);
      if (val === null || val === undefined) return `${pad}${k}:`;
      if (typeof val === "object") {
        if (Array.isArray(val) && val.length === 0) return `${pad}${k}: []`;
        if (!Array.isArray(val) && Object.keys(val).length === 0) return `${pad}${k}: {}`;
        return `${pad}${k}:\n${serialize(val, indentLevel + 1)}`;
      }
      return `${pad}${k}: ${serialize(val, 0)}`;
    })
    .join("\n");
}

/** 把配置对象序列化为 YAML 文本，带生成标识头。 */
export function toYaml(config, headerLines = []) {
  const header = headerLines.length > 0 ? `# ${headerLines.join("\n# ")}\n\n` : "";
  return header + serialize(config, 0) + "\n";
}
