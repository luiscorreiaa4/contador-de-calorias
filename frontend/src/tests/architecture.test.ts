import { describe, it, expect } from 'vitest';
import { projectFiles, type Checkable, type CheckOptions } from 'archunit';
import { resolve } from 'node:path';

const tsConfigPath = resolve(import.meta.dirname, '../../tsconfig.app.json');

function expectArchitecture(checkable: Checkable) {
  return {
    async toPassAsync(options?: CheckOptions) {
      const violations = await checkable.check(options);
      expect(violations).toEqual([]);
    },
  };
}

describe('Frontend Architectural Rules (ArchUnitTS)', () => {
  it('não deve conter dependências circulares em src/**', async () => {
    const rule = projectFiles(tsConfigPath).inFolder('src/**').should().haveNoCycles();

    await expectArchitecture(rule).toPassAsync();
  }, 60000);

  it('camada de services não deve importar componentes UI', async () => {
    const rule = projectFiles(tsConfigPath)
      .inFolder('src/services/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/components/**');

    await expectArchitecture(rule).toPassAsync();
  });

  it('componentes reutilizáveis não devem depender de páginas', async () => {
    const rule = projectFiles(tsConfigPath)
      .inFolder('src/components/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/pages/**');

    await expectArchitecture(rule).toPassAsync();
  });
});
