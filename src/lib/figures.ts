// The blog's drawn figures, built once at build time with the anatomy kit (./iso-kit.ts) into plain SVG strings.
// Each moving part is a <g data-part="i"> drawn at rest with a CSS offset (--dx, --dy, in SVG units) for its start
// pose; src/scripts/blog-figures.ts steps the parts home one at a time, and blog.css holds the motion. With no
// script, or under reduced motion, every part is drawn at rest.
import * as k from './iso-kit';

type P3 = k.Point3;
const S = k.solidSvg;
const L = k.lineSvg;
const D = k.dotsSvg;
const off = (P: k.Projection, by: P3) => {
  const [x, y] = k.axisVector(P, by);
  return `--dx:${x.toFixed(2)}px;--dy:${y.toFixed(2)}px`;
};

export interface Drawn {
  svg: string;
  width: number;
  height: number;
}

/**
 * An equipment rack with its near side panel off: `n` units on slides, each with a faceplate, two handles,
 * vents, a numbered label and a status light. Each unit starts pulled out and slides home; its light comes on.
 */
export function rack(n: number, label: string): Drawn {
  const WIDTH = 640;
  const HEIGHT = 440;
  const W = 64; // inner width, along y
  const DEP = 46; // depth, along x; the front faces +x
  const U = 10; // one unit's height
  const PITCH = 11.5;
  const OUT = 22; // how far a unit sits pulled out before it seats
  const Z0 = 9;
  const TOP = Z0 + n * PITCH + 0.5;
  const P = k.fitProjection(
    [...k.boxCorners({ x: -4, y: -4, w: DEP + 6 + OUT, d: W + 8, r: 0 }, 0, TOP + 3)],
    WIDTH,
    HEIGHT,
    { pad: 34, azimuth: 32 },
  );
  const at = (p: P3) => k.iso(p, P);
  const out: string[] = [];

  // floor shadow, feet, plinth with a ruler strip along its front
  const plinth = { x: -4, y: -4, w: DEP + 8, d: W + 8, r: 1.2 };
  out.push(`<path class="iso-halo" d="${k.haloOf(plinth, 0, 4, P)}"/>`);
  const feet = k.corners(plinth, 5).sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
  for (const [x, y] of feet) {
    out.push(S(k.cylinder(x, y, 2.6, 0, 1, P, 24), { tone: 'lo' }));
    out.push(S(k.cylinder(x, y, 1.9, 1, 2.6, P, 24), { tone: 'mid' }));
  }
  out.push(S(k.slabOf(plinth, 3.6, 4.4, P, 6, 0.8), { tone: 'mid' }));
  const strip = { x: DEP + 0.5, y: 2, w: 2.6, d: W - 4, r: 0.4 };
  out.push(S(k.slabOf(strip, 8, 0.4, P, 2), { tone: 'lo', crease: 'none' }));
  const ticks = k.topTicks(strip.y + 1, strip.y + strip.d - 1, 2, 5, strip.x + 0.3, 8.4, [0.9, 1.7], P, 'y');
  out.push(L(ticks.minor, { tone: 'lo' }), L(ticks.major, { tone: 'mid' }));
  out.push(
    D(
      k.corners(plinth, 1.8).map(([x, y]) => at([x, y, 8])),
      { size: 0.45 },
    ),
  );

  // back panel and the far side panel, with the slide rails and the rack holes on its inner face
  out.push(S(k.slabOf({ x: -3, y: -3, w: 3, d: W + 3, r: 0.4 }, 8, TOP - 8, P, 2), { tone: 'lo' }));
  out.push(S(k.slabOf({ x: 0, y: -3, w: DEP, d: 3, r: 0.4 }, 8, TOP - 8, P, 2), { tone: 'lo' }));
  const holes: k.Flat[] = [];
  for (let z = Z0 + 1.5; z < TOP - 1; z += 2.3) holes.push(at([DEP - 2.4, 0, z]), at([2.4, 0, z]));
  out.push(D(holes, { size: 0.42, tone: 'lo' }));
  for (let i = 0; i < n; i++) {
    const z = Z0 + i * PITCH;
    out.push(L(k.segment([1, 0, z + 1.2], [DEP - 4, 0, z + 1.2], P), { tone: 'faint' }));
  }
  // a cable loom up the back corner, clipped every unit
  out.push(L(k.segment([1.6, 1.6, 8], [1.6, 1.6, TOP], P), { tone: 'lo' }));
  out.push(
    D(
      Array.from({ length: n }, (_, i) => at([1.6, 1.6, Z0 + i * PITCH + 5])),
      { size: 0.5, tone: 'mid' },
    ),
  );

  // the units, bottom to top
  for (let i = 0; i < n; i++) {
    const z = Z0 + i * PITCH;
    const g: string[] = [];
    const body = { x: 3, y: 2.5, w: DEP - 4, d: W - 5, r: 0.6 };
    g.push(S(k.slabOf(body, z + 0.6, U - 1.2, P, 3), { tone: 'mid' }));
    // the side of the case: a seam and a row of vents
    g.push(L(k.segment([5, W - 2.5, z + U - 2.4], [DEP - 3, W - 2.5, z + U - 2.4], P), { tone: 'faint' }));
    for (let x = 9; x < DEP - 6; x += 2.4)
      g.push(L(k.segment([x, W - 2.5, z + 2.4], [x, W - 2.5, z + 5.2], P), { tone: 'lo' }));
    g.push(D([at([5, W - 2.5, z + 3.8]), at([DEP - 4.5, W - 2.5, z + 3.8])], { size: 0.4 }));
    // faceplate with ears, screws, vents, a label plate and the status light
    const FX = DEP + 1.6;
    const face = { x: DEP - 0.4, y: 0.4, w: 2, d: W - 0.8, r: 0.3 };
    g.push(S(k.slabOf(face, z, U, P, 2, 0.3), { tone: 'hi', crease: 'lo' }));
    g.push(
      D(
        [
          [1.6, 1.8],
          [1.6, U - 1.8],
          [W - 1.6, 1.8],
          [W - 1.6, U - 1.8],
        ].map(([y, dz]) => at([FX, y!, z + dz!])),
        { size: 0.5, tone: 'mid' },
      ),
    );
    for (let y = W * 0.5; y < W - 9; y += 1.5)
      g.push(L(k.segment([FX, y, z + 2.6], [FX, y, z + U - 2.6], P), { tone: 'lo' }));
    const plate: P3[] = [
      [FX, 13, z + 3],
      [FX, 13, z + U - 3],
      [FX, 26, z + U - 3],
      [FX, 26, z + 3],
    ];
    g.push(L(k.pathOf(k.pointsAt(plate, P), true), { tone: 'lo' }));
    g.push(L(k.segment([FX, 20.5, z + U / 2 + 0.6], [FX, 14.5, z + U / 2 + 0.6], P), { tone: 'faint' }));
    g.push(L(k.segment([FX, 20.5, z + U / 2 - 0.9], [FX, 16.5, z + U / 2 - 0.9], P), { tone: 'faint' }));
    g.push(
      k.faceTextSvg(k.sideMatrix([FX, 25], z + U / 2 - 1.2, P, 'right'), String(i + 1).padStart(2, '0'), {
        size: 2.4,
        tone: 'hi',
      }),
    );
    const led = at([FX, 9.2, z + U / 2]);
    g.push(L(k.sideRing([FX, 9.2, z + U / 2], 1.3, 'x', P, 18), { tone: 'lo' }));
    g.push(`<circle class="fig-led" cx="${led[0].toFixed(1)}" cy="${led[1].toFixed(1)}" r="1.5"/>`);
    // handles, near the two ends
    for (const y of [3.4, W - 5.2]) {
      g.push(S(k.slabOf({ x: FX, y, w: 1.8, d: 1.8, r: 0.5 }, z + 1.8, U - 3.6, P, 3), { tone: 'hi', crease: 'none' }));
    }
    out.push(`<g data-part="${i}" style="${off(P, [OUT, 0, 0])}">${g.join('')}</g>`);
  }

  // the top cap, with a vent grille
  const cap = { x: -3, y: -3, w: DEP + 3, d: W + 3, r: 0.8 };
  out.push(S(k.slabOf(cap, TOP, 3, P, 4, 0.6), { tone: 'mid' }));
  for (let y = 10; y < W - 10; y += 2)
    out.push(L(k.lineOnTop([DEP * 0.3, y], [DEP * 0.7, y], TOP + 3, P), { tone: 'lo' }));
  out.push(
    L(k.planOutline({ x: DEP * 0.3 - 2, y: 8, w: DEP * 0.4 + 4, d: W - 16, r: 1 }, TOP + 3, P), { tone: 'faint' }),
  );
  out.push(
    D(
      k.corners(cap, 2).map(([x, y]) => at([x, y, TOP + 3])),
      { size: 0.45 },
    ),
  );

  return { svg: k.figureSvg({ width: WIDTH, height: HEIGHT, label, body: out }), width: WIDTH, height: HEIGHT };
}

/**
 * A water line on a bench: an intake tank, a square duct with `n` leaking joints over a drip tray, and a
 * tank at the end with a sight glass. Each joint's collar drops into place, its drip stops, and the sight
 * glass rises one notch.
 */
export function leaks(n: number, label: string): Drawn {
  const WIDTH = 680;
  const HEIGHT = 400;
  const LEN = 160;
  const DY = 20; // the duct's centre line, along y
  const DZ = 40; // the duct's floor
  const DH = 8;
  const IN: k.Plane = [-14, DY];
  const END: k.Plane = [LEN + 14, DY];
  const TANK_TOP = 52;
  const RISE = 18; // how high a collar waits before it drops
  const joints = Array.from({ length: n }, (_, i) => 14 + ((LEN - 28) * i) / Math.max(1, n - 1));
  const stands = joints.slice(0, -1).map((x, i) => (x + joints[i + 1]!) / 2);
  const P = k.fitProjection(
    [
      ...k.boxCorners({ x: -28, y: 0, w: LEN + 56, d: 40, r: 0 }, 0, 0),
      [IN[0], IN[1], 62],
      [joints[0]!, DY, DZ + DH + RISE + 4],
      [END[0], END[1], TANK_TOP + 2],
    ],
    WIDTH,
    HEIGHT,
    { pad: 30, azimuth: 60 },
  );
  const at = (p: P3) => k.iso(p, P);
  const out: string[] = [];

  // base plate and the drip tray
  const base = { x: -30, y: 0, w: LEN + 60, d: 40, r: 1.5 };
  out.push(`<path class="iso-halo" d="${k.haloOf(base, 0, 3, P)}"/>`);
  out.push(S(k.slabOf(base, 0, 3, P, 6, 0.8), { tone: 'mid' }));
  out.push(
    D(
      k.corners(base, 3).map(([x, y]) => at([x, y, 3])),
      { size: 0.5 },
    ),
  );
  const tray = { x: 4, y: 9, w: LEN - 8, d: 22, r: 1 };
  out.push(S(k.slabOf(tray, 3, 2.4, P, 4, 0.4), { tone: 'mid' }));
  out.push(L(k.planOutline(k.insetPlan(tray, 1.4), 5.4, P), { tone: 'lo' }));
  const ticks = k.topTicks(6, LEN - 6, 2, 5, 33, 3, [1.2, 2.2], P, 'x');
  out.push(L(ticks.minor, { tone: 'lo' }), L(ticks.major, { tone: 'mid' }));
  joints.forEach((x, i) => {
    out.push(
      `<g data-puddle="${i}">${L(k.ring(x, DY, 3.2, 5.4, P, 24), { tone: 'mid' })}${L(k.ring(x, DY, 1.6, 5.4, P, 18), { tone: 'lo' })}</g>`,
    );
  });

  // the intake tank on the left, with bands and a fill cap
  out.push(S(k.cylinder(IN[0], IN[1], 11, 3, 2, P, 40), { tone: 'lo' }));
  out.push(S(k.cylinder(IN[0], IN[1], 10, 5, 55, P, 40, 0.8), { tone: 'hi', crease: 'lo' }));
  for (const z of [16, 34, 52]) out.push(L(k.sideArc(IN[0], IN[1], 10, z, P, 28), { tone: 'lo' }));
  out.push(L(k.ring(IN[0], IN[1], 7.6, 60, P, 36), { tone: 'faint' }));
  out.push(S(k.cylinder(IN[0], IN[1], 3.2, 60, 2.2, P, 24), { tone: 'mid' }));
  out.push(L(k.knurl(IN[0], IN[1], 3.2, 60, 62.2, 22, P), { tone: 'lo' }));

  // stands, then the drips under each joint (drawn before the duct, which hides where they form)
  for (const x of stands) {
    out.push(S(k.slabOf({ x: x - 4, y: DY - 6, w: 8, d: 12, r: 0.6 }, 5.4, 1.4, P, 2), { tone: 'mid' }));
    out.push(S(k.slabOf({ x: x - 1.6, y: DY - 1.6, w: 3.2, d: 3.2, r: 0.4 }, 6.8, DZ - 8.2, P, 2), { tone: 'mid' }));
    out.push(S(k.slabOf({ x: x - 3, y: DY - 5, w: 6, d: 10, r: 0.5 }, DZ - 1.4, 1.4, P, 2), { tone: 'mid' }));
  }
  const fall = k.screenRise(DZ - 6, P);
  joints.forEach((x, i) => {
    const [cx, cy] = at([x, DY, DZ]);
    out.push(
      `<g class="fig-drip" data-drip="${i}" style="--fall:${fall.toFixed(1)}px;--late:${(i * 0.37).toFixed(2)}s"><ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="2" ry="3"/></g>`,
    );
  });

  // the duct, joint by joint, with a collar per joint that drops into place
  const segment = (from: number, to: number) =>
    S(k.slabOf({ x: from, y: DY - DH / 2, w: to - from, d: DH, r: 0.5 }, DZ, DH, P, 2), { tone: 'hi', crease: 'lo' });
  let from = -6;
  joints.forEach((x, i) => {
    out.push(segment(from, x - 1));
    out.push(
      S(k.slabOf({ x: x - 1, y: DY - DH / 2 - 1.4, w: 2, d: DH + 2.8, r: 0.4 }, DZ - 1.4, DH + 2.8, P, 2), {
        tone: 'mid',
      }),
    );
    out.push(
      L(k.segment([x + 1, DY + DH / 2 + 1.4, DZ + DH + 1.4], [x + 1, DY - DH / 2 - 1.4, DZ + DH + 1.4], P), {
        tone: 'lo',
      }),
    );
    // a crack on the flange's face
    out.push(
      `<g data-crack="${i}">${L(k.pathOf([at([x + 1, DY + 1, DZ - 1.4]), at([x + 1, DY + 0.2, DZ + 1.6]), at([x + 1, DY + 1.4, DZ + 3.4])]), { tone: 'mid' })}</g>`,
    );
    const collar: string[] = [];
    const c = { x: x - 2.6, y: DY - DH / 2 - 2.6, w: 5.2, d: DH + 5.2, r: 0.8 };
    collar.push(S(k.slabOf(c, DZ - 2.6, DH + 5.2, P, 3, 0.5), { tone: 'hi', crease: 'lo', lit: true }));
    collar.push(
      L(k.segment([x + 2.6, c.y + c.d, DZ + DH / 2 + 1], [x + 2.6, c.y, DZ + DH / 2 + 1], P), { tone: 'faint' }),
    );
    collar.push(
      D(
        [
          at([x + 2.6, DY + 4.6, DZ + DH + 1.2]),
          at([x + 2.6, DY - 4.6, DZ + DH + 1.2]),
          at([x + 2.6, DY + 4.6, DZ - 1.2]),
          at([x + 2.6, DY - 4.6, DZ - 1.2]),
        ],
        { size: 0.45, tone: 'mid' },
      ),
    );
    collar.push(
      S(k.slabOf({ x: x - 0.8, y: c.y + c.d, w: 1.6, d: 1.6, r: 0.4 }, DZ + DH / 2 - 0.8, 1.6, P, 2), {
        tone: 'mid',
        crease: 'none',
      }),
    );
    out.push(`<g data-part="${i}" style="${off(P, [0, 0, RISE])}">${collar.join('')}</g>`);
    from = x + 1;
  });
  out.push(segment(from, END[0] - 8));

  // the tank at the end, with a sight glass that fills a notch per sealed joint
  out.push(S(k.cylinder(END[0], END[1], 13, 3, 2, P, 44), { tone: 'lo' }));
  out.push(S(k.cylinder(END[0], END[1], 12, 5, TANK_TOP - 5, P, 44, 0.8), { tone: 'hi', crease: 'lo' }));
  for (const z of [14, 30, 46]) out.push(L(k.sideArc(END[0], END[1], 12, z, P, 30), { tone: 'lo' }));
  out.push(L(k.ring(END[0], END[1], 9.6, TANK_TOP, P, 40), { tone: 'faint' }));
  const [vx, vy] = k.towardViewer(P);
  const gx = END[0] + vx * 12.2;
  const gy = END[1] + vy * 12.2;
  const across: k.Plane = [-vy * 1.6, vx * 1.6];
  const G0 = 9;
  const G1 = TANK_TOP - 7;
  const glass = (z0: number, z1: number) =>
    k.pathOf(
      k.pointsAt(
        [
          [gx - across[0], gy - across[1], z0],
          [gx + across[0], gy + across[1], z0],
          [gx + across[0], gy + across[1], z1],
          [gx - across[0], gy - across[1], z1],
        ],
        P,
      ),
      true,
    );
  out.push(`<path class="fig-glass" d="${glass(G0, G1)}"/>`);
  out.push(`<path class="fig-level" style="--steps:${n}" d="${glass(G0, G1)}"/>`);
  out.push(L(glass(G0, G1), { tone: 'mid' }));
  for (let i = 1; i <= n; i++) {
    const z = G0 + ((G1 - G0) * i) / n;
    out.push(
      L(k.pathOf([at([gx + across[0], gy + across[1], z]), at([gx + across[0] * 2.2, gy + across[1] * 2.2, z])]), {
        tone: 'mid',
      }),
    );
  }

  return { svg: k.figureSvg({ width: WIDTH, height: HEIGHT, label, body: out }), width: WIDTH, height: HEIGHT };
}

/** The items of the first list in a component's rendered Markdown, as plain text: the figure's parts, in order. */
export function listItems(html: string): string[] {
  const list = html.match(/<(ul|ol)>([\s\S]*?)<\/\1>/)?.[2] ?? '';
  return [...list.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) =>
    m[1]!
      .replace(/<[^>]+>/g, '')
      .replace(/&#x27;|&#39;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim(),
  );
}
