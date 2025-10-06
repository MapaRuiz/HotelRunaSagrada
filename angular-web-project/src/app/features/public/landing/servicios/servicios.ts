import { Component, AfterViewInit, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

@Component({
  selector: 'app-servicios',
  standalone: true,
  templateUrl: './servicios.html',
  styleUrls: ['./servicios.css']
})
export class Servicios implements AfterViewInit {

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  private camera!: THREE.PerspectiveCamera;
  private scene!: THREE.Scene;
  private renderer!: THREE.WebGLRenderer;
  private uOffset = new THREE.Vector2(0, 0);
  private items: { mesh: THREE.Mesh; index: number }[] = [];
  private st: any;

  private images = [
    'https://raw.githubusercontent.com/jankohlbach/canary-islands/main/assets/images/slider-1.jpeg',
    'https://raw.githubusercontent.com/jankohlbach/canary-islands/main/assets/images/slider-2.jpeg',
    'https://raw.githubusercontent.com/jankohlbach/canary-islands/main/assets/images/slider-3.jpeg',
    'https://raw.githubusercontent.com/jankohlbach/canary-islands/main/assets/images/slider-4.jpeg',
    'https://raw.githubusercontent.com/jankohlbach/canary-islands/main/assets/images/slider-5.jpeg',
    'https://raw.githubusercontent.com/jankohlbach/canary-islands/main/assets/images/slider-6.jpeg',
    'https://raw.githubusercontent.com/jankohlbach/canary-islands/main/assets/images/slider-7.jpeg',
    'https://raw.githubusercontent.com/jankohlbach/canary-islands/main/assets/images/slider-8.jpeg',
    'https://raw.githubusercontent.com/jankohlbach/canary-islands/main/assets/images/slider-9.jpeg'
  ];

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initScene();
      this.setupScrollAnimation();
      this.animate();
    }
  }

  private initScene(): void {
    const canvas = document.querySelector('#canvas') as HTMLCanvasElement;
    if (!canvas) return;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.camera.position.z = 1.75;
    this.camera.position.y = 0.3;
    this.camera.rotation.z = 2 * Math.PI * 0.01;

    const textureLoader = new THREE.TextureLoader();
    const imgs = [...this.images];
    imgs.unshift(imgs[imgs.length - 2], imgs[imgs.length - 1]);
    imgs.splice(imgs.length - 2, 2);

    const textures = imgs.map(image => textureLoader.load(image));
    const geometry = new THREE.PlaneGeometry(1, 0.75, 10, 10);

    for (let i = 0; i < textures.length; i++) {
      const mesh = new THREE.Mesh(
        geometry,
        new THREE.ShaderMaterial({
          uniforms: {
            uOffset: { value: this.uOffset },
            uTexture: { value: textures[i] },
            uAlpha: { value: 1.0 }
          },
          vertexShader: `
            float PI = 3.141592653589793;
            uniform vec2 uOffset;
            varying vec2 vUv;
            vec3 deformationCurve(vec3 position, vec2 uv) {
              position.x = position.x - (sin(uv.y * PI) * uOffset.x);
              return position;
            }
            void main() {
              vUv = uv;
              vec3 newPosition = deformationCurve(position, uv);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
            }
          `,
          fragmentShader: `
            uniform vec2 uOffset;
            uniform sampler2D uTexture;
            uniform float uAlpha;
            varying vec2 vUv;
            vec3 rgbShift(sampler2D textureImage, vec2 uv, vec2 offset) {
              vec2 rg = texture2D(textureImage, uv).rg;
              float b = texture2D(textureImage, uv + offset).b;
              return vec3(rg, b);
            }
            void main() {
              vec3 color = rgbShift(uTexture, vUv, uOffset);
              gl_FragColor = vec4(color, uAlpha);
            }
          `
        })
      );
      this.items.push({ mesh, index: i });
      this.scene.add(mesh);
    }

    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.resizeCanvas();
  }

  private setupScrollAnimation(): void {
    gsap.registerPlugin(ScrollTrigger);

    const wrap = document.querySelector('#wrap');
    this.st = ScrollTrigger.create({
      trigger: wrap,
      start: 'top top',
      end: '+=500%',
      pin: true
    });
  }

  private updateMeshes(): void {
    const width = 1.1;
    const wholeWidth = this.items.length * width;
    this.items.forEach(item => {
      item.mesh.position.x =
        ((width * item.index) - (this.st.progress * 10) + (42069 * wholeWidth)) % wholeWidth - 2 * width;
      item.mesh.rotation.y = 2 * Math.PI * 0.03;
    });
  }

  private animate = (): void => {
    if (!isPlatformBrowser(this.platformId)) return;

    if (this.st?.isActive) {
      this.uOffset.set(this.st.getVelocity() * 0.00002, 0);
    } else {
      this.uOffset.set(0, 0);
    }

    this.updateMeshes();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.animate);
  };

  @HostListener('window:resize')
  onResize(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.resizeCanvas();
    }
  }

  private resizeCanvas(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }
}
