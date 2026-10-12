/**
 * APP.JS - Main Game Controller & Orchestrator
 * Integrates Authentic D&D 5E Character Creation, AI Party, Dice Roller, 9router API, and Story Feeds.
 */

import { Character, CLASS_DEFINITIONS, BACKGROUND_DEFINITIONS, POINT_BUY_COST } from './character.js';
import { PartyManager } from './party.js';
import { DiceRoller } from './dice.js';
import { apiClient } from './api.js';
import { sound } from './audio.js';
import { PixelRenderer } from './canvas-pixel.js';
import { GameStorage } from './storage.js';
import { CAMPAIGN_DEFINITIONS, getCampaignById, getRandomCampaign } from './campaigns.js';
import { ChronicleManager } from './chronicle.js';

class GameApp {
  constructor() {
    this.player = null;
    this.party = null;
    this.diceRoller = null;
    this.turn = 0;
    this.currentCampaign = CAMPAIGN_DEFINITIONS[0];
    this.currentChapter = this.currentCampaign.chapterName;
    this.currentScene = this.currentCampaign.scene;
    this.chronicle = new ChronicleManager();
    this.chronicle.setCampaign(this.currentCampaign);
    this.storyLogs = [];
    this.activeDC = null;

    // D&D Character Creation State
    this.createName = 'Bạch Ngọc Đường';
    this.createCampaign = 'van-yeu-co-son';
    this.createClass = 'kiem-khach';
    this.createBackground = 'tan-tu';
    this.createAvatar = 'kiem-khach';
    this.createMethod = 'pointbuy'; // 'pointbuy' | 'standard' | 'roll4d6'
    this.createBaseStats = { STR: 14, AGI: 14, CON: 13, INT: 10, WIS: 10, CHA: 8 };
  }

  init() {
    // 1. Initialize Audio & CRT states
    this.initHeaderToggles();

    // 2. Load Saved Game or Prepare Uncreated State (DO NOT AUTO-CREATE CHARACTER)
    const savedState = GameStorage.load();
    if (savedState && savedState.player) {
      this.loadExistingState(savedState);
    } else {
      this.initUncreatedState();
    }

    // 3. Initialize Dice Roller
    this.diceRoller = new DiceRoller('dice-canvas');

    // 4. Render All UI Components
    this.renderAll();

    // 5. Setup Event Listeners
    this.bindEvents();

    // 6. If no character exists yet, open Character Creation Wizard immediately
    if (!this.player) {
      this.openCharacterCreationWizard(true);
    }

    // 7. Test connection in background to update status dot
    setTimeout(async () => {
      try {
        const testRes = await apiClient.testConnection();
        const dot = document.getElementById('api-status-dot');
        if (dot) {
          dot.className = `status-dot-indicator ${testRes.success ? 'connected' : 'error'}`;
          dot.title = testRes.success ? '9router đã kết nối thành công!' : '9router chưa phản hồi';
        }
      } catch (e) {}
    }, 400);
  }

  initUncreatedState(campaign = CAMPAIGN_DEFINITIONS[0]) {
    this.player = null;
    this.party = new PartyManager();
    this.turn = 0;
    this.currentCampaign = campaign;
    this.currentChapter = campaign.chapterName;
    this.currentScene = campaign.scene;
    this.chronicle = new ChronicleManager();
    this.chronicle.setCampaign(campaign);

    this.storyLogs = [
      {
        id: 'msg-welcome-init',
        sender: 'DM',
        senderName: 'QUẢN TRÒ (DM)',
        type: 'dm',
        timestamp: this.getCurrentTimestamp(),
        content: `🏮 **CHÀO MỪNG ĐẠO HỮU ĐẾN VỚI CỬU CHÂU PHONG MA LỤC**\n\nChiến dịch hiện tại: **${campaign.title}** (${campaign.genre})\n${campaign.hook}\n\nĐể bắt đầu cuộc phiêu lưu, **hãy khởi tạo nhân vật D&D của bạn** (Chọn Môn Phái, Xuất Thân, Phân bổ chỉ số Point Buy hoặc Tung 4d6).\n\nNhấn nút **"KHỞI TẠO NHÂN VẬT D&D"** ở bảng bên trái hoặc trên màn hình để bước vào giang hồ!`
      }
    ];

    this.activeDC = null;
  }

  loadExistingState(saved) {
    this.player = Character.deserialize(saved.player);
    this.party = new PartyManager(saved.party);
    this.turn = saved.turn || 1;
    this.currentChapter = saved.chapter || 'Hồi 1: Quán Trọ Vong Hồn';
    this.currentScene = saved.scene || 'inn';
    this.currentCampaign = saved.campaign || getCampaignById('van-yeu-co-son');
    this.chronicle = saved.chronicle ? ChronicleManager.deserialize(saved.chronicle) : new ChronicleManager();
    if (!saved.chronicle && this.currentCampaign) {
      this.chronicle.setCampaign(this.currentCampaign);
    }
    this.storyLogs = saved.storyLogs || [];
  }

  initHeaderToggles() {
    const audioBtn = document.getElementById('btn-toggle-audio');
    const audioIcon = document.getElementById('audio-icon');
    if (sound.isMuted()) {
      audioIcon.textContent = '🔇';
    }

    audioBtn.addEventListener('click', () => {
      const isMuted = sound.toggleMute();
      audioIcon.textContent = isMuted ? '🔇' : '🔊';
      this.showToast(isMuted ? 'Đã tắt âm thanh' : 'Đã bật âm thanh 8-bit');
    });

    const crtBtn = document.getElementById('btn-toggle-crt');
    crtBtn.addEventListener('click', () => {
      document.body.classList.toggle('scanline-active');
      const active = document.body.classList.contains('scanline-active');
      this.showToast(active ? 'Đã bật hiệu ứng CRT scanlines' : 'Đã tắt hiệu ứng CRT');
      sound.playClick();
    });
  }

  // =========================================================================
  // RENDERING FUNCTIONS
  // =========================================================================

  renderAll() {
    this.renderHeaderInfo();
    this.renderPlayerSheet();
    this.renderParty();
    this.renderSceneBanner();
    this.renderStoryFeed();
    this.renderDCChallenge();
    this.renderDiceSection();
  }

  renderHeaderInfo() {
    document.getElementById('turn-count').textContent = this.turn;
    document.getElementById('current-chapter-title').textContent = this.currentChapter;
  }

  renderPlayerSheet() {
    const emptyState = document.getElementById('player-empty-state');
    const sheetContainer = document.getElementById('player-sheet-container');

    if (!this.player) {
      if (emptyState) emptyState.classList.remove('hidden');
      if (sheetContainer) sheetContainer.classList.add('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');
    if (sheetContainer) sheetContainer.classList.remove('hidden');

    // Name, class, level, realm, background
    document.getElementById('player-name').textContent = this.player.name;
    document.getElementById('player-class').textContent = this.player.className;
    const bgTag = document.getElementById('player-background-tag');
    if (bgTag) bgTag.textContent = this.player.backgroundName;
    document.getElementById('player-level').textContent = this.player.level;
    document.getElementById('player-realm').textContent = `Cảnh Giới: ${this.player.cultivationRealm}`;
    document.getElementById('player-gold').textContent = this.player.gold;

    // Vitals
    document.getElementById('hp-text').textContent = `${this.player.hp} / ${this.player.maxHp}`;
    const hpPct = Math.max(0, Math.min(100, (this.player.hp / this.player.maxHp) * 100));
    document.getElementById('hp-bar-fill').style.width = `${hpPct}%`;

    document.getElementById('qi-text').textContent = `${this.player.qi} / ${this.player.maxQi}`;
    const qiPct = Math.max(0, Math.min(100, (this.player.qi / this.player.maxQi) * 100));
    document.getElementById('qi-bar-fill').style.width = `${qiPct}%`;

    document.getElementById('exp-text').textContent = `${this.player.exp} / ${this.player.expToNext}`;
    const expPct = Math.max(0, Math.min(100, (this.player.exp / this.player.expToNext) * 100));
    document.getElementById('exp-bar-fill').style.width = `${expPct}%`;

    // 6 Stats
    ['STR', 'AGI', 'CON', 'INT', 'WIS', 'CHA'].forEach(stat => {
      const scoreEl = document.getElementById(`stat-${stat.toLowerCase()}`);
      const modEl = document.getElementById(`mod-${stat.toLowerCase()}`);
      if (scoreEl) scoreEl.textContent = this.player.stats[stat];
      if (modEl) modEl.textContent = this.player.getModifierFormatted(stat);
    });

    // Draw Player Avatar
    const avatarCanvas = document.getElementById('player-avatar-canvas');
    PixelRenderer.drawAvatar(avatarCanvas, this.player.avatarId);

    // Equipment
    document.getElementById('equip-weapon').textContent = this.player.equipment.weapon;
    document.getElementById('equip-armor').textContent = this.player.equipment.armor;
    document.getElementById('equip-trinket').textContent = this.player.equipment.trinket;

    // Inventory List
    const invList = document.getElementById('inventory-list');
    invList.innerHTML = '';
    this.player.inventory.forEach(item => {
      const li = document.createElement('li');
      li.className = 'inventory-item-card';
      li.innerHTML = `
        <div class="item-left">
          <span class="item-name">${item.icon} ${item.name} (${item.count}x)</span>
          <span class="item-desc">${item.desc}</span>
        </div>
        <button class="mini-pixel-btn btn-use-item" data-id="${item.id}">DÙNG</button>
      `;
      invList.appendChild(li);
    });

    // Skills List
    const skillList = document.getElementById('skills-list');
    skillList.innerHTML = '';
    this.player.skills.forEach(skill => {
      const li = document.createElement('li');
      li.className = 'skill-card';
      li.innerHTML = `
        <div class="skill-left">
          <span class="skill-name">⚡ ${skill.name}</span>
          <span class="skill-desc">${skill.desc} (${skill.dice})</span>
        </div>
        <button class="mini-pixel-btn btn-cast-skill" data-id="${skill.id}">QI -${skill.qiCost}</button>
      `;
      skillList.appendChild(li);
    });
  }

  renderParty() {
    const list = document.getElementById('party-list');
    if (!list || !this.party) return;

    const comps = this.party.getAll();
    list.innerHTML = comps.map(c => `
      <div class="companion-card" id="companion-${c.id}">
        <div class="companion-top">
          <div class="companion-avatar-wrap">
            <canvas id="avatar-${c.id}" width="40" height="40"></canvas>
          </div>
          <div class="companion-info">
            <div class="comp-name-row">
              <span class="comp-name">${c.name.toUpperCase()}</span>
              <span class="comp-class">${c.class}</span>
            </div>
            <div class="comp-personality">"${c.quote}"</div>
          </div>
        </div>
        <div class="comp-stats-row">
          <div class="comp-hp-wrap">
            <span class="comp-hp-label">HP: <span id="hp-${c.id}">${c.hp}/${c.maxHp}</span></span>
            <div class="pixel-progress-bar mini-bar">
              <div class="bar-fill hp-bar-fill" id="bar-${c.id}" style="width: ${Math.max(0, Math.min(100, (c.hp / c.maxHp) * 100))}%;"></div>
            </div>
          </div>
          <button class="mini-action-btn" data-companion="${c.id}" title="${c.signatureMove.name}: ${c.signatureMove.desc}">
            ⚔️ ${c.signatureMove.name.split('(')[0].trim()}
          </button>
        </div>
      </div>
    `).join('');

    // Draw pixel avatars on canvases
    comps.forEach(c => {
      const canvas = document.getElementById(`avatar-${c.id}`);
      if (canvas) {
        PixelRenderer.drawAvatar(canvas, c.avatarId || 'lanh-han');
      }
    });

    // Re-bind action button click events
    list.querySelectorAll('.mini-action-btn').forEach(btn => {
      btn.onclick = () => {
        const compId = btn.getAttribute('data-companion');
        this.triggerCompanionAction(compId);
      };
    });
  }

  renderSceneBanner() {
    const sceneCanvas = document.getElementById('scene-canvas');
    PixelRenderer.drawScene(sceneCanvas, this.currentScene);

    const titleEl = document.getElementById('scene-location-title');
    const weatherEl = document.getElementById('scene-weather');

    const scenes = {
      inn: { title: '🏮 QUÁN TRỌ VONG HỒN (CÔ SƠN TRẠM)', weather: 'Khí trời: Gió lạnh căm căm, tà khí vương vấn sau rèm' },
      bamboo: { title: '🎋 RỪNG TRÚC U TĂM (MA ĐẠO KẾT GIỚI)', weather: 'Khí trời: Sương mù che mắt, lá trúc kêu xào xạc' },
      ruins: { title: '🏛️ TÀN TÍCH MA MÔN (CỔ TRẬN BỊ PHÁ)', weather: 'Khí trời: Linh khí hỗn loạn, huyết quang bập bùng' },
      cliff: { title: '⛰️ PHONG MA NHAI (ĐỈNH HUYẾT NGUYỆT)', weather: 'Khí trời: Sấm sét rền vang, trăng máu ngự trị' }
    };

    const cur = scenes[this.currentScene] || scenes.inn;
    titleEl.textContent = cur.title;
    weatherEl.textContent = cur.weather;
  }

  renderStoryFeed() {
    const container = document.getElementById('story-log-container');
    container.innerHTML = '';

    this.storyLogs.forEach(log => {
      const msgDiv = document.createElement('div');
      msgDiv.className = `story-message ${log.type}-message ${log.extraClass || ''}`;

      let icon = '📜';
      if (log.type === 'dm') icon = '👑';
      else if (log.type === 'player') icon = '🥋';
      else if (log.type === 'companion') icon = '👥';
      else if (log.type === 'system') icon = '🎲';

      msgDiv.innerHTML = `
        <div class="msg-header">
          <span class="msg-sender-tag">${icon} ${log.senderName}</span>
          <span class="msg-timestamp">${log.timestamp}</span>
        </div>
        <div class="msg-body">${log.formattedContent || this.formatMarkdown(log.content)}</div>
      `;

      container.appendChild(msgDiv);
    });

    container.scrollTop = container.scrollHeight;
  }

  renderDCChallenge() {
    const card = document.getElementById('active-dc-card');
    if (!this.activeDC) {
      card.classList.add('hidden');
      return;
    }

    card.classList.remove('hidden');
    document.getElementById('dc-target-val').textContent = this.activeDC.target;
    document.getElementById('dc-stat-name').textContent = `${this.activeDC.stat} (${this.getStatVietName(this.activeDC.stat)})`;
    document.getElementById('dc-challenge-desc').textContent = this.activeDC.reason;

    // Automatically sync modifier select in dice box
    const modSelect = document.getElementById('select-modifier');
    if (modSelect) {
      modSelect.value = this.activeDC.stat;
    }
  }

  renderDiceSection() {
    const modSelect = document.getElementById('select-modifier');
    ['STR', 'AGI', 'CON', 'INT', 'WIS', 'CHA'].forEach(st => {
      const opt = modSelect.querySelector(`option[value="${st}"]`);
      if (opt) {
        const modStr = this.player ? this.player.getModifierFormatted(st) : '+0';
        opt.textContent = `${st} (${this.getStatVietName(st)}: ${modStr})`;
      }
    });

    const histWrap = document.getElementById('dice-history-list');
    histWrap.innerHTML = '';
    this.diceRoller.history.forEach(h => {
      const span = document.createElement('span');
      span.className = `hist-tag ${h.verdictClass}`;
      span.textContent = `${h.dice}: ${h.total} (${h.verdict.replace('_', ' ')})`;
      histWrap.appendChild(span);
    });
  }

  // =========================================================================
  // ACTIONS & STORY ADVANCEMENT
  // =========================================================================

  async handleUserAction(rawText) {
    const text = rawText.trim();
    if (!text) return;

    if (!this.player) {
      this.showToast('Vui lòng khởi tạo nhân vật D&D trước khi hành động!');
      this.openCharacterCreationWizard(true);
      return;
    }

    sound.playClick();

    // 1. Append Player Message
    const playerMsg = {
      id: `msg-${Date.now()}`,
      sender: 'PLAYER',
      senderName: `${this.player.name} (${this.player.className})`,
      type: 'player',
      timestamp: this.getCurrentTimestamp(),
      content: text
    };
    this.storyLogs.push(playerMsg);
    this.renderStoryFeed();

    // 2. Clear action input
    document.getElementById('action-input').value = '';

    // 3. Increment turn & show typing
    this.turn += 1;
    this.renderHeaderInfo();
    this.showDMTyping(true);

    // 4. Send to Dungeon Master Agent
    try {
      const historyForApi = this.storyLogs
        .filter(m => m.type === 'player' || m.type === 'dm')
        .slice(-10)
        .map(m => ({
          role: m.type === 'player' ? 'user' : 'assistant',
          content: m.content
        }));

      const context = {
        playerName: this.player.name,
        playerClass: this.player.className,
        playerBackground: this.player.backgroundName,
        playerRealm: this.player.cultivationRealm,
        playerHp: this.player.hp,
        playerQi: this.player.qi,
        campaign: this.currentCampaign,
        activeParty: this.party ? this.party.getAll().map(c => `${c.name} (${c.class})`).join(', ') : 'Lãnh Hàn, Thanh Vân, Dạ Nguyệt',
        chronicleMemory: this.chronicle ? this.chronicle.getDenseMemoryPrompt() : ''
      };

      const res = await apiClient.callDMAgent(historyForApi, context);
      this.showDMTyping(false);

      // 5. Parse response tags and create DM log
      this.processDMResponse(res.content, res.errorNotice);
    } catch (err) {
      this.showDMTyping(false);
      this.appendSystemNotice(`Lỗi giao tiếp với Quản trò: ${err.message}`);
    }

    // Auto-save game
    GameStorage.save(this);
  }

  processDMResponse(rawContent, errorNotice = null) {
    let cleanText = rawContent;

    // Parse Chronicle & Long-term Memory tags: [MILESTONE: ...], [LORE: ...], [QUEST: ...]
    if (this.chronicle) {
      cleanText = this.chronicle.parseMemoryTagsFromResponse(cleanText, this.turn, this.currentChapter);
    }

    // Check for DC Check: [DC_CHECK: d20 | DC: 14 | STAT: AGI | REASON: ...]
    const dcMatch = cleanText.match(/\[DC_CHECK:\s*(d\d+)?\s*\|\s*DC:\s*(\d+)\s*\|\s*STAT:\s*([A-Za-z]+)\s*(?:\|\s*REASON:\s*([^\]]+))?\]/i);
    if (dcMatch) {
      const diceType = dcMatch[1] || 'd20';
      const targetDC = parseInt(dcMatch[2], 10);
      const statName = (dcMatch[3] || 'AGI').toUpperCase();
      const reason = dcMatch[4] ? dcMatch[4].trim() : 'Kiểm tra kỹ năng theo yêu cầu DM';

      this.activeDC = { dice: diceType, target: targetDC, stat: statName, reason };
      this.diceRoller.setActiveDC(this.activeDC);
      this.renderDCChallenge();

      cleanText = cleanText.replace(dcMatch[0], '');
    }

    // Check for Scene Change: [SCENE: inn | bamboo | ruins | cliff ...]
    const sceneMatch = cleanText.match(/\[SCENE:\s*([a-zA-Z0-9_-]+)(?:\s*\|\s*TITLE:\s*([^\]]+))?\]/i);
    if (sceneMatch) {
      const newScene = sceneMatch[1].toLowerCase();
      if (['inn', 'bamboo', 'ruins', 'cliff'].includes(newScene)) {
        this.currentScene = newScene;
        this.renderSceneBanner();
      }
      if (sceneMatch[2]) {
        this.currentChapter = sceneMatch[2].trim();
        this.renderHeaderInfo();
        if (this.chronicle) {
          this.chronicle.addMilestone({
            turn: this.turn,
            chapter: this.currentChapter,
            summary: `Đặt chân tới bối cảnh mới: ${this.currentChapter}.`,
            type: 'major'
          });
        }
      }
      cleanText = cleanText.replace(sceneMatch[0], '');
    }

    // Check for HP Change: [HP_CHANGE: -5]
    const hpMatch = cleanText.match(/\[HP_CHANGE:\s*([+-]?\d+)\]/i);
    if (hpMatch && this.player) {
      const delta = parseInt(hpMatch[1], 10);
      if (delta < 0) {
        this.player.takeDamage(Math.abs(delta));
      } else {
        this.player.heal(delta);
      }
      this.renderPlayerSheet();
      cleanText = cleanText.replace(hpMatch[0], '');
    }

    // Check for EXP Gain: [EXP_GAIN: 20]
    const expMatch = cleanText.match(/\[EXP_GAIN:\s*(\d+)\]/i);
    if (expMatch && this.player) {
      const amt = parseInt(expMatch[1], 10);
      const leveled = this.player.addExp(amt);
      if (leveled) {
        this.showToast(`✨ CHÚC MỪNG! BẠN ĐÃ ĐỘT PHÁ CẢNH GIỚI: ${this.player.cultivationRealm} (LV.${this.player.level})!`);
      }
      this.renderPlayerSheet();
      cleanText = cleanText.replace(expMatch[0], '');
    }

    // Append Clean DM Log
    const dmMsg = {
      id: `msg-${Date.now()}`,
      sender: 'DM',
      senderName: errorNotice ? 'QUẢN TRÒ (DM) [OFFLINE]' : 'QUẢN TRÒ (DM)',
      type: 'dm',
      timestamp: this.getCurrentTimestamp(),
      content: cleanText.trim() + (errorNotice ? `\n\n*${errorNotice}*` : '')
    };

    this.storyLogs.push(dmMsg);
    this.renderStoryFeed();
    sound.playMagic();
  }

  // Perform Dice Roll & Sync with DM
  async handleDiceRoll() {
    const diceSelect = document.querySelector('.dice-select-btn.active');
    const diceType = diceSelect ? diceSelect.getAttribute('data-dice') : 'd20';

    const modSelect = document.getElementById('select-modifier');
    const modStat = modSelect ? modSelect.value : 'NONE';

    let modVal = 0;
    let modLabel = '';
    if (modStat !== 'NONE' && this.player && this.player.stats[modStat] !== undefined) {
      modVal = this.player.getModifier(modStat);
      modLabel = `${modStat} ${this.player.getModifierFormatted(modStat)}`;
    }

    const customBonus = parseInt(document.getElementById('custom-mod')?.value || '0', 10);

    // Roll!
    const result = await this.diceRoller.roll({
      dice: diceType,
      modifierValue: modVal,
      modifierLabel: modLabel,
      customBonus,
      dc: this.activeDC ? this.activeDC.target : null
    });

    if (!result) return;

    // Update Big UI Display in Dice Tray
    const bigRes = document.getElementById('dice-big-result');
    bigRes.textContent = result.total;
    bigRes.classList.add('pop');
    setTimeout(() => bigRes.classList.remove('pop'), 250);

    document.getElementById('dice-breakdown').textContent = result.breakdown;
    const verdEl = document.getElementById('dice-verdict');
    verdEl.textContent = result.verdictText;
    verdEl.className = `verdict-tag ${result.verdictClass}`;

    // Enable Send to DM button
    const sendBtn = document.getElementById('btn-send-roll-to-dm');
    sendBtn.disabled = false;

    // Append Result Card into Story Feed
    const rollCard = {
      id: `msg-${Date.now()}`,
      sender: 'SYSTEM',
      senderName: 'KẾT QUẢ ĐỔ XÚC XẮC',
      type: 'system',
      timestamp: this.getCurrentTimestamp(),
      content: `Đổ **${result.dice}**: ${result.breakdown}\n➔ **${result.verdictText}**`,
      formattedContent: `
        <div class="dice-result-card ${result.verdictClass}">
          <div>
            <strong>${result.dice.toUpperCase()} ROLL:</strong> ${result.breakdown}
          </div>
          <div class="verdict-tag ${result.verdictClass}">
            ${result.verdictText}
          </div>
        </div>
      `
    };
    this.storyLogs.push(rollCard);
    this.renderStoryFeed();
    this.renderDiceSection();

    // If this roll was fulfilling an active DC challenge
    if (this.activeDC) {
      this.activeDC = null;
      this.diceRoller.clearActiveDC();
      this.renderDCChallenge();
    }
  }

  sendDiceResultToDM() {
    if (!this.diceRoller.lastResult) return;
    const res = this.diceRoller.lastResult;
    const rollSummary = `[KẾT QUẢ XÚC XẮC]: Ta đã đổ ${res.dice}. ${res.breakdown}. Đánh giá: ${res.verdictText}. Hãy mô tả diễn biến tiếp theo!`;
    this.handleUserAction(rollSummary);
    document.getElementById('btn-send-roll-to-dm').disabled = true;
  }

  // Trigger AI Companion Action or Banter
  async triggerCompanionAction(compId) {
    if (!this.player) {
      this.showToast('Vui lòng tạo nhân vật D&D trước!');
      this.openCharacterCreationWizard(true);
      return;
    }

    const comp = this.party.getCompanion(compId);
    if (!comp) return;

    sound.playClick();
    const actionData = this.party.executeAction(compId);

    const compMsg = {
      id: `msg-${Date.now()}`,
      sender: comp.name.toUpperCase(),
      senderName: `${comp.name} (${comp.class})`,
      type: 'companion',
      extraClass: comp.id,
      timestamp: this.getCurrentTimestamp(),
      content: `**[XUẤT CHIÊU: ${comp.signatureMove.name}]**\n${actionData.actionDesc} (Công hiệu: ${actionData.formula})`
    };
    this.storyLogs.push(compMsg);
    this.renderStoryFeed();

    this.showDMTyping(true);
    try {
      const historyForApi = this.storyLogs
        .filter(m => m.type === 'player' || m.type === 'dm' || m.type === 'companion')
        .slice(-8)
        .map(m => ({
          role: m.type === 'dm' ? 'assistant' : 'user',
          content: m.content
        }));

      const dmRes = await apiClient.callDMAgent(historyForApi, {
        playerName: this.player.name,
        playerClass: this.player.className,
        playerBackground: this.player.backgroundName,
        playerHp: this.player.hp
      });
      this.showDMTyping(false);
      this.processDMResponse(dmRes.content, dmRes.errorNotice);
    } catch (err) {
      this.showDMTyping(false);
      this.appendSystemNotice(`Lỗi phản hồi: ${err.message}`);
    }
  }

  triggerPartyBanter() {
    sound.playClick();
    const banter = this.party.getRandomBanter();
    if (!banter) return;

    const msg = {
      id: `msg-${Date.now()}`,
      sender: banter.companion.name.toUpperCase(),
      senderName: `${banter.companion.name} (${banter.companion.class})`,
      type: 'companion',
      extraClass: banter.companion.id,
      timestamp: this.getCurrentTimestamp(),
      content: `*"${banter.text}"*`
    };
    this.storyLogs.push(msg);
    this.renderStoryFeed();
    sound.playMagic();
  }

  // =========================================================================
  // D&D 5E AUTHENTIC CHARACTER CREATION WIZARD LOGIC
  // =========================================================================

  openCharacterCreationWizard(isFirstTime = false) {
    sound.playClick();
    const modal = document.getElementById('modal-char-create');
    const closeBtn = document.getElementById('btn-close-char-create');

    if (isFirstTime || !this.player) {
      if (closeBtn) closeBtn.style.display = 'none'; // Must create character
    } else {
      if (closeBtn) closeBtn.style.display = 'block';
    }

    this.initCharacterCreationModal();
    modal.classList.remove('hidden');
  }

  initCharacterCreationModal() {
    this.createName = this.player ? this.player.name : 'Bạch Ngọc Đường';
    document.getElementById('create-name').value = this.createName;

    this.createClass = this.player ? this.player.classId : 'kiem-khach';
    this.createBackground = this.player ? this.player.backgroundId : 'tan-tu';
    this.createAvatar = this.player ? this.player.avatarId : 'kiem-khach';
    this.createMethod = 'pointbuy';

    // Base stats start at D&D standard point buy values
    this.createBaseStats = this.player
      ? { ...this.player.stats }
      : { STR: 14, AGI: 14, CON: 13, INT: 10, WIS: 10, CHA: 8 };

    // 0. Render Campaign Selection Cards
    this.createCampaign = this.currentCampaign ? this.currentCampaign.id : 'van-yeu-co-son';
    const campPicker = document.getElementById('create-campaign-picker');
    if (campPicker) {
      campPicker.innerHTML = '';
      CAMPAIGN_DEFINITIONS.forEach(camp => {
        const div = document.createElement('div');
        div.className = `campaign-card ${camp.id === this.createCampaign ? 'active' : ''}`;
        div.setAttribute('data-campaign', camp.id);
        div.innerHTML = `
          <div class="camp-top-row">
            <span class="camp-title">${camp.icon} ${camp.title}</span>
            <span class="camp-badge-genre">${camp.genre}</span>
          </div>
          <div class="camp-desc">${camp.shortDesc}</div>
          <div class="camp-goal">🎯 Mục tiêu: ${camp.mainObjective}</div>
        `;
        div.onclick = () => {
          sound.playClick();
          document.querySelectorAll('#create-campaign-picker .campaign-card').forEach(c => c.classList.remove('active'));
          div.classList.add('active');
          this.createCampaign = camp.id;
        };
        campPicker.appendChild(div);
      });
    }

    // Random Campaign Button
    const btnRandCamp = document.getElementById('btn-random-campaign');
    if (btnRandCamp) {
      btnRandCamp.onclick = () => {
        sound.playDiceRoll();
        const rand = getRandomCampaign();
        this.createCampaign = rand.id;
        document.querySelectorAll('#create-campaign-picker .campaign-card').forEach(c => {
          c.classList.toggle('active', c.getAttribute('data-campaign') === rand.id);
        });
        this.showToast(`🎲 Đã chọn ngẫu nhiên: ${rand.title}!`);
      };
    }

    // 1. Render Avatar Choices Thumbnails
    const avatarChoices = document.getElementById('avatar-choices');
    avatarChoices.innerHTML = '';
    const avatars = ['kiem-khach', 'tu-si', 'am-duong-su', 'han-si', 'thich-khach', 'lanh-han', 'thanh-van', 'da-nguyet'];
    avatars.forEach(av => {
      const canvas = document.createElement('canvas');
      canvas.width = 44;
      canvas.height = 44;
      canvas.className = `avatar-choice-thumb ${av === this.createAvatar ? 'active' : ''}`;
      canvas.setAttribute('data-avatar', av);
      PixelRenderer.drawAvatar(canvas, av);
      canvas.addEventListener('click', () => {
        sound.playClick();
        document.querySelectorAll('.avatar-choice-thumb').forEach(c => c.classList.remove('active'));
        canvas.classList.add('active');
        this.createAvatar = av;
      });
      avatarChoices.appendChild(canvas);
    });

    // 2. Class Selection Cards
    document.querySelectorAll('#create-class-picker .class-card').forEach(card => {
      card.classList.toggle('active', card.getAttribute('data-class') === this.createClass);
      card.onclick = () => {
        sound.playClick();
        document.querySelectorAll('#create-class-picker .class-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        this.createClass = card.getAttribute('data-class');
        this.updateAllocUI();
      };
    });

    // 3. Background Selection Cards
    document.querySelectorAll('#create-bg-picker .bg-card').forEach(card => {
      card.classList.toggle('active', card.getAttribute('data-bg') === this.createBackground);
      card.onclick = () => {
        sound.playClick();
        document.querySelectorAll('#create-bg-picker .bg-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        this.createBackground = card.getAttribute('data-bg');
        this.updateAllocUI();
      };
    });

    // 4. Stat Allocation Methods Buttons
    const btnPointBuy = document.getElementById('btn-method-pointbuy');
    const btnStandard = document.getElementById('btn-method-standard');
    const btnRoll4d6 = document.getElementById('btn-method-roll4d6');

    const updateMethodButtons = (activeBtn) => {
      [btnPointBuy, btnStandard, btnRoll4d6].forEach(b => b.classList.remove('active'));
      activeBtn.classList.add('active');
    };

    btnPointBuy.onclick = () => {
      sound.playClick();
      this.createMethod = 'pointbuy';
      this.createBaseStats = { STR: 14, AGI: 14, CON: 13, INT: 10, WIS: 10, CHA: 8 };
      updateMethodButtons(btnPointBuy);
      this.updateAllocUI();
      this.showToast('Chế độ: Point Buy D&D (27 Điểm Mua)');
    };

    btnStandard.onclick = () => {
      sound.playClick();
      this.createMethod = 'standard';
      // D&D Standard Array [15, 14, 13, 12, 10, 8] according to class
      if (this.createClass === 'kiem-khach') {
        this.createBaseStats = { STR: 15, AGI: 14, CON: 13, INT: 10, WIS: 12, CHA: 8 };
      } else if (this.createClass === 'tu-si') {
        this.createBaseStats = { STR: 14, AGI: 12, CON: 15, INT: 8, WIS: 13, CHA: 10 };
      } else if (this.createClass === 'am-duong-su') {
        this.createBaseStats = { STR: 8, AGI: 13, CON: 12, INT: 15, WIS: 14, CHA: 10 };
      } else if (this.createClass === 'han-si') {
        this.createBaseStats = { STR: 8, AGI: 12, CON: 13, INT: 15, WIS: 10, CHA: 14 };
      } else {
        this.createBaseStats = { STR: 10, AGI: 15, CON: 13, INT: 14, WIS: 12, CHA: 8 };
      }
      updateMethodButtons(btnStandard);
      this.updateAllocUI();
      this.showToast('Đã áp dụng Dãy Số Tiêu Chuẩn D&D (15, 14, 13, 12, 10, 8)!');
    };

    btnRoll4d6.onclick = () => {
      sound.playDiceRoll();
      this.createMethod = 'roll4d6';
      updateMethodButtons(btnRoll4d6);
      ['STR', 'AGI', 'CON', 'INT', 'WIS', 'CHA'].forEach(st => {
        const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
        rolls.sort((a, b) => a - b);
        this.createBaseStats[st] = rolls[1] + rolls[2] + rolls[3];
      });
      this.updateAllocUI();
      this.showToast('🎲 Đã đổ 4d6 (bỏ xúc xắc thấp nhất) cho 6 chỉ số!');
    };

    // 5. Stat Increment / Decrement Buttons
    document.querySelectorAll('.stat-alloc-grid .alloc-btn').forEach(btn => {
      btn.onclick = () => {
        sound.playClick();
        const stat = btn.getAttribute('data-stat');
        const isInc = btn.classList.contains('inc');

        if (this.createMethod === 'pointbuy') {
          const curVal = this.createBaseStats[stat];
          if (isInc && curVal < 15) {
            const nextCost = (POINT_BUY_COST[curVal + 1] || 0) - (POINT_BUY_COST[curVal] || 0);
            const remaining = 27 - this.getPointBuySpent();
            if (remaining >= nextCost) {
              this.createBaseStats[stat] += 1;
            } else {
              this.showToast('Không đủ điểm Point Buy!');
              sound.playFailure();
            }
          } else if (!isInc && curVal > 8) {
            this.createBaseStats[stat] -= 1;
          }
        } else {
          // Free adjustments for rolled or custom stats (range 3 to 18)
          if (isInc && this.createBaseStats[stat] < 18) {
            this.createBaseStats[stat] += 1;
          } else if (!isInc && this.createBaseStats[stat] > 3) {
            this.createBaseStats[stat] -= 1;
          }
        }
        this.updateAllocUI();
      };
    });

    // 6. Confirm Character Creation
    document.getElementById('btn-confirm-character').onclick = () => {
      sound.playSuccess();
      const newName = document.getElementById('create-name').value.trim() || 'Bạch Ngọc Đường';
      const bgDef = BACKGROUND_DEFINITIONS[this.createBackground];

      // Calculate final stats with background bonus
      const finalStats = { ...this.createBaseStats };
      if (bgDef && bgDef.bonusStat) {
        finalStats[bgDef.bonusStat] += 1;
      }

      this.player = new Character({
        name: newName,
        classId: this.createClass,
        backgroundId: this.createBackground,
        avatarId: this.createAvatar,
        stats: finalStats
      });

      // Apply Selected Campaign
      const selectedCamp = getCampaignById(this.createCampaign);
      this.currentCampaign = selectedCamp;
      this.currentChapter = selectedCamp.chapterName;
      this.currentScene = selectedCamp.scene;
      this.chronicle = new ChronicleManager();
      this.chronicle.setCampaign(selectedCamp);
      this.chronicle.addMilestone({
        turn: 1,
        chapter: selectedCamp.chapterName,
        summary: `${this.player.name} (${this.player.className}) cùng ba đồng đội chính thức bắt đầu chiến dịch "${selectedCamp.title}". Mục tiêu: ${selectedCamp.mainObjective}`,
        type: 'major'
      });

      this.turn = 1;
      document.getElementById('modal-char-create').classList.add('hidden');
      this.renderPlayerSheet();
      this.renderHeaderInfo();
      this.renderSceneBanner();
      this.renderDiceSection();

      this.showToast(`✨ Bắt đầu chiến dịch: ${selectedCamp.title}!`);
      sound.playCritSuccess();

      // Initiate tailored opening story with Dungeon Master based on chosen campaign & party
      const compNames = this.party ? this.party.getAll().map(c => c.name).join(', ') : 'Lãnh Hàn, Thanh Vân, Dạ Nguyệt';
      const openingPrompt = `Ta là ${this.player.name}, truyền nhân môn phái ${this.player.className}, xuất thân ${this.player.backgroundName}. Cùng với ba vị đồng đạo ${compNames}, ta chính thức bước vào chiến dịch "${selectedCamp.title}" (${selectedCamp.chapterName}). Bối cảnh: "${selectedCamp.hook}". Mục tiêu chính: "${selectedCamp.mainObjective}". Xin Quản trò (DM) hãy mô tả khởi đầu câu chuyện và đưa ra thử thách xúc xắc đầu tiên!`;
      this.handleUserAction(openingPrompt);
    };

    this.updateAllocUI();
  }

  getPointBuySpent() {
    let spent = 0;
    ['STR', 'AGI', 'CON', 'INT', 'WIS', 'CHA'].forEach(st => {
      const v = this.createBaseStats[st];
      spent += (POINT_BUY_COST[v] !== undefined ? POINT_BUY_COST[v] : 0);
    });
    return spent;
  }

  updateAllocUI() {
    const bgDef = BACKGROUND_DEFINITIONS[this.createBackground];
    const classDef = CLASS_DEFINITIONS[this.createClass];

    ['STR', 'AGI', 'CON', 'INT', 'WIS', 'CHA'].forEach(st => {
      const baseVal = this.createBaseStats[st];
      const bonus = (bgDef && bgDef.bonusStat === st) ? 1 : 0;
      const totalVal = baseVal + bonus;

      document.getElementById(`alloc-${st.toLowerCase()}`).textContent = baseVal;
      const bonusEl = document.getElementById(`bonus-${st.toLowerCase()}`);
      if (bonusEl) bonusEl.textContent = bonus > 0 ? `+${bonus}` : `+0`;

      const mod = Math.floor((totalVal - 10) / 2);
      document.getElementById(`alloc-mod-${st.toLowerCase()}`).textContent = mod >= 0 ? `+${mod}` : `${mod}`;
    });

    // Update Point Buy Pool Tracker
    const poolContainer = document.getElementById('alloc-pool-container');
    const poolPts = document.getElementById('alloc-pool-pts');
    if (this.createMethod === 'pointbuy') {
      poolContainer.style.display = 'flex';
      const spent = this.getPointBuySpent();
      const remaining = 27 - spent;
      poolPts.textContent = `${remaining} / 27`;
      poolPts.style.color = remaining < 0 ? 'var(--red-crimson)' : 'var(--gold-primary)';
    } else {
      poolContainer.style.display = 'none';
    }

    // Live Metrics Preview
    const conBonus = bgDef?.bonusStat === 'CON' ? 1 : 0;
    const conMod = Math.floor(((this.createBaseStats.CON + conBonus) - 10) / 2);
    const bgHpBonus = this.createBackground === 'hoa-thi' ? 3 : 0;
    const calcHp = classDef.hitDie + conMod + bgHpBonus;
    document.getElementById('preview-hp').textContent = Math.max(8, calcHp);

    const agiBonus = bgDef?.bonusStat === 'AGI' ? 1 : 0;
    const agiMod = Math.floor(((this.createBaseStats.AGI + agiBonus) - 10) / 2);
    document.getElementById('preview-ac').textContent = 10 + 2 + agiMod; // Basic Armor + AGI

    const mentalBonus = Math.max(0, Math.floor((this.createBaseStats.INT - 10) / 2) + Math.floor((this.createBaseStats.WIS - 10) / 2));
    document.getElementById('preview-qi').textContent = classDef.baseQi + mentalBonus;

    document.getElementById('preview-gold').textContent = this.createBackground === 'the-gia' ? '75' : '50';
    document.getElementById('preview-weapon').textContent = classDef.starterWeapon;
  }

  // =========================================================================
  // EVENT BINDINGS & MODALS
  // =========================================================================

  bindEvents() {
    // 1. Action Form Submit
    const form = document.getElementById('action-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('action-input');
      this.handleUserAction(input.value);
    });

    // 2. Quick Action Chips
    document.querySelectorAll('.chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const actionText = btn.getAttribute('data-action');
        this.handleUserAction(actionText);
      });
    });

    // 3. Dice Selection Buttons
    document.querySelectorAll('.dice-select-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        sound.playClick();
        document.querySelectorAll('.dice-select-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const dt = btn.getAttribute('data-dice');
        this.diceRoller.setDiceType(dt);
        document.getElementById('active-dice-badge').textContent = dt;
      });
    });

    // 4. Roll Dice Button & Auto Roll DC Button
    document.getElementById('btn-roll-dice').addEventListener('click', () => this.handleDiceRoll());
    document.getElementById('btn-auto-roll-dc').addEventListener('click', () => {
      if (this.activeDC) {
        document.getElementById('select-modifier').value = this.activeDC.stat;
        this.handleDiceRoll();
      }
    });

    // 5. Send Roll to DM Button
    document.getElementById('btn-send-roll-to-dm').addEventListener('click', () => this.sendDiceResultToDM());

    // 6. Direct Stat Card Roll click
    document.querySelectorAll('.stat-card').forEach(card => {
      card.addEventListener('click', () => {
        const stat = card.getAttribute('data-stat');
        document.getElementById('select-modifier').value = stat;
        this.handleDiceRoll();
      });
    });

    // 7. Tabs Switching (Left Column)
    document.querySelectorAll('.pixel-tab-headers .tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        sound.playClick();
        document.querySelectorAll('.pixel-tab-headers .tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const tabId = btn.getAttribute('data-tab');
        document.getElementById(tabId)?.classList.add('active');
      });
    });

    // 8. Inventory Item Use
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-use-item')) {
        if (!this.player) return;
        const id = e.target.getAttribute('data-id');
        const result = this.player.useItem(id);
        this.showToast(result.msg);
        this.renderPlayerSheet();
        if (result.success) {
          this.appendSystemNotice(`Người chơi đã sử dụng đan dược: ${result.msg}`);
        }
      }
    });

    // 9. Skill Casting
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-cast-skill')) {
        if (!this.player) return;
        const id = e.target.getAttribute('data-id');
        const skill = this.player.skills.find(s => s.id === id);
        if (!skill) return;

        if (this.player.spendQi(skill.qiCost)) {
          this.showToast(`Đã thi triển ${skill.name}! (Tiêu hao ${skill.qiCost} Qi)`);
          this.renderPlayerSheet();
          this.handleUserAction(`Ta vận chuyển toàn bộ chân khí, thi triển tuyệt kỹ "${skill.name}"! (${skill.desc})`);
        } else {
          this.showToast('Không đủ Chân Khí (Qi) để thi triển!');
          sound.playFailure();
        }
      }
    });

    // 10. Companion Mini Action Buttons & Party Banter
    document.querySelectorAll('.mini-action-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const compKey = btn.getAttribute('data-companion');
        this.triggerCompanionAction(compKey);
      });
    });
    document.getElementById('btn-party-banter').addEventListener('click', () => this.triggerPartyBanter());

    // 11. Trigger Character Creation Buttons
    document.getElementById('btn-new-character')?.addEventListener('click', () => this.openCharacterCreationWizard(false));
    document.getElementById('btn-trigger-char-create')?.addEventListener('click', () => this.openCharacterCreationWizard(true));

    // 12. Modals setup (Settings & Save)
    this.setupModals();
  }

  setupModals() {
    // Open Settings Modal
    document.getElementById('btn-open-settings').addEventListener('click', () => {
      sound.playClick();
      const cfg = apiClient.getConfig();
      if (cfg.routeMode === 'proxy') {
        const proxyRadio = document.getElementById('route-mode-proxy');
        if (proxyRadio) proxyRadio.checked = true;
      } else {
        const directRadio = document.getElementById('route-mode-direct');
        if (directRadio) directRadio.checked = true;
      }
      document.getElementById('cfg-base-url').value = cfg.baseUrl;
      document.getElementById('cfg-api-key').value = cfg.apiKey;
      document.getElementById('cfg-model-name').value = cfg.model;
      document.getElementById('cfg-temperature').value = cfg.temperature;
      document.getElementById('temp-val').textContent = cfg.temperature;
      document.getElementById('cfg-offline-fallback').checked = cfg.offlineFallback;

      document.getElementById('modal-settings').classList.remove('hidden');
    });

    // Save Settings
    document.getElementById('btn-save-settings').addEventListener('click', () => {
      sound.playClick();
      const routeMode = document.querySelector('input[name="cfg-route-mode"]:checked')?.value || 'proxy';
      apiClient.saveConfig({
        routeMode,
        baseUrl: document.getElementById('cfg-base-url').value,
        apiKey: document.getElementById('cfg-api-key').value,
        model: document.getElementById('cfg-model-name').value,
        temperature: document.getElementById('cfg-temperature').value,
        offlineFallback: document.getElementById('cfg-offline-fallback').checked
      });
      document.getElementById('modal-settings').classList.add('hidden');
      this.showToast('Đã lưu cấu hình 9router thành công!');
    });

    // Test Connection
    document.getElementById('btn-test-connection').addEventListener('click', async () => {
      sound.playClick();
      const resBox = document.getElementById('test-connection-result');
      resBox.className = 'connection-status-box';
      resBox.classList.remove('hidden');
      resBox.innerHTML = '<span class="status-icon">🔄</span> Đang kiểm tra kết nối...';

      const routeMode = document.querySelector('input[name="cfg-route-mode"]:checked')?.value || 'proxy';
      apiClient.saveConfig({
        routeMode,
        baseUrl: document.getElementById('cfg-base-url').value,
        apiKey: document.getElementById('cfg-api-key').value,
        model: document.getElementById('cfg-model-name').value,
        temperature: document.getElementById('cfg-temperature').value,
        offlineFallback: document.getElementById('cfg-offline-fallback').checked
      });

      const res = await apiClient.testConnection();
      if (res.success) {
        resBox.className = 'connection-status-box success';
        resBox.innerHTML = `✅ ${res.msg}`;
        sound.playSuccess();
        const dot = document.getElementById('api-status-dot');
        if (dot) dot.className = 'status-dot-indicator connected';
      } else {
        resBox.className = 'connection-status-box error';
        resBox.innerHTML = `❌ ${res.msg}`;
        sound.playFailure();
        const dot = document.getElementById('api-status-dot');
        if (dot) dot.className = 'status-dot-indicator error';
      }
    });

    // Preset model chips in Settings
    document.querySelectorAll('.preset-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        sound.playClick();
        document.querySelectorAll('.preset-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        document.getElementById('cfg-model-name').value = chip.getAttribute('data-model');
      });
    });

    // Temperature slider display
    document.getElementById('cfg-temperature').addEventListener('input', (e) => {
      document.getElementById('temp-val').textContent = e.target.value;
    });

    // Open Save Modal
    document.getElementById('btn-open-save').addEventListener('click', () => {
      sound.playClick();
      document.getElementById('save-turn-display').textContent = this.turn;
      document.getElementById('modal-save').classList.remove('hidden');
    });

    // Manual Save Button
    document.getElementById('btn-manual-save').addEventListener('click', () => {
      sound.playClick();
      const res = GameStorage.save(this);
      if (res.success) {
        this.showToast(`Đã lưu tiến trình (${res.timestamp})!`);
        document.getElementById('last-saved-time').textContent = res.timestamp;
      }
    });

    // Export Save
    document.getElementById('btn-export-save').addEventListener('click', () => {
      sound.playClick();
      GameStorage.exportJSON(this);
      this.showToast('Đã tải xuống file save game!');
    });

    // Import Save
    document.getElementById('file-import-save').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const data = await GameStorage.importJSON(file);
        this.loadExistingState(data);
        this.renderAll();
        this.showToast('Tải file save thành công!');
        sound.playSuccess();
        document.getElementById('modal-save').classList.add('hidden');
      } catch (err) {
        this.showToast(`Lỗi nhập file: ${err.message}`);
        sound.playFailure();
      }
    });

    // Reset Game
    document.getElementById('btn-reset-game').addEventListener('click', () => {
      if (confirm('Bạn có chắc chắn muốn xóa dữ liệu và tạo nhân vật lại từ đầu không?')) {
        GameStorage.clear();
        this.initUncreatedState();
        this.renderAll();
        document.getElementById('modal-save').classList.add('hidden');
        this.showToast('Đã khởi động lại! Hãy tạo nhân vật D&D mới.');
        sound.playSuccess();
        this.openCharacterCreationWizard(true);
      }
    });

    // Open Chronicle Modal
    document.getElementById('btn-open-chronicle')?.addEventListener('click', () => {
      sound.playClick();
      this.renderChronicleModal();
      document.getElementById('modal-chronicle')?.classList.remove('hidden');
    });

    // Chronicle Modal Tab Switching
    document.querySelectorAll('#modal-chronicle .pixel-tab-headers .tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        sound.playClick();
        document.querySelectorAll('#modal-chronicle .pixel-tab-headers .tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('#modal-chronicle .tab-pane').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const tabId = btn.getAttribute('data-tab');
        document.getElementById(tabId)?.classList.add('active');
      });
    });

    // Open Party Management Modal
    document.getElementById('btn-manage-party')?.addEventListener('click', () => {
      this.openPartyModal();
    });

    // Generate Random Companion
    document.getElementById('btn-gen-random-comp')?.addEventListener('click', () => {
      if (!this.party) return;
      sound.playDiceRoll();
      const comp = this.party.addRandomCompanion();
      this.renderPartyModalRoster();
      this.showToast(`🎲 Đã chiêu mộ ngẫu nhiên: ${comp.name} (${comp.class})!`);
    });

    // Toggle Custom Companion Form
    document.getElementById('btn-toggle-custom-form')?.addEventListener('click', () => {
      sound.playClick();
      const form = document.getElementById('custom-companion-form');
      form?.classList.toggle('hidden');
    });

    document.getElementById('btn-cancel-custom-comp')?.addEventListener('click', () => {
      sound.playClick();
      document.getElementById('custom-companion-form')?.classList.add('hidden');
    });

    // Save Custom Companion
    document.getElementById('btn-save-custom-comp')?.addEventListener('click', () => {
      sound.playClick();
      const name = document.getElementById('new-comp-name')?.value.trim();
      const title = document.getElementById('new-comp-title')?.value.trim() || 'Giang Hồ Hiệp Sĩ';
      const cls = document.getElementById('new-comp-class')?.value || 'Kiếm Khách';
      const av = document.getElementById('new-comp-avatar')?.value || 'kiem-khach';
      const move = document.getElementById('new-comp-move')?.value.trim() || 'Tuyệt Kỹ Gia Truyền';
      const formula = document.getElementById('new-comp-formula')?.value.trim() || '1d10+3';
      const quote = document.getElementById('new-comp-quote')?.value.trim() || 'Ta vì nghĩa hiệp mà đến.';

      if (!name) {
        this.showToast('Vui lòng nhập họ tên cho đồng đội mới!');
        return;
      }

      const newComp = {
        id: `custom-comp-${Date.now()}`,
        name,
        title,
        class: cls,
        avatarId: av,
        maxHp: 26,
        hp: 26,
        stats: { STR: 14, AGI: 14, CON: 14, INT: 12, WIS: 12, CHA: 10 },
        quote,
        signatureMove: {
          name: move,
          dice: formula,
          desc: `${name} thi triển ${move} uy lực phi phàm!`
        },
        banterResponses: [
          `Có ${name} ta ở đây, chư vị cứ yên tâm tiến bước.`,
          `Thế trận có biến, hãy cẩn thận phía sau!`,
          `Một đòn vừa rồi... quả là mở rộng tầm mắt!`
        ]
      };

      this.party.addCompanion(newComp);
      if (this.tempSelectedParty && this.tempSelectedParty.length < 3) {
        this.tempSelectedParty.push(newComp.id);
      }
      this.renderPartyModalRoster();
      document.getElementById('custom-companion-form')?.classList.add('hidden');
      sound.playSuccess();
      this.showToast(`✨ Đã thêm ${name} vào danh sách đồng đội!`);

      // Reset form fields
      if (document.getElementById('new-comp-name')) document.getElementById('new-comp-name').value = '';
      if (document.getElementById('new-comp-title')) document.getElementById('new-comp-title').value = '';
      if (document.getElementById('new-comp-move')) document.getElementById('new-comp-move').value = '';
      if (document.getElementById('new-comp-formula')) document.getElementById('new-comp-formula').value = '';
      if (document.getElementById('new-comp-quote')) document.getElementById('new-comp-quote').value = '';
    });

    // Save Party Selection Button
    document.getElementById('btn-save-party-selection')?.addEventListener('click', () => {
      sound.playClick();
      if (!this.tempSelectedParty || this.tempSelectedParty.length !== 3) {
        this.showToast('Vui lòng chọn đúng 3 đồng đội xuất trận!');
        return;
      }

      this.party.setActiveParty(this.tempSelectedParty);
      this.renderParty();
      GameStorage.save(this);
      document.getElementById('modal-party-manage')?.classList.add('hidden');
      sound.playCritSuccess();
      const compNames = this.party.getAll().map(c => c.name).join(', ');
      this.showToast(`Đội hình xuất trận mới: ${compNames}!`);
    });

    // Universal Close Modal buttons
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        sound.playClick();
        const targetId = btn.getAttribute('data-close');
        if (targetId === 'modal-char-create' && !this.player) {
          this.showToast('Bạn cần hoàn thành khởi tạo nhân vật để bắt đầu!');
          return;
        }
        document.getElementById(targetId)?.classList.add('hidden');
      });
    });
  }

  openPartyModal() {
    if (!this.party) return;
    sound.playClick();
    this.tempSelectedParty = [...this.party.activeIds];
    this.renderPartyModalRoster();
    document.getElementById('custom-companion-form')?.classList.add('hidden');
    document.getElementById('modal-party-manage')?.classList.remove('hidden');
  }

  renderPartyModalRoster() {
    const list = document.getElementById('party-roster-list');
    const countEl = document.getElementById('party-selected-count');
    if (!list || !this.party) return;

    if (countEl) {
      countEl.textContent = `${this.tempSelectedParty.length} / 3 Người`;
      countEl.style.color = this.tempSelectedParty.length === 3 ? 'var(--gold-accent)' : 'var(--red-crimson)';
    }

    const roster = this.party.getFullRoster();
    list.innerHTML = roster.map(comp => {
      const isSelected = this.tempSelectedParty.includes(comp.id);
      return `
        <div class="roster-card ${isSelected ? 'active' : ''}" data-id="${comp.id}">
          <div class="roster-card-top">
            <canvas class="roster-avatar-canvas" id="roster-av-${comp.id}" width="40" height="40"></canvas>
            <div class="roster-info">
              <div class="roster-name">${comp.name}</div>
              <div class="roster-class">${comp.class} • ${comp.title}</div>
              <div class="roster-title">"${comp.quote}"</div>
            </div>
          </div>
          <div class="roster-move">
            ⚡ <strong>${comp.signatureMove.name}:</strong> ${comp.signatureMove.dice}
          </div>
          <div class="roster-stats-row">
            <span>STR ${comp.stats.STR}</span>
            <span>AGI ${comp.stats.AGI}</span>
            <span>CON ${comp.stats.CON}</span>
            <span>INT ${comp.stats.INT}</span>
            <span>WIS ${comp.stats.WIS}</span>
            <span>CHA ${comp.stats.CHA}</span>
          </div>
          <div class="roster-card-bottom">
            <span style="font-size: 10px; color: ${isSelected ? 'var(--gold-accent)' : 'var(--text-muted)'};">
              ${isSelected ? '★ ĐANG XUẤT TRẬN' : 'Dự bị'}
            </span>
            <button type="button" class="btn-toggle-active-party ${isSelected ? 'selected' : ''}" data-id="${comp.id}">
              ${isSelected ? '✔ ĐÃ CHỌN' : '+ CHỌN'}
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Draw avatars on canvases
    roster.forEach(comp => {
      const cv = document.getElementById(`roster-av-${comp.id}`);
      if (cv) {
        PixelRenderer.drawAvatar(cv, comp.avatarId || 'lanh-han');
      }
    });

    // Bind selection toggle buttons
    list.querySelectorAll('.btn-toggle-active-party').forEach(btn => {
      btn.onclick = () => {
        sound.playClick();
        const compId = btn.getAttribute('data-id');
        const idx = this.tempSelectedParty.indexOf(compId);
        if (idx !== -1) {
          if (this.tempSelectedParty.length <= 1) {
            this.showToast('Phải giữ lại ít nhất 1 đồng đội xuất trận!');
            return;
          }
          this.tempSelectedParty.splice(idx, 1);
        } else {
          if (this.tempSelectedParty.length >= 3) {
            this.showToast('Đã đủ 3 đồng đội xuất trận! Hãy bỏ bớt 1 người để thay thế.');
            return;
          }
          this.tempSelectedParty.push(compId);
        }
        this.renderPartyModalRoster();
      };
    });
  }

  renderChronicleModal() {
    if (!this.chronicle) return;
    const camp = this.currentCampaign || getCampaignById(this.chronicle.campaignId);

    // Banner Info
    const iconEl = document.getElementById('chronicle-camp-icon');
    const titleEl = document.getElementById('chronicle-camp-title');
    const goalEl = document.getElementById('chronicle-camp-goal');
    if (iconEl) iconEl.textContent = camp.icon || '🏮';
    if (titleEl) titleEl.textContent = camp.title || this.chronicle.campaignTitle;
    if (goalEl) goalEl.textContent = `🎯 Mục tiêu cốt lõi: ${camp.mainObjective || this.chronicle.mainObjective}`;

    // 1. Milestones Timeline
    const timeList = document.getElementById('chronicle-timeline-list');
    if (timeList) {
      if (this.chronicle.milestones.length === 0) {
        timeList.innerHTML = '<div style="color: var(--text-muted); padding: 14px; text-align: center; font-size: 11px;">Chưa có mốc sự kiện nào được ghi chép. Hành trình vừa mới bắt đầu!</div>';
      } else {
        timeList.innerHTML = this.chronicle.milestones.map(m => `
          <div class="milestone-item">
            <div class="milestone-header">
              <span class="milestone-tag">📍 LƯỢT ${m.turn} • ${m.chapter}</span>
              <span class="milestone-time">${m.timestamp || ''}</span>
            </div>
            <div class="milestone-summary">${m.summary}</div>
          </div>
        `).join('');
      }
    }

    // 2. Lorebook Entities
    const loreList = document.getElementById('chronicle-lore-list');
    if (loreList) {
      if (this.chronicle.loreJournal.length === 0) {
        loreList.innerHTML = '<div style="color: var(--text-muted); padding: 14px; text-align: center; font-size: 11px;">Chưa phát hiện nhân vật hoặc thế lực đặc biệt nào trong sổ tay thế giới.</div>';
      } else {
        const catMap = { npc: '👤 Nhân Vật', faction: '🚩 Môn Phái', location: '🏯 Địa Danh', artifact: '💎 Bảo Vật' };
        loreList.innerHTML = this.chronicle.loreJournal.map(l => `
          <div class="lore-item">
            <div class="lore-header">
              <span class="lore-name">${l.name}</span>
              <span class="lore-cat-tag">${catMap[l.category] || l.category}</span>
            </div>
            <div class="lore-desc">${l.description}</div>
          </div>
        `).join('');
      }
    }

    // 3. Quests & Oaths
    const qList = document.getElementById('chronicle-quests-list');
    if (qList) {
      if (this.chronicle.quests.length === 0) {
        qList.innerHTML = '<div style="color: var(--text-muted); padding: 14px; text-align: center; font-size: 11px;">Chưa có nhiệm vụ nào được ghi nhận.</div>';
      } else {
        qList.innerHTML = this.chronicle.quests.map(q => `
          <div class="quest-item">
            <div class="quest-header">
              <span class="quest-title">⚔️ ${q.title}</span>
              <span class="quest-status-tag ${q.status}">${q.status === 'completed' ? 'ĐÃ HOÀN THÀNH' : 'ĐANG THỰC HIỆN'}</span>
            </div>
            <div class="quest-desc">${q.description}</div>
          </div>
        `).join('');
      }
    }
  }

  // =========================================================================
  // UTILITIES & HELPERS
  // =========================================================================

  getCurrentTimestamp() {
    return new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }

  showDMTyping(show) {
    const el = document.getElementById('dm-typing-indicator');
    if (show) el.classList.remove('hidden');
    else el.classList.add('hidden');
  }

  showToast(msg) {
    const toast = document.getElementById('retro-toast');
    const txt = document.getElementById('toast-text');
    txt.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 2800);
  }

  appendSystemNotice(text) {
    this.storyLogs.push({
      id: `msg-${Date.now()}`,
      sender: 'SYSTEM',
      senderName: 'HỆ THỐNG',
      type: 'system',
      timestamp: this.getCurrentTimestamp(),
      content: text
    });
    this.renderStoryFeed();
  }

  getStatVietName(stat) {
    const map = {
      STR: 'Sức Mạnh',
      AGI: 'Thân Pháp',
      CON: 'Thể Chất',
      INT: 'Ngộ Tính',
      WIS: 'Thần Thức',
      CHA: 'Mị Lực'
    };
    return map[stat] || stat;
  }

  formatMarkdown(text) {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  }
}

// Start application when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  const app = new GameApp();
  app.init();
  window.__GAME_APP = app;
});
