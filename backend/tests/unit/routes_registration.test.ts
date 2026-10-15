import { describe, it } from 'node:test';
import assert from 'node:assert';
import { app } from '../../src/app.js';

describe('Route Registration (PC-04 / ARCH-004)', () => {
  it('deve registrar cada sub-roteador (/api/users, /api/foods, /api/meals) exatamente 1 vez', () => {
    const stack = (app as unknown as { _router: { stack: Array<{ name: string; regexp: RegExp }> } })._router.stack;

    // Apenas sub-roteadores montados com app.use('/api/...', router)
    const routerLayers = stack.filter(layer => layer.name === 'router');

    const userRouters = routerLayers.filter(l => l.regexp.source.includes('users'));
    const foodRouters = routerLayers.filter(l => l.regexp.source.includes('foods'));
    const mealRouters = routerLayers.filter(l => l.regexp.source.includes('meals'));

    assert.strictEqual(userRouters.length, 1, 'Sub-roteador /api/users deve estar montado exatamente 1 vez');
    assert.strictEqual(foodRouters.length, 1, 'Sub-roteador /api/foods deve estar montado exatamente 1 vez');
    assert.strictEqual(mealRouters.length, 1, 'Sub-roteador /api/meals deve estar montado exatamente 1 vez');
  });
});
