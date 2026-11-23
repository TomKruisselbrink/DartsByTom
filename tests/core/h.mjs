// Kleine testharnas voor tests/core (fase 2). Elke t() is één testgeval; done() print de uitslag en de regel
// "##CASES ok=X total=Y" die tests/run.mjs optelt. Exitcode 0 = alles groen.
export { browser, page, open } from '../security/lib.mjs';
export function suite(name) {
  const res = []; const t0 = Date.now();
  return {
    async t(label, fn) {
      try { await fn(); res.push([label, true]); }
      catch (e) { res.push([label, false, (e && e.message || String(e)).slice(0, 300)]); }
    },
    done() {
      const bad = res.filter(r => !r[1]);
      res.forEach(r => console.log((r[1] ? '  ✓ ' : '  ✗ ') + r[0] + (r[1] ? '' : '\n      ' + r[2])));
      console.log(`\n${name}: ${bad.length ? 'GEZAKT' : 'GESLAAGD'} (${res.length - bad.length}/${res.length}, ${Math.round((Date.now() - t0) / 1000)}s)`);
      console.log(`##CASES ok=${res.length - bad.length} total=${res.length}`);
      return bad.length ? 1 : 0;
    },
  };
}
export function eq(a, b, msg) { const A = JSON.stringify(a), B = JSON.stringify(b); if (A !== B) throw new Error(`${msg}: ${A} ≠ ${B}`); }
export function ok(c, msg) { if (!c) throw new Error(msg); }
export const E = () => ({ games: 0, wins: 0, totalDarts: 0, totalScore: 0, gameHistory: [] });
export const DB = (...names) => Object.fromEntries(names.map(n => [n, E()]));
export const wait = ms => new Promise(r => setTimeout(r, ms));
