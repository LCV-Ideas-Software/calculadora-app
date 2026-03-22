import test from 'node:test';
import assert from 'node:assert/strict';
import { getOperationalContext } from '../contexto-operacional.mjs';

test('mercado aberto em dia útil sem feriado', () => {
    // 2026-03-23 15:30:00Z => 12:30 (BRT), segunda-feira
    const ctx = getOperationalContext(new Date('2026-03-23T15:30:00.000Z'));
    assert.equal(ctx.dataBrasilISO, '2026-03-23');
    assert.equal(ctx.diaSemana, 1);
    assert.equal(ctx.hora, 12);
    assert.equal(ctx.is_feriado, false);
    assert.equal(ctx.is_plantao, false);
});

test('mercado fechado no fim de semana', () => {
    // 2026-03-22 15:30:00Z => 12:30 (BRT), domingo
    const ctx = getOperationalContext(new Date('2026-03-22T15:30:00.000Z'));
    assert.equal(ctx.diaSemana, 0);
    assert.equal(ctx.is_plantao, true);
});

test('feriado fixo fecha mercado', () => {
    // 2026-12-25 15:00:00Z => 12:00 (BRT), Natal
    const ctx = getOperationalContext(new Date('2026-12-25T15:00:00.000Z'));
    assert.equal(ctx.dataBrasilISO, '2026-12-25');
    assert.equal(ctx.is_feriado, true);
    assert.equal(ctx.is_plantao, true);
});

test('feriado variável de 2026 (Carnaval) fecha mercado', () => {
    // 2026-02-17 14:00:00Z => 11:00 (BRT), terça-feira de Carnaval
    const ctx = getOperationalContext(new Date('2026-02-17T14:00:00.000Z'));
    assert.equal(ctx.dataBrasilISO, '2026-02-17');
    assert.equal(ctx.is_feriado, true);
    assert.equal(ctx.is_plantao, true);
});
