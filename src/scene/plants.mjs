import { E, Ci, leaf, L } from './draw.mjs';

export const level = c => c === null ? -1 : c === 0 ? 0 : c < 2 ? 1 : c < 4 ? 2 : c < 7 ? 3 : 4;
// southern-hemisphere seasons, indexed by calendar month (summer crops in Dec-Feb)
export const CROPS = ['tomato','corn','pumpkin','carrot','cabbage','broccoli','garlic','peas','lettuce','beans','strawberry','tomato'];
// the north's seasons run six months later, so its summer crops land in Jun-Aug
export const cropFor = (month, hemisphere = 'south') => CROPS[(month - 1 + (hemisphere === 'north' ? 6 : 0)) % 12];

export function plant(x, y, lv, crop, k, j) {
  // j: per-plant jitter 0..1
  if (lv === -1) return E(x, y, 2.4*k, 1*k, '#7d5636', 'opacity=".6"');
  if (lv === 0) return E(x, y, 2.6*k, 1.1*k, '#3e2716') + E(x-0.4*k, y-0.4*k, 1.6*k, 0.5*k, '#6e4a2e');
  const f = lv === 3 ? 0.72 : 1;
  let o = E(x + 1.6*k, y + 0.4*k, (lv < 3 ? 2.6 : 4) * k * f, 1.3*k, '#000', 'opacity=".2"');
  if (lv === 1) return o + L(x, y, x, y-2*k, '#5a9a35', 0.6*k) + leaf(x, y-1.8*k, 3*k, -55, 1*k, 'url(#leafA)') + leaf(x, y-1.8*k, 3*k, 50, 1*k, 'url(#leafA)');
  if (lv === 2) { [-75,-35,0,35,75].forEach((a,i) => o += leaf(x, y, (3.6 + (i%2)) * k, a + j*10, 1.2*k, i%2 ? 'url(#leafB)' : 'url(#leafA)')); return o; }
  switch (crop) {
    case 'tomato': {
      const h = 17*k*f;
      [[-3,'#3f7f2c'],[3,'#3f7f2c']].forEach(([dx]) => o += L(x+dx*k, y, x+dx*k*0.8, y-h, '#9fa6ab', 0.5*k));
      [0.35,0.7].forEach(t => o += `<ellipse cx="${x}" cy="${y-h*t}" rx="${3.4*k}" ry="${1.3*k}" fill="none" stroke="#9fa6ab" stroke-width="${0.5*k}"/>`);
      [[-1.6,.25,2.6],[1.8,.4,2.4],[-1.2,.6,2.4],[1.2,.78,2.2],[0,.95,1.8]].forEach(([dx,t,r],i) => o += Ci(x+dx*k, y-h*t, r*k*f, i%2 ? '#4f9a35' : '#3a7a28'));
      if (lv === 4) [[-2.2,.3],[2.4,.5],[-1.6,.62],[0.8,.22]].forEach(([dx,t]) => o += Ci(x+dx*k, y-h*t, 1.7*k, 'url(#fRed)') + Ci(x+dx*k, y-h*t-1.5*k, 0.5*k, '#2f6e22'));
      else [[-2,.35],[2,.55]].forEach(([dx,t]) => o += Ci(x+dx*k, y-h*t, 1*k, '#8ccf5a'));
      return o;
    }
    case 'corn': {
      const h = 26*k*f;
      o += L(x, y, x, y-h, '#6a9a3a', 1.4*k);
      [[.25,-60],[.4,55],[.55,-50],[.7,60],[.82,-45]].forEach(([t,a],i) => o += leaf(x, y-h*t, 9*k*f, a, 0.9*k, i%2 ? 'url(#leafB)' : 'url(#leafA)'));
      if (lv === 4) { o += E(x+1.8*k, y-h*0.55, 1.5*k, 3.6*k, 'url(#fYellow)', `transform="rotate(15 ${x+1.8*k} ${y-h*0.55})"`); o += leaf(x+0.6*k, y-h*0.4, 6*k, 20, 1*k, '#8cbf4f'); }
      for (let i = -2; i <= 2; i++) o += L(x, y-h, x+i*1.2*k, y-h-3*k, '#d9b45a', 0.45*k);
      return o;
    }
    case 'pumpkin': {
      [[-3,-1.5,3.2],[2.5,-2.2,2.9],[-0.5,-3.8,2.6]].forEach(([dx,dy,r],i) => o += Ci(x+dx*k, y+dy*k, r*k*f, i%2 ? 'url(#leafB)' : 'url(#leafA)') + L(x+dx*k, y+dy*k, x+dx*k-r*k*0.5*f, y+dy*k-r*k*0.5*f, '#a8d880', 0.3*k));
      if (lv === 4) { o += E(x+2.6*k, y-1.8*k, 2*k, 2.3*k, 'url(#fOrange)') + E(x-0.4*k, y-1.8*k, 2*k, 2.3*k, 'url(#fOrange)') + E(x+1.1*k, y-2*k, 2.2*k, 2.6*k, 'url(#fOrange)'); o += L(x+1.1*k, y-4.4*k, x+1.6*k, y-5.6*k, '#5a3d1e', 0.8*k); }
      else o += Ci(x+1.6*k, y-1.6*k, 1.3*k, '#9ac25a') + Ci(x-1*k, y-3*k, 1*k, '#ffd54d');
      return o;
    }
    case 'carrot': {
      const h = 10*k*f;
      for (let i = -3; i <= 3; i++) { const ex = x + i*1.3*k, ey = y - h + Math.abs(i)*1.2*k; o += L(x, y, ex, ey, '#4f9a35', 0.4*k); o += Ci(ex, ey, 0.9*k, i%2 ? '#6dbb45' : '#4f9a35'); o += Ci((x+ex)/2, (y+ey)/2, 0.7*k, '#5aa83a'); }
      if (lv === 4) o += E(x, y-0.2*k, 1.6*k, 1*k, 'url(#fOrange)');
      return o;
    }
    case 'cabbage': {
      [-70,-35,0,35,70].forEach((a,i) => o += leaf(x, y, 5*k*f, a, 2.2*k*f, i%2 ? '#5f9483' : '#73a891'));
      o += Ci(x, y-2.6*k*f, 3*k*f, 'url(#fCab)') + L(x, y-0.6*k*f, x-1.2*k*f, y-3.8*k*f, '#c8e6b4', 0.3*k) + L(x, y-0.6*k*f, x+1.4*k*f, y-3.6*k*f, '#c8e6b4', 0.3*k);
      return o;
    }
    case 'broccoli': {
      const h = 10*k*f;
      [-60,60,-25,25].forEach((a,i) => o += leaf(x, y, 7*k*f, a, 1.6*k, i%2 ? '#4f7f6a' : '#5f9483'));
      o += L(x, y, x, y-h*0.6, '#8fb46a', 1*k);
      [[-1.6,-.6],[1.6,-.6],[0,-.85],[-0.8,-1],[0.9,-1]].forEach(([dx,t]) => o += Ci(x+dx*k*f, y+h*t, 1.7*k*f, '#3d6e3a') + Ci(x+dx*k*f-0.4*k, y+h*t-0.4*k, 0.6*k, '#5c8f4f'));
      return o;
    }
    case 'garlic': {
      const h = 11*k*f;
      [-22,-10,4,16,28].forEach((a,i) => o += leaf(x, y, h * (0.8 + (i%2)*0.2), a, 0.55*k, i%2 ? '#8fbf6a' : '#a8cf80'));
      if (lv === 4) o += E(x, y-0.3*k, 1.8*k, 1.2*k, '#f4ecdc') + E(x-0.5*k, y-0.6*k, 0.6*k, 0.4*k, '#ffffff') + `<path d="M${x} ${y-h} q${3*k} ${-3*k} ${1*k} ${-5*k}" stroke="#8fbf6a" stroke-width="${0.5*k}" fill="none"/>`;
      return o;
    }
    case 'peas': {
      const h = 16*k*f;
      o += L(x-3*k, y, x-3*k, y-h, '#a07a4a', 0.6*k) + L(x+3*k, y, x+3*k, y-h, '#a07a4a', 0.6*k);
      for (let t = 0.25; t < 1; t += 0.25) o += L(x-3*k, y-h*t, x+3*k, y-h*t, '#c9bfae', 0.25*k);
      o += `<path d="M${x} ${y} q${-3*k} ${-h*0.3} 0 ${-h*0.5} q${3*k} ${-h*0.2} 0 ${-h*0.45}" stroke="#5a9a35" stroke-width="${0.5*k}" fill="none"/>`;
      [[-1.4,.2],[1.4,.35],[-1.2,.55],[1.2,.7],[0,.88]].forEach(([dx,t],i) => o += Ci(x+dx*k, y-h*t, 1.3*k, i%2 ? '#6dbb45' : '#4f9a35'));
      if (lv === 4) { o += leaf(x+1.8*k, y-h*0.42, 4*k, 15, 0.9*k, '#8fd45b') + leaf(x-1.8*k, y-h*0.62, 4*k, -15, 0.9*k, '#8fd45b'); o += Ci(x+0.5*k, y-h*0.95, 0.9*k, '#ffffff'); }
      return o;
    }
    case 'lettuce': {
      const r = 3.4*k*f;
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; o += E(x + Math.cos(a)*r*0.6, y - r*0.7 + Math.sin(a)*r*0.35, r*0.55, r*0.4, lv === 4 && i%3 === 0 ? '#b8574a' : (i%2 ? '#9ad66a' : '#7cc451')); }
      o += Ci(x, y - r*0.9, r*0.5, '#c4ec8c');
      return o;
    }
    case 'beans': {
      const h = 20*k*f;
      o += L(x-2.5*k, y, x, y-h, '#a07a4a', 0.6*k) + L(x+2.5*k, y, x, y-h, '#a07a4a', 0.6*k);
      [[-1.8,.15],[1.6,.3],[-1.2,.45],[1.1,.6],[-0.6,.75],[0.4,.88]].forEach(([dx,t],i) => o += Ci(x+dx*k, y-h*t, 1.5*k, i%2 ? 'url(#leafA)' : 'url(#leafB)'));
      if (lv === 4) [[-2.2,.35],[2,.5],[-1.4,.62]].forEach(([dx,t]) => o += L(x+dx*k, y-h*t, x+dx*k+0.3*k, y-h*t+4*k, '#6fae38', 0.8*k));
      return o;
    }
    case 'strawberry': {
      [[-2.4,-1],[2.2,-1.2],[0,-2.6]].forEach(([dx,dy]) => { [-40,0,40].forEach(a => o += leaf(x+dx*k*f, y+dy*k*f, 2.6*k*f, a, 1.1*k*f, a ? 'url(#leafB)' : 'url(#leafA)')); });
      if (lv === 4) { [[2.8,0],[-2.6,-0.2],[0.6,0.4]].forEach(([dx,dy]) => o += `<path d="M${x+dx*k-1.1*k} ${y+dy*k-1.2*k} q${1.1*k} ${-0.6*k} ${2.2*k} 0 q${-0.2*k} ${2*k} ${-1.1*k} ${2.6*k} q${-0.9*k} ${-0.6*k} ${-1.1*k} ${-2.6*k}z" fill="url(#fStraw)"/>` + Ci(x+dx*k-0.3*k, y+dy*k, 0.18*k, '#ffe08a') + Ci(x+dx*k+0.4*k, y+dy*k+0.4*k, 0.18*k, '#ffe08a')); }
      else [0,72,144,216,288].forEach(a => o += Ci(x+Math.cos(a/57.3)*0.8*k, y-3.6*k+Math.sin(a/57.3)*0.8*k, 0.6*k, '#ffffff')) ;
      return o;
    }
  }
  return o;
}
