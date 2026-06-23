
//3D metaball animation
// Orbiting balls animation
(function () {
  const canvas = document.getElementById('orbitCanvas');
  const ctx = canvas.getContext('2d');
  const homeImg = document.querySelector('.home-img');
  let mouseX = -999, mouseY = -999;

  function resize() {
    const box = homeImg.querySelector('.img-box');
    const r = box.getBoundingClientRect();
    const size = Math.max(r.width, r.height) + 140;
    canvas.width = size;
    canvas.height = size;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
  }
  window.addEventListener('resize', resize);
  resize();

  // ── Pointer helpers (shared logic for mouse & touch) ──────────────────────
  function setPointerFromClient(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    mouseX = (clientX - rect.left) * (canvas.width / rect.width);
    mouseY = (clientY - rect.top) * (canvas.height / rect.height);
  }

  function clearPointer() {
    mouseX = -999;
    mouseY = -999;
  }

  // ── Mouse events ──────────────────────────────────────────────────────────
  homeImg.addEventListener('mousemove', e => {
    setPointerFromClient(e.clientX, e.clientY);
  });
  homeImg.addEventListener('mouseleave', clearPointer);

  // ── Touch events ──────────────────────────────────────────────────────────
  // Use the first active touch point as the "pointer".
  // passive: false lets us call preventDefault() to suppress scroll-while-touching.
  homeImg.addEventListener('touchstart', e => {
    e.preventDefault();
    const t = e.touches[0];
    setPointerFromClient(t.clientX, t.clientY);
  }, { passive: false });

  homeImg.addEventListener('touchmove', e => {
    e.preventDefault();
    const t = e.touches[0];
    setPointerFromClient(t.clientX, t.clientY);
  }, { passive: false });

  homeImg.addEventListener('touchend', e => {
    // Clear only when all fingers have lifted
    if (e.touches.length === 0) clearPointer();
  });

  homeImg.addEventListener('touchcancel', clearPointer);

  // ── Canvas centre / radius helpers ────────────────────────────────────────
  const CX = () => canvas.width / 2;
  const CY = () => canvas.height / 2;
  const IMG_R = () => canvas.width / 2 - 70;

  class Bubble {
    constructor(i, total) {
      this.baseAngle = (i / total) * Math.PI * 1;
      this.angle = this.baseAngle;
      this.speed = (0.004 + Math.random() * 0.005) * (Math.random() < 0.5 ? 1 : -1);
      this.r = 4 + Math.random() * 6;
      this.isOrange = Math.random() < 1 / 2;
      this.phase = Math.random() * Math.PI * 2;
      this.wobble = 12 + Math.random() * 12;
      this.vx = 0; this.vy = 0;
      this.px = CX() + Math.cos(this.angle) * IMG_R();
      this.py = CY() + Math.sin(this.angle) * IMG_R();
    }

    update(t) {
      this.angle += this.speed;
      const baseOrbit = IMG_R() + 18;
      const tx = CX() + Math.cos(this.angle) * (baseOrbit + Math.sin(t * 1.3 + this.phase) * this.wobble);
      const ty = CY() + Math.sin(this.angle) * (baseOrbit + Math.sin(t * 1.3 + this.phase) * this.wobble);

      const REPEL_ZONE = 80, REPEL_FORCE = 230;
      let fx = 0, fy = 0;

      if (mouseX > 0) {
        const dx = this.px - mouseX, dy = this.py - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < REPEL_ZONE && dist > 0.1) {
          const force = (REPEL_ZONE - dist) / REPEL_ZONE;
          fx += (dx / dist) * force * force * REPEL_FORCE;
          fy += (dy / dist) * force * force * REPEL_FORCE;
        }
      }

      this.vx = (this.vx + (tx - this.px) * 0.08 + fx * 0.016) * 0.82;
      this.vy = (this.vy + (ty - this.py) * 0.08 + fy * 0.016) * 0.82;
      this.px += this.vx;
      this.py += this.vy;
    }

    draw() {
      const hue = this.isOrange ? 28 : 210;
      const sat = this.isOrange ? 90 : 80;

      // Motion trail
      for (let tr = 5; tr >= 1; tr--) {
        ctx.beginPath();
        ctx.arc(this.px - this.vx * tr * 0.7, this.py - this.vy * tr * 0.7, this.r * (1 - tr * 0.12), 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue},${sat}%,65%,${0.14 - tr * 0.022})`;
        ctx.fill();
      }

      // Glow effect
      const glow = ctx.createRadialGradient(this.px, this.py, 0, this.px, this.py, this.r * 0.5);
      glow.addColorStop(0, `hsla(${hue},${sat}%,70%,0.45)`);
      glow.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(this.px, this.py, this.r * 2.8, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      // Core colour gradient
      const core = ctx.createRadialGradient(
        this.px - this.r * 0.32, this.py - this.r * 0.32, 0,
        this.px, this.py, this.r
      );
      core.addColorStop(0, `hsl(${hue},100%,95%)`);
      core.addColorStop(0.4, `hsl(${hue},95%,61%)`);
      core.addColorStop(1, `hsl(${hue},75%,25%)`);
      ctx.beginPath();
      ctx.arc(this.px, this.py, this.r, 0, Math.PI * 2);
      ctx.fillStyle = core;
      ctx.fill();
    }
  }

  const bubbles = Array.from({ length: 32 }, (_, i) => new Bubble(i, 26));
  let t = 0;

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    bubbles.forEach(b => { b.update(t); b.draw(); });
    t += 0.022;
    requestAnimationFrame(loop);
  }
  loop();
})();