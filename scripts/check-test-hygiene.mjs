import ts from '../backend/node_modules/typescript/lib/typescript.js';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, relative } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const backend = resolve(root, 'backend');
function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? files(resolve(dir, e.name)) : [resolve(dir, e.name)]);
}
function parse(file) { return ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true); }
function imports(ast) {
  return ast.statements.filter(ts.isImportDeclaration).map(s => s.moduleSpecifier.text);
}
function touchesDatabase(file, seen = new Set()) {
  if (seen.has(file) || !existsSync(file)) return false;
  seen.add(file);
  if (file === resolve(backend, 'src/database/pool.ts')) return true;
  return imports(parse(file)).some(spec => spec.startsWith('.') && touchesDatabase(resolve(dirname(file), spec.replace(/\.js$/, '.ts')), seen));
}
let failed = false;
for (const file of files(resolve(backend, 'tests')).filter(p => p.endsWith('.test.ts'))) {
  const ast = parse(file);
  const helperImports = ast.statements.filter(ts.isImportDeclaration).filter(s => /helpers\/lifecycle\.js$/.test(s.moduleSpecifier.text));
  const names = helperImports.flatMap(s => s.importClause?.namedBindings && ts.isNamedImports(s.importClause.namedBindings) ? s.importClause.namedBindings.elements.filter(e => (e.propertyName?.text ?? e.name.text) === 'closeTestPool').map(e => e.name.text) : []);
  let registered = false;
  function visit(node) {
    if (ts.isExpressionStatement(node) && ts.isCallExpression(node.expression) && ts.isIdentifier(node.expression.expression) && names.includes(node.expression.expression.text)) registered = true;
    ts.forEachChild(node, visit);
  }
  visit(ast);
  if (touchesDatabase(file) && !registered) {
    console.error(`${relative(root, file)}: importe e registre closeTestPool() de helpers/lifecycle.js.`);
    failed = true;
  }
}
process.exitCode = failed ? 1 : 0;
if (!failed) console.log('Higiene dos testes: encerramento central registrado.');
