/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");

const LOCALES = ["en", "zh"];

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepMerge(target, source) {
  for (const [key, sourceValue] of Object.entries(source)) {
    const targetValue = target[key];

    if (isPlainObject(targetValue) && isPlainObject(sourceValue)) {
      deepMerge(targetValue, sourceValue);
      continue;
    }

    target[key] = sourceValue;
  }
}

for (const locale of LOCALES) {
  const localeDir = path.join(process.cwd(), "messages", locale);
  const files = fs
    .readdirSync(localeDir)
    .filter((file) => file.endsWith(".json") && file !== "_index.json" && file !== "compiled.json")
    .sort();

  const merged = {};

  for (const file of files) {
    const filePath = path.join(localeDir, file);
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    deepMerge(merged, data);
  }

  fs.writeFileSync(path.join(localeDir, "compiled.json"), `${JSON.stringify(merged, null, 2)}\n`);
  console.log(`Compiled i18n for ${locale} from ${files.length} files`);
}
