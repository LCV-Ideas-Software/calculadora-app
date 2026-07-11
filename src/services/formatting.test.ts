import { describe, expect, it } from 'vitest';
import { parseLocalizedNumber, pct } from './formatting.ts';

describe('pct', () => {
  it('formata fração como percentual (0.055 → "5,50%")', () => {
    expect(pct(0.055)).toBe('5,50%');
  });

  it('formata IOF fração 0.035 como "3,50%"', () => {
    expect(pct(0.035)).toBe('3,50%');
  });

  it('retorna travessão para null/undefined/NaN', () => {
    expect(pct(null)).toBe('—');
    expect(pct(undefined)).toBe('—');
    expect(pct(NaN)).toBe('—');
  });

  it('formata zero como "0,00%"', () => {
    expect(pct(0)).toBe('0,00%');
  });
});

describe('parseLocalizedNumber', () => {
  it('interpreta ponto como decimal em número simples ("5.5" → 5.5)', () => {
    expect(parseLocalizedNumber('5.5')).toBe(5.5);
  });

  it('interpreta "3.38" como 3.38 (spread/IOF)', () => {
    expect(parseLocalizedNumber('3.38')).toBe(3.38);
  });

  it('preserva formato BR mascarado ("1.234,56" → 1234.56)', () => {
    expect(parseLocalizedNumber('1.234,56')).toBe(1234.56);
  });

  it('interpreta vírgula como decimal ("1,5" → 1.5)', () => {
    expect(parseLocalizedNumber('1,5')).toBe(1.5);
  });

  it('interpreta formato en-US ("1,234.56" → 1234.56)', () => {
    expect(parseLocalizedNumber('1,234.56')).toBe(1234.56);
  });

  it('interpreta VET com vírgula ("5,7340" → 5.734)', () => {
    expect(parseLocalizedNumber('5,7340')).toBe(5.734);
  });

  it('retorna NaN para string vazia', () => {
    expect(Number.isNaN(parseLocalizedNumber(''))).toBe(true);
  });
});
