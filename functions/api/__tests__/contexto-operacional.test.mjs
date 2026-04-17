import { expect, it } from 'vitest';
import { getOperationalContext } from '../contexto-operacional.mjs';

it('mercado aberto em dia útil sem feriado', () => {
    // 2026-03-23 15:30:00Z => 12:30 (BRT), segunda-feira
    const ctx = getOperationalContext(new Date('2026-03-23T15:30:00.000Z'));
    expect(ctx.dataBrasilISO).toBe('2026-03-23');
    expect(ctx.diaSemana).toBe(1);
    expect(ctx.hora).toBe(12);
    expect(ctx.is_feriado).toBe(false);
    expect(ctx.is_plantao).toBe(false);
});

it('mercado fechado no fim de semana', () => {
    // 2026-03-22 15:30:00Z => 12:30 (BRT), domingo
    const ctx = getOperationalContext(new Date('2026-03-22T15:30:00.000Z'));
    expect(ctx.diaSemana).toBe(0);
    expect(ctx.is_plantao).toBe(true);
});

it('feriado fixo fecha mercado', () => {
    // 2026-12-25 15:00:00Z => 12:00 (BRT), Natal
    const ctx = getOperationalContext(new Date('2026-12-25T15:00:00.000Z'));
    expect(ctx.dataBrasilISO).toBe('2026-12-25');
    expect(ctx.is_feriado).toBe(true);
    expect(ctx.is_plantao).toBe(true);
});

it('feriado variável de 2026 (Carnaval) fecha mercado', () => {
    // 2026-02-17 14:00:00Z => 11:00 (BRT), terça-feira de Carnaval
    const ctx = getOperationalContext(new Date('2026-02-17T14:00:00.000Z'));
    expect(ctx.dataBrasilISO).toBe('2026-02-17');
    expect(ctx.is_feriado).toBe(true);
    expect(ctx.is_plantao).toBe(true);
});
