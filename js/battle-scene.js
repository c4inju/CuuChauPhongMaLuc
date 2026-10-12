/**
 * BATTLE-SCENE.JS - Dynamic Retro Pixel Scene & Combat Animator
 * Controls the 4-hero marching squad, opposing monsters/NPCs,
 * lunge attacks, elemental skill casting, green healing auras, and damage reactions.
 */

import { PixelRenderer } from './canvas-pixel.js';
import { sound } from './audio.js';

export class BattleSceneAnimator {
  constructor(canvasId = 'scene-canvas') {
    this.canvasId = canvasId;
    this.canvas = typeof canvasId === 'string' ? document.getElementById(canvasId) : canvasId;
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.w = 600;
    this.h = 150;
    this.sceneType = 'inn';

    this.tick = 0;
    this.scrollGround = 0;
    this.isRunning = false;
    this.rafId = null;

    // Screen Shake
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
    this.shakeDuration = 0;
    this.shakeMagnitude = 0;

    // Visual elements
    this.particles = [];
    this.floatingTexts = [];
    this.projectiles = [];
    this.effects = [];

    // Formation definition for 4 heroes (Leader + 3 Companions)
    this.heroes = [
      {
        id: 'player',
        name: 'Người Chơi',
        avatarId: 'kiem-khach',
        classId: 'kiem-khach',
        baseX: 165,
        baseY: 96,
        x: 165,
        y: 96,
        runOffset: 0,
        state: 'run', // 'run', 'lunge', 'strike', 'return', 'casting', 'hurt'
        stateTimer: 0,
        flashColor: null,
        flashTimer: 0,
        weapon: 'sword'
      },
      {
        id: 'comp-1',
        name: 'Lãnh Hàn',
        avatarId: 'lanh-han',
        classId: 'kiem-khach',
        baseX: 125,
        baseY: 96,
        x: 125,
        y: 96,
        runOffset: 2,
        state: 'run',
        stateTimer: 0,
        flashColor: null,
        flashTimer: 0,
        weapon: 'sword'
      },
      {
        id: 'comp-2',
        name: 'Thanh Vân',
        avatarId: 'thanh-van',
        classId: 'am-duong-su',
        baseX: 85,
        baseY: 96,
        x: 85,
        y: 96,
        runOffset: 5,
        state: 'run',
        stateTimer: 0,
        flashColor: null,
        flashTimer: 0,
        weapon: 'talisman'
      },
      {
        id: 'comp-3',
        name: 'Dạ Nguyệt',
        avatarId: 'da-nguyet',
        classId: 'thich-khach',
        baseX: 45,
        baseY: 96,
        x: 45,
        y: 96,
        runOffset: 3,
        state: 'run',
        stateTimer: 0,
        flashColor: null,
        flashTimer: 0,
        weapon: 'dagger'
      }
    ];

    // Monster state
    this.monster = {
      name: 'Ma Tu Áo Đen',
      type: 'cultist',
      title: 'Tà Đạo Môn Đồ',
      baseX: 485,
      baseY: 90,
      x: 485,
      y: 90,
      maxHp: 80,
      hp: 80,
      state: 'idle', // 'idle', 'recoil', 'attack', 'cast'
      stateTimer: 0,
      flashColor: null,
      flashTimer: 0
    };

    this.initMonsterForScene(this.sceneType);
  }

  // Update monster type when scene/campaign changes
  initMonsterForScene(sceneType) {
    this.sceneType = sceneType || 'inn';
    const presets = {
      inn: {
        name: 'Ma Tu Áo Đen',
        type: 'cultist',
        title: 'Tà Đạo Môn Đồ (DC 12)',
        maxHp: 80,
        hp: 80,
        weapon: 'blade'
      },
      bamboo: {
        name: 'Tử Sĩ U Minh',
        type: 'assassin',
        title: 'U Minh Các Thích Khách (DC 14)',
        maxHp: 100,
        hp: 100,
        weapon: 'dagger'
      },
      ruins: {
        name: 'Cổ Ma Thạch Thần',
        type: 'golem',
        title: 'Cổ Trận Cấm Chế Vệ (DC 16)',
        maxHp: 140,
        hp: 140,
        weapon: 'fist'
      },
      cliff: {
        name: 'Huyết Ma Cửu Tôn',
        type: 'demon_lord',
        title: 'Vực Chủ Phong Ma (DC 18)',
        maxHp: 200,
        hp: 200,
        weapon: 'greatsword'
      }
    };

    const p = presets[this.sceneType] || presets.inn;
    this.monster.name = p.name;
    this.monster.type = p.type;
    this.monster.title = p.title;
    this.monster.maxHp = p.maxHp;
    this.monster.hp = p.hp;
    this.monster.weapon = p.weapon;
    this.monster.state = 'idle';
    this.monster.stateTimer = 0;
    this.monster.x = this.monster.baseX;
    this.monster.y = this.monster.baseY;
  }

  // Sync Party and Player information
  setActors(player, partyMembers = []) {
    if (player) {
      this.heroes[0].name = player.name || 'Người Chơi';
      this.heroes[0].avatarId = player.avatarId || 'kiem-khach';
      this.heroes[0].classId = player.classId || 'kiem-khach';
      if (player.classId === 'tu-si') this.heroes[0].weapon = 'staff';
      else if (player.classId === 'am-duong-su') this.heroes[0].weapon = 'talisman';
      else if (player.classId === 'thich-khach') this.heroes[0].weapon = 'dagger';
      else if (player.classId === 'han-si') this.heroes[0].weapon = 'fan';
      else this.heroes[0].weapon = 'sword';
    }

    if (Array.isArray(partyMembers)) {
      for (let i = 0; i < 3; i++) {
        const comp = partyMembers[i];
        const hero = this.heroes[i + 1];
        if (hero) {
          if (comp) {
            hero.name = comp.name;
            hero.avatarId = comp.avatarId || 'lanh-han';
            hero.classId = comp.classId || 'kiem-khach';
            if (comp.id === 'thanh-van' || hero.classId.includes('am-duong')) hero.weapon = 'talisman';
            else if (comp.id === 'da-nguyet' || hero.classId.includes('thich-khach')) hero.weapon = 'dagger';
            else hero.weapon = 'sword';
          }
        }
      }
    }
  }

  setScene(sceneType) {
    if (this.sceneType !== sceneType) {
      this.initMonsterForScene(sceneType);
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.canvas = typeof this.canvasId === 'string' ? document.getElementById(this.canvasId) : this.canvasId;
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      this.w = this.canvas.width;
      this.h = this.canvas.height;
    }
    const loop = () => {
      if (!this.isRunning) return;
      this.update();
      this.render();
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  stop() {
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  // =========================================================================
  // ANIMATION ACTIONS TRIGGERED BY GAMEPLAY OR BUTTONS
  // =========================================================================

  // Hero lunges forward, strikes monster, recoils back
  playAttack(heroIndex = 0) {
    const hero = this.heroes[heroIndex] || this.heroes[0];
    if (hero.state !== 'run') return; // busy

    hero.state = 'lunge';
    hero.stateTimer = 0;
    hero.targetX = this.monster.x - 36;
    sound.playClick();
  }

  // Hero casts skill with projectile / elemental spark
  playSkill(heroIndex = 0, skillName = 'Tuyệt Kỹ') {
    const hero = this.heroes[heroIndex] || this.heroes[0];
    if (hero.state !== 'run') return;

    hero.state = 'casting';
    hero.stateTimer = 30;
    sound.playMagic();

    // Spawn skill projectile
    const startX = hero.x + 14;
    const startY = hero.y + 10;
    const targetX = this.monster.x + 10;
    const targetY = this.monster.y + 12;

    this.projectiles.push({
      startX,
      startY,
      x: startX,
      y: startY,
      targetX,
      targetY,
      speed: 12,
      type: hero.weapon === 'talisman' ? 'talisman' : (hero.weapon === 'dagger' ? 'dagger' : 'sword_energy'),
      skillName,
      heroIndex
    });

    // Casting aura on hero
    this.effects.push({
      type: 'cast_ring',
      x: hero.x + 10,
      y: hero.y + 14,
      radius: 4,
      maxRadius: 28,
      color: hero.weapon === 'talisman' ? '#c084fc' : '#38bdf8',
      life: 25,
      maxLife: 25
    });
  }

  // Green Healing Aura & Sparkles
  playHeal(heroIndex = 0, amountText = '+HP HỒI PHỤC') {
    sound.playSuccess();

    const targets = (heroIndex === -1) ? this.heroes : [this.heroes[heroIndex] || this.heroes[0]];

    targets.forEach(hero => {
      hero.flashColor = '#34d399';
      hero.flashTimer = 22;

      // Expanding green halo rings
      for (let r = 0; r < 2; r++) {
        this.effects.push({
          type: 'heal_ring',
          x: hero.x + 10,
          y: hero.y + 14,
          radius: 2,
          maxRadius: 26,
          delay: r * 8,
          color: '#34d399',
          life: 26,
          maxLife: 26
        });
      }

      // Rising green sparkle particles
      for (let i = 0; i < 14; i++) {
        this.particles.push({
          x: hero.x + 2 + Math.random() * 16,
          y: hero.y + 12 + Math.random() * 16,
          vx: (Math.random() - 0.5) * 0.8,
          vy: -1.2 - Math.random() * 1.5,
          color: Math.random() > 0.3 ? '#34d399' : '#a7f3d0',
          size: Math.random() > 0.5 ? 3 : 2,
          life: 28 + Math.floor(Math.random() * 15),
          maxLife: 40
        });
      }

      // Floating text
      this.floatingTexts.push({
        text: amountText,
        x: hero.x - 8,
        y: hero.y - 10,
        vy: -0.7,
        color: '#34d399',
        font: '8px "Press Start 2P"',
        life: 55,
        maxLife: 55
      });
    });
  }

  // Hero takes damage and recoils
  playHeroHurt(heroIndex = 0, dmgText = '-HP') {
    const hero = this.heroes[heroIndex] || this.heroes[0];
    hero.flashColor = '#ef4444';
    hero.flashTimer = 16;
    hero.state = 'hurt';
    hero.stateTimer = 16;
    this.shake(4, 10);
    sound.playFailure();

    this.floatingTexts.push({
      text: dmgText,
      x: hero.x - 4,
      y: hero.y - 8,
      vy: -0.8,
      color: '#ef4444',
      font: '9px "Press Start 2P"',
      life: 50,
      maxLife: 50
    });
  }

  // Monster attacks the party!
  playMonsterAttack() {
    if (this.monster.state !== 'idle') return;
    this.monster.state = 'attack';
    this.monster.stateTimer = 0;
    sound.playCombat();

    // Monster shoots dark fire or slashes
    setTimeout(() => {
      this.projectiles.push({
        startX: this.monster.x - 10,
        startY: this.monster.y + 14,
        x: this.monster.x - 10,
        y: this.monster.y + 14,
        targetX: this.heroes[0].x + 10,
        targetY: this.heroes[0].y + 14,
        speed: 10,
        type: 'dark_orb',
        heroIndex: 0
      });
    }, 180);
  }

  // Screen shake
  shake(magnitude = 4, duration = 10) {
    this.shakeMagnitude = magnitude;
    this.shakeDuration = duration;
  }

  // =========================================================================
  // UPDATE LOOP (60 FPS)
  // =========================================================================

  update() {
    this.tick++;
    this.scrollGround = (this.scrollGround + 1.2) % 600;

    // Shake
    if (this.shakeDuration > 0) {
      this.shakeDuration--;
      this.shakeOffsetX = (Math.random() - 0.5) * this.shakeMagnitude * 2;
      this.shakeOffsetY = (Math.random() - 0.5) * this.shakeMagnitude * 2;
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }

    // Update Heroes
    this.heroes.forEach(h => {
      if (h.flashTimer > 0) h.flashTimer--;

      if (h.state === 'run') {
        // Smoothly settle at formation slot
        h.x += (h.baseX - h.x) * 0.15;
        h.y += (h.baseY - h.y) * 0.15;

        // Footstep dust particle occasionally
        if (this.tick % 24 === (h.runOffset * 4) % 24) {
          this.particles.push({
            x: h.x + 2,
            y: h.y + 26,
            vx: -0.8 - Math.random() * 0.5,
            vy: -0.2 - Math.random() * 0.3,
            color: '#78716c',
            size: 2,
            life: 14,
            maxLife: 14
          });
        }
      } else if (h.state === 'lunge') {
        // Dash towards monster
        const dx = h.targetX - h.x;
        h.x += dx * 0.28;
        if (Math.abs(dx) < 6) {
          h.state = 'strike';
          h.stateTimer = 12;
          this.onHeroStrikeMonster(h);
        }
      } else if (h.state === 'strike') {
        h.stateTimer--;
        if (h.stateTimer <= 0) {
          h.state = 'return';
        }
      } else if (h.state === 'return') {
        // Dash back to formation slot
        const dx = h.baseX - h.x;
        h.x += dx * 0.22;
        if (Math.abs(dx) < 3) {
          h.x = h.baseX;
          h.state = 'run';
        }
      } else if (h.state === 'casting') {
        h.stateTimer--;
        if (h.stateTimer <= 0) {
          h.state = 'run';
        }
      } else if (h.state === 'hurt') {
        h.stateTimer--;
        h.x = h.baseX - 8;
        if (h.stateTimer <= 0) {
          h.state = 'run';
        }
      }
    });

    // Update Monster
    if (this.monster.flashTimer > 0) this.monster.flashTimer--;

    if (this.monster.state === 'idle') {
      // Gentle floating / breathing
      this.monster.x += (this.monster.baseX - this.monster.x) * 0.15;
      this.monster.y = this.monster.baseY + Math.sin(this.tick * 0.08) * 1.5;

      // Dark miasma wisps
      if (this.tick % 20 === 0) {
        this.particles.push({
          x: this.monster.x + 6 + Math.random() * 16,
          y: this.monster.y + 22,
          vx: (Math.random() - 0.5) * 0.4,
          vy: -0.6 - Math.random() * 0.6,
          color: this.monster.type === 'cultist' ? '#701a75' : (this.monster.type === 'assassin' ? '#064e3b' : '#312e81'),
          size: 2,
          life: 20,
          maxLife: 20
        });
      }
    } else if (this.monster.state === 'recoil') {
      this.monster.stateTimer--;
      this.monster.x = this.monster.baseX + 12;
      if (this.monster.stateTimer <= 0) {
        this.monster.state = 'idle';
      }
    } else if (this.monster.state === 'attack') {
      this.monster.stateTimer++;
      // Lunges forward slightly
      if (this.monster.stateTimer < 14) {
        this.monster.x -= 2.2;
      } else if (this.monster.stateTimer > 28) {
        this.monster.state = 'idle';
      }
    }

    // Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      const dx = p.targetX - p.x;
      const dy = p.targetY - p.y;
      const dist = Math.hypot(dx, dy);

      if (dist < p.speed) {
        // Hit target!
        this.projectiles.splice(i, 1);
        this.onProjectileHit(p);
      } else {
        p.x += (dx / dist) * p.speed;
        p.y += (dy / dist) * p.speed;

        // Projectile spark trail
        this.particles.push({
          x: p.x,
          y: p.y,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          color: p.type === 'dark_orb' ? '#dc2626' : (p.type === 'talisman' ? '#fbbf24' : '#38bdf8'),
          size: 2,
          life: 12,
          maxLife: 12
        });
      }
    }

    // Update Visual Effects
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const ef = this.effects[i];
      ef.life--;
      if (ef.type === 'heal_ring' || ef.type === 'cast_ring') {
        ef.radius += (ef.maxRadius - ef.radius) * 0.12;
      }
      if (ef.life <= 0) {
        this.effects.splice(i, 1);
      }
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life--;
      if (pt.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update Floating Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.life--;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  // Handle Hero Melee Strike on Monster
  onHeroStrikeMonster(hero) {
    this.shake(5, 10);
    this.monster.flashColor = '#ef4444';
    this.monster.flashTimer = 10;
    this.monster.state = 'recoil';
    this.monster.stateTimer = 12;

    const dmg = 15 + Math.floor(Math.random() * 15);
    this.monster.hp = Math.max(0, this.monster.hp - dmg);

    // Slash visual arc
    this.effects.push({
      type: 'slash',
      x: this.monster.x - 6,
      y: this.monster.y + 4,
      color: hero.weapon === 'dagger' ? '#c084fc' : '#fef08a',
      life: 10,
      maxLife: 10
    });

    // Sparks
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        x: this.monster.x + 8,
        y: this.monster.y + 12,
        vx: (Math.random() - 0.2) * 3,
        vy: (Math.random() - 0.5) * 3,
        color: Math.random() > 0.5 ? '#f59e0b' : '#ef4444',
        size: 2,
        life: 16,
        maxLife: 16
      });
    }

    // Damage number
    this.floatingTexts.push({
      text: `-${dmg} HP`,
      x: this.monster.x + 4,
      y: this.monster.y - 8,
      vy: -0.8,
      color: '#fbbf24',
      font: '9px "Press Start 2P"',
      life: 50,
      maxLife: 50
    });

    // Check monster respawn if killed
    if (this.monster.hp <= 0) {
      this.onMonsterDefeated();
    }
  }

  // Handle Projectile Impact
  onProjectileHit(p) {
    if (p.type === 'dark_orb') {
      // Monster hit the heroes!
      this.playHeroHurt(p.heroIndex || 0, '-12 HP');
    } else {
      // Hero hit the monster!
      this.shake(6, 12);
      this.monster.flashColor = '#ef4444';
      this.monster.flashTimer = 12;
      this.monster.state = 'recoil';
      this.monster.stateTimer = 14;

      const dmg = 25 + Math.floor(Math.random() * 20);
      this.monster.hp = Math.max(0, this.monster.hp - dmg);

      // Burst of elemental sparks
      const sparkColor = p.type === 'talisman' ? '#c084fc' : '#38bdf8';
      for (let i = 0; i < 16; i++) {
        this.particles.push({
          x: this.monster.x + 8,
          y: this.monster.y + 12,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
          color: Math.random() > 0.4 ? sparkColor : '#ffffff',
          size: 3,
          life: 20,
          maxLife: 20
        });
      }

      this.floatingTexts.push({
        text: `⚡ ${p.skillName || 'TUYỆT KỸ'}! -${dmg} HP`,
        x: this.monster.x - 20,
        y: this.monster.y - 12,
        vy: -0.7,
        color: sparkColor,
        font: '8px "Press Start 2P"',
        life: 55,
        maxLife: 55
      });

      if (this.monster.hp <= 0) {
        this.onMonsterDefeated();
      }
    }
  }

  onMonsterDefeated() {
    this.floatingTexts.push({
      text: '💥 QUÁI VẬT ĐÃ BỊ ĐÁNH BẠI!',
      x: 380,
      y: 65,
      vy: -0.5,
      color: '#facc15',
      font: '9px "Press Start 2P"',
      life: 70,
      maxLife: 70
    });

    // Respawn stronger after 2 seconds
    setTimeout(() => {
      this.initMonsterForScene(this.sceneType);
      this.floatingTexts.push({
        text: `⚠️ ${this.monster.name} XUẤT HIỆN!`,
        x: 390,
        y: 65,
        vy: -0.5,
        color: '#ef4444',
        font: '8px "Press Start 2P"',
        life: 60,
        maxLife: 60
      });
    }, 2200);
  }

  // =========================================================================
  // RENDER PIPELINE
  // =========================================================================

  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.w;
    const h = this.h;

    ctx.save();
    // Apply Screen Shake
    if (this.shakeOffsetX !== 0 || this.shakeOffsetY !== 0) {
      ctx.translate(this.shakeOffsetX, this.shakeOffsetY);
    }

    ctx.imageSmoothingEnabled = false;

    // 1. Draw Scene Backdrop (sky, mountains, buildings, lanterns)
    PixelRenderer.drawScene(this.canvas, this.sceneType);

    // 2. Dynamic Scrolling Ground pathway details & mist
    this.renderScrollingGround(ctx, w, h);

    // 3. Render 4 Marching Heroes
    this.renderHeroes(ctx);

    // 4. Render Opposing Monster / NPC & Health Bar
    this.renderMonster(ctx);

    // 5. Render Projectiles
    this.renderProjectiles(ctx);

    // 6. Render Visual Effects (Slashes, Heal Rings)
    this.renderEffects(ctx);

    // 7. Render Particles
    this.renderParticles(ctx);

    // 8. Render Floating Texts
    this.renderFloatingTexts(ctx);

    ctx.restore();
  }

  // Dynamic parallax ground details moving leftward
  renderScrollingGround(ctx, w, h) {
    const groundY = h - 25;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';

    // Small stone pebbles drifting
    for (let i = 0; i < 8; i++) {
      const px = (i * 85 - this.scrollGround) % (w + 40);
      const actualX = px < -20 ? px + w + 40 : px;
      ctx.fillRect(actualX, groundY + 8 + (i % 3) * 4, 3, 2);
    }

    // Moving mist puffs on ground
    ctx.fillStyle = 'rgba(148, 163, 184, 0.08)';
    for (let i = 0; i < 4; i++) {
      const mx = (i * 170 - this.scrollGround * 1.5) % (w + 120);
      const actualX = mx < -60 ? mx + w + 120 : mx;
      ctx.fillRect(actualX, groundY + 2, 45, 4);
    }
  }

  // =========================================================================
  // SPRITE RENDERING: 4 HEROES
  // =========================================================================

  renderHeroes(ctx) {
    // Render in order from back to front (Hero 3 -> Hero 2 -> Hero 1 -> Hero 0)
    for (let i = this.heroes.length - 1; i >= 0; i--) {
      const hero = this.heroes[i];
      this.drawHeroSprite(ctx, hero, i);
    }
  }

  drawHeroSprite(ctx, hero, idx) {
    const runCycle = Math.floor((this.tick + hero.runOffset * 4) / 7) % 4;
    // Bobbing Y offset
    const bob = (hero.state === 'run') ? (runCycle === 1 ? -2 : (runCycle === 3 ? -1 : 0)) : 0;
    const x = Math.round(hero.x);
    const y = Math.round(hero.y + bob);

    // Palette lookup based on avatar / class
    const colors = this.getHeroPalette(hero);

    // If flashing (heal or hurt)
    const flash = hero.flashTimer > 0 ? hero.flashColor : null;

    ctx.save();

    // 1. Shadow underneath
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(x + 2, hero.baseY + 26, 16, 4);

    // 2. Legs (Alternating 4-frame run animation)
    let leftLegX = x + 4;
    let rightLegX = x + 11;
    let leftLegY = y + 20;
    let rightLegY = y + 20;

    if (hero.state === 'run') {
      if (runCycle === 0) {
        leftLegX += 2;
        rightLegX -= 2;
      } else if (runCycle === 2) {
        leftLegX -= 2;
        rightLegX += 2;
      }
    } else if (hero.state === 'lunge' || hero.state === 'strike') {
      leftLegX -= 3;
      rightLegX += 4;
    }

    // Boots
    ctx.fillStyle = flash || '#1e1b18';
    ctx.fillRect(leftLegX, leftLegY, 4, 6);
    ctx.fillRect(rightLegX, rightLegY, 4, 6);

    // 3. Body / Robes (Torso)
    ctx.fillStyle = flash || colors.cloth;
    ctx.fillRect(x + 3, y + 10, 14, 11);

    // Robe Belt / Sash
    ctx.fillStyle = flash || colors.accent;
    ctx.fillRect(x + 3, y + 15, 14, 2);

    // V-neck Hanfu Collar
    ctx.fillStyle = flash || colors.skin;
    ctx.fillRect(x + 7, y + 10, 4, 3);

    // 4. Head & Face
    ctx.fillStyle = flash || colors.skin;
    ctx.fillRect(x + 5, y + 3, 10, 8);

    // Hair & Hairbun / Headband
    ctx.fillStyle = flash || colors.hair;
    ctx.fillRect(x + 4, y + 1, 12, 3);
    ctx.fillRect(x + 8, y - 2, 4, 3); // Topknot / Bun
    ctx.fillRect(x + 3, y + 3, 3, 5); // Side hair
    ctx.fillRect(x + 13, y + 3, 3, 5);

    // Headband / Crown
    ctx.fillStyle = flash || colors.accent;
    ctx.fillRect(x + 4, y + 3, 11, 2);

    // Eye (facing right)
    ctx.fillStyle = flash || '#000000';
    ctx.fillRect(x + 11, y + 6, 2, 2);
    ctx.fillStyle = flash || '#ffffff';
    ctx.fillRect(x + 11, y + 6, 1, 1);

    // 5. Weapon held in hand
    this.drawHeroWeapon(ctx, hero, x, y, colors, flash);

    // 6. Mini Name Tag above hero
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(x - 4, y - 10, hero.name.length * 5 + 6, 8);
    ctx.fillStyle = idx === 0 ? '#facc15' : '#e2e8f0';
    ctx.font = '6px "VT323", monospace';
    ctx.fillText(hero.name, x - 2, y - 4);

    ctx.restore();
  }

  drawHeroWeapon(ctx, hero, x, y, colors, flash) {
    if (hero.weapon === 'sword') {
      // Long steel sword angled forward or held high
      ctx.fillStyle = flash || '#e2e8f0';
      if (hero.state === 'lunge' || hero.state === 'strike') {
        // Thrust straight ahead!
        ctx.fillRect(x + 16, y + 12, 14, 2);
        ctx.fillStyle = flash || colors.accent;
        ctx.fillRect(x + 15, y + 10, 2, 6); // Crossguard
      } else {
        // Slung or held at waist
        ctx.fillRect(x + 13, y + 10, 8, 2);
        ctx.fillRect(x + 15, y + 8, 2, 6);
      }
    } else if (hero.weapon === 'talisman') {
      // Glowing paper charm with red runes
      ctx.fillStyle = flash || '#fef08a';
      ctx.fillRect(x + 14, y + 9, 6, 7);
      ctx.fillStyle = flash || '#dc2626';
      ctx.fillRect(x + 16, y + 11, 2, 3);
    } else if (hero.weapon === 'dagger') {
      // Dual daggers
      ctx.fillStyle = flash || '#94a3b8';
      ctx.fillRect(x + 14, y + 12, 6, 2);
      ctx.fillRect(x + 1, y + 12, 5, 2);
    } else {
      // Zen staff / fan
      ctx.fillStyle = flash || '#b45309';
      ctx.fillRect(x + 15, y + 4, 2, 18);
      ctx.fillStyle = flash || '#fbbf24';
      ctx.fillRect(x + 14, y + 3, 4, 3);
    }
  }

  getHeroPalette(hero) {
    const map = {
      'kiem-khach': { cloth: '#0284c7', hair: '#1e293b', skin: '#fbd38d', accent: '#fbbf24' },
      'lanh-han': { cloth: '#0284c7', hair: '#0f172a', skin: '#e0f2fe', accent: '#38bdf8' },
      'tu-si': { cloth: '#b45309', hair: '#78350f', skin: '#f6ad55', accent: '#f59e0b' },
      'am-duong-su': { cloth: '#4f46e5', hair: '#312e81', skin: '#fef08a', accent: '#a855f7' },
      'thanh-van': { cloth: '#7e22ce', hair: '#475569', skin: '#fef3c7', accent: '#facc15' },
      'thich-khach': { cloth: '#7c3aed', hair: '#09090b', skin: '#fed7aa', accent: '#ef4444' },
      'da-nguyet': { cloth: '#c026d3', hair: '#181824', skin: '#fbcfe8', accent: '#f43f5e' },
      'han-si': { cloth: '#059669', hair: '#0f172a', skin: '#fde68a', accent: '#6ee7b7' }
    };
    return map[hero.avatarId] || map[hero.classId] || map['kiem-khach'];
  }

  // =========================================================================
  // SPRITE RENDERING: OPPOSING MONSTER / NPC & HEALTH BAR
  // =========================================================================

  renderMonster(ctx) {
    const m = this.monster;
    const x = Math.round(m.x);
    const y = Math.round(m.y);
    const flash = m.flashTimer > 0 ? m.flashColor : null;

    ctx.save();

    // 1. Monster Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(x - 2, this.monster.baseY + 30, 28, 5);

    // 2. Draw Monster Body according to type
    if (m.type === 'cultist') {
      this.drawCultistMonster(ctx, x, y, flash);
    } else if (m.type === 'assassin') {
      this.drawAssassinMonster(ctx, x, y, flash);
    } else if (m.type === 'golem') {
      this.drawGolemMonster(ctx, x, y, flash);
    } else {
      this.drawDemonLordMonster(ctx, x, y, flash);
    }

    // 3. Mini Monster Health Bar & Name above
    const hpPercent = Math.max(0, m.hp / m.maxHp);
    const barW = 54;
    const barH = 5;
    const barX = x - 12;
    const barY = y - 18;

    // Background box
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(barX - 2, barY - 11, barW + 4, 18);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX - 2, barY - 11, barW + 4, 18);

    // Monster Title / Name
    ctx.fillStyle = '#ef4444';
    ctx.font = '6px "VT323", monospace';
    ctx.fillText(m.name, barX, barY - 3);

    // HP Bar Track
    ctx.fillStyle = '#450a0a';
    ctx.fillRect(barX, barY + 1, barW, barH);

    // HP Bar Fill (green to red)
    const fillColor = hpPercent > 0.5 ? '#22c55e' : (hpPercent > 0.25 ? '#eab308' : '#ef4444');
    ctx.fillStyle = fillColor;
    ctx.fillRect(barX, barY + 1, Math.round(barW * hpPercent), barH);

    ctx.restore();
  }

  // Inn Monster: Cultist with dark cowl and glowing red eyes
  drawCultistMonster(ctx, x, y, flash) {
    // Robes
    ctx.fillStyle = flash || '#1e1b36';
    ctx.fillRect(x + 2, y + 8, 20, 22);
    ctx.fillStyle = flash || '#0f0d1a';
    ctx.fillRect(x + 4, y + 14, 16, 16);

    // Cowl / Hood
    ctx.fillStyle = flash || '#312e81';
    ctx.fillRect(x + 4, y + 1, 16, 10);
    ctx.fillRect(x + 6, y - 2, 12, 3);

    // Shadow in hood
    ctx.fillStyle = flash || '#05040a';
    ctx.fillRect(x + 6, y + 4, 12, 6);

    // Glowing Menacing Red Eyes
    ctx.fillStyle = flash || '#ef4444';
    ctx.fillRect(x + 8, y + 5, 2, 2);
    ctx.fillRect(x + 13, y + 5, 2, 2);

    // Curved Demonic Scimitar
    ctx.fillStyle = flash || '#9333ea';
    ctx.fillRect(x - 4, y + 10, 6, 14);
    ctx.fillStyle = flash || '#f43f5e';
    ctx.fillRect(x - 5, y + 14, 2, 6);
  }

  // Bamboo Monster: Shadow Assassin with Kasa hat
  drawAssassinMonster(ctx, x, y, flash) {
    // Robe
    ctx.fillStyle = flash || '#064e3b';
    ctx.fillRect(x + 3, y + 10, 18, 20);

    // Conical Kasa Bamboo Hat
    ctx.fillStyle = flash || '#292524';
    ctx.fillRect(x - 2, y + 4, 28, 4);
    ctx.fillRect(x + 2, y + 1, 20, 3);
    ctx.fillRect(x + 6, y - 2, 12, 3);

    // Poisonous Green Eyes under hat
    ctx.fillStyle = flash || '#10b981';
    ctx.fillRect(x + 7, y + 7, 2, 2);
    ctx.fillRect(x + 14, y + 7, 2, 2);

    // Twin dripping stilettos
    ctx.fillStyle = flash || '#34d399';
    ctx.fillRect(x - 2, y + 12, 4, 10);
    ctx.fillRect(x + 20, y + 12, 4, 10);
  }

  // Ruins Monster: Ancient Stone Golem
  drawGolemMonster(ctx, x, y, flash) {
    // Massive blocky granite body
    ctx.fillStyle = flash || '#475569';
    ctx.fillRect(x, y + 4, 26, 26);
    ctx.fillStyle = flash || '#334155';
    ctx.fillRect(x + 2, y + 7, 22, 21);

    // Heavy Spiked Shoulders
    ctx.fillStyle = flash || '#64748b';
    ctx.fillRect(x - 4, y + 2, 6, 8);
    ctx.fillRect(x + 24, y + 2, 6, 8);

    // Mystic Purple Runes
    ctx.fillStyle = flash || '#c084fc';
    ctx.fillRect(x + 8, y + 11, 10, 2);
    ctx.fillRect(x + 12, y + 11, 2, 8);
    // Glowing eyes
    ctx.fillRect(x + 6, y + 6, 3, 2);
    ctx.fillRect(x + 16, y + 6, 3, 2);
  }

  // Cliff Monster: Blood Overlord
  drawDemonLordMonster(ctx, x, y, flash) {
    // Crimson demon body & armor
    ctx.fillStyle = flash || '#450a0a';
    ctx.fillRect(x + 1, y + 6, 24, 24);

    // Horns
    ctx.fillStyle = flash || '#dc2626';
    ctx.fillRect(x + 2, y - 4, 4, 8);
    ctx.fillRect(x + 20, y - 4, 4, 8);
    ctx.fillRect(x + 4, y + 1, 18, 7);

    // Flaming Eyes
    ctx.fillStyle = flash || '#fbbf24';
    ctx.fillRect(x + 7, y + 5, 3, 2);
    ctx.fillRect(x + 16, y + 5, 3, 2);

    // Giant flaming sword
    ctx.fillStyle = flash || '#f97316';
    ctx.fillRect(x - 6, y + 2, 5, 22);
    ctx.fillStyle = flash || '#ef4444';
    ctx.fillRect(x - 7, y + 6, 7, 3);
  }

  // =========================================================================
  // PROJECTILES, VISUAL EFFECTS, PARTICLES, FLOATING TEXTS
  // =========================================================================

  renderProjectiles(ctx) {
    this.projectiles.forEach(p => {
      ctx.save();
      const x = Math.round(p.x);
      const y = Math.round(p.y);

      if (p.type === 'talisman') {
        // Glowing flying Taoist Talisman
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(x - 4, y - 5, 8, 10);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(x - 2, y - 3, 4, 6);
      } else if (p.type === 'dagger') {
        // Flying ninja kunai
        ctx.fillStyle = '#c084fc';
        ctx.fillRect(x - 5, y - 1, 10, 3);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 3, y, 3, 1);
      } else if (p.type === 'dark_orb') {
        // Dark crimson fireball
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#7f1d1d';
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Flying Sword energy projectile
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(x - 7, y - 2, 14, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - 5, y - 1, 10, 2);
      }
      ctx.restore();
    });
  }

  renderEffects(ctx) {
    this.effects.forEach(ef => {
      ctx.save();
      const alpha = Math.max(0, ef.life / ef.maxLife);

      if (ef.type === 'slash') {
        // Crescent slash arc
        ctx.strokeStyle = ef.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(ef.x + 8, ef.y + 8, 16, -Math.PI * 0.4, Math.PI * 0.4);
        ctx.stroke();
      } else if (ef.type === 'heal_ring' || ef.type === 'cast_ring') {
        // Concentric expanding ring
        ctx.strokeStyle = `rgba(52, 211, 153, ${alpha})`;
        if (ef.type === 'cast_ring') {
          ctx.strokeStyle = ef.color;
        }
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ef.x, ef.y, ef.radius, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    });
  }

  renderParticles(ctx) {
    this.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    });
  }

  renderFloatingTexts(ctx) {
    this.floatingTexts.forEach(ft => {
      ctx.save();
      const alpha = Math.min(1, ft.life / 20);
      ctx.globalAlpha = alpha;

      ctx.font = ft.font;
      // Text drop shadow for high contrast
      ctx.fillStyle = '#000000';
      ctx.fillText(ft.text, Math.round(ft.x) + 1, Math.round(ft.y) + 1);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, Math.round(ft.x), Math.round(ft.y));

      ctx.restore();
    });
  }
}
