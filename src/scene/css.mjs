// Keyframes + class rules for the day scene. No var(): GitHub's image proxy needs plain CSS.
// Per-element timing (duration/delay) is written inline on each element.
export const DAY_CSS = [
  '.gr{transform-box:fill-box;transform-origin:50% 100%;animation:grow .5s cubic-bezier(.3,1.6,.5,1) both}',
  '@keyframes grow{from{transform:scale(0)}to{transform:scale(1)}}',
  '.sw{transform-box:fill-box;transform-origin:50% 100%;animation:sway 3s ease-in-out infinite alternate}',
  '@keyframes sway{from{transform:rotate(-3deg)}to{transform:rotate(3deg)}}',
  '.pk{transform-box:fill-box;transform-origin:30% 100%;animation:peck 4.2s ease-in-out infinite}',
  '.pkr{transform-origin:70% 100%;animation-name:peckr}',
  '@keyframes peck{0%,70%,100%{transform:rotate(0)}76%,88%{transform:rotate(22deg)}82%,94%{transform:rotate(4deg)}}',
  '@keyframes peckr{0%,70%,100%{transform:rotate(0)}76%,88%{transform:rotate(-22deg)}82%,94%{transform:rotate(-4deg)}}',
  '.bf{animation:flit 8s ease-in-out infinite}',
  '@keyframes flit{0%,100%{transform:translate(0,0)}25%{transform:translate(38px,-14px)}50%{transform:translate(70px,6px)}75%{transform:translate(26px,18px)}}',
  '.fl{transform-box:fill-box;transform-origin:50% 50%;animation:flap .22s ease-in-out infinite alternate}',
  '@keyframes flap{from{transform:scaleX(1)}to{transform:scaleX(.25)}}',
  '.bee{animation:orbit 3s linear infinite}',
  '@keyframes orbit{to{transform:rotate(360deg)}}',
  '.rp{transform-box:fill-box;transform-origin:50% 50%;animation:ripple 3s ease-out infinite}',
  '@keyframes ripple{from{transform:scale(.2);opacity:.9}to{transform:scale(1);opacity:0}}',
  '.cl{animation:drift 40s linear infinite}',
  '@keyframes drift{from{transform:translate(-500px,-120px)}to{transform:translate(700px,260px)}}',
  '.zz{animation:zz 3s ease-out infinite;opacity:0}',
  '@keyframes zz{0%{transform:translate(0,0);opacity:0}20%{opacity:.9}100%{transform:translate(8px,-16px);opacity:0}}',
  '.drop{animation:drop .9s ease-in infinite}',
  '.hop{animation:hop 5s ease-in-out infinite}',
  '@keyframes hop{0%,80%,100%{transform:translateY(0)}84%{transform:translateY(-5px)}88%{transform:translateY(0)}92%{transform:translateY(-4px)}}',
].join('\n');

// The water-drop keyframe's end point depends on where the
// gardener stands, so the renderer appends this one keyframe with literal values.
export const dropKeyframes = (dx, dy) =>
  `@keyframes drop{from{transform:translate(0,0);opacity:1}to{transform:translate(${dx}px,${dy}px);opacity:0}}`;

// Night additions, also without var().
// Firefly drift uses four fixed directions (bob1..bob4) instead of --dx/--dy.
export const BOBS = [[10, -5], [-9, 5], [7, 6], [-11, -4]];
export const NIGHT_CSS = [
  '.tail{transform-box:fill-box;transform-origin:100% 100%;animation:tail 2.6s ease-in-out infinite alternate}',
  '@keyframes tail{from{transform:rotate(-8deg)}to{transform:rotate(10deg)}}',
  '.shoot{animation:shoot 12s linear infinite;opacity:0}',
  '@keyframes shoot{0%{transform:translate(0,0);opacity:0}1%{opacity:1}6%{transform:translate(-300px,140px);opacity:0}100%{transform:translate(-300px,140px);opacity:0}}',
  '.eyes{transform-box:fill-box;transform-origin:50% 50%;animation:eyes 7s ease-in-out infinite}',
  '@keyframes eyes{0%,30%{opacity:0}34%,60%,66%,86%{opacity:1;transform:scaleY(1)}63%{transform:scaleY(.1)}90%,100%{opacity:0}}',
  '.ff{animation:blink 2s ease-in-out infinite,bob1 3.4s ease-in-out infinite alternate}',
  '@keyframes blink{0%,100%{opacity:.05}40%,60%{opacity:1}}',
  ...BOBS.map(([dx, dy], i) => `@keyframes bob${i + 1}{from{transform:translate(0,0)}to{transform:translate(${dx}px,${dy}px)}}`),
  '.tw,.ms{animation:blink 3s ease-in-out infinite}',
  '.bulb{animation:glow 3s ease-in-out infinite alternate}',
  '@keyframes glow{from{opacity:.75}to{opacity:1}}',
  '.moth{animation:orbit 2s linear infinite}',
  '.owl{transform-box:fill-box;transform-origin:50% 50%;animation:owlturn 9s ease-in-out infinite}',
  '@keyframes owlturn{0%,40%,100%{transform:scaleX(1)}45%,80%{transform:scaleX(-1)}}',
].join('\n');
