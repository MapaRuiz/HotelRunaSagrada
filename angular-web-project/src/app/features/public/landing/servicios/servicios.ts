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
    'https://images.unsplash.com/photo-1761487184147-1a1b17af05d5?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8Y3VsdHVyYSUyMGNvbG9tYmlhbmF8ZW58MHwwfDB8fHww&auto=format&fit=crop&q=60&w=700',
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
    'https://images.unsplash.com/photo-1565310561246-a399c7659d12?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8Y3VsdHVyYSUyMGNvbG9tYmlhbmF8ZW58MHwwfDB8fHww&auto=format&fit=crop&q=60&w=700',
    'https://images.unsplash.com/photo-1567649543804-9e2cd1796342?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGN1bHR1cmElMjBjb2xvbWJpYW5hfGVufDB8MHwwfHx8MA%3D%3D&auto=format&fit=crop&q=60&w=700',
    'https://images.unsplash.com/photo-1589682449071-d13c27d1c298?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fGN1bHR1cmElMjBjb2xvbWJpYW5hfGVufDB8MHwwfHx8MA%3D%3D&auto=format&fit=crop&q=60&w=700',
    'https://images.unsplash.com/photo-1717521232674-e9a48c6a6fb5?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fHZhY2FjaW9uZXMlMjBjb2xvbWJpYXxlbnwwfDB8MHx8fDA%3D&auto=format&fit=crop&q=60&w=700'
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
    const textures = this.images.map(image => textureLoader.load(image));
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
            uniform sampler2D uTexture;
            uniform float uAlpha;
            varying vec2 vUv;
            void main() {
              vec4 color = texture2D(uTexture, vUv);
              gl_FragColor = vec4(color.rgb, uAlpha);
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
      end: '+=200%',
      pin: true
    });
  }

  private updateMeshes(): void {
    const width = 1.1;
    this.items.forEach(item => {
      const scrollOffset = this.st.progress * (this.items.length * width);
      item.mesh.position.x = (width * item.index) - scrollOffset;
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
