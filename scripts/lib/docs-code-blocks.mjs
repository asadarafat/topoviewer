import fs from 'node:fs';
import path from 'node:path';

// Respect fence length so examples of Markdown fences inside ````markdown are
// not mistaken for runnable YAML. Preserve original line numbers for diagnostics.
export function documentationBlocks(markdown) {
  const blocks = [];
  let current;
  let marker;
  for (const [index, line] of markdown.split('\n').entries()) {
    if (current) {
      const closing = line.match(/^\s*(`+|~+)\s*$/);
      if (closing && closing[1][0] === current.fence[0] && closing[1].length >= current.fence.length) {
        blocks.push({ ...current, text: current.lines.join('\n') });
        current = undefined;
      } else {
        current.lines.push(line.slice(Math.min(current.indent, line.search(/\S|$/))));
      }
      continue;
    }
    const annotation = line.match(/^\s*<!-- docs-check: ([\w-]+)(?: ([\w-]+))? -->\s*$/);
    if (annotation) {
      marker = { kind: annotation[1], id: annotation[2] };
      continue;
    }
    const opening = line.match(/^(\s*)(`{3,}|~{3,})([\w+-]*).*$/);
    if (opening) {
      current = { language: opening[3], fence: opening[2], indent: opening[1].length, line: index + 1, marker, lines: [] };
      marker = undefined;
    } else if (line.trim()) {
      marker = undefined;
    }
  }
  if (current) throw new Error(`Unclosed code fence at line ${current.line}`);
  return blocks;
}

export function expandDocumentationSnippets(text, repoRoot, ancestors = []) {
  return text.replace(/^([ \t]*)--8<--\s+"([^"]+)"\s*$/gm, (_, indent, reference) => {
    const file = path.resolve(repoRoot, reference);
    if (!file.startsWith(`${repoRoot}${path.sep}`)) throw new Error(`Snippet is outside the repository: ${reference}`);
    if (ancestors.includes(file)) throw new Error(`Cyclic snippet include: ${reference}`);
    const source = expandDocumentationSnippets(fs.readFileSync(file, 'utf8'), repoRoot, [...ancestors, file]);
    return source.trimEnd().split('\n').map((line) => `${indent}${line}`).join('\n');
  });
}
