#!/usr/bin/env node

// 运行
// node ./utils/option-map.js cdp

import { getFiles, readText } from "./file.js";

const rootDir = process.argv[2];

if (!rootDir) {
  console.error("usage: node utils/option-map.js <dir>");
  process.exit(1);
}

function collectOptions(body) {
  const options = new Set();

  let match;

  const propertyRegex = /\boptions\.([a-zA-Z0-9_]+)\b/g;

  while ((match = propertyRegex.exec(body))) {
    options.add(match[1]);
  }

  const destructRegex = /\bconst\s*\{([\s\S]*?)\}\s*=\s*options\b/g;

  while ((match = destructRegex.exec(body))) {
    const fields = match[1]
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);

    for (const field of fields) {
      const name = field.split("=")[0].trim();

      if (name) {
        options.add(name);
      }
    }
  }

  return [...options];
}

function collectCalls(body) {
  const calls = new Set();

  const ignoreCalls = new Set(["if", "for", "while", "switch", "catch"]);

  const regex = /\b([a-zA-Z0-9_]+)\s*\(/g;

  let match;

  while ((match = regex.exec(body))) {
    const functionName = match[1];

    if (ignoreCalls.has(functionName)) {
      continue;
    }

    const openParen = body.indexOf("(", match.index);

    let depth = 1;
    let i = openParen + 1;

    while (i < body.length && depth > 0) {
      if (body[i] === "(") depth++;
      if (body[i] === ")") depth--;

      i++;
    }

    const args = body.slice(openParen + 1, i - 1);

    const argList = args.split(",").map((v) => v.trim());

    if (!argList.includes("options")) {
      continue;
    }

    calls.add(functionName);
  }

  return [...calls];
}

function parseFunctions(content, moduleName) {
  const methods = {};

  const lines = content.split("\n");

  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    let exported = false;

    let match = line.match(
      /^export\s+(?:async\s+)?function\s+([a-zA-Z0-9_]+)\s*\(/,
    );

    if (match) {
      exported = true;
    } else {
      match = line.match(/^(?:async\s+)?function\s+([a-zA-Z0-9_]+)\s*\(/);
    }

    if (!match) {
      i++;
      continue;
    }

    const functionName = match[1];

    const source = [line];

    i++;

    while (i < lines.length) {
      source.push(lines[i]);

      if (lines[i] === "}") {
        break;
      }

      i++;
    }

    const text = source.join("\n");

    if (!text.includes("options")) {
      i++;
      continue;
    }

    const body = text.slice(text.indexOf("{") + 1);

    methods[functionName] = {
      moduleName,
      exported,
      options: collectOptions(body),
      calls: collectCalls(body),
    };

    i++;
  }

  return methods;
}

function collectAllOptions(functionName, methods, visited = new Set()) {
  if (visited.has(functionName)) {
    return new Set();
  }

  visited.add(functionName);

  const method = methods[functionName];

  if (!method) {
    return new Set();
  }

  const result = new Set(method.options);

  for (const call of method.calls) {
    const childOptions = collectAllOptions(call, methods, visited);

    for (const option of childOptions) {
      result.add(option);
    }
  }

  return result;
}

const methods = {};

for (const file of getFiles(rootDir, ".js")) {
  const moduleName = file.split("/").pop().replace(".js", "");

  const content = readText(file);

  Object.assign(methods, parseFunctions(content, moduleName));
}

const result = {};

for (const [functionName, method] of Object.entries(methods)) {
  if (!method.exported) {
    continue;
  }

  const options = [...collectAllOptions(functionName, methods)];

  if (!result[method.moduleName]) {
    result[method.moduleName] = {};
  }

  result[method.moduleName][functionName] = options
    .map((option) => `--${option}`)
    .join(" ");
}

console.log(JSON.stringify(result, null, 2));

console.log("functions:", Object.keys(result).length);
