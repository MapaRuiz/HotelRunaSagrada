import { AfterViewInit, Component, ElementRef, Inject, Input, OnDestroy, PLATFORM_ID, ViewChild } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-blinds-bg',
  template: `<div class="bg-wrap"><canvas #cv class="bg-canvas"></canvas></div>`, // 👈 quitamos la viñeta
  styles: [`
    :host { position:absolute; inset:0; z-index:-1; pointer-events:none; background:#f2f3ed; }
    .bg-wrap { position:absolute; inset:0; overflow:hidden; }
    .bg-canvas { width:100%; height:100%; display:block; image-rendering:auto; filter:saturate(1.02); }
  `]
})
export class BlindsBgComponent implements AfterViewInit, OnDestroy {
  @ViewChild('cv', { static: true }) cv!: ElementRef<HTMLCanvasElement>;

  @Input() colors: string[] = ['#f2f3ed', '#e0d4be', '#bcc399', '#778E69'];
  @Input() angleDeg = -22;
  @Input() blindCount = 18;
  @Input() blindMinWidth = 64;
  @Input() noise = 0.1;           // 👈 menos grano
  @Input() mirror = true;
  @Input() mouseDampening = 0.15;
  @Input() bg = '#f2f3ed';         // 👈 fondo base claro (blanquito)
  @Input() stripeStrength = 0.10;  // 👈 sombras de persiana mucho más suaves

  private isBrowser = false;
  private gl!: WebGLRenderingContext;
  private program!: WebGLProgram;
  private raf: number | null = null;
  private ro?: ResizeObserver;
  private t0 = 0;
  private iMouse: [number, number] = [0, 0];
  private iMouseTarget: [number, number] = [0, 0];

  constructor(@Inject(PLATFORM_ID) pid: Object) { this.isBrowser = isPlatformBrowser(pid); }

  ngAfterViewInit() {
    if (!this.isBrowser) return;

    const canvas = this.cv.nativeElement;
    const gl = canvas.getContext('webgl', { alpha: true, antialias: true })!;
    if (!gl) return;
    this.gl = gl;

    const vsrc = `
      attribute vec2 position; attribute vec2 uv; varying vec2 vUv;
      void main(){ vUv = uv; gl_Position = vec4(position,0.,1.); }
    `;
    const fsrc = `
      precision mediump float;
      uniform vec3  iResolution;
      uniform vec2  iMouse;
      uniform float iTime;

      uniform float uAngle, uNoise, uBlindCount, uMirror, uDistort;
      uniform float uStripeStrength, uShineFlip;
      uniform vec3  uBg;

      uniform vec3  uColor0; uniform vec3 uColor1; uniform vec3 uColor2; uniform vec3 uColor3;
      uniform vec3  uColor4; uniform vec3 uColor5; uniform vec3 uColor6; uniform vec3 uColor7;
      uniform int   uColorCount;
      varying vec2 vUv;

      float rand(vec2 c){ return fract(sin(dot(c, vec2(12.9898,78.233))) * 43758.5453); }
      vec2 rot(vec2 p, float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c)*p; }
      vec3 mix2(vec3 a, vec3 b, float t){ return a*(1.0-t)+b*t; }

      vec3 grad(float t){
        int n = uColorCount; if (n < 2) n = 2;
        float x = clamp(t,0.,1.) * float(n-1);
        float s = floor(x), f = fract(x);
        if (s < 1.0) return mix2(uColor0,uColor1,f);
        if (s < 2.0 && n>2) return mix2(uColor1,uColor2,f);
        if (s < 3.0 && n>3) return mix2(uColor2,uColor3,f);
        if (s < 4.0 && n>4) return mix2(uColor3,uColor4,f);
        if (s < 5.0 && n>5) return mix2(uColor4,uColor5,f);
        if (s < 6.0 && n>6) return mix2(uColor5,uColor6,f);
        if (s < 7.0 && n>7) return mix2(uColor6,uColor7,f);
        return uColor7;
      }

      void main(){
        vec2 frag = vUv * iResolution.xy;
        vec2 uv0  = frag / iResolution.xy;

        float aspect = iResolution.x / iResolution.y;
        vec2 p = uv0*2.0-1.0; p.x *= aspect;
        vec2 pr = rot(p, uAngle); pr.x /= aspect;
        vec2 uv = pr*0.5 + 0.5;

        // ondulado sutil
        vec2 um = uv;
        float a = um.y * 6.0, b = um.x * 6.0, w = 0.006;
        um.x += sin(a) * w; um.y += cos(b) * w;

        float t = um.x;
        if (uMirror > 0.5) t = 1.0 - abs(1.0 - 2.0 * fract(t));
        vec3 g = grad(t);

        // 👉 base muy clara (más del color #f2f3ed que del gradiente)
        vec3 col = mix(uBg, g, 0.30);

        // 👉 sombras de persiana MUY suaves
        float stripe = fract(um.x * max(uBlindCount, 1.0));
        if (uShineFlip > 0.5) stripe = 1.0 - stripe;
        col -= vec3(stripe) * uStripeStrength;

        // 👉 “spot” claro y suave (no oscurece)
        vec2 off = vec2(iMouse.x/iResolution.x, iMouse.y/iResolution.y);
        float d = distance(uv0, off);
        float r = 0.60, s = 1.0, o = 0.45;
        float dn = d / max(r, 1e-4);
        float spot = (1.0 - 2.0 * pow(dn, s)) * o;
        col += vec3(spot);

        // ruido más ligero
        col += (rand(gl_FragCoord.xy + iTime) - 0.5) * uNoise;

        gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
      }
    `;

    const vs = this.makeShader(gl.VERTEX_SHADER, vsrc);
    const fs = this.makeShader(gl.FRAGMENT_SHADER, fsrc);
    this.program = this.makeProgram(vs, fs);

    const buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1,-1, 0,0,  3,-1, 2,0,  -1, 3, 0,2
    ]), gl.STATIC_DRAW);

    const locPos = gl.getAttribLocation(this.program, 'position');
    const locUv  = gl.getAttribLocation(this.program, 'uv');
    gl.enableVertexAttribArray(locPos);
    gl.enableVertexAttribArray(locUv);
    gl.vertexAttribPointer(locPos, 2, gl.FLOAT, false, 16, 0);
    gl.vertexAttribPointer(locUv,  2, gl.FLOAT, false, 16, 8);

    this.setupUniforms();

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      const w = Math.max(1, Math.floor(rect.width  * dpr));
      const h = Math.max(1, Math.floor(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; this.gl.viewport(0, 0, w, h); }
      this.gl.uniform3f(this.loc('iResolution'), w, h, 1);
      const byMin = Math.max(1, Math.floor(rect.width / this.blindMinWidth));
      this.gl.uniform1f(this.loc('uBlindCount'), Math.min(this.blindCount, byMin));
      this.iMouse = [w/2, h/2]; this.iMouseTarget = [w/2, h/2];
    };
    resize();
    this.ro = new ResizeObserver(resize);
    this.ro.observe(canvas.parentElement!);

    const onMove = (ev: PointerEvent | MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      const x = (ev.clientX - rect.left) * dpr;
      const y = (rect.height - (ev.clientY - rect.top)) * dpr;
      this.iMouseTarget = [x, y];
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('mousemove', onMove, { passive: true });

    const loop = (t: number) => {
      this.raf = requestAnimationFrame(loop);
      if (!this.t0) this.t0 = t;
      this.gl.uniform1f(this.loc('iTime'), (t - this.t0) / 1000);
      const dt = 1/60, tau = Math.max(0.001, this.mouseDampening), k = 1 - Math.exp(-dt / tau);
      this.iMouse[0] += (this.iMouseTarget[0] - this.iMouse[0]) * k;
      this.iMouse[1] += (this.iMouseTarget[1] - this.iMouse[1]) * k;
      this.gl.uniform2f(this.loc('iMouse'), this.iMouse[0], this.iMouse[1]);
      this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);
    };
    this.raf = requestAnimationFrame(loop);
  }

  ngOnDestroy(){ if (this.raf) cancelAnimationFrame(this.raf); this.ro?.disconnect(); }

  private loc(name:string){ return this.gl.getUniformLocation(this.program, name)!; }
  private hex2rgb(h:string){ const c=h.replace('#',''); return [parseInt(c.slice(0,2),16)/255, parseInt(c.slice(2,4),16)/255, parseInt(c.slice(4,6),16)/255] as [number,number,number]; }

  private setupUniforms(){
    const gl = this.gl, prg = this.program; gl.useProgram(prg);
    gl.uniform1f(this.loc('uAngle'), this.angleDeg * Math.PI/180);
    gl.uniform1f(this.loc('uNoise'), this.noise);
    gl.uniform1f(this.loc('uDistort'), 0.6);
    gl.uniform1f(this.loc('uMirror'), this.mirror ? 1 : 0);
    gl.uniform1f(this.loc('uShineFlip'), 0);
    gl.uniform1f(this.loc('uStripeStrength'), this.stripeStrength);

    const [br,bg,bb] = this.hex2rgb(this.bg);
    gl.uniform3f(this.loc('uBg'), br,bg,bb);

    const stops = [...this.colors]; while (stops.length < 8) stops.push(stops[stops.length-1]);
    stops.slice(0,8).forEach((hex, i) => { const [r,g,b] = this.hex2rgb(hex); gl.uniform3f(this.loc(`uColor${i}`), r,g,b); });
    gl.uniform1i(this.loc('uColorCount'), Math.max(2, Math.min(8, this.colors.length)));
  }

  private makeShader(type:number, src:string){ const gl=this.gl; const sh=gl.createShader(type)!; gl.shaderSource(sh,src); gl.compileShader(sh);
    if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS)){ console.error(gl.getShaderInfoLog(sh)); throw new Error('shader'); } return sh; }
  private makeProgram(vs:WebGLShader, fs:WebGLShader){ const gl=this.gl; const p=gl.createProgram()!;
    gl.attachShader(p,vs); gl.attachShader(p,fs); gl.linkProgram(p);
    if(!gl.getProgramParameter(p,gl.LINK_STATUS)){ console.error(gl.getProgramInfoLog(p)); throw new Error('program'); }
    gl.useProgram(p); return p; }
}
