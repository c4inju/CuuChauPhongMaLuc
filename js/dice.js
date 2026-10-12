/**
 * DICE.JS - 2D/3D Canvas Animated Dice Roller & D&D 5E Calculation Engine
 * Supports d4, d6, d8, d10, d12, d20, d100 with modifier calculations and DC checks.
 */

import { sound } from './audio.js';

export class DiceRoller {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.currentDice = 'd20';
    this.lastResult = null;
    this.history = [];
    this.isRolling = false;
    this.activeDC = null; // { target: 14, stat: 'AGI', reason: 'Né độc' }

    if (this.canvas) {
      this.ctx.imageSmoothingEnabled = false;
      this.drawIdleDice();
    }
  }

  setDiceType(type) {
    this.currentDice = type;
  }

  setActiveDC(dcInfo) {
    this.activeDC = dcInfo;
  }

  clearActiveDC() {
    this.activeDC = null;
  }

  getMaxValue(diceType = this.currentDice) {
    const map = { d4: 4, d6: 6, d8: 8, d10: 10, d12: 12, d20: 20, d100: 100 };
    return map[diceType] || 20;
  }

  // Perform animated roll
  async roll(options = {}) {
    if (this.isRolling) return null;
    this.isRolling = true;

    const diceType = options.dice || this.currentDice;
    const maxVal = this.getMaxValue(diceType);
    const modValue = options.modifierValue ?? 0;
    const modLabel = options.modifierLabel || '';
    const customBonus = options.customBonus ?? 0;
    const targetDC = options.dc ?? (this.activeDC ? this.activeDC.target : null);

    // Audio cue
    sound.playDiceRoll();

    // Visual roll animation on canvas
    const finalRoll = await this._animateRoll(maxVal);

    const totalMod = modValue + customBonus;
    const total = finalRoll + totalMod;

    // Determine verdict
    let verdict = 'NORMAL';
    let verdictText = 'KẾT QUẢ: ' + total;
    let verdictClass = 'normal';

    if (diceType === 'd20') {
      if (finalRoll === 20) {
        verdict = 'CRIT_SUCCESS';
        verdictText = 'ĐẠI THÀNH CÔNG RỰC RỠ (NAT 20)!';
        verdictClass = 'crit-success';
        sound.playCritSuccess();
      } else if (finalRoll === 1) {
        verdict = 'CRIT_FAIL';
        verdictText = 'ĐẠI THẤT BẠI THẢM HẠI (NAT 1)!';
        verdictClass = 'crit-fail';
        sound.playCritFail();
      } else if (targetDC !== null) {
        if (total >= targetDC) {
          verdict = 'SUCCESS';
          verdictText = `THÀNH CÔNG (${total} ≥ DC ${targetDC})!`;
          verdictClass = 'success';
          sound.playSuccess();
        } else {
          verdict = 'FAIL';
          verdictText = `THẤT BẠI (${total} < DC ${targetDC})!`;
          verdictClass = 'fail';
          sound.playFailure();
        }
      } else {
        verdictText = `ĐẠT ${total} ĐIỂM!`;
        verdictClass = 'success';
        sound.playSuccess();
      }
    } else {
      if (targetDC !== null) {
        verdict = total >= targetDC ? 'SUCCESS' : 'FAIL';
        verdictText = verdict === 'SUCCESS' ? `THÀNH CÔNG (${total} ≥ DC ${targetDC})!` : `THẤT BẠI (${total} < DC ${targetDC})!`;
        verdictClass = verdict === 'SUCCESS' ? 'success' : 'fail';
        verdict === 'SUCCESS' ? sound.playSuccess() : sound.playFailure();
      } else {
        verdictText = `ĐẠT ${total} ĐIỂM!`;
        verdictClass = 'normal';
      }
    }

    const breakdown = `${finalRoll} (${diceType})${modValue !== 0 ? ` + ${modValue} (${modLabel || 'Mod'})` : ''}${customBonus !== 0 ? ` + ${customBonus} (Bonus)` : ''} = ${total}`;

    const result = {
      dice: diceType,
      naturalRoll: finalRoll,
      modifier: modValue,
      modLabel,
      customBonus,
      total,
      targetDC,
      verdict,
      verdictText,
      verdictClass,
      breakdown,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    this.lastResult = result;
    this.history.unshift(result);
    if (this.history.length > 20) this.history.pop();

    this.isRolling = false;
    return result;
  }

  // Canvas tumble animation loop
  _animateRoll(maxVal) {
    return new Promise(resolve => {
      if (!this.canvas || !this.ctx) {
        resolve(Math.floor(Math.random() * maxVal) + 1);
        return;
      }

      const w = this.canvas.width;
      const h = this.canvas.height;
      const startTime = performance.now();
      const duration = 650; // ms
      let currentDisplay = 1;

      const drawFrame = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(1, elapsed / duration);

        this.ctx.clearRect(0, 0, w, h);

        // Shake / tumble coordinates
        const wobbleX = (Math.random() - 0.5) * 16 * (1 - progress);
        const wobbleY = (Math.random() - 0.5) * 16 * (1 - progress);
        const angle = (elapsed * 0.02) % (Math.PI * 2);

        // Draw retro dice in center
        currentDisplay = Math.floor(Math.random() * maxVal) + 1;
        this._renderDiceShape(w / 2 + wobbleX, h / 2 + wobbleY, angle, currentDisplay, progress);

        if (progress < 1) {
          requestAnimationFrame(drawFrame);
        } else {
          // Final settled roll
          const finalRoll = Math.floor(Math.random() * maxVal) + 1;
          this.ctx.clearRect(0, 0, w, h);
          this._renderDiceShape(w / 2, h / 2, 0, finalRoll, 1.0);
          resolve(finalRoll);
        }
      };

      requestAnimationFrame(drawFrame);
    });
  }

  _renderDiceShape(cx, cy, rotation, value, progress) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);

    const size = 36;

    // Drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(-size / 2 + 5, -size / 2 + 5, size, size);

    // Pixel die body (Gold / Amber border with deep slate fill)
    ctx.fillStyle = progress < 1 ? '#b45309' : (value === 20 ? '#d97706' : (value === 1 ? '#7f1d1d' : '#1e293b'));
    ctx.fillRect(-size / 2, -size / 2, size, size);

    // 8-bit stepped borders
    ctx.strokeStyle = value === 20 ? '#ffd166' : (value === 1 ? '#ef4444' : '#f6c944');
    ctx.lineWidth = 3;
    ctx.strokeRect(-size / 2, -size / 2, size, size);

    // Value text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(value.toString(), 0, 2);

    ctx.restore();
  }

  drawIdleDice() {
    if (!this.canvas || !this.ctx) return;
    const w = this.canvas.width;
    const h = this.canvas.height;
    this.ctx.clearRect(0, 0, w, h);
    this._renderDiceShape(w / 2, h / 2, 0, 20, 1.0);
  }
}
