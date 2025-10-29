(function(){
  'use strict';

  class CardStreamController {
    constructor() {
      this.container = document.getElementById('cardStream');
      this.cardLine = document.getElementById('cardLine');
      this.speedIndicator = document.getElementById('speedValue');

      if (!this.container || !this.cardLine || !this.speedIndicator) {
        console.warn('CardStreamController: faltan elementos DOM requeridos.');
        return;
      }

      this.position = 0;
      this.velocity = 120;
      this.direction = -1;
      this.isAnimating = true;
      this.isDragging = false;

      this.lastTime = performance.now();
      this.lastMouseX = 0;
      this.mouseVelocity = 0;
      this.friction = 0.95;
      this.minVelocity = 30;

      this.containerWidth = 0;
      this.cardLineWidth = 0;
      this._resizeTimer = null;

      this.init();
    }

    init() {
      this.populateCardLine();
      this.calculateDimensions();
      this.setupEventListeners();
      this.updateCardPosition();
      this.animate();
      this.startPeriodicUpdates();
    }

    calculateDimensions() {
      if (!this.container || !this.cardLine) return;
      this.containerWidth = this.container.offsetWidth || window.innerWidth;
      const cardWidth = 400;
      const cardGap = 60;
      const cardCount = Math.max(1, this.cardLine.children.length || 1);
      this.cardLineWidth = (cardWidth + cardGap) * cardCount;
    }

    setupEventListeners() {
      if (!this.cardLine) return;

      this._onMouseDown = (e) => this.startDrag(e);
      this._onMouseMove = (e) => this.onDrag(e);
      this._onMouseUp = () => this.endDrag();

      this.cardLine.addEventListener('mousedown', this._onMouseDown);
      document.addEventListener('mousemove', this._onMouseMove);
      document.addEventListener('mouseup', this._onMouseUp);

      this._onTouchStart = (e) => {
        if (e && e.touches && e.touches[0]) this.startDrag(e.touches[0]);
      };
      this._onTouchMove = (e) => {
        if (e && e.touches && e.touches[0]) this.onDrag(e.touches[0]);
      };
      this._onTouchEnd = () => this.endDrag();

      this.cardLine.addEventListener('touchstart', this._onTouchStart, { passive: false });
      document.addEventListener('touchmove', this._onTouchMove, { passive: false });
      document.addEventListener('touchend', this._onTouchEnd);

      this._onWheel = (e) => this.onWheel(e);
      this.cardLine.addEventListener('wheel', this._onWheel, { passive: false });
      this.cardLine.addEventListener('selectstart', (e) => e.preventDefault());
      this.cardLine.addEventListener('dragstart', (e) => e.preventDefault());

      window.addEventListener('resize', () => {
        clearTimeout(this._resizeTimer);
        this._resizeTimer = setTimeout(() => {
          this.calculateDimensions();
          this.updateCardPosition();
        }, 120);
      });
    }

    startDrag(e) {
      if (!this.cardLine) return;
      e.preventDefault();

      this.isDragging = true;
      this.isAnimating = false;
      this.lastMouseX = e.clientX || 0;
      this.mouseVelocity = 0;

      const transform = window.getComputedStyle(this.cardLine).transform;
      if (transform && transform !== 'none') {
        try {
          const matrix = new DOMMatrix(transform);
          this.position = matrix.m41;
        } catch (err) {
          // ignore
        }
      }

      this.cardLine.style.animation = 'none';
      this.cardLine.classList.add('dragging');

      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'grabbing';
    }

    onDrag(e) {
      if (!this.isDragging) return;
      e.preventDefault();

      const x = e.clientX || 0;
      const deltaX = x - this.lastMouseX;
      this.position += deltaX;
      this.mouseVelocity = deltaX * 60;
      this.lastMouseX = x;

      this.cardLine.style.transform = `translateX(${this.position}px)`;
      this.updateCardClipping();
    }

    endDrag() {
      if (!this.isDragging) return;

      this.isDragging = false;
      this.cardLine.classList.remove('dragging');

      if (Math.abs(this.mouseVelocity) > this.minVelocity) {
        this.velocity = Math.abs(this.mouseVelocity);
        this.direction = this.mouseVelocity > 0 ? 1 : -1;
      } else {
        this.velocity = 120;
      }

      this.isAnimating = true;
      this.updateSpeedIndicator();

      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }

    animate() {
      const currentTime = performance.now();
      const deltaTime = Math.min(0.05, (currentTime - this.lastTime) / 1000);
      this.lastTime = currentTime;

      if (this.isAnimating && !this.isDragging) {
        if (this.velocity > this.minVelocity) {
          this.velocity *= this.friction;
        } else {
          this.velocity = Math.max(this.minVelocity, this.velocity);
        }

        this.position += this.velocity * this.direction * deltaTime;
        this.updateCardPosition();
        this.updateSpeedIndicator();
      }

      requestAnimationFrame(() => this.animate());
    }

    updateCardPosition() {
      const containerWidth = this.containerWidth || window.innerWidth;
      const cardLineWidth = this.cardLineWidth || 0;

      if (cardLineWidth > 0) {
        if (this.position < -cardLineWidth) {
          this.position = containerWidth;
        } else if (this.position > containerWidth) {
          this.position = -cardLineWidth;
        }
      }

      if (this.cardLine) {
        this.cardLine.style.transform = `translateX(${this.position}px)`;
        this.updateCardClipping();
      }
    }

    updateSpeedIndicator() {
      if (!this.speedIndicator) return;
      this.speedIndicator.textContent = Math.round(this.velocity);
    }

    toggleAnimation() {
      this.isAnimating = !this.isAnimating;
      const pauseBtn = document.querySelector('.controls .control-btn');
      if (pauseBtn) pauseBtn.textContent = this.isAnimating ? '⏸️ Pause' : '▶️ Play';

      if (this.isAnimating && this.cardLine) {
        this.cardLine.style.animation = 'none';
      }
    }

    resetPosition() {
      this.position = this.containerWidth || window.innerWidth;
      this.velocity = 120;
      this.direction = -1;
      this.isAnimating = true;
      this.isDragging = false;

      if (this.cardLine) {
        this.cardLine.style.animation = 'none';
        this.cardLine.style.transform = `translateX(${this.position}px)`;
        this.cardLine.classList.remove('dragging');
      }

      this.updateSpeedIndicator();

      const pauseBtn = document.querySelector('.controls .control-btn');
      if (pauseBtn) pauseBtn.textContent = '⏸️ Pause';
    }

    changeDirection() {
      this.direction *= -1;
      this.updateSpeedIndicator();
    }

    onWheel(e) {
      if (!e) return;
      e.preventDefault();

      const scrollSpeed = 20;
      const delta = e.deltaY > 0 ? scrollSpeed : -scrollSpeed;

      this.position += delta;
      this.updateCardPosition();
      this.updateCardClipping();
    }

    generateCode(width, height) {
      const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
      const pick = (arr) => arr[randInt(0, arr.length - 1)];

      const header = [
        "// compiled preview • scanner demo",
        "/* generated for visual effect – not executed */",
        "const SCAN_WIDTH = 8;",
        "const FADE_ZONE = 35;",
        "const MAX_PARTICLES = 2500;",
        "const TRANSITION = 0.05;",
      ];

      const helpers = [
        "function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }",
        "function lerp(a, b, t) { return a + (b - a) * t; }",
        "const now = () => performance.now();",
        "function rng(min, max) { return Math.random() * (max - min) + min; }",
      ];

      const particleBlock = (idx) => [
        `class Particle${idx} {`,
        "  constructor(x, y, vx, vy, r, a) {",
        "    this.x = x; this.y = y;",
        "    this.vx = vx; this.vy = vy;",
        "    this.r = r; this.a = a;",
        "  }",
        "  step(dt) { this.x += this.vx * dt; this.y += this.vy * dt; }",
        "}",
      ];

      const scannerBlock = [
        "const scanner = {",
        "  x: Math.floor(window.innerWidth / 2),",
        "  width: SCAN_WIDTH,",
        "  glow: 3.5,",
        "};",
        "",
        "function drawParticle(ctx, p) {",
        "  ctx.globalAlpha = clamp(p.a, 0, 1);",
        "  ctx.drawImage(gradient, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);",
        "}",
      ];

      const misc = [
        "const state = { intensity: 1.2, particles: MAX_PARTICLES };",
        "const bounds = { w: window.innerWidth, h: 300 };",
        "const gradient = document.createElement('canvas');",
        "const ctx = gradient.getContext('2d');",
        "ctx.globalCompositeOperation = 'lighter';",
        "// ascii overlay is masked with a 3-phase gradient",
      ];

      const library = [];
      header.forEach((l) => library.push(l));
      helpers.forEach((l) => library.push(l));
      for (let b = 0; b < 2; b++) particleBlock(b).forEach((l) => library.push(l));
      scannerBlock.forEach((l) => library.push(l));
      misc.forEach((l) => library.push(l));

      for (let i = 0; i < 30; i++) {
        const n1 = randInt(1, 9);
        const n2 = randInt(10, 99);
        library.push(`const v${i} = (${n1} + ${n2}) * 0.${randInt(1, 9)};`);
      }

      let flow = library.join(' ');
      flow = flow.replace(/\s+/g, ' ').trim();
      const totalChars = width * height;
      while (flow.length < totalChars + width) {
        const extra = pick(library).replace(/\s+/g, ' ').trim();
        flow += ' ' + extra;
      }

      let out = '';
      let offset = 0;
      for (let row = 0; row < height; row++) {
        let line = flow.slice(offset, offset + width);
        if (line.length < width) line = line + ' '.repeat(width - line.length);
        out += line + (row < height - 1 ? '\n' : '');
        offset += width;
      }
      return out;
    }

    calculateCodeDimensions(cardWidth, cardHeight) {
      const fontSize = 11;
      const lineHeight = 13;
      const charWidth = 6;
      const width = Math.floor(cardWidth / charWidth);
      const height = Math.floor(cardHeight / lineHeight);
      return { width, height, fontSize, lineHeight };
    }

    createCardWrapper(index) {
      const wrapper = document.createElement('div');
      wrapper.className = 'card-wrapper';

      const normalCard = document.createElement('div');
      normalCard.className = 'card card-normal';

      const cardImages = [
        'https://cdn.prod.website-files.com/68789c86c8bc802d61932544/689f20b55e654d1341fb06f8_4.1.png',
        'https://cdn.prod.website-files.com/68789c86c8bc802d61932544/689f20b5a080a31ee7154b19_1.png',
        'https://cdn.prod.website-files.com/68789c86c8bc802d61932544/689f20b5c1e4919fd69672b8_3.png',
      ];

      const cardImage = document.createElement('img');
      cardImage.className = 'card-image';
      cardImage.src = cardImages[index % cardImages.length];
      cardImage.alt = 'Credit Card';

      cardImage.onerror = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 250;
        const ctx = canvas.getContext('2d');

        const gradient = ctx.createLinearGradient(0, 0, 400, 250);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 400, 250);

        cardImage.src = canvas.toDataURL();
      };

      normalCard.appendChild(cardImage);

      const asciiCard = document.createElement('div');
      asciiCard.className = 'card card-ascii';

      const asciiContent = document.createElement('div');
      asciiContent.className = 'ascii-content';

      const { width, height, fontSize, lineHeight } = this.calculateCodeDimensions(400, 250);
      asciiContent.style.fontSize = fontSize + 'px';
      asciiContent.style.lineHeight = lineHeight + 'px';
      asciiContent.textContent = this.generateCode(width, height);

      asciiCard.appendChild(asciiContent);
      wrapper.appendChild(normalCard);
      wrapper.appendChild(asciiCard);

      return wrapper;
    }

    updateCardClipping() {
      const scannerX = window.innerWidth / 2;
      const scannerWidth = 8;
      const scannerLeft = scannerX - scannerWidth / 2;
      const scannerRight = scannerX + scannerWidth / 2;
      let anyScanningActive = false;

      const wrappers = this.cardLine ? Array.from(this.cardLine.querySelectorAll('.card-wrapper')) : [];

      wrappers.forEach((wrapper) => {
        const rect = wrapper.getBoundingClientRect();
        const cardLeft = rect.left;
        const cardRight = rect.right;
        const cardWidth = rect.width;

        const normalCard = wrapper.querySelector('.card-normal');
        const asciiCard = wrapper.querySelector('.card-ascii');
        if (!normalCard || !asciiCard) return;

        if (cardLeft < scannerRight && cardRight > scannerLeft) {
          anyScanningActive = true;
          const scannerIntersectLeft = Math.max(scannerLeft - cardLeft, 0);
          const scannerIntersectRight = Math.min(scannerRight - cardLeft, cardWidth);

          const normalClipRight = (scannerIntersectLeft / cardWidth) * 100;
          const asciiClipLeft = (scannerIntersectRight / cardWidth) * 100;

          normalCard.style.setProperty('--clip-right', `${normalClipRight}%`);
          asciiCard.style.setProperty('--clip-left', `${asciiClipLeft}%`);

          if (!wrapper.hasAttribute('data-scanned') && scannerIntersectLeft > 0) {
            wrapper.setAttribute('data-scanned', 'true');
            const scanEffect = document.createElement('div');
            scanEffect.className = 'scan-effect';
            wrapper.appendChild(scanEffect);
            setTimeout(() => {
              if (scanEffect.parentNode) {
                scanEffect.parentNode.removeChild(scanEffect);
              }
            }, 600);
          }
        } else {
          if (cardRight < scannerLeft) {
            normalCard.style.setProperty('--clip-right', '100%');
            asciiCard.style.setProperty('--clip-left', '100%');
          } else if (cardLeft > scannerRight) {
            normalCard.style.setProperty('--clip-right', '0%');
            asciiCard.style.setProperty('--clip-left', '0%');
          }
          wrapper.removeAttribute('data-scanned');
        }
      });

      if (window.setScannerScanning) {
        window.setScannerScanning(anyScanningActive);
      }
    }

    updateAsciiContent() {
      const nodes = this.cardLine ? Array.from(this.cardLine.querySelectorAll('.ascii-content')) : [];
      nodes.forEach((content) => {
        if (Math.random() < 0.08) {
          const { width, height } = this.calculateCodeDimensions(400, 250);
          content.textContent = this.generateCode(width, height);
        }
      });
    }

    populateCardLine() {
      if (!this.cardLine) return;
      this.cardLine.innerHTML = '';
      const cardsCount = 1;
      for (let i = 0; i < cardsCount; i++) {
        const cardWrapper = this.createCardWrapper(i);
        this.cardLine.appendChild(cardWrapper);
      }

      if (cardsCount === 1) {
        this.cardLine.classList.add('single');
        this.position = (this.containerWidth || window.innerWidth) / 2 - 200;
        this.cardLine.style.justifyContent = 'center';
      } else {
        this.cardLine.classList.remove('single');
        this.cardLine.style.justifyContent = '';
      }

      this.calculateDimensions();
    }

    startPeriodicUpdates() {
      this._asciiInterval = setInterval(() => {
        this.updateAsciiContent();
      }, 500);

      const updateClipping = () => {
        this.updateCardClipping();
        requestAnimationFrame(updateClipping);
      };
      updateClipping();
    }

    destroy() {
      clearInterval(this._asciiInterval);
      try {
        this.cardLine.removeEventListener('mousedown', this._onMouseDown);
        document.removeEventListener('mousemove', this._onMouseMove);
        document.removeEventListener('mouseup', this._onMouseUp);
        this.cardLine.removeEventListener('touchstart', this._onTouchStart);
        document.removeEventListener('touchmove', this._onTouchMove);
        document.removeEventListener('touchend', this._onTouchEnd);
        this.cardLine.removeEventListener('wheel', this._onWheel);
      } catch (e) {}
    }
  }

  class ParticleSystem {
    constructor() {
      this.scene = null;
      this.camera = null;
      this.renderer = null;
      this.particles = null;
      this.particleCount = 400;
      this.canvas = document.getElementById('particleCanvas');

      if (!this.canvas || typeof THREE === 'undefined') {
        if (!this.canvas) console.warn('ParticleSystem: #particleCanvas no encontrado.');
        if (typeof THREE === 'undefined') console.warn('ParticleSystem: THREE no cargado (omitiendo).');
        return;
      }

      this.init();
    }

    init() {
      this.scene = new THREE.Scene();

      this.camera = new THREE.OrthographicCamera(
        -window.innerWidth / 2,
        window.innerWidth / 2,
        125,
        -125,
        1,
        1000
      );
      this.camera.position.z = 100;

      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        alpha: true,
        antialias: true,
      });
      this.renderer.setSize(window.innerWidth, 250);
      this.renderer.setClearColor(0x000000, 0);

      this.createParticles();

      this.animateBound = this.animate.bind(this);
      this.animateBound();

      window.addEventListener('resize', () => this.onWindowResize());
    }

    createParticles() {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(this.particleCount * 3);
      const colors = new Float32Array(this.particleCount * 3);
      const sizes = new Float32Array(this.particleCount);
      const velocities = new Float32Array(this.particleCount);

      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');

      const half = canvas.width / 2;
      const hue = 217;

      const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
      gradient.addColorStop(0.025, '#fff');
      gradient.addColorStop(0.1, `hsl(${hue}, 61%, 33%)`);
      gradient.addColorStop(0.25, `hsl(${hue}, 64%, 6%)`);
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(half, half, half, 0, Math.PI * 2);
      ctx.fill();

      const texture = new THREE.CanvasTexture(canvas);

      for (let i = 0; i < this.particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * window.innerWidth * 2;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 250;
        positions[i * 3 + 2] = 0;

        colors[i * 3] = 1;
        colors[i * 3 + 1] = 1;
        colors[i * 3 + 2] = 1;

        const orbitRadius = Math.random() * 200 + 100;
        sizes[i] = (Math.random() * (orbitRadius - 60) + 60) / 8;

        velocities[i] = Math.random() * 60 + 30;
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

      this.velocities = velocities;

      const alphas = new Float32Array(this.particleCount);
      for (let i = 0; i < this.particleCount; i++) {
        alphas[i] = (Math.random() * 8 + 2) / 10;
      }
      geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
      this.alphas = alphas;

      const material = new THREE.ShaderMaterial({
        uniforms: {
          pointTexture: { value: texture },
          size: { value: 15.0 },
        },
        vertexShader: `
        attribute float alpha;
        varying float vAlpha;
        varying vec3 vColor;
        uniform float size;
        
        void main() {
          vAlpha = alpha;
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
        fragmentShader: `
        uniform sampler2D pointTexture;
        varying float vAlpha;
        varying vec3 vColor;
        
        void main() {
          gl_FragColor = vec4(vColor, vAlpha) * texture2D(pointTexture, gl_PointCoord);
        }
      `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        vertexColors: true,
      });

      this.particles = new THREE.Points(geometry, material);
      this.scene.add(this.particles);
    }

    animate() {
      requestAnimationFrame(this.animateBound);

      if (this.particles) {
        const positions = this.particles.geometry.attributes.position.array;
        const alphas = this.particles.geometry.attributes.alpha.array;
        const time = Date.now() * 0.001;

        for (let i = 0; i < this.particleCount; i++) {
          positions[i * 3] += this.velocities[i] * 0.016;

          if (positions[i * 3] > window.innerWidth / 2 + 100) {
            positions[i * 3] = -window.innerWidth / 2 - 100;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 250;
          }

          positions[i * 3 + 1] += Math.sin(time + i * 0.1) * 0.5;

          const twinkle = Math.floor(Math.random() * 10);
          if (twinkle === 1 && alphas[i] > 0) {
            alphas[i] -= 0.05;
          } else if (twinkle === 2 && alphas[i] < 1) {
            alphas[i] += 0.05;
          }

          alphas[i] = Math.max(0, Math.min(1, alphas[i]));
        }

        this.particles.geometry.attributes.position.needsUpdate = true;
        this.particles.geometry.attributes.alpha.needsUpdate = true;
      }

      if (this.renderer && this.camera) this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
      if (!this.camera || !this.renderer) return;
      this.camera.left = -window.innerWidth / 2;
      this.camera.right = window.innerWidth / 2;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(window.innerWidth, 250);
    }

    destroy() {
      if (this.renderer) {
        this.renderer.dispose();
      }
      if (this.particles) {
        this.scene.remove(this.particles);
        this.particles.geometry.dispose();
        this.particles.material.dispose();
      }
    }
  }

  class ParticleScanner {
    constructor() {
      this.canvas = document.getElementById('scannerCanvas');
      if (!this.canvas) {
        console.warn('ParticleScanner: #scannerCanvas no encontrado.');
        return;
      }
      this.ctx = this.canvas.getContext('2d');
      this.animationId = null;

      this.w = window.innerWidth;
      this.h = 300;
      this.particles = [];
      this.count = 0;
      this.maxParticles = 800;
      this.intensity = 0.8;
      this.lightBarX = this.w / 2;
      this.lightBarWidth = 3;
      this.fadeZone = 60;

      this.scanTargetIntensity = 1.8;
      this.scanTargetParticles = 2500;
      this.scanTargetFadeZone = 35;

      this.scanningActive = false;

      this.baseIntensity = this.intensity;
      this.baseMaxParticles = this.maxParticles;
      this.baseFadeZone = this.fadeZone;

      this.currentIntensity = this.intensity;
      this.currentMaxParticles = this.maxParticles;
      this.currentFadeZone = this.fadeZone;
      this.transitionSpeed = 0.05;

      this.setupCanvas();
      this.createGradientCache();
      this.initParticles();
      this.animate();

      window.addEventListener('resize', () => this.onResize());
    }

    setupCanvas() {
      this.canvas.width = this.w;
      this.canvas.height = this.h;
      this.canvas.style.width = this.w + 'px';
      this.canvas.style.height = this.h + 'px';
      if (this.ctx) this.ctx.clearRect(0, 0, this.w, this.h);
    }

    onResize() {
      this.w = window.innerWidth;
      this.lightBarX = this.w / 2;
      this.setupCanvas();
    }

    createGradientCache() {
      this.gradientCanvas = document.createElement('canvas');
      this.gradientCtx = this.gradientCanvas.getContext('2d');
      this.gradientCanvas.width = 16;
      this.gradientCanvas.height = 16;

      const half = this.gradientCanvas.width / 2;
      const gradient = this.gradientCtx.createRadialGradient(
        half,
        half,
        0,
        half,
        half,
        half
      );
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.3, 'rgba(196, 181, 253, 0.8)');
      gradient.addColorStop(0.7, 'rgba(139, 92, 246, 0.4)');
      gradient.addColorStop(1, 'transparent');

      this.gradientCtx.fillStyle = gradient;
      this.gradientCtx.beginPath();
      this.gradientCtx.arc(half, half, half, 0, Math.PI * 2);
      this.gradientCtx.fill();
    }

    random(min, max) {
      if (arguments.length < 2) {
        max = min;
        min = 0;
      }
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    randomFloat(min, max) {
      return Math.random() * (max - min) + min;
    }

    createParticle() {
      const intensityRatio = this.intensity / this.baseIntensity;
      const speedMultiplier = 1 + (intensityRatio - 1) * 1.2;
      const sizeMultiplier = 1 + (intensityRatio - 1) * 0.7;

      return {
        x:
          this.lightBarX +
          this.randomFloat(-this.lightBarWidth / 2, this.lightBarWidth / 2),
        y: this.randomFloat(0, this.h),

        vx: this.randomFloat(0.2, 1.0) * speedMultiplier,
        vy: this.randomFloat(-0.15, 0.15) * speedMultiplier,

        radius: this.randomFloat(0.4, 1) * sizeMultiplier,
        alpha: this.randomFloat(0.6, 1),
        decay: this.randomFloat(0.005, 0.025) * (2 - intensityRatio * 0.5),
        originalAlpha: 0,
        life: 1.0,
        time: 0,
        startX: 0,

        twinkleSpeed: this.randomFloat(0.02, 0.08) * speedMultiplier,
        twinkleAmount: this.randomFloat(0.1, 0.25),
      };
    }

    initParticles() {
      for (let i = 0; i < Math.min(this.maxParticles, 200); i++) {
        const particle = this.createParticle();
        particle.originalAlpha = particle.alpha;
        particle.startX = particle.x;
        this.count++;
        this.particles[this.count] = particle;
      }
    }

    updateParticle(particle) {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.time++;

      particle.alpha =
        particle.originalAlpha * particle.life +
        Math.sin(particle.time * particle.twinkleSpeed) * particle.twinkleAmount;

      particle.life -= particle.decay;

      if (particle.x > this.w + 10 || particle.life <= 0) {
        this.resetParticle(particle);
      }
    }

    resetParticle(particle) {
      particle.x =
        this.lightBarX +
        this.randomFloat(-this.lightBarWidth / 2, this.lightBarWidth / 2);
      particle.y = this.randomFloat(0, this.h);
      particle.vx = this.randomFloat(0.2, 1.0);
      particle.vy = this.randomFloat(-0.15, 0.15);
      particle.alpha = this.randomFloat(0.6, 1);
      particle.originalAlpha = particle.alpha;
      particle.life = 1.0;
      particle.time = 0;
      particle.startX = particle.x;
    }

    drawParticle(particle) {
      if (!this.ctx || particle.life <= 0) return;

      let fadeAlpha = 1;

      if (particle.y < this.fadeZone) {
        fadeAlpha = particle.y / this.fadeZone;
      } else if (particle.y > this.h - this.fadeZone) {
        fadeAlpha = (this.h - particle.y) / this.fadeZone;
      }

      fadeAlpha = Math.max(0, Math.min(1, fadeAlpha));

      this.ctx.globalAlpha = particle.alpha * fadeAlpha;
      this.ctx.drawImage(
        this.gradientCanvas,
        particle.x - particle.radius,
        particle.y - particle.radius,
        particle.radius * 2,
        particle.radius * 2
      );
    }

    drawLightBar() {
      if (!this.ctx) return;

      const verticalGradient = this.ctx.createLinearGradient(0, 0, 0, this.h);
      verticalGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
      verticalGradient.addColorStop(
        this.fadeZone / this.h,
        'rgba(255, 255, 255, 1)'
      );
      verticalGradient.addColorStop(
        1 - this.fadeZone / this.h,
        'rgba(255, 255, 255, 1)'
      );
      verticalGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

      this.ctx.globalCompositeOperation = 'lighter';

      const targetGlowIntensity = this.scanningActive ? 3.5 : 1;

      if (!this.currentGlowIntensity) this.currentGlowIntensity = 1;

      this.currentGlowIntensity +=
        (targetGlowIntensity - this.currentGlowIntensity) * this.transitionSpeed;

      const glowIntensity = this.currentGlowIntensity;
      const lineWidth = this.lightBarWidth;
      const glow1Alpha = this.scanningActive ? 1.0 : 0.8;
      const glow2Alpha = this.scanningActive ? 0.8 : 0.6;
      const glow3Alpha = this.scanningActive ? 0.6 : 0.4;

      const coreGradient = this.ctx.createLinearGradient(
        this.lightBarX - lineWidth / 2,
        0,
        this.lightBarX + lineWidth / 2,
        0
      );
      coreGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
      coreGradient.addColorStop(
        0.3,
        `rgba(255, 255, 255, ${0.9 * glowIntensity})`
      );
      coreGradient.addColorStop(0.5, `rgba(255, 255, 255, ${1 * glowIntensity})`);
      coreGradient.addColorStop(
        0.7,
        `rgba(255, 255, 255, ${0.9 * glowIntensity})`
      );
      coreGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

      this.ctx.globalAlpha = 1;
      this.ctx.fillStyle = coreGradient;

      const radius = 15;
      this.ctx.beginPath();
      if (this.ctx.roundRect) {
        this.ctx.roundRect(
          this.lightBarX - lineWidth / 2,
          0,
          lineWidth,
          this.h,
          radius
        );
      } else {
        this.ctx.rect(this.lightBarX - lineWidth / 2, 0, lineWidth, this.h);
      }
      this.ctx.fill();

      const glow1Gradient = this.ctx.createLinearGradient(
        this.lightBarX - lineWidth * 2,
        0,
        this.lightBarX + lineWidth * 2,
        0
      );
      glow1Gradient.addColorStop(0, 'rgba(139, 92, 246, 0)');
      glow1Gradient.addColorStop(
        0.5,
        `rgba(196, 181, 253, ${0.8 * glowIntensity})`
      );
      glow1Gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');

      this.ctx.globalAlpha = glow1Alpha;
      this.ctx.fillStyle = glow1Gradient;
      if (this.ctx.roundRect) {
        this.ctx.beginPath();
        this.ctx.roundRect(
          this.lightBarX - lineWidth * 2,
          0,
          lineWidth * 4,
          this.h,
          25
        );
        this.ctx.fill();
      } else {
        this.ctx.fillRect(this.lightBarX - lineWidth * 2, 0, lineWidth * 4, this.h);
      }

      const glow2Gradient = this.ctx.createLinearGradient(
        this.lightBarX - lineWidth * 4,
        0,
        this.lightBarX + lineWidth * 4,
        0
      );
      glow2Gradient.addColorStop(0, 'rgba(139, 92, 246, 0)');
      glow2Gradient.addColorStop(
        0.5,
        `rgba(139, 92, 246, ${0.4 * glowIntensity})`
      );
      glow2Gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');

      this.ctx.globalAlpha = glow2Alpha;
      this.ctx.fillStyle = glow2Gradient;
      if (this.ctx.roundRect) {
        this.ctx.beginPath();
        this.ctx.roundRect(
          this.lightBarX - lineWidth * 4,
          0,
          lineWidth * 8,
          this.h,
          35
        );
        this.ctx.fill();
      } else {
        this.ctx.fillRect(this.lightBarX - lineWidth * 4, 0, lineWidth * 8, this.h);
      }

      if (this.scanningActive) {
        const glow3Gradient = this.ctx.createLinearGradient(
          this.lightBarX - lineWidth * 8,
          0,
          this.lightBarX + lineWidth * 8,
          0
        );
        glow3Gradient.addColorStop(0, 'rgba(139, 92, 246, 0)');
        glow3Gradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.2)');
        glow3Gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');

        this.ctx.globalAlpha = glow3Alpha;
        this.ctx.fillStyle = glow3Gradient;
        if (this.ctx.roundRect) {
          this.ctx.beginPath();
          this.ctx.roundRect(
            this.lightBarX - lineWidth * 8,
            0,
            lineWidth * 16,
            this.h,
            45
          );
          this.ctx.fill();
        } else {
          this.ctx.fillRect(
            this.lightBarX - lineWidth * 8,
            0,
            lineWidth * 16,
            this.h
          );
        }
      }

      this.ctx.globalCompositeOperation = 'destination-in';
      this.ctx.globalAlpha = 1;
      this.ctx.fillStyle = verticalGradient;
      this.ctx.fillRect(0, 0, this.w, this.h);
    }

    render() {
      if (!this.ctx) return;

      const targetIntensity = this.scanningActive
        ? this.scanTargetIntensity
        : this.baseIntensity;
      const targetMaxParticles = this.scanningActive
        ? this.scanTargetParticles
        : this.baseMaxParticles;
      const targetFadeZone = this.scanningActive
        ? this.scanTargetFadeZone
        : this.baseFadeZone;

      this.currentIntensity +=
        (targetIntensity - this.currentIntensity) * this.transitionSpeed;
      this.currentMaxParticles +=
        (targetMaxParticles - this.currentMaxParticles) * this.transitionSpeed;
      this.currentFadeZone +=
        (targetFadeZone - this.currentFadeZone) * this.transitionSpeed;

      this.intensity = this.currentIntensity;
      this.maxParticles = Math.floor(this.currentMaxParticles);
      this.fadeZone = this.currentFadeZone;

      this.ctx.globalCompositeOperation = 'source-over';
      this.ctx.clearRect(0, 0, this.w, this.h);

      this.drawLightBar();

      this.ctx.globalCompositeOperation = 'lighter';
      for (let i = 1; i <= this.count; i++) {
        if (this.particles[i]) {
          this.updateParticle(this.particles[i]);
          this.drawParticle(this.particles[i]);
        }
      }

      const currentIntensity = this.intensity;
      const currentMaxParticles = this.maxParticles;

      if (Math.random() < Math.min(0.6, currentIntensity * 0.2) && this.count < currentMaxParticles) {
        const particle = this.createParticle();
        particle.originalAlpha = particle.alpha;
        particle.startX = particle.x;
        this.count++;
        this.particles[this.count] = particle;
      }

      const intensityRatio = this.intensity / this.baseIntensity;

      if (intensityRatio > 1.1 && Math.random() < (intensityRatio - 1.0) * 0.08) {
        const particle = this.createParticle();
        particle.originalAlpha = particle.alpha;
        particle.startX = particle.x;
        this.count++;
        this.particles[this.count] = particle;
      }

      if (this.count > currentMaxParticles + 200) {
        const excessCount = Math.min(10, this.count - currentMaxParticles);
        for (let i = 0; i < excessCount; i++) {
          delete this.particles[this.count - i];
        }
        this.count -= excessCount;
      }
    }

    animate() {
      this.render();
      this.animationId = requestAnimationFrame(() => this.animate());
    }

    startScanning() {
      this.scanningActive = true;
    }

    stopScanning() {
      this.scanningActive = false;
    }

    setScanningActive(active) {
      this.scanningActive = !!active;
    }

    getStats() {
      return {
        intensity: this.intensity,
        maxParticles: this.maxParticles,
        currentParticles: this.count,
        lightBarWidth: this.lightBarWidth,
        fadeZone: this.fadeZone,
        scanningActive: this.scanningActive,
        canvasWidth: this.w,
        canvasHeight: this.h,
      };
    }

    destroy() {
      if (this.animationId) cancelAnimationFrame(this.animationId);
      this.particles = [];
      this.count = 0;
    }
  }

  let cardStreamInstance = null;
  let particleSystemInstance = null;
  let particleScannerInstance = null;
  let initializingPromise = null;

  function ensureInstances() {
    const overlay = document.getElementById('loadingOverlay');
    if (!overlay || overlay.classList.contains('loading-init-error')) return;

    if (!cardStreamInstance) {
      try {
        cardStreamInstance = new CardStreamController();
      } catch (e) {
        console.warn('No se pudo inicializar CardStreamController', e);
      }
    }

    if (!particleSystemInstance) {
      try {
        particleSystemInstance = new ParticleSystem();
      } catch (e) {
        console.warn('No se pudo inicializar ParticleSystem', e);
      }
    }

    if (!particleScannerInstance) {
      try {
        particleScannerInstance = new ParticleScanner();
      } catch (e) {
        console.warn('No se pudo inicializar ParticleScanner', e);
      }
    }
  }

  function updateSpeedDisplay(value) {
    const speedEl = document.getElementById('speedValue');
    if (speedEl) speedEl.textContent = String(value);
  }

  window.initLoadingAnimation = function initLoadingAnimation() {
    if (initializingPromise) {
      return initializingPromise;
    }

    initializingPromise = new Promise((resolve) => {
      const finish = () => {
        initializingPromise = null;
        resolve();
      };

      const startSequence = () => {
        ensureInstances();

        try {
          if (particleScannerInstance && typeof particleScannerInstance.setScanningActive === 'function') {
            particleScannerInstance.setScanningActive(true);
          }
        } catch (e) {
          console.warn('No se pudo activar el modo scanning', e);
        }

        updateSpeedDisplay(260);

        setTimeout(() => {
          try {
            if (particleScannerInstance && typeof particleScannerInstance.setScanningActive === 'function') {
              particleScannerInstance.setScanningActive(false);
            }
          } catch (e) {
            console.warn('No se pudo desactivar el modo scanning', e);
          }
          updateSpeedDisplay(120);
          finish();
        }, 1300);
      };

      if (typeof THREE === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
        script.onload = startSequence;
        script.onerror = () => {
          console.warn('No se pudo cargar three.js, se continúa sin partículas 3D');
          startSequence();
        };
        document.head.appendChild(script);
      } else {
        startSequence();
      }
    });

    return initializingPromise;
  };

  window.setScannerScanning = function setScannerScanning(active) {
    if (particleScannerInstance && typeof particleScannerInstance.setScanningActive === 'function') {
      particleScannerInstance.setScanningActive(active);
    }
  };

  window.getScannerStats = function getScannerStats() {
    if (particleScannerInstance && typeof particleScannerInstance.getStats === 'function') {
      return particleScannerInstance.getStats();
    }
    return null;
  };

  document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('loadingOverlay');
    if (!overlay) return;

    ensureInstances();
  });

})();
