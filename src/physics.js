export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// All velocities use CSS pixels/second, independent of refresh rate.
export function advance(b, dt, bounds) {
  const damping = Math.exp(-.72 * dt);
  b.vx *= damping; b.vy *= damping;
  b.x += b.vx * dt; b.y += b.vy * dt;
  for (const [axis, velocity, lo, hi] of [
    ['x', 'vx', bounds.left + b.r, bounds.right - b.r],
    ['y', 'vy', bounds.top + b.r, bounds.bottom - b.r]
  ]) {
    if (b[axis] < lo) { b[axis] = lo; b[velocity] = Math.abs(b[velocity]) * .68; }
    if (b[axis] > hi) { b[axis] = hi; b[velocity] = -Math.abs(b[velocity]) * .68; }
  }
}

export function repel(b, rect, dt) {
  const x = clamp(b.x, rect.left, rect.right), y = clamp(b.y, rect.top, rect.bottom);
  let dx = b.x - x, dy = b.y - y, distance = Math.hypot(dx, dy);
  const clearance = b.r + 18;
  if (distance >= clearance) return false;
  if (distance < .01) {
    const sides = [[b.x-rect.left,-1,0],[rect.right-b.x,1,0],[b.y-rect.top,0,-1],[rect.bottom-b.y,0,1]];
    sides.sort((a,b)=>a[0]-b[0]);
    [,dx,dy] = sides[0]; distance = 1;
  }
  const force = Math.min(850, (clearance - distance) * 17);
  b.vx += dx / distance * force * dt;
  b.vy += dy / distance * force * dt;
  return true;
}

export function collide(a, b) {
  const dx = b.x-a.x, dy=b.y-a.y, d=Math.hypot(dx,dy), reach=a.r+b.r;
  if (d >= reach) return;
  const nx=d ? dx/d : 1, ny=d ? dy/d : 0, overlap=(reach-d)/2;
  a.x-=nx*overlap; a.y-=ny*overlap; b.x+=nx*overlap; b.y+=ny*overlap;
  const speed=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
  if(speed>=0)return;
  const impulse=-speed*.83;
  a.vx-=impulse*nx; a.vy-=impulse*ny; b.vx+=impulse*nx; b.vy+=impulse*ny;
  a.spin+=impulse*.002; b.spin-=impulse*.002;
}
