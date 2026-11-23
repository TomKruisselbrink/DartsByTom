// Vaste testdata voor de visuele baseline: altijd dezelfde spelers, potjes, datums en waarden (geen toeval).
// Realistisch genoeg om lijsten, grafieken, ranglijsten en detailtabellen te vullen.
export const NOW = new Date('2026-11-20T20:15:00+01:00').getTime();
const DAY = 86400000;
function rnd(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const PLAYERS = ['Tom', 'Henk', 'Imke', 'Jorn'];
const date = ts => { const d = new Date(ts); return d.getDate() + '-' + (d.getMonth() + 1) + '-' + d.getFullYear(); };
export function buildDB() {
  const r = rnd(42), db = {};
  PLAYERS.forEach(n => db[n] = { games: 0, wins: 0, totalDarts: 0, totalScore: 0, gameHistory: [] });
  db.Tom.nickname = 'The Power'; db.Tom.doubleStats = { D20: 9, D16: 6, D8: 3, D10: 2, D25: 1 }; db.Henk.doubleStats = { D16: 4, D20: 2, D1: 1 };
  const types = ['501', '501', '501', 'cricket', 'halveit', 'atc', 'shanghai7', 'bobs27', 'randomco', 'afgooien', '301', 'eliminatie', 'checkout121'];
  let gidN = 0;
  for (let k = 0; k < 36; k++) {
    const ts = NOW - (k * 0.9 + 0.1) * DAY - Math.floor(r() * 3600000), gt = types[k % types.length];
    const pl = gt === 'checkout121' ? ['Tom'] : (k % 3 === 0 ? ['Tom', 'Henk', 'Imke'] : ['Tom', k % 2 ? 'Henk' : 'Jorn']);
    const wi = Math.floor(r() * pl.length);
    pl.forEach((n, i) => {
      const won = pl.length > 1 && i === wi, e = { gid: 'fx-' + (++gidN), ts, date: date(ts), gameType: gt, won, darts: 0, score: 0 };
      if (pl.length > 1) e.opponents = pl.filter(x => x !== n);
      if (gt === '501' || gt === '301') {
        const avg = Math.round((45 + r() * 30) * 10) / 10, turns = 14 + Math.floor(r() * 10);
        e.darts = turns; e.matchFormat = 'FT2'; e.legResult = won ? '2–1' : '1–2';
        e.detailedStats = { avg3: avg, avg1: Math.round(avg / 3 * 100) / 100, count180: r() < .15 ? 1 : 0, count160: 0, count140: Math.floor(r() * 2), count120: 1, count100: 2, count80: 3, count60: 4, count0: 3, highTurn: 140, highFinish: won ? 40 + Math.floor(r() * 60) : 0, turns, checkoutAttempts: 5, checkoutHits: won ? 2 : 1, checkoutPct: won ? 40 : 20 };
        e.legBreakdown = [1, 2, 3].map(l => ({ legNum: l, winner: pl[(wi + l) % pl.length], start: Number(gt), co: 32, dbl: 'D16', playerStats: Object.fromEntries(pl.map(m => [m, { avg: Math.round((45 + r() * 30) * 10) / 10, darts: 7 + Math.floor(r() * 5), high: 100 + Math.floor(r() * 40), count180: 0, f9: 55.3, c100: 1, c140: 0, busts: 0, left: m === pl[(wi + l) % pl.length] ? 0 : 40 + Math.floor(r() * 80) }])) }));
      } else if (gt === 'cricket') { e.darts = 30; e.score = won ? 120 : 60 + Math.floor(r() * 40); }
      else if (gt === 'halveit') { e.score = e.highScore = won ? 260 : 120 + Math.floor(r() * 100); e.darts = 36; e.hiStats = { hits: 18, att: 36 }; e.hiRoundHistory = Array.from({ length: 12 }, (_, i2) => ({ round: i2, label: String(20 - i2), pts: i2 % 4 ? 20 : 0, halved: !(i2 % 4), newScore: 20 * i2 })); }
      else if (gt === 'atc') { e.darts = 60; e.highScore = won ? 22 : 15 + Math.floor(r() * 6); }
      else if (gt === 'shanghai7') { e.score = e.highScore = won ? 84 : 40 + Math.floor(r() * 40); e.darts = 21; }
      else if (gt === 'bobs27') { e.score = e.highScore = won ? 210 : 60; e.darts = 63; e.bobStats = { hits: 22, att: 63, reached: 21, out: false, stop: true }; }
      else if (gt === 'randomco') { e.score = e.highScore = won ? 24 : 12; e.darts = 90; e.rcoStats = { hits: won ? 7 : 4, att: 10, best: 96, brk: { '2–40': [3, 4], '41–60': [2, 3] }, mode: 'default', darts: 9 }; }
      else if (gt === 'afgooien') { e.darts = 24; }
      else if (gt === 'eliminatie') { e.score = e.highScore = won ? 301 : 180 + Math.floor(r() * 90); e.darts = 9; e.matchFormat = 'tot 301'; }
      else if (gt === 'checkout121') { e.won = true; e.darts = 45; e.score = 131; }
      db[n].gameHistory.push(e);
    });
  }
  PLAYERS.forEach(n => { const p = db[n]; p.gameHistory.sort((a, b) => b.ts - a.ts); p.games = p.gameHistory.length; p.wins = p.gameHistory.filter(e => e.won).length; p.totalDarts = p.gameHistory.reduce((s, e) => s + (e.darts || 0), 0); p.totalScore = p.gameHistory.reduce((s, e) => s + (e.score || 0), 0); });
  return db;
}
export const LAST_CONFIG = { c: { players: ['Tom', 'Henk'], botName: null, gameType: '501', doubleOut: true, matchN: 3, matchSets: 1, matchFormat: 'firstto', x01Start: 501 }, ts: NOW - 3 * 3600000 };
export const ERRLOG = [{ t: NOW - 7200000, w: 'Vriendverzoeken', m: 'FirebaseError: Missing or insufficient permissions.', n: 3, v: 252 }, { t: NOW - 3600000, w: '_lsSet', m: 'QuotaExceededError: The quota has been exceeded.', n: 1, v: 252 }];
