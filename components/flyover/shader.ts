// Fragment shader for the homepage hero: a painted grassland seen from above,
// with a winding river, fish, a dirt road, bridges, cattle, a gull and clouds.
export const FLYOVER_FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes;
uniform float uTime;
uniform float uScroll;
uniform float uUnit; // canvas pixels per world unit
uniform float uCamX;
uniform float uFeather;
uniform vec4 uGull; // x, y, bank, flap

#define PI 3.14159265
float px;

float h21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  i = mod(i, 289.0);
  vec2 i1 = mod(i + 1.0, 289.0);
  float a = h21(i), b = h21(vec2(i1.x, i.y)), c = h21(vec2(i.x, i1.y)), d = h21(i1);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
  return v;
}
mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
float sdEll(vec2 p, vec2 r) { return (length(p / r) - 1.0) * min(r.x, r.y); }
float fill(float sd) { return 1.0 - smoothstep(-px, px, sd); }

// Rivers and main roads repeat across the land so the flight can go in any direction.
#define GAP 1.6
float riverK(vec2 w) { return floor((w.x - 0.06) / GAP + 0.5); }
float riverX(float y, float k) { float v = y + k * 3.7; return k * GAP + 0.06 + 0.15 * sin(v * 2.3) + 0.045 * sin(v * 5.3 + 1.3); }
float riverDX(float y, float k) { float v = y + k * 3.7; return 0.345 * cos(v * 2.3) + 0.2385 * cos(v * 5.3 + 1.3); }
float riverW(float y) { return 0.036 + 0.006 * sin(y * 1.9); }
// signed distance across the nearest river, measured perpendicular to its course
float riverLat(vec2 w) { float k = riverK(w); float dx = riverDX(w.y, k); return (w.x - riverX(w.y, k)) / sqrt(1.0 + dx * dx); }
float roadK(vec2 w) { return floor((w.x + 0.3) / GAP + 0.5); }
float roadX(float y, float k) { return k * GAP - 0.3 + 0.045 * sin((y + k * 2.9) * 1.2 + 2.0); }
float roadDX(float y, float k) { return 0.054 * cos((y + k * 2.9) * 1.2 + 2.0); }
float roadDist(vec2 w) { float k = roadK(w); float dx = roadDX(w.y, k); return abs(w.x - roadX(w.y, k)) / sqrt(1.0 + dx * dx); }

vec3 grassCol(vec2 w) {
  float m = fbm(w * 5.0 + 3.1);
  vec3 c = mix(vec3(0.49, 0.73, 0.22), vec3(0.62, 0.81, 0.27), smoothstep(0.25, 0.75, m));
  float dk = smoothstep(0.54, 0.63, fbm(w * 2.6 + vec2(5.2, 1.3)));
  c = mix(c, vec3(0.38, 0.62, 0.21), dk * 0.45);
  float lt = smoothstep(0.56, 0.66, fbm(w * 2.2 + vec2(-7.0, 4.0)));
  c = mix(c, vec3(0.73, 0.86, 0.33), lt * 0.5);
  float big = fbm(w * 1.1 + vec2(11.0, -3.0));
  c *= 0.9 + 0.18 * big;
  // painterly strokes: anisotropic noise turned by a slow direction field
  vec2 sq = rot(noise(w * 6.0) * 2.0 * PI) * w;
  float s = noise(vec2(sq.x * 320.0, sq.y * 70.0));
  float s2 = noise(vec2(sq.x * 140.0, sq.y * 35.0) + 17.0);
  c *= 0.92 + 0.09 * s + 0.05 * s2;
  return c;
}

vec4 trees(vec2 w, out float shadow) {
  vec2 cs = vec2(0.11);
  vec2 id = floor(w / cs);
  vec4 res = vec4(0.0);
  shadow = 0.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 cid = id + vec2(float(i), float(j));
    float h = h21(cid + vec2(3.1, 7.7));
    if (h > 0.13) continue;
    vec2 c = (cid + 0.2 + 0.6 * vec2(h21(cid + 1.3), h21(cid + 5.9))) * cs;
    if (abs(riverLat(c)) < riverW(c.y) + 0.025 || roadDist(c) < 0.022) continue;
    float r = 0.008 + 0.008 * h21(cid + 9.1);
    vec2 d = w - c;
    // a second, smaller crown beside some trees
    if (h < 0.07) {
      vec2 c2 = c + (vec2(h21(cid + 2.2), h21(cid + 4.4)) - 0.5) * 0.03;
      if (length(w - c2) < length(d)) { d = w - c2; r *= 0.75; c = c2; }
    }
    float rr = r * (1.0 + 0.45 * (noise(c * 50.0 + d / r * 1.6) - 0.5));
    vec2 dsh = d - vec2(0.007, -0.008);
    shadow = max(shadow, 1.0 - smoothstep(rr * 0.7, rr * 1.25, length(dsh)));
    float inside = fill(length(d) - rr);
    if (inside > 0.0) {
      float lit = clamp(dot(d / rr, vec2(-0.6, 0.6)) * 0.5 + 0.5, 0.0, 1.0);
      vec3 tc = mix(vec3(0.17, 0.36, 0.14), vec3(0.42, 0.64, 0.25), lit);
      tc *= 0.85 + 0.3 * noise(d * 700.0 + c * 31.0);
      res = vec4(mix(res.rgb, tc, inside), max(res.a, inside));
    }
  }
  return res;
}

float rectSd(vec2 p, vec2 b) { vec2 q = abs(p) - b; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0); }

void house(vec2 w, inout vec3 col) {
  float rk = roadK(w);
  float cy = floor(w.y / 0.8);
  vec2 hid = vec2(cy, rk * 7.0);
  float h = h21(hid + vec2(0.0, 17.0));
  if (h > 0.6) return;
  float side = h21(hid + vec2(0.0, 23.0)) < 0.5 ? -1.0 : 1.0;
  vec2 c = vec2(0.0, (cy + 0.3 + 0.4 * h21(hid + vec2(0.0, 9.0))) * 0.8);
  c.x = roadX(c.y, rk) + side * (0.03 + 0.03 * h21(hid + vec2(0.0, 4.0)));
  if (abs(riverLat(c)) < riverW(c.y) + 0.03) return;
  vec2 p = w - c;
  // shadows
  float sh = fill(rectSd(p - vec2(0.004, -0.005), vec2(0.0065, 0.0105)));
  sh = max(sh, fill(rectSd(p - vec2(0.0035, -0.0255), vec2(0.0045, 0.005))));
  col *= 1.0 - 0.3 * sh;
  // main house: ridge along y
  float m = fill(rectSd(p, vec2(0.0065, 0.0105)));
  vec3 roof = p.x < 0.0 ? vec3(0.80, 0.48, 0.36) : vec3(0.58, 0.32, 0.25);
  roof = mix(roof, vec3(0.92, 0.66, 0.5), (1.0 - smoothstep(0.0, px * 1.2, abs(p.x))) * 0.6);
  col = mix(col, roof, m);
  // shed
  vec2 q = p - vec2(0.0, -0.02);
  float s = fill(rectSd(q, vec2(0.0045, 0.005)));
  col = mix(col, q.x < 0.0 ? vec3(0.86, 0.83, 0.77) : vec3(0.66, 0.64, 0.6), s);
}

void roads(vec2 w, inout vec3 col) {
  float d = roadDist(w);
  float wob = (noise(vec2(w.y * 60.0, 3.0)) - 0.5) * 0.0008;
  // Side roads run from one main road to the next and cross the river between them on a bridge.
  float g = floor((w.x + 0.3) / GAP);
  float xa = roadX(w.y, g), xb = roadX(w.y, g + 1.0);
  float cy = floor(w.y / 1.1);
  float onBridge = 0.0, bridgeShadow = 0.0;
  vec2 sid = vec2(cy, g * 5.0);
  if (h21(sid + vec2(0.0, 31.0)) < 0.6 && w.x > xa && w.x < xb) {
    float y0 = (cy + 0.25 + 0.5 * h21(sid + vec2(0.0, 37.0))) * 1.1;
    float slope = (h21(sid + vec2(0.0, 41.0)) - 0.5) * 0.1;
    float yy = w.y - y0 - (w.x - xa) * slope;
    float d2 = abs(yy);
    if (abs(riverLat(w)) - riverW(w.y) < 0.004) {
      bridgeShadow = fill(abs(yy + 0.0045) - 0.0042);
      if (d2 < 0.0055) onBridge = 1.0;
    }
    d = min(d, d2);
  }
  d += wob;
  float rw = 0.0034;
  col *= 1.0 - 0.35 * bridgeShadow * (1.0 - onBridge);
  if (onBridge > 0.0) {
    float plank = step(0.25, fract(w.x * 700.0));
    vec3 bc = mix(vec3(0.45, 0.31, 0.21), vec3(0.66, 0.49, 0.33), plank);
    float rail = 1.0 - smoothstep(0.0038, 0.0046, d);
    col = mix(col, mix(vec3(0.36, 0.25, 0.17), bc, rail), fill(d - 0.0055));
    return;
  }
  vec3 rc = mix(vec3(0.82, 0.69, 0.50), vec3(0.67, 0.53, 0.37), smoothstep(rw * 0.45, rw, d));
  rc *= 0.93 + 0.12 * noise(w * 900.0);
  col = mix(col * (1.0 - 0.12 * (1.0 - smoothstep(rw, rw * 2.2, d))), rc, fill(d - rw));
}

void car(vec2 w, float period, float speed, float phase, inout vec3 col) {
  float rk = roadK(w);
  float yy = w.y - speed * uTime + phase + rk * 0.37;
  float k = floor(yy / period);
  float ly = yy - (k + 0.5) * period;
  float lx = w.x - roadX(w.y, rk);
  if (h21(vec2(k, phase + rk * 3.0)) > 0.7) return;
  vec2 p = vec2(lx - 0.0008 * sign(speed), ly);
  col *= 1.0 - 0.3 * fill(rectSd(p - vec2(0.0012, -0.0014), vec2(0.0017, 0.0033)) - 0.0005);
  float body = fill(rectSd(p, vec2(0.0016, 0.0032)) - 0.0005);
  vec3 cc = vec3(0.96, 0.96, 0.94);
  float front = speed < 0.0 ? -1.0 : 1.0;
  float glass = fill(rectSd(p - vec2(0.0, front * 0.0013), vec2(0.0012, 0.0006)));
  cc = mix(cc, vec3(0.25, 0.3, 0.36), glass);
  col = mix(col, cc, body);
}

// Loose herds of cattle and flocks of sheep. Each animal grazes in place for a while,
// then ambles a few body lengths, turning to face the way it walks.
// Cheap two-octave field that decides where herds graze.
float herdField(vec2 p) { return noise(p * 1.6 + vec2(20.0, 3.0)) * 0.62 + noise(p * 3.4 + vec2(7.0, 1.0)) * 0.38; }

void cows(vec2 w, inout vec3 col) {
  if (herdField(w) < 0.6) return;
  vec2 cs = vec2(0.022);
  vec2 id0 = floor(w / cs);
  float shadow = 0.0;
  vec4 animal = vec4(0.0);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 id = id0 + vec2(float(i), float(j));
    vec2 cc = (id + 0.5) * cs;
    float herd = smoothstep(0.64, 0.72, herdField(cc));
    if (herd <= 0.0 || h21(id + vec2(41.0, 17.0)) > herd * 0.3) continue;
    if (abs(riverLat(cc)) < riverW(cc.y) + 0.035 || roadDist(cc) < 0.018) continue;
    float sheep = step(0.66, noise(cc * 2.5 + 50.0));
    vec2 c = (id + 0.35 + 0.3 * vec2(h21(id + 2.0), h21(id + 8.0))) * cs;
    // graze (stand still) most of the time, walk for the rest
    float u = uTime * (0.045 + 0.04 * h21(id + 12.0)) + h21(id + 13.0) * 10.0;
    float fr = fract(u);
    float prog = floor(u) + smoothstep(0.6, 1.0, fr);
    float walking = smoothstep(0.6, 0.7, fr) * (1.0 - smoothstep(0.92, 1.0, fr));
    float a1 = 0.9 + 0.6 * h21(id + 14.0), a2 = 0.7 + 0.6 * h21(id + 15.0), ph = h21(id + 16.0) * 6.283;
    c += 0.014 * vec2(sin(prog * a1 + ph), sin(prog * a2 + ph * 1.7));
    vec2 dir = vec2(a1 * cos(prog * a1 + ph), a2 * cos(prog * a2 + ph * 1.7));
    mat2 r = rot(atan(dir.y, dir.x));
    vec2 d = r * (w - c);
    vec2 ds = r * (w - c - vec2(0.0014, -0.0018));
    // the head dips to graze while standing and lifts while walking
    float hx = sheep > 0.5 ? 0.0046 : 0.0051;
    hx += (1.0 - walking) * 0.0005 * sin(uTime * (1.3 + h21(id + 17.0)) + ph);
    vec2 br = sheep > 0.5 ? vec2(0.004, 0.003) : vec2(0.0045, 0.0027);
    float hr = sheep > 0.5 ? 0.0012 : 0.0015;
    shadow = max(shadow, max(fill(sdEll(ds, br + 0.0001)), fill(length(ds - vec2(hx, 0.0)) - hr)));
    float body = fill(sdEll(d, br));
    float head = fill(length(d - vec2(hx, 0.0)) - hr);
    float tone = h21(id + 9.0);
    vec3 bc = sheep > 0.5 ? vec3(0.95, 0.94, 0.88)
      : tone < 0.55 ? vec3(0.33, 0.2, 0.13) : tone < 0.9 ? vec3(0.2, 0.14, 0.11) : vec3(0.58, 0.42, 0.28);
    vec3 hc = sheep > 0.5 ? vec3(0.22, 0.2, 0.19) : bc * 0.85;
    bc *= 0.88 + 0.22 * clamp(-d.y / br.y * 0.5 + 0.5, 0.0, 1.0);
    float m = max(body, head);
    if (m > 0.0) animal = vec4(mix(bc, hc, head * (1.0 - body)), max(animal.a, m));
  }
  col *= 1.0 - 0.26 * shadow;
  col = mix(col, animal.rgb, animal.a);
}

// Single fish drifting downstream, each with its own pace, wander and tail beat.
float fish(vec2 w, float rk) {
  float m = 0.0;
  for (int L = 0; L < 3; L++) {
    float fl = float(L);
    float sp = 0.01 + 0.008 * fl;
    float P = 0.16 + 0.07 * fl;
    float base = floor((w.y + uTime * sp) / P);
    for (int j = -1; j <= 1; j++) {
      float c = base + float(j);
      vec2 id = vec2(c, fl * 17.0 + rk * 31.0);
      if (h21(id) > 0.12) continue;
      float ph = h21(id + 3.0) * 6.283;
      float fy = (c + 0.5 + 0.4 * (h21(id + 1.0) - 0.5)) * P - uTime * sp + 0.01 * sin(uTime * 0.31 + ph);
      float vy = -sp + 0.0031 * cos(uTime * 0.31 + ph);
      float rwf = riverW(fy);
      float f1 = 0.25 + 0.3 * h21(id + 5.0), f2 = 0.9 + 0.8 * h21(id + 6.0);
      float lat = (0.5 * sin(uTime * f1 + ph) + 0.15 * sin(uTime * f2 + ph * 2.0)) * rwf;
      float dlat = (0.5 * f1 * cos(uTime * f1 + ph) + 0.15 * f2 * cos(uTime * f2 + ph * 2.0)) * rwf;
      float dx = riverDX(fy, rk), inv = 1.0 / sqrt(1.0 + dx * dx);
      vec2 tang = vec2(dx, 1.0) * inv, nrm = vec2(1.0, -dx) * inv;
      vec2 fc = vec2(riverX(fy, rk), fy) + nrm * lat;
      vec2 fwd = normalize(tang * vy + nrm * dlat);
      vec2 side = vec2(fwd.y, -fwd.x);
      vec2 d = w - fc;
      vec2 lp = vec2(dot(d, side), dot(d, fwd));
      if (abs(lp.y) > 0.009 || abs(lp.x) > 0.005) continue;
      lp /= 0.95 + 0.5 * h21(id + 7.0);
      lp.x -= sin(uTime * (5.0 + 5.0 * h21(id + 9.0)) + ph) * 0.0007 * clamp(-lp.y / 0.0035, 0.0, 1.0);
      float body = fill(sdEll(lp, vec2(0.0012, 0.0036)));
      float tl = -lp.y - 0.003;
      float tail = (tl > 0.0 && tl < 0.0022) ? fill(abs(lp.x) - (tl * 0.75 + 0.0002)) : 0.0;
      m = max(m, max(body, tail) * (0.6 + 0.4 * h21(id + 11.0)));
    }
  }
  return m;
}

float cloudD(vec2 q) {
  vec2 cs = vec2(1.0, 0.9);
  vec2 id = floor(q / cs);
  float dmax = 0.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 cid = id + vec2(float(i), float(j));
    if (h21(cid + vec2(71.0, 13.0)) > 0.5) continue;
    vec2 c = (cid + 0.5 + 0.5 * (vec2(h21(cid + 3.0), h21(cid + 7.0)) - 0.5)) * cs;
    vec2 p = q - c;
    float r = 0.045 + 0.04 * h21(cid + 11.0);
    if (length(p) > r * 2.4) continue;
    float v = 1.0 - length(p * vec2(0.85, 1.0)) / (r * 0.8);
    for (int k = 0; k < 6; k++) {
      float fk = float(k);
      vec2 o = (vec2(h21(cid + fk * 1.7 + 0.3), h21(cid + fk * 2.3 + 0.9)) - 0.5) * r * 1.5;
      float rk = r * (0.55 + 0.3 * h21(cid + fk * 3.1));
      v = max(v, 1.0 - length(p - o) / rk);
    }
    v = min(v + (fbm(p * 55.0 + cid * 7.0) - 0.5) * 0.3, v + 0.03);
    dmax = max(dmax, v);
  }
  return dmax;
}

float gull(vec2 p, float flap, float blur) {
  float e = px * 1.2 + blur;
  float span = 0.026 * (0.78 + 0.22 * cos(flap));
  float ax = abs(p.x);
  float tx = clamp(ax / span, 0.0, 1.0);
  float wy = 0.0025 - 0.13 * ax - 0.007 * tx * tx + 0.003 * sin(flap) * tx;
  float th = mix(0.0042, 0.001, tx * tx);
  float wing = (1.0 - smoothstep(span - e, span + e, ax)) * (1.0 - smoothstep(th - e, th + e, abs(p.y - wy)));
  float body = 1.0 - smoothstep(-e, e, sdEll(p - vec2(0.0, 0.001), vec2(0.0021, 0.0085)));
  float tail = 1.0 - smoothstep(-e, e, sdEll(p - vec2(0.0, -0.0085), vec2(0.0017, 0.0032)));
  return max(max(body, wing), tail);
}

void main() {
  px = 1.0 / uUnit;
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uUnit;
  vec2 w = uv + vec2(uCamX, uScroll);

  vec3 col = grassCol(w);

  // river with sandy banks and slow current
  float rw = riverW(w.y), lat = riverLat(w), rk = riverK(w);
  float rd = abs(lat) - rw + (noise(vec2(w.y * 40.0, sign(lat) * 5.0 + rk)) - 0.5) * 0.003;
  // wet sand, then a darker damp line right at the waterline
  col = mix(col, vec3(0.86, 0.79, 0.6) * (0.94 + 0.12 * noise(w * 400.0)), 1.0 - smoothstep(0.0028, 0.0042, rd));
  col = mix(col, vec3(0.62, 0.6, 0.45), (1.0 - smoothstep(0.0, 0.0012, abs(rd - 0.0004))) * 0.5);
  if (rd < px * 3.0) {
    float depth = clamp(-rd / rw, 0.0, 1.0);
    float across = lat / rw;
    // downstream is toward -y; patterns sampled at (y + v t) drift that way
    float s = w.y + uTime * 0.05;
    vec3 wc = mix(vec3(0.45, 0.72, 0.76), vec3(0.15, 0.44, 0.67), smoothstep(0.0, 0.75, depth));
    // the sandy bottom shows through the shallows
    wc = mix(wc, vec3(0.6, 0.7, 0.58), (1.0 - smoothstep(0.0, 0.22, depth)) * 0.45);
    // long, slowly warping current lines
    float warp = noise(vec2(across * 2.0 + rk, s * 7.0));
    float cur = noise(vec2(across * 5.0 + warp * 1.6, s * 2.6));
    wc = mix(wc, vec3(0.5, 0.76, 0.9), smoothstep(0.58, 0.8, cur) * 0.35 * smoothstep(0.1, 0.5, depth));
    float cur2 = noise(vec2(across * 9.0 - warp, s * 5.0 + 4.0));
    wc *= 1.0 - 0.1 * smoothstep(0.55, 0.8, cur2);
    // fish under the surface, fainter where the water is deep
    wc = mix(wc, vec3(0.04, 0.13, 0.2), fish(w, rk) * 0.85);
    // glints on small ripples
    float glint = noise(vec2(across * 40.0, (w.y + uTime * 0.065) * 300.0)) * noise(vec2(across * 13.0 + 7.0, (w.y + uTime * 0.04) * 90.0));
    wc += vec3(0.9, 0.95, 1.0) * smoothstep(0.66, 0.78, glint) * 0.12 * smoothstep(0.3, 0.8, depth);
    // the bank's shadow on the water (light comes from the upper left)
    wc *= 1.0 - 0.22 * (1.0 - smoothstep(0.0, 0.3, depth)) * step(across, 0.0);
    // thin bright foam against the banks
    wc = mix(wc, vec3(0.9, 0.95, 0.96), (1.0 - smoothstep(0.0, 0.05, depth)) * 0.4);
    col = mix(col, wc, fill(rd));
  }

  roads(w, col);
  house(w, col);
  car(w, 1.3, -0.05, 0.0, col);
  car(w, 2.3, 0.035, 0.77, col);
  cows(w, col);
  float tsh;
  vec4 tr = trees(w, tsh);
  col *= 1.0 - 0.3 * tsh;
  col = mix(col, tr.rgb, tr.a);

  // big soft light variation, like sun through haze
  col *= 0.95 + 0.08 * smoothstep(0.2, 0.8, fbm(w * 0.7 + vec2(uTime * 0.004, 0.0)));

  // clouds sit closer to the camera, so they pass faster
  vec2 q = uv + vec2(uTime * 0.004 + uCamX * 1.8, uScroll * 1.8);
  float cs = cloudD(q - vec2(0.05, -0.065));
  col *= 1.0 - 0.22 * smoothstep(0.0, 0.2, cs);

  // gull, wandering slowly over the middle
  vec2 gp = uGull.xy;
  float bank = uGull.z;
  float flap = uGull.w;
  vec2 gpLocal = rot(bank) * (uv - gp);
  vec2 gsLocal = rot(bank) * (uv - gp - vec2(0.024, -0.032));
  col *= 1.0 - 0.25 * gull(gsLocal, flap, 0.0012);

  // feathered, speckled edge into the page
  vec2 b = 0.5 * uRes / uUnit - 0.04;
  vec2 dq = abs(uv) - b + 0.02;
  float sd = length(max(dq, 0.0)) + min(max(dq.x, dq.y), 0.0) - 0.02;
  sd += (fbm(uv * 9.0) - 0.5) * 0.03;
  float soft = 1.0 - smoothstep(-0.01, 0.002, sd);
  float a = uFeather > 0.5 ? step(h21(floor(gl_FragCoord.xy) * 0.731 + 0.5), soft * 1.02) : 1.0;
  // paper grain
  col *= 0.975 + 0.05 * h21(floor(gl_FragCoord.xy) + 7.0);

  // gull on top
  float gm = gull(gpLocal, flap, 0.0);
  if (gm > 0.0) {
    float ax = abs(gpLocal.x);
    vec3 gc = mix(vec3(0.98, 0.98, 0.96), vec3(0.82, 0.84, 0.86), smoothstep(0.0, 0.004, -gpLocal.y + 0.0025 - 0.13 * ax) * 0.6);
    gc = mix(gc, vec3(0.3, 0.32, 0.36), smoothstep(0.019, 0.024, ax));
    col = mix(col, gc, gm);
    a = max(a, gm);
  }

  // clouds above everything, kept inside the feathered edge
  float cd = cloudD(q);
  if (cd > -0.05) {
    float ca = smoothstep(0.0, 0.1, cd);
    float cbr = cloudD(q + vec2(0.008, -0.008));
    float shade = clamp((cd - cbr) * 5.0, 0.0, 1.0);
    vec3 cc = mix(vec3(1.0), vec3(0.84, 0.87, 0.91), shade * 0.6);
    col = mix(col, cc, ca);
  }

  gl_FragColor = vec4(col * a, a);
}
`;
