import { load } from 'js-yaml';
import { documentationBlocks } from './docs-code-blocks.mjs';

function withoutDocumentationComments(text) {
  // Keep token boundaries and diagnostic line numbers when ignoring editorial
  // comments. This is documentation preprocessing, not HTML sanitization.
  return text.replace(/<!--[\s\S]*?-->/g, (comment) => comment.replace(/[^\r\n]/g, ' '));
}

// Check the dependencies a command installs, not their order or an exact prose
// string. Other packages (for example js-yaml in the validator guide) are valid.
export function npmInstallCommands(text) {
  const joined = withoutDocumentationComments(text).replace(/\\\r?\n[ \t]*/g, ' ');
  return joined.split(/\r?\n/).flatMap((line) => {
    if (/^\s*#/.test(line)) return [];
    return [...line.matchAll(/(?:^|`)[ \t]*(?:\$[ \t]+)?(npm[ \t]+(?:install|i)[ \t]+[^\r\n`]*)/g)]
      .map((match) => match[1].trim().replace(/\s+/g, ' '));
  });
}

export function npmInstallCommandProblems(command, { requiredPeers, allowedTarballs = [] }) {
  const prefix = command.match(/^npm\s+(?:install|i)\s+/);
  if (!prefix) return ['Expected a literal npm install command.'];
  const tokens = command.slice(prefix[0].length).match(/"[^"]*"|'[^']*'|\S+/g) || [];
  const packages = new Set();
  const problems = [];
  const allowedOptions = new Set(['--save', '--save-prod', '--save-exact', '-E', '--ignore-scripts', '--no-audit', '--no-fund']);
  for (const token of tokens) {
    if (token.startsWith('#')) break;
    if (allowedOptions.has(token)) continue;
    const spec = token.replace(/^(['"])(.*)\1$/, '$2');
    if (allowedTarballs.includes(spec)) {
      packages.add('topoviewer');
      continue;
    }
    // Registry names and optional versions/tags; reject local paths, URLs and
    // aliases that could silently substitute another package for a required one.
    const match = spec.match(/^(@[a-z0-9._-]+\/[a-z0-9._-]+|[a-z0-9][a-z0-9._-]*)(?:@([^:/\\\s]+))?$/i);
    if (match) packages.add(match[1]);
    else problems.push(`Unsupported package specifier or option: ${spec}`);
  }
  for (const required of ['topoviewer', ...requiredPeers]) {
    if (!packages.has(required)) problems.push(`Missing required package: ${required}`);
  }
  return problems;
}

const adoptionLinks = [
  'integration-roadmap.md',
  '../reference/compatibility.md',
  'performance-reliability-accessibility.md',
  'threat-model.md',
  '../start/first-topology.md',
  '../examples/use-cases/mkdocs.md',
  '../examples/use-cases/react.md'
];

// The adoption contract is an actionable trial and honest support/limit links.
// Editorial headings and paragraph wording are deliberately not an API.
export function adoptionGuideProblems(markdown, { sourceExists = () => true } = {}) {
  const text = withoutDocumentationComments(markdown);
  const problems = [];
  const links = new Set([...text.matchAll(/(?<!!)\[[^\]]*\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g)]
    .map((match) => match[1].split('#')[0]));
  for (const target of adoptionLinks) {
    if (!links.has(target)) problems.push(`Missing adoption guidance link: ${target}`);
  }
  for (const artifact of ['topology.yaml', 'stylesheet.yaml', 'mapper.yaml']) {
    if (!text.includes(artifact)) problems.push(`Missing portable bundle document: ${artifact}`);
  }
  let embeds;
  try {
    embeds = documentationBlocks(text).filter((block) => block.language === 'topoviewer');
  } catch (error) {
    return [...problems, error.message];
  }
  if (!embeds.length) problems.push('Missing runnable TopoViewer adoption example.');
  for (const block of embeds) {
    try {
      const config = load(block.text);
      for (const field of ['topology', 'stylesheet']) {
        const reference = config?.[field];
        if (typeof reference !== 'string' || !/^examples\/(?!.*(?:^|\/)\.\.\/).+\.ya?ml$/.test(reference)) {
          problems.push(`Adoption example at line ${block.line} needs an examples/ YAML ${field} reference.`);
        } else if (!sourceExists(reference)) {
          problems.push(`Missing adoption example source: ${reference}`);
        }
      }
    } catch (error) {
      problems.push(`Invalid adoption example at line ${block.line}: ${error.message}`);
    }
  }
  return problems;
}
