// gradient.js - Interactive Layered Wave Background (3D lighting pass)
(function () {
  const canvas = document.getElementById('gradientCanvas');
  if (!canvas) return;

  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) {
    canvas.style.background = 'linear-gradient(135deg, #4a2c1a, #1a2f4a)';
    return;
  }

  // ---------- Shaders ----------
  const vertexShaderSrc = `
    attribute vec2 a_position;
    void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
  `;

  const fragmentShaderSrc = `
    precision highp float;

    uniform vec2  u_resolution;
    uniform float u_time;
    uniform vec2  u_mouse;       // 0..1
    uniform float u_mouseForce;  // 0..1

    // ---------- Palette (brown + navy, matches reference) ----------
    vec3 C_BG          = vec3(0.28, 0.16, 0.10);
    vec3 C_BROWN_HI    = vec3(0.55, 0.34, 0.22);
    vec3 C_BROWN_MID   = vec3(0.40, 0.24, 0.15);
    vec3 C_NAVY_DEEP   = vec3(0.07, 0.12, 0.22);
    vec3 C_NAVY_MID    = vec3(0.13, 0.20, 0.32);
    vec3 C_EDGE_GLOW   = vec3(0.78, 0.50, 0.28);
    vec3 C_SPEC        = vec3(1.00, 0.92, 0.78); // warm specular highlight color

    // ---- Wave height and its analytic derivative (slope) ----
    float wave(float x, float base, float amp, float freq, float phase) {
      return base + amp * sin(x * freq + phase)
                  + amp * 0.35 * sin(x * freq * 2.3 + phase * 1.7);
    }

    float waveSlope(float x, float amp, float freq, float phase) {
      return amp * freq * cos(x * freq + phase)
           + amp * 0.35 * (freq * 2.3) * cos(x * freq * 2.3 + phase * 1.7);
    }

    // Fine high-frequency ripple used only to perturb the normal's Z
    // component -- gives a shimmering, fabric-like specular texture
    // instead of one flat highlight band per layer.
    float bumpNormalZ(float x, float t, float seed) {
      return 0.5  * sin(x * 24.0 + t * 1.8 + seed)
           + 0.35 * sin(x * 41.0 - t * 1.1 + seed * 2.0);
    }

    // Draws one wave layer as a lit 3D-ish surface:
    // - normal built from the wave's slope (X) + a shimmer term (Z)
    // - lit with a cursor-driven directional light, Blinn-Phong
    // - faded toward the background color based on depth (aerial fog)
    void drawLayer(
      in  vec2  uv,
      in  float base, in float amp, in float freq, in float phase,
      in  vec3  layerColor,
      in  float depth,        // 0 = nearest, 1 = farthest
      in  float specStrength, // per-layer glossiness
      in  vec3  lightDir,
      in  float seed,
      inout vec3 col,
      inout float topEdge
    ) {
      float y = wave(uv.x, base, amp, freq, phase);
      float d = uv.y - y;
      float layerMask = smoothstep(0.004, -0.004, d);

      float shadow = smoothstep(0.00, 0.08, -d) * (1.0 - smoothstep(0.08, 0.25, -d));
      float rim = smoothstep(0.010, 0.0, abs(d));

      // ---- Build the surface normal ----
      float slope = waveSlope(uv.x, amp, freq, phase);
      float nz = bumpNormalZ(uv.x, u_time, seed) * 0.55;
      vec3 normal = normalize(vec3(-slope, 1.0, nz));

      // ---- Blinn-Phong lighting ----
      vec3 viewDir = vec3(0.0, 0.0, 1.0);
      vec3 halfDir = normalize(lightDir + viewDir);

      float ambient  = 0.24;
      float diffuse  = max(dot(normal, lightDir), 0.0);
      float spec     = pow(max(dot(normal, halfDir), 0.0), 34.0);

      // Distant layers catch less crisp specular (aerial softening)
      float fog = depth * 0.55;
      spec *= specStrength * (1.0 - fog * 0.8);

      vec3 lit = layerColor * (ambient + diffuse * 0.9);
      lit += C_SPEC * spec;

      // Fade toward background color the farther back the layer sits
      lit = mix(lit, C_BG, fog);

      col *= (1.0 - shadow * 0.5 * (1.0 - fog));
      col = mix(col, lit, layerMask);
      col += C_EDGE_GLOW * rim * 0.30 * (1.0 - fog * 0.6);

      topEdge = max(topEdge, rim);
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution.xy;

      vec2 mouse = u_mouse;
      vec2 dm = (mouse - 0.5);

      float t = u_time * 0.20;

      // ---- Light direction driven by the cursor ----
      // x controls left/right angle, y controls up/down tilt, z keeps
      // front faces lit so it never goes fully dark.
      vec3 lightDir = normalize(vec3(dm.x * 1.8, 0.55 + dm.y * 1.3, 0.75));

      float bgGrad = smoothstep(0.0, 1.0, uv.y);
      vec3 col = mix(C_BG * 0.75, C_BROWN_MID, bgGrad);

      float glow = exp(-length(uv - mouse) * 3.5) * u_mouseForce * 0.25;
      col += C_EDGE_GLOW * glow;

      float topEdge = 0.0;

      // Parallax: far layers barely shift, near layers shift more
      float par1 = dm.x * 0.015;
      float par2 = dm.x * 0.028;
      float par3 = dm.x * 0.042;
      float par4 = dm.x * 0.058;
      float par5 = dm.x * 0.075;

      // ---- Layer 1 (back - navy, big slow wave, farthest) ----
      drawLayer(
        vec2(uv.x + par1, uv.y),
        0.72, 0.10 + dm.y * 0.03, 2.2, t * 0.6 + dm.x * 1.2,
        C_NAVY_MID, 0.85, 0.5, lightDir, 1.0,
        col, topEdge
      );

      // ---- Layer 2 (brown mid layer) ----
      drawLayer(
        vec2(uv.x + par2, uv.y),
        0.55, 0.09 - dm.y * 0.025, 2.8, -t * 0.8 - dm.x * 1.0 + 1.3,
        C_BROWN_MID, 0.65, 0.6, lightDir, 2.0,
        col, topEdge
      );

      // ---- Layer 3 (deep navy, main center wave) ----
      drawLayer(
        vec2(uv.x + par3, uv.y),
        0.42, 0.11 + dm.y * 0.04, 2.5, t * 1.0 + dm.x * 1.5 + 2.1,
        C_NAVY_DEEP, 0.45, 0.75, lightDir, 3.0,
        col, topEdge
      );

      // ---- Layer 4 (brown highlight) ----
      drawLayer(
        vec2(uv.x + par4, uv.y),
        0.28, 0.08 - dm.y * 0.02, 3.1, -t * 0.9 - dm.x * 0.8 + 3.4,
        C_BROWN_HI * 0.85, 0.22, 0.85, lightDir, 4.0,
        col, topEdge
      );

      // ---- Layer 5 (front - deep navy foreground, nearest) ----
      drawLayer(
        vec2(uv.x + par5, uv.y),
        0.14, 0.09 + dm.y * 0.03, 2.6, t * 0.7 + dm.x * 1.1 + 4.7,
        C_NAVY_DEEP * 0.9, 0.0, 1.0, lightDir, 5.0,
        col, topEdge
      );

      float grain = (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.03;
      col += grain;

      float vig = smoothstep(1.15, 0.35, length(uv - 0.5));
      col *= 0.6 + 0.4 * vig;

      col = pow(col, vec3(0.95));

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  // ---------- Compile helpers ----------
  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  const vs = compile(gl.VERTEX_SHADER, vertexShaderSrc);
  const fs = compile(gl.FRAGMENT_SHADER, fragmentShaderSrc);
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.useProgram(program);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,  1, -1,  -1, 1,
    -1,  1,  1, -1,   1, 1
  ]), gl.STATIC_DRAW);

  const posLoc = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  const uRes   = gl.getUniformLocation(program, 'u_resolution');
  const uTime  = gl.getUniformLocation(program, 'u_time');
  const uMouse = gl.getUniformLocation(program, 'u_mouse');
  const uForce = gl.getUniformLocation(program, 'u_mouseForce');

  // ---------- Resize ----------
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width  = Math.floor(window.innerWidth  * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width  = window.innerWidth  + 'px';
    canvas.style.height = window.innerHeight + 'px';
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  window.addEventListener('resize', resize);
  resize();

  // ---------- Interaction ----------
  const target = { x: 0.5, y: 0.5 };
  const mouse  = { x: 0.5, y: 0.5 };
  let targetForce = 0.0;
  let force = 0.0;

  function setPointer(x, y) {
    target.x = x / window.innerWidth;
    target.y = 1.0 - (y / window.innerHeight);
    targetForce = 1.0;
  }

  window.addEventListener('mousemove',  e => setPointer(e.clientX, e.clientY), { passive: true });
  window.addEventListener('mouseleave', () => { targetForce = 0.0; });

  window.addEventListener('touchstart', e => {
    if (e.touches.length) setPointer(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });
  window.addEventListener('touchmove', e => {
    if (e.touches.length) setPointer(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });
  window.addEventListener('touchend', () => { targetForce = 0.0; });

  // Device tilt (mobile) — also drives the light angle via u_mouse
  window.addEventListener('deviceorientation', e => {
    if (e.gamma == null || e.beta == null) return;
    const gx = Math.max(-45, Math.min(45, e.gamma)) / 45;
    const gy = Math.max(-45, Math.min(45, e.beta - 30)) / 45;
    target.x = 0.5 + gx * 0.35;
    target.y = 0.5 - gy * 0.35;
    targetForce = Math.max(targetForce, 0.6);
  });

  // ---------- Render loop ----------
  const start = performance.now();
  function render() {
    mouse.x += (target.x - mouse.x) * 0.06;
    mouse.y += (target.y - mouse.y) * 0.06;
    force   += (targetForce - force) * 0.04;
    targetForce *= 0.985;

    const t = (performance.now() - start) / 1000;

    gl.uniform2f(uRes,  canvas.width, canvas.height);
    gl.uniform1f(uTime, t);
    gl.uniform2f(uMouse, mouse.x, mouse.y);
    gl.uniform1f(uForce, force);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(render);
  }
  render();
})();


