const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { transform } = require('lightningcss');

const root = path.resolve(__dirname, '..');
// Match Tailwind v4's browser baseline. Explicit targets also prevent unsafe
// shorthand folding of animation-timeline in browsers that require its longhand.
const targets = { chrome: 111 << 16, safari: (16 << 16) | (4 << 8), firefox: 128 << 16 };
const tailwind = spawnSync(process.execPath, [
    path.join(root, 'node_modules/@tailwindcss/cli/dist/index.mjs'),
    '-i', 'src/input.css', '-o', 'styles/tailwind.css', '--minify',
], { cwd: root, stdio: 'inherit' });
if (tailwind.error) throw tailwind.error;
if (tailwind.status !== 0) process.exit(tailwind.status ?? 1);

// Preserve the authored cascade; all outputs stay in styles/ so font URLs keep
// the same base. Editable source files remain separate for maintenance.
const bundles = {
    'site.min.css': [
        'tailwind.css', 'foundations.css', 'main.css', 'project-previews.css', 'portrait.css',
        'analysis-comparisons.css', 'analyst-workbench.css', 'dbt-project.css',
        'typography.css', 'skill-icons.css', 'storytelling.css',
        'lineage-explorer.css', 'data-cleaning.css',
    ],
    'legal.min.css': ['foundations.css', 'legal.css'],
};
for (const [output, sources] of Object.entries(bundles)) {
    const code = Buffer.from(sources.map(file => fs.readFileSync(path.join(root, 'styles', file), 'utf8')).join('\n'));
    const result = transform({ filename: output, code, minify: true, targets });
    for (const warning of result.warnings) console.warn(`${output}: ${warning.message}`);
    fs.writeFileSync(path.join(root, 'styles', output), result.code);
    console.log(`${output}: ${code.length.toLocaleString('en')} → ${result.code.length.toLocaleString('en')} bytes`);
}
