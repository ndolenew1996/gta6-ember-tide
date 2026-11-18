// EMBER TIDE — render: the three.js renderer, sunset sky, lighting and the
// chase camera. One class owns the WebGL canvas and nothing else.

import * as THREE from '../vendor/three.module.min.js';

export function skyTexture(night) {
  const c = document.createElement('canvas');
  c.width = 16; c.height = 512;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 512);
  if (night) {
    grad.addColorStop(0, '#070718'); grad.addColorStop(0.55, '#1b1440');
    grad.addColorStop(0.8, '#3d1e5c'); grad.addColorStop(1, '#120a24');
  } else {
    grad.addColorStop(0, '#7a4a9e'); grad.addColorStop(0.38, '#e85d75');
    grad.addColorStop(0.62, '#ff9a3d'); grad.addColorStop(0.8, '#ffd23f');
    grad.addColorStop(1, '#2a1a4a');
  }
  g.fillStyle = grad; g.fillRect(0, 0, 16, 512);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function windowTexture(lit) {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#232a3d'; g.fillRect(0, 0, 64, 128);
  for (let y = 8; y < 120; y += 14) {
    for (let x = 6; x < 58; x += 12) {
      const on = ((x * 7 + y * 13) % 10) < (lit ? 7 : 3);
      g.fillStyle = on ? (lit ? '#ffd98a' : '#ffe9a8') : '#10151f';
      g.fillRect(x, y, 8, 9);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export class Render {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.scene = new THREE.Scene();
    this.scene.background = skyTexture(false);
    this.camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 2000);
    this.camera.position.set(0, 40, 120);
    this.sun = new THREE.DirectionalLight(0xffb36b, 2.2);
    this.sun.position.set(-180, 90, 260);
    this.scene.add(this.sun);
    this.scene.add(new THREE.HemisphereLight(0xff9a6b, 0x2a1a4a, 0.9));
    this.ambient = new THREE.AmbientLight(0x804060, 0.5);
    this.scene.add(this.ambient);
    this.night = false;
    this.yaw = 0; this.pitch = 0.32;
    window.addEventListener('resize', () => this.resize());
    // The low sun disc on the horizon, due west over the bay.
    const sunGeo = new THREE.CircleGeometry(13, 32);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffd23f, fog: false });
    this.sunDisc = new THREE.Mesh(sunGeo, sunMat);
    this.sunDisc.position.set(-380, 48, 150);
    this.sunDisc.lookAt(-272, 9, 10);
    this.scene.add(this.sunDisc);
    // Skyline silhouette: a dark band of far towers on the horizon.
    const silMat = new THREE.MeshBasicMaterial({ color: 0x2a1440, fog: false });
    for (let i = 0; i < 26; i++) {
      const h = 30 + ((i * 37) % 70);
      const m = new THREE.Mesh(new THREE.BoxGeometry(18, h, 8), silMat);
      m.position.set(-480 + i * 40, h / 2 - 4, 420 - ((i * 53) % 60));
      this.scene.add(m);
    }
  }

  setNight(night) {
    this.night = night;
    this.scene.background = skyTexture(night);
    this.sun.intensity = night ? 0.25 : 2.2;
    this.sun.color.setHex(night ? 0x8fa8ff : 0xffb36b);
    this.ambient.intensity = night ? 0.9 : 0.5;
    this.sunDisc.visible = !night;
  }

  resize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }

  place(x, y, z, tx, ty, tz) {
    this.camera.position.set(x, y, z);
    this.camera.lookAt(tx, ty, tz);
  }

  // Chase camera: behind and above the target, looking slightly ahead.
  follow(x, y, z, heading, dist, height, lookAhead) {
    const bx = x - Math.sin(heading) * dist;
    const bz = z - Math.cos(heading) * dist;
    this.camera.position.set(bx, y + height, bz);
    this.camera.lookAt(x + Math.sin(heading) * lookAhead, y + 1.5, z + Math.cos(heading) * lookAhead);
  }

  draw() { this.renderer.render(this.scene, this.camera); }
}
