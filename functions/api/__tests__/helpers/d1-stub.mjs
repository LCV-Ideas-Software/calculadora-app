/**
 * Stub mínimo de D1 para testes. Encadeia prepare().bind().first/all/run.
 * `rules` permite sobrescrever respostas por trecho de SQL; caso contrário:
 *   run  → { success: true }
 *   all  → { results: [] }
 *   first→ { total: 0 } para COUNT, senão null
 *
 * @param {Array<{match:(sql:string)=>boolean, first?:Function, all?:Function, run?:Function}>} rules
 */
export function createD1Stub(rules = []) {
  function resolve(sql, kind, args) {
    for (const rule of rules) {
      if (rule.match(sql) && typeof rule[kind] === 'function') {
        return rule[kind](args, sql);
      }
    }
    if (kind === 'all') return { results: [] };
    if (kind === 'first') return /COUNT/i.test(sql) ? { total: 0 } : null;
    return { success: true };
  }

  return {
    prepare(sql) {
      const make = (args) => ({
        first: async () => resolve(sql, 'first', args),
        all: async () => resolve(sql, 'all', args),
        run: async () => resolve(sql, 'run', args),
      });
      return {
        bind: (...args) => make(args),
        ...make([]),
      };
    },
  };
}
