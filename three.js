//3D metaball animation
// Orbiting balls animation
/* JS — full self-contained IIFE */
(function () {
  const canvas = document.getElementById('orbitCanvas');
  const ctx    = canvas.getContext('2d');
  const wrap   = document.getElementById('homeImg');

  let pointerX = -9999, pointerY = -9999;
  let active   = false;
  let longTimer = null;
  const LONG_MS = 120;   // ms before a stationary touch activates repulsion

  /* ── resize ── */
  function resize() {
    const box  = wrap.querySelector('.img-box');
    const r    = box.getBoundingClientRect();
    const size = Math.max(r.width, r.height) + 160;
    canvas.width  = size;
    canvas.height = size;
    canvas.style.width  = size + 'px';
    canvas.style.height = size + 'px';
  }
  window.addEventListener('resize', resize);
  resize();

  /* ── coordinate helper ── */
  function toCanvas(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return {
      x: (clientX - r.left) * (canvas.width  / r.width),
      y: (clientY - r.top)  * (canvas.height / r.height)
    };
  }

  function setPointer(clientX, clientY) {
    const p = toCanvas(clientX, clientY);
    pointerX = p.x; pointerY = p.y; active = true;
  }
  function clearPointer() {
    pointerX = -9999; pointerY = -9999; active = false;
  }

  /* ── mouse ── */
  wrap.addEventListener('mouseenter', e => setPointer(e.clientX, e.clientY));
  wrap.addEventListener('mousemove',  e => setPointer(e.clientX, e.clientY));
  wrap.addEventListener('mouseleave', clearPointer);

  /* ── touch ──
     - touchstart starts a short timer; if finger holds still it activates
     - touchmove activates immediately and tracks the drag
     - touchend / touchcancel always deactivate                           */
  wrap.addEventListener('touchstart', e => {
    e.preventDefault();
    clearTimeout(longTimer);
    const t = e.touches[0];
    longTimer = setTimeout(() => setPointer(t.clientX, t.clientY), LONG_MS);
  }, { passive: false });

  wrap.addEventListener('touchmove', e => {
    e.preventDefault();
    clearTimeout(longTimer);
    const t = e.touches[0];
    setPointer(t.clientX, t.clientY);
  }, { passive: false });

  wrap.addEventListener('touchend', e => {
    e.preventDefault();
    clearTimeout(longTimer);
    clearPointer();
  }, { passive: false });

  wrap.addEventListener('touchcancel', () => {
    clearTimeout(longTimer);
    clearPointer();
  });

  /* ── geometry helpers ── */
  const CX    = () => canvas.width  / 2;
  const CY    = () => canvas.height / 2;
  const IMG_R = () => canvas.width  / 2 - 80;

  /* ── Bubble class ── */
  class Bubble {
    constructor(i, total) {
      this.baseAngle = (i / total) * Math.PI * 2;
      this.angle     = this.baseAngle;
      this.speed     = (0.003 + Math.random() * 0.005) * (Math.random() < 0.5 ? 1 : -1);
      this.r         = 4 + Math.random() * 6;
      this.isOrange  = Math.random() < 0.5;
      this.phase     = Math.random() * Math.PI * 2;
      this.wobble    = 10 + Math.random() * 14;
      this.vx = 0; this.vy = 0;
      this.px = CX() + Math.cos(this.angle) * IMG_R();
      this.py = CY() + Math.sin(this.angle) * IMG_R();
    }

    update(t) {
      this.angle += this.speed;
      const orbit = IMG_R() + 20 + Math.sin(t * 1.3 + this.phase) * this.wobble;
      const tx = CX() + Math.cos(this.angle) * orbit;
      const ty = CY() + Math.sin(this.angle) * orbit;

      const ZONE = 90, FORCE = 260;
      let fx = 0, fy = 0;

      if (active) {
        const dx   = this.px - pointerX, dy = this.py - pointerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < ZONE && dist > 0.1) {
          const f = (ZONE - dist) / ZONE;
          fx += (dx / dist) * f * f * FORCE;
          fy += (dy / dist) * f * f * FORCE;
        }
      }

      this.vx = (this.vx + (tx - this.px) * 0.08 + fx * 0.016) * 0.82;
      this.vy = (this.vy + (ty - this.py) * 0.08 + fy * 0.016) * 0.82;
      this.px += this.vx;
      this.py += this.vy;
    }

    draw() {
      const hue  = this.isOrange ? 28  : 210;
      const sat  = this.isOrange ? 90  : 80;
      const spd  = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      const trail = Math.min(6, Math.ceil(spd * 0.35 + 2));

      // velocity-scaled motion trail
      for (let tr = trail; tr >= 1; tr--) {
        const alpha = (0.16 - tr * 0.018) * Math.min(1, spd * 0.3 + 0.5);
        ctx.beginPath();
        ctx.arc(
          this.px - this.vx * tr * 0.65,
          this.py - this.vy * tr * 0.65,
          this.r * (1 - tr * 0.1), 0, Math.PI * 2
        );
        ctx.fillStyle = `hsla(${hue},${sat}%,65%,${alpha})`;
        ctx.fill();
      }

      // outer glow
      const glow = ctx.createRadialGradient(this.px, this.py, 0, this.px, this.py, this.r * 3);
      glow.addColorStop(0, `hsla(${hue},${sat}%,30%,0.1)`);
      glow.addColorStop(1, `hsla(${hue},${sat}%,30%,0)`);
      ctx.beginPath();
      ctx.arc(this.px, this.py, this.r * 3, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      // core sphere gradient
      const core = ctx.createRadialGradient(
        this.px - this.r * 0.32, this.py - this.r * 0.32, 0,
        this.px, this.py, this.r
      );
      core.addColorStop(0,   `hsl(${hue},100%,97%)`);
      core.addColorStop(0.4, `hsl(${hue},95%,62%)`);
      core.addColorStop(1,   `hsl(${hue},75%,28%)`);
      ctx.beginPath();
      ctx.arc(this.px, this.py, this.r, 0, Math.PI * 2);
      ctx.fillStyle = core;
      ctx.fill();
    }
  }

  const bubbles = Array.from({ length: 36 }, (_, i) => new Bubble(i, 36));
  let t = 0;

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    bubbles.forEach(b => { b.update(t); b.draw(); });
    t += 0.022;
    requestAnimationFrame(loop);
  }
  loop();
})();