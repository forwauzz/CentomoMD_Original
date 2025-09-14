import fs from "fs";

const INPUTS = [
  { source: "backend", file: "/workspace/.tsc-reports/backend_raw.txt" },
  { source: "frontend", file: "/workspace/.tsc-reports/frontend_raw.txt" },
];

const errorLineRegex = /^(?<file>[^\(\n]+)\((?<line>\d+),(?<col>\d+)\): error (?<code>TS\d+): (?<msg>.*)$/;

const codeToCategory = (code) => {
  if (code === "TS2322") return "Type mismatch (assignment)";
  if (code === "TS2345") return "Type mismatch (call argument)";
  if (code === "TS2339") return "Property does not exist";
  if (code === "TS2304") return "Name not found";
  if (code === "TS2307") return "Module not found";
  if (code === "TS7030") return "Not all code paths return a value";
  if (code === "TS6133") return "Unused variable";
  if (code === "TS18048") return "Possibly undefined";
  if (code === "TS2532") return "Object is possibly undefined/null";
  if (code === "TS2353") return "Object literal extra/invalid properties";
  if (code === "TS2379") return "Exact optional property types mismatch";
  if (code === "TS2741") return "Missing required property";
  if (code === "TS2367") return "Unintentional comparison (no overlap)";
  if (code === "TS2552") return "Cannot find name (did you mean)";
  if (code === "TS4111") return "Index signature property access required";
  return "Other";
};

const allErrors = [];
for (const { source, file } of INPUTS) {
  if (!fs.existsSync(file)) continue;
  const txt = fs.readFileSync(file, "utf8");
  for (const rawLine of txt.split(/\r?\n/)) {
    const line = rawLine.trim();
    const m = errorLineRegex.exec(line);
    if (!m) continue;
    const { file: f, line: ln, col, code, msg } = m.groups;
    allErrors.push({
      source,
      file: f.trim(),
      line: Number(ln),
      column: Number(col),
      code,
      category: codeToCategory(code),
      message: msg.trim(),
    });
  }
}

const byFile = new Map();
for (const err of allErrors) {
  const key = err.file;
  if (!byFile.has(key)) byFile.set(key, []);
  byFile.get(key).push(err);
}

const totalErrors = allErrors.length;
const totalsBySource = allErrors.reduce((acc, e) => {
  acc[e.source] = (acc[e.source] || 0) + 1;
  return acc;
}, {});

const filesWithCounts = Array.from(byFile.entries()).map(([file, errs]) => ({ file, count: errs.length }));
filesWithCounts.sort((a, b) => b.count - a.count);
const topFiles = filesWithCounts.slice(0, 10);

const byCategory = allErrors.reduce((acc, e) => {
  const k = `${e.category} (${e.code})`;
  acc[k] = (acc[k] || 0) + 1;
  return acc;
}, {});
const recurring = Object.entries(byCategory)
  .map(([k, v]) => ({ category: k, count: v }))
  .sort((a, b) => b.count - a.count);

const jsonOut = {
  totalErrors,
  totalsBySource,
  topFiles,
  recurring,
  errors: allErrors,
  byFile: Object.fromEntries(Array.from(byFile.entries()).map(([f, errs]) => [f, errs])),
};
fs.writeFileSync("/workspace/.tsc-reports/ts_errors.json", JSON.stringify(jsonOut, null, 2));

const lines = [];
lines.push("# TypeScript Error Report");
lines.push("");
lines.push(`- Total errors: ${totalErrors}`);
lines.push(`- Backend errors: ${totalsBySource.backend || 0}`);
lines.push(`- Frontend errors: ${totalsBySource.frontend || 0}`);
lines.push("");
lines.push(`## Top files by error count`);
for (const { file, count } of topFiles) {
  lines.push(`- ${file}: ${count}`);
}
lines.push("");
lines.push(`## Recurring issue types`);
for (const { category, count } of recurring.slice(0, 15)) {
  lines.push(`- ${category}: ${count}`);
}
lines.push("");
lines.push(`## Errors by file`);
for (const [file, errs] of Array.from(byFile.entries()).sort((a,b)=>a[0].localeCompare(b[0]))) {
  lines.push("");
  lines.push(`### ${file} (${errs.length})`);
  for (const e of errs) {
    lines.push(`- [${e.source}] ${e.code} at ${e.line}:${e.column} — ${e.message}`);
  }
}

fs.writeFileSync("/workspace/.tsc-reports/ts_report.md", lines.join("\n"));

console.log(`Parsed ${totalErrors} errors into JSON and Markdown.`);

