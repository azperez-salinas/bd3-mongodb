const fs = require("fs");
const path = require("path");

const inputPath = path.resolve(__dirname, "../../../mongodb.csv");
const outputPath = path.resolve(__dirname, "../../../mongodb.cleaned.csv");

const splitCsvLine = (line) => {
  const cells = [];
  let buffer = "";
  let inQuotes = false;
  let bracketDepth = 0;
  let braceDepth = 0;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];

    if (ch === '"' && bracketDepth === 0 && braceDepth === 0) {
      inQuotes = !inQuotes;
      buffer += ch;
      continue;
    }

    if (ch === "[") bracketDepth += 1;
    if (ch === "]") bracketDepth = Math.max(0, bracketDepth - 1);
    if (ch === "{") braceDepth += 1;
    if (ch === "}") braceDepth = Math.max(0, braceDepth - 1);

    if (ch === "," && !inQuotes && bracketDepth === 0 && braceDepth === 0) {
      cells.push(buffer);
      buffer = "";
      continue;
    }

    buffer += ch;
  }

  cells.push(buffer);
  return cells;
};

const normalizeField = (value = "") => {
  let text = String(value).trim();

  if (text.startsWith('"') && text.endsWith('"')) {
    text = text.slice(1, -1);
  }

  text = text.replace(/\\"/g, '"');
  text = text.replace(/\\n/g, "\n");
  text = text.replace(/\\r/g, "\r");

  if (
    (text.startsWith("[") && text.endsWith("]")) ||
    (text.startsWith("{") && text.endsWith("}"))
  ) {
    try {
      return JSON.stringify(JSON.parse(text), null, 0);
    } catch {
      return text;
    }
  }

  return text;
};

const cleanCsv = () => {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Archivo no encontrado: ${inputPath}`);
  }

  const text = fs.readFileSync(inputPath, "utf8");
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    throw new Error("El CSV está vacío");
  }

  const header = splitCsvLine(lines[0]).map(normalizeField);
  const rows = [header];

  for (const line of lines.slice(1)) {
    const values = splitCsvLine(line).map(normalizeField);
    while (values.length < header.length) values.push("");
    if (values.length > header.length) values.length = header.length;
    rows.push(values);
  }

  const output = rows.map((row) => row.join(",")).join("\n") + "\n";
  fs.writeFileSync(outputPath, output, "utf8");

  console.log(`CSV limpio: ${inputPath}`);
  console.log(`CSV generado: ${outputPath}`);
  console.log(`Filas procesadas: ${rows.length - 1}`);
};

cleanCsv();
