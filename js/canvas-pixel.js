/**
 * CANVAS-PIXEL.JS - Procedural Pixel Art Generator
 * Renders retro 8-bit/16-bit portraits and atmospheric Asian Fantasy scene backdrops.
 */

export const PixelRenderer = {
  // Draw Character Pixel Avatar on canvas
  drawAvatar(canvas, avatarType = 'kiem-khach', customColors = {}) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    ctx.imageSmoothingEnabled = false;

    ctx.clearRect(0, 0, width, height);

    // Grid size (16x16 pixel art)
    const gridSize = 16;
    const pixelSize = width / gridSize;

    // Palette presets
    const palettes = {
      'kiem-khach': {
        bg: '#0f172a',
        skin: '#fbd38d',
        hair: '#1e293b',
        cloth: '#0284c7',
        accent: '#f6c944',
        shadow: '#c05621'
      },
      'tu-si': {
        bg: '#1c1917',
        skin: '#f6ad55',
        hair: '#78350f',
        cloth: '#b45309',
        accent: '#fbbf24',
        shadow: '#9a3412'
      },
      'am-duong-su': {
        bg: '#1e1b4b',
        skin: '#fef08a',
        hair: '#312e81',
        cloth: '#4f46e5',
        accent: '#a855f7',
        shadow: '#eab308'
      },
      'han-si': {
        bg: '#064e3b',
        skin: '#fde68a',
        hair: '#0f172a',
        cloth: '#059669',
        accent: '#6ee7b7',
        shadow: '#d97706'
      },
      'thich-khach': {
        bg: '#18181b',
        skin: '#fed7aa',
        hair: '#09090b',
        cloth: '#7c3aed',
        accent: '#ef4444',
        shadow: '#4c1d95'
      },
      'lanh-han': {
        bg: '#082f49',
        skin: '#e0f2fe',
        hair: '#0f172a',
        cloth: '#0284c7',
        accent: '#38bdf8',
        shadow: '#0369a1'
      },
      'thanh-van': {
        bg: '#2e1065',
        skin: '#fef3c7',
        hair: '#475569',
        cloth: '#7e22ce',
        accent: '#facc15',
        shadow: '#581c87'
      },
      'da-nguyet': {
        bg: '#4a044e',
        skin: '#fbcfe8',
        hair: '#18181b',
        cloth: '#c026d3',
        accent: '#f43f5e',
        shadow: '#701a75'
      }
    };

    const p = { ...(palettes[avatarType] || palettes['kiem-khach']), ...customColors };

    function fillP(x, y, color) {
      ctx.fillStyle = color;
      ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
    }

    // 1. Background fill
    ctx.fillStyle = p.bg;
    ctx.fillRect(0, 0, width, height);

    // 2. Head / Hair / Face Layout (16x16 standard RPG sprite)
    // Head base (Skin)
    for (let x = 5; x <= 10; x++) {
      for (let y = 5; y <= 11; y++) {
        fillP(x, y, p.skin);
      }
    }

    // Hair Top & Bun
    for (let x = 4; x <= 11; x++) {
      fillP(x, 4, p.hair);
    }
    for (let x = 7; x <= 8; x++) {
      fillP(x, 2, p.accent); // Hairpin / Jade crown
      fillP(x, 3, p.hair);
    }
    fillP(4, 5, p.hair);
    fillP(11, 5, p.hair);
    fillP(4, 6, p.hair);
    fillP(11, 6, p.hair);
    fillP(4, 7, p.hair);
    fillP(11, 7, p.hair);

    // Eyes
    fillP(6, 7, '#000');
    fillP(9, 7, '#000');
    // Eye spark
    fillP(6, 7, '#ffffff');
    fillP(9, 7, '#ffffff');
    ctx.fillStyle = '#000';
    ctx.fillRect(6 * pixelSize + 1, 7 * pixelSize + 1, pixelSize - 1, pixelSize - 1);
    ctx.fillRect(9 * pixelSize + 1, 7 * pixelSize + 1, pixelSize - 1, pixelSize - 1);

    // Headband / Mask / Details
    if (avatarType === 'thich-khach' || avatarType === 'da-nguyet') {
      // Cloth mask covering lower face
      for (let x = 5; x <= 10; x++) {
        for (let y = 9; y <= 11; y++) {
          fillP(x, y, p.cloth);
        }
      }
    } else {
      // Smile / mouth
      fillP(7, 10, p.shadow);
      fillP(8, 10, p.shadow);
    }

    // Headband
    if (avatarType === 'kiem-khach' || avatarType === 'lanh-han') {
      for (let x = 4; x <= 11; x++) fillP(x, 5, p.accent);
    }

    // Shoulders & Robes
    for (let x = 3; x <= 12; x++) {
      for (let y = 12; y <= 15; y++) {
        fillP(x, y, p.cloth);
      }
    }
    // Collar (V-neck kimono / hanfu collar)
    fillP(7, 12, p.skin);
    fillP(8, 12, p.skin);
    fillP(7, 13, p.accent);
    fillP(8, 13, p.accent);
    fillP(6, 13, p.cloth);
    fillP(9, 13, p.cloth);

    // Border Frame (retro 1px border)
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, width, height);
  },

  // Draw Atmospheric Pixel Scene Banner
  drawScene(canvas, sceneType = 'inn') {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.imageSmoothingEnabled = false;

    ctx.clearRect(0, 0, w, h);

    if (sceneType === 'inn') {
      this._drawInnScene(ctx, w, h);
    } else if (sceneType === 'bamboo') {
      this._drawBambooScene(ctx, w, h);
    } else if (sceneType === 'ruins') {
      this._drawRuinsScene(ctx, w, h);
    } else if (sceneType === 'cliff') {
      this._drawCliffScene(ctx, w, h);
    } else {
      this._drawInnScene(ctx, w, h);
    }
  },

  _drawInnScene(ctx, w, h) {
    // 1. Sky & Mist (Night dark purple / indigo)
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#0f0c1b');
    sky.addColorStop(0.6, '#1e1b36');
    sky.addColorStop(1, '#110e1f');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // 2. Yellow Full Moon
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(480, 40, 24, 0, Math.PI * 2);
    ctx.fill();

    // Subtle moon glow
    ctx.fillStyle = 'rgba(254, 240, 138, 0.15)';
    ctx.beginPath();
    ctx.arc(480, 40, 48, 0, Math.PI * 2);
    ctx.fill();

    // 3. Mountains in background
    ctx.fillStyle = '#161328';
    ctx.beginPath();
    ctx.moveTo(350, h);
    ctx.lineTo(430, 60);
    ctx.lineTo(520, h);
    ctx.fill();

    ctx.fillStyle = '#110e20';
    ctx.beginPath();
    ctx.moveTo(460, h);
    ctx.lineTo(560, 45);
    ctx.lineTo(600, h);
    ctx.fill();

    // 4. Wooden Asian Tavern Structure (Roofs, Pagoda Eaves)
    ctx.fillStyle = '#181824';
    // Eaves sloping
    ctx.beginPath();
    ctx.moveTo(0, 75);
    ctx.lineTo(240, 45);
    ctx.lineTo(280, 40);
    ctx.lineTo(270, 58);
    ctx.lineTo(0, 95);
    ctx.fill();

    // Main tavern wall & windows
    ctx.fillStyle = '#1f1b2e';
    ctx.fillRect(0, 60, 220, h - 60);

    // Glowing paper windows (warm orange amber)
    const winColors = ['#f59e0b', '#fbbf24', '#d97706'];
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = winColors[i % winColors.length];
      const wx = 30 + i * 55;
      ctx.fillRect(wx, 80, 36, 40);
      // Window lattice cross
      ctx.fillStyle = '#181824';
      ctx.fillRect(wx + 17, 80, 3, 40);
      ctx.fillRect(wx, 98, 36, 3);
    }

    // 5. Red Hanging Lanterns
    const lanterns = [{ x: 120, y: 55 }, { x: 230, y: 50 }, { x: 310, y: 65 }];
    lanterns.forEach(l => {
      // Cord
      ctx.strokeStyle = '#991b1b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(l.x, l.y - 15);
      ctx.lineTo(l.x, l.y);
      ctx.stroke();

      // Red lantern body
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(l.x - 8, l.y, 16, 20);
      // Gold tassel
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(l.x - 4, l.y + 4, 8, 12);
      ctx.fillRect(l.x - 2, l.y + 20, 4, 6);

      // Glow halo
      ctx.fillStyle = 'rgba(220, 38, 38, 0.2)';
      ctx.beginPath();
      ctx.arc(l.x, l.y + 10, 20, 0, Math.PI * 2);
      ctx.fill();
    });

    // 6. Ground & Stone Pathway with mist
    ctx.fillStyle = '#131120';
    ctx.fillRect(0, h - 25, w, 25);

    // Mist clouds (retro pixel stepped bars)
    ctx.fillStyle = 'rgba(148, 163, 184, 0.12)';
    ctx.fillRect(80, h - 35, 180, 6);
    ctx.fillRect(200, h - 28, 260, 8);
    ctx.fillRect(350, h - 20, 220, 7);
  },

  _drawBambooScene(ctx, w, h) {
    // Bamboo Forest at Dusk
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#042f2e');
    sky.addColorStop(0.7, '#064e3b');
    sky.addColorStop(1, '#022c22');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // Crescent Moon
    ctx.fillStyle = '#a7f3d0';
    ctx.beginPath();
    ctx.arc(520, 35, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#042f2e';
    ctx.beginPath();
    ctx.arc(513, 33, 16, 0, Math.PI * 2);
    ctx.fill();

    // Bamboo stalks (varying thickness)
    const stalks = [
      { x: 30, w: 8, col: '#065f46' },
      { x: 75, w: 12, col: '#047857' },
      { x: 140, w: 6, col: '#065f46' },
      { x: 210, w: 14, col: '#059669' },
      { x: 290, w: 8, col: '#047857' },
      { x: 380, w: 10, col: '#065f46' },
      { x: 440, w: 16, col: '#059669' },
      { x: 500, w: 7, col: '#047857' },
      { x: 560, w: 12, col: '#065f46' }
    ];

    stalks.forEach(s => {
      ctx.fillStyle = s.col;
      ctx.fillRect(s.x, 0, s.w, h);
      // Joint nodes
      ctx.fillStyle = '#022c22';
      for (let y = 25; y < h; y += 38) {
        ctx.fillRect(s.x - 2, y, s.w + 4, 3);
      }
    });

    // Ground grass
    ctx.fillStyle = '#022c22';
    ctx.fillRect(0, h - 20, w, 20);

    // Eerie mist
    ctx.fillStyle = 'rgba(52, 211, 153, 0.15)';
    ctx.fillRect(0, h - 30, w, 15);
  },

  _drawRuinsScene(ctx, w, h) {
    // Ancient Demonic Ruins
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#1e112a');
    sky.addColorStop(1, '#090511');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // Broken Stone Pillars
    ctx.fillStyle = '#332940';
    ctx.fillRect(80, 30, 28, h - 30);
    ctx.fillRect(180, 55, 32, h - 55);
    ctx.fillRect(360, 40, 30, h - 40);
    ctx.fillRect(490, 70, 24, h - 70);

    // Glowing Purple Demonic Seal on ground
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(280, h - 20, 60, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(192, 132, 252, 0.2)';
    ctx.beginPath();
    ctx.arc(280, h - 20, 50, 0, Math.PI * 2);
    ctx.fill();

    // Ground
    ctx.fillStyle = '#160d24';
    ctx.fillRect(0, h - 20, w, 20);
  },

  _drawCliffScene(ctx, w, h) {
    // Crimson Moon Peak
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#380a0a');
    sky.addColorStop(1, '#0f0505');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // Crimson Blood Moon
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(420, 40, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
    ctx.beginPath();
    ctx.arc(420, 40, 55, 0, Math.PI * 2);
    ctx.fill();

    // Jagged Cliff Silhouette
    ctx.fillStyle = '#1f0d0d';
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, 90);
    ctx.lineTo(90, 65);
    ctx.lineTo(210, 80);
    ctx.lineTo(310, 50);
    ctx.lineTo(420, 110);
    ctx.lineTo(w, 85);
    ctx.lineTo(w, h);
    ctx.fill();
  }
};
