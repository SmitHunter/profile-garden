// Font stacks: Chrome has no ui-monospace, so name real monospace faces.
export const MONO = "Consolas, Menlo, 'DejaVu Sans Mono', 'Liberation Mono', 'Courier New', monospace";
export const SANS = "-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";

export const DEFS = `<defs>
  <radialGradient id="fRed" cx=".35" cy=".35" r=".7"><stop offset="0" stop-color="#ff8a70"/><stop offset=".5" stop-color="#e53b2c"/><stop offset="1" stop-color="#a51f17"/></radialGradient>
  <radialGradient id="fOrange" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#ffc06b"/><stop offset=".55" stop-color="#f08a24"/><stop offset="1" stop-color="#b85a10"/></radialGradient>
  <radialGradient id="fYellow" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#fff2a8"/><stop offset=".6" stop-color="#f4cc3a"/><stop offset="1" stop-color="#c8981a"/></radialGradient>
  <radialGradient id="fCab" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#d8f0c0"/><stop offset=".6" stop-color="#9cc982"/><stop offset="1" stop-color="#6b9c5c"/></radialGradient>
  <radialGradient id="fStraw" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ff7b8a"/><stop offset=".6" stop-color="#e2283f"/><stop offset="1" stop-color="#9c1225"/></radialGradient>
  <linearGradient id="leafA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7cc451"/><stop offset="1" stop-color="#3f8a2c"/></linearGradient>
  <linearGradient id="leafB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5ea83b"/><stop offset="1" stop-color="#2f6e22"/></linearGradient>
  <linearGradient id="lawn" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a9d77e"/><stop offset="1" stop-color="#7fbf55"/></linearGradient>
  <linearGradient id="gravel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e9dcc0"/><stop offset="1" stop-color="#d4c29e"/></linearGradient>
  <linearGradient id="soil" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6a4529"/><stop offset="1" stop-color="#4a2e1a"/></linearGradient>
</defs>`;

export const S = 16, C = 0.866, OX = 450, OY = 175;
export const iso = (x, y, z = 0) => [OX + (x - y) * C * S, OY + (x + y) * 0.5 * S - z * S];
export const pts = a => a.map(p => iso(...p).map(v => v.toFixed(1)).join(',')).join(' ');
export const poly = (a, f, x = '') => `<polygon points="${pts(a)}" fill="${f}" ${x}/>`;
export const line = (a, b, st, w) => { const [x1,y1] = iso(...a), [x2,y2] = iso(...b); return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${st}" stroke-width="${w}" stroke-linecap="round"/>`; };
export function box(x, y, z, W, H, Z, top, front, right) {
  return poly([[x,y+H,z],[x+W,y+H,z],[x+W,y+H,z+Z],[x,y+H,z+Z]], front) +
         poly([[x+W,y,z],[x+W,y+H,z],[x+W,y+H,z+Z],[x+W,y,z+Z]], right) +
         poly([[x,y,z+Z],[x+W,y,z+Z],[x+W,y+H,z+Z],[x,y+H,z+Z]], top);
}

export const E = (cx, cy, rx, ry, f, x = '') => `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="${f}" ${x}/>`;
export const Ci = (cx, cy, r, f, x = '') => `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${f}" ${x}/>`;
export const leaf = (x, y, len, ang, w, f) => `<ellipse cx="0" cy="${(-len/2).toFixed(1)}" rx="${w.toFixed(1)}" ry="${(len/2).toFixed(1)}" fill="${f}" transform="translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${ang})"/>`;
export const L = (x1, y1, x2, y2, st, w) => `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${st}" stroke-width="${w}" stroke-linecap="round"/>`;
