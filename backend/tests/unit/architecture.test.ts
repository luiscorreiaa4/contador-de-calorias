import { describe, it } from 'node:test';
import assert from 'node:assert';
import { resolve } from 'node:path';
import { projectFiles, type Checkable, type CheckOptions } from 'archunit';

const tsConfigPath = resolve(import.meta.dirname, '../../tsconfig.json');

interface FormattedViolation {
  dependency?: { sourceLabel?: string; targetLabel?: string };
  cycle?: unknown;
}

/**
 * Adaptador de asserção para ArchUnitTS em suítes com node:test + node:assert.
 * Permite usar a sintaxe idiomática `await expect(rule).toPassAsync()`.
 */
function expect(checkable: Checkable) {
  return {
    async toPassAsync(options?: CheckOptions) {
      const violations = await checkable.check(options);
      if (violations.length > 0) {
        const details = violations.map((rawViolation: unknown, index: number) => {
          const v = rawViolation as FormattedViolation;
          if (v.dependency) {
            return `  ${index + 1}. Violação de dependência: ${v.dependency.sourceLabel} -> ${v.dependency.targetLabel}`;
          }
          if (v.cycle) {
            return `  ${index + 1}. Ciclo detectado: ${JSON.stringify(v.cycle)}`;
          }
          return `  ${index + 1}. ${JSON.stringify(v)}`;
        }).join('\n');
        assert.fail(`Regra de arquitetura violada (${violations.length} ocorrência(s)):\n${details}`);
      }
    },
  };
}

describe('Backend Architecture Rules (ArchUnitTS - 4 Camadas)', () => {
  it('1. O código-fonte em src/** não deve conter dependências circulares', async () => {
    const rule = projectFiles(tsConfigPath)
      .inFolder('src/**')
      .should()
      .haveNoCycles();

    await expect(rule).toPassAsync();
  });

  it('2. Controllers não devem depender diretamente de Models (devem usar Services)', async () => {
    const rule = projectFiles(tsConfigPath)
      .inFolder('src/controllers/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/models/**');

    await expect(rule).toPassAsync();
  });

  it('3. Controllers não devem depender de Routes', async () => {
    const rule = projectFiles(tsConfigPath)
      .inFolder('src/controllers/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/routes/**');

    await expect(rule).toPassAsync();
  });

  it('4. Services não devem depender de Controllers', async () => {
    const rule = projectFiles(tsConfigPath)
      .inFolder('src/services/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/controllers/**');

    await expect(rule).toPassAsync();
  });

  it('5. Services não devem depender de Routes', async () => {
    const rule = projectFiles(tsConfigPath)
      .inFolder('src/services/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/routes/**');

    await expect(rule).toPassAsync();
  });

  it('6. Models não devem depender de Services', async () => {
    const rule = projectFiles(tsConfigPath)
      .inFolder('src/models/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/services/**');

    await expect(rule).toPassAsync();
  });

  it('7. Models não devem depender de Controllers', async () => {
    const rule = projectFiles(tsConfigPath)
      .inFolder('src/models/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/controllers/**');

    await expect(rule).toPassAsync();
  });

  it('8. Models não devem depender de Routes', async () => {
    const rule = projectFiles(tsConfigPath)
      .inFolder('src/models/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/routes/**');

    await expect(rule).toPassAsync();
  });

  it('9. Routes não devem depender diretamente de Models (devem delegar para Controllers)', async () => {
    const rule = projectFiles(tsConfigPath)
      .inFolder('src/routes/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/models/**');

    await expect(rule).toPassAsync();
  });

  it('10. Routes não devem depender de Services (devem delegar para Controllers)', async () => {
    const rule = projectFiles(tsConfigPath)
      .inFolder('src/routes/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/services/**');

    await expect(rule).toPassAsync();
  });
});
