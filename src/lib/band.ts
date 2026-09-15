// Hairline trace band (brand motif). Built at build time from a seed so the page reads with JS off; no crossings.
function rng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
export const BAND = { W: 1200, M: 420, H: 60, R: 3.6 }; // W desktop width, M phone width (the phone svg is cropped to the viewport, so it gets its own, denser band)
export function makeBand(seed: number, W = BAND.W, tries = 26) {
  const { R } = BAND, r = rng(seed * 7919 + 17);
  const rows = [15, 30, 45], J = 15, GAP = 28;
  const paths: string[] = [], nodes: [number, number][] = [], used: [number, number][][] = rows.map(() => []);
  const free = (ri: number, x0: number, x1: number) => used[ri].every(([a, b]) => x1 + GAP < a || x0 - GAP > b);
  const take = (ri: number, x0: number, x1: number) => used[ri].push([x0, x1]);
  for (let t = 0; t < tries; t++) {
    let ri = Math.floor(r() * rows.length), x = r() * W, y = rows[ri];
    let d = `M${x.toFixed(1)} ${y}`, ok = true;
    const x0 = x, segs = 1 + Math.floor(r() * 3), taken: [number, number, number][] = [];
    for (let k = 0; k < segs; k++) {
      const nx = x + 50 + r() * 150;
      if (!free(ri, x, nx)) { ok = false; break; }
      taken.push([ri, x, nx]); d += ` H${nx.toFixed(1)}`; x = nx;
      if (k < segs - 1) {
        const dir = r() < 0.5 ? -1 : 1, nri = ri + dir;
        if (nri < 0 || nri >= rows.length || !free(nri, x, x + J + 50)) break;
        x += J; ri = nri; y = rows[ri]; d += ` L${x.toFixed(1)} ${y}`;
      }
    }
    if (!ok || taken.length === 0) continue;
    taken.forEach(([q, a, b]) => take(q, a - R, b + R));
    paths.push(d); nodes.push([x + R, y]);
    if (r() < 0.55) nodes.push([x0 - R, rows[taken[0][0]]]);
  }
  return { paths, nodes };
}
