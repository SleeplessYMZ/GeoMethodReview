#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const LIBRARY_DIR = path.join(ROOT, "data", "library");
const REPORTS_DIR = path.join(ROOT, "reports");

function usage() {
  return `Usage: node scripts/generate-reports.mjs [options]

Options:
  --from YYYY-MM   First month to report
  --to YYYY-MM     Last month to report
  --top N          Number of representative papers per month (default: 12)
  --help           Show this help text
`;
}

function parseArgs(argv) {
  const options = { from: "", to: "", top: 12 };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help") {
      console.log(usage());
      process.exit(0);
    }
    if (arg === "--from" || arg === "--to") {
      const value = argv[index + 1];
      if (!/^\d{4}-\d{2}$/.test(value || "")) throw new Error(`${arg} requires YYYY-MM`);
      options[arg.slice(2)] = value;
      index += 1;
      continue;
    }
    if (arg === "--top") {
      const value = Number(argv[index + 1]);
      if (!Number.isInteger(value) || value < 1 || value > 30) throw new Error("--top must be an integer from 1 to 30");
      options.top = value;
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (inQuotes) {
      if (char === '"' && next === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") {
      cell += char;
    }
  }

  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }

  const headers = rows.shift() || [];
  return rows
    .filter((values) => values.some((value) => value.length))
    .map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] || ""])));
}

function splitList(value) {
  return String(value || "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function countValues(rows, field) {
  const counts = new Map();
  for (const row of rows) {
    for (const value of splitList(row[field])) {
      counts.set(value, (counts.get(value) || 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function uniqueValues(rows, field) {
  return [...new Set(rows.map((row) => row[field]).filter(Boolean))].sort();
}

function topText(counts, limit = 5) {
  if (!counts.length) return "暂无明确标签";
  return counts.slice(0, limit).map(([name, count]) => `${name} (${count})`).join("、");
}

function markdownTable(headers, rows) {
  const lines = [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
  ];
  for (const row of rows) lines.push(`| ${row.join(" | ")} |`);
  return lines.join("\n");
}

function scorePaper(paper) {
  let score = 0;
  const text = [
    paper.journal_short_name,
    paper.journal,
    paper.title,
    paper.method_family_topics,
    paper.method_family_keywords,
    paper.data_source_keywords,
    paper.spatiotemporal_context_keywords,
  ].join(" ").toLowerCase();

  if (/international journal of geographical information science|geoinformatica|transactions in gis|geographical analysis|journal of geographical systems/.test(text)) score += 7;
  if (/isprs|giscience|remote sensing|digital earth/.test(text)) score += 4;
  if (/geoai|foundation model|geospatial artificial intelligence|large language model|vision-language|self-supervised|contrastive/.test(text)) score += 9;
  if (/graph neural network|gnn|gcn|gat|knowledge graph|spatial graph|complex network/.test(text)) score += 8;
  if (/transformer|lstm|neural network|deep learning|cnn|u-net|temporal convolutional/.test(text)) score += 7;
  if (/spatiotemporal|space-time|time series|forecasting|change detection|state-space|kalman/.test(text)) score += 6;
  if (/spatial econometrics|spatial regression|gwr|mgwr|kriging|moran|lisa|point pattern/.test(text)) score += 6;
  if (/causal inference|difference-in-differences|synthetic control|instrumental variable|regression discontinuity/.test(text)) score += 6;
  if (/trajectory|mobility|origin-destination|od|spatial interaction|accessibility/.test(text)) score += 5;
  if (/crop classification|land cover classification|case study|accuracy assessment/.test(text)) score -= 3;
  return score;
}

function contributionNote(paper) {
  const methods = splitList(paper.method_family_topics).join("、") || "方法应用";
  const data = splitList(paper.data_source_topics).join("、");
  const context = splitList(paper.spatiotemporal_context_topics).join("、");
  const parts = [`该文适合作为 ${methods} 方向的候选文献`];
  if (data) parts.push(`数据侧重点为 ${data}`);
  if (context) parts.push(`时空语境包括 ${context}`);
  return `${parts.join("，")}。`;
}

function reportForMonth(month, rows, topLimit) {
  const journalCounts = countBy(rows, "journal_short_name");
  const methodCounts = countValues(rows, "method_family_topics");
  const keywordCounts = countValues(rows, "method_family_keywords");
  const dataCounts = countValues(rows, "data_source_topics");
  const contextCounts = countValues(rows, "spatiotemporal_context_topics");
  const journals = uniqueValues(rows, "journal_short_name");
  const topPapers = rows
    .map((paper) => ({ ...paper, priority_score: scorePaper(paper) }))
    .sort((a, b) => b.priority_score - a.priority_score || a.publication_date.localeCompare(b.publication_date) || a.title.localeCompare(b.title))
    .slice(0, topLimit);

  const lines = [
    `# ${month} 月度方法文献简报`,
    "",
    `本月简报基于 \`data/library/${month}.csv\` 中自动筛选出的方法候选文献。筛选规则为：文章标题或 Crossref 摘要至少命中一个“方法家族”关键词；“数据来源”和“时空分析语境”作为辅助标签记录。`,
    "",
    "## 本月概览",
    "",
    `- 候选文献数量：${rows.length} 篇`,
    `- 涉及期刊：${journals.length ? journals.map((name) => `\`${name}\``).join("、") : "暂无"}`,
    `- 主要方法方向：${topText(methodCounts)}`,
    `- 高频方法关键词：${topText(keywordCounts)}`,
    `- 主要数据来源：${topText(dataCounts)}`,
    `- 主要时空语境：${topText(contextCounts)}`,
    "",
    "## 方法分布",
    "",
    methodCounts.length
      ? markdownTable(["方法方向", "候选数"], methodCounts.slice(0, 10).map(([name, count]) => [name, String(count)]))
      : "本月没有可统计的方法方向。",
    "",
    "## 期刊分布",
    "",
    journalCounts.length
      ? markdownTable(["期刊", "候选数"], journalCounts.slice(0, 12).map(([name, count]) => [name, String(count)]))
      : "本月没有可统计的期刊分布。",
    "",
    "## 代表性文献",
    "",
  ];

  if (!topPapers.length) {
    lines.push("本月没有候选文献。", "");
  } else {
    topPapers.forEach((paper, index) => {
      lines.push(
        `### ${index + 1}. ${paper.title}`,
        "",
        `- 期刊：\`${paper.journal_short_name}\` (${paper.journal})`,
        `- DOI：<${paper.doi_url}>`,
        `- 发表日期：${paper.publication_date} (${paper.date_basis})`,
        `- 方法家族：${paper.method_family_topics || "未标注"} (${paper.method_family_keywords || "无"})`,
        `- 数据来源：${paper.data_source_topics || "未标注"} (${paper.data_source_keywords || "无"})`,
        `- 时空语境：${paper.spatiotemporal_context_topics || "未标注"} (${paper.spatiotemporal_context_keywords || "无"})`,
        `- 优先级评分：${paper.priority_score}`,
        "",
        contributionNote(paper),
        ""
      );
    });
  }

  lines.push(
    "## 本月归纳",
    "",
    summaryParagraph(methodCounts, dataCounts, contextCounts),
    "",
    "## 后续建议",
    "",
    "1. 优先精读代表性文献中同时命中方法家族、数据来源和时空语境的文章。",
    "2. 对仅命中泛化关键词的遥感分类或单案例应用论文进行人工复核。",
    "3. 将可复用的方法记录为模型、输入数据、空间尺度、时间尺度、评价指标和潜在迁移方向。",
    ""
  );

  return lines.join("\n");
}

function countBy(rows, field) {
  const counts = new Map();
  for (const row of rows) {
    const value = row[field] || "未标注";
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function hasTopic(counts, pattern) {
  return counts.some(([name]) => pattern.test(name));
}

function summaryParagraph(methodCounts, dataCounts, contextCounts) {
  const sentences = [];
  if (hasTopic(methodCounts, /GeoAI|基础模型/)) sentences.push("GeoAI 与基础模型相关论文是本月需要重点关注的方向，尤其适合跟踪通用模型、迁移学习和多模态地理知识表达。");
  if (hasTopic(methodCounts, /深度学习|图模型|时序|时空/)) sentences.push("深度学习、图模型和时空建模共同构成本月的方法主轴，可重点比较不同模型对空间依赖、时间动态和异质性的处理方式。");
  if (hasTopic(methodCounts, /空间统计|空间计量|因果/)) sentences.push("空间统计、空间计量和因果推断类论文适合作为方法论基础文献，用于补充可解释性和识别策略。");
  if (dataCounts.length) sentences.push(`数据层面，本月较常见的数据来源包括 ${topText(dataCounts, 3)}，后续精读时应记录数据粒度、覆盖范围和可获取性。`);
  if (contextCounts.length) sentences.push(`时空语境上，本月集中在 ${topText(contextCounts, 3)}，适合进一步比较尺度效应与动态过程建模。`);
  return sentences.length ? sentences.join("\n\n") : "本月候选文献数量较少，建议先保留为背景库，并等待后续月份形成更稳定的方法主题分布。";
}

async function availableMonths() {
  const entries = await fs.readdir(LIBRARY_DIR, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && /^20\d{2}-\d{2}\.csv$/.test(entry.name))
    .map((entry) => entry.name.replace(/\.csv$/, ""))
    .sort();
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const months = (await availableMonths()).filter((month) => {
    if (options.from && month < options.from) return false;
    if (options.to && month > options.to) return false;
    return true;
  });

  await fs.mkdir(REPORTS_DIR, { recursive: true });
  const indexRows = [];
  for (const month of months) {
    const csvPath = path.join(LIBRARY_DIR, `${month}.csv`);
    const rows = parseCsv(await fs.readFile(csvPath, "utf8"));
    const report = reportForMonth(month, rows, options.top);
    await fs.writeFile(path.join(REPORTS_DIR, `${month}.md`), report, "utf8");
    indexRows.push({
      month,
      count: rows.length,
      methods: topText(countValues(rows, "method_family_topics"), 3),
      journals: uniqueValues(rows, "journal_short_name").length,
    });
  }

  const readme = [
    "# Monthly Reports",
    "",
    "本目录保存由 `scripts/generate-reports.mjs` 根据 `data/library/*.csv` 自动生成的月度方法文献简报。",
    "",
    markdownTable(
      ["月份", "候选文献", "涉及期刊数", "主要方法方向"],
      indexRows.map((row) => [`[${row.month}](${row.month}.md)`, String(row.count), String(row.journals), row.methods])
    ),
    "",
  ].join("\n");
  await fs.writeFile(path.join(REPORTS_DIR, "README.md"), readme, "utf8");
  console.log(`Wrote ${months.length} monthly reports to ${REPORTS_DIR}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
