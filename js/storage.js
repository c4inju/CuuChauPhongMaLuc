/**
 * STORAGE.JS - LocalStorage Persistence & Save File Export/Import
 */

const STORAGE_KEY = 'dnd_asian_rpg_save_v1';

export const GameStorage = {
  save(gameState) {
    try {
      const data = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        turn: gameState.turn || 1,
        chapter: gameState.chapter || 'Hồi 1: Quán Trọ Vong Hồn',
        scene: gameState.scene || 'inn',
        campaign: gameState.currentCampaign || null,
        chronicle: gameState.chronicle ? gameState.chronicle.serialize() : null,
        player: gameState.player ? gameState.player.serialize() : null,
        party: gameState.party ? gameState.party.serialize() : null,
        storyLogs: gameState.storyLogs || [],
        diceHistory: gameState.diceHistory || []
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return { success: true, timestamp: new Date().toLocaleTimeString('vi-VN') };
    } catch (err) {
      console.error('Save failed:', err);
      return { success: false, error: err.message };
    }
  },

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (err) {
      console.error('Load failed:', err);
      return null;
    }
  },

  clear() {
    localStorage.removeItem(STORAGE_KEY);
  },

  exportJSON(gameState) {
    const data = this.save(gameState);
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const blob = new Blob([raw], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cuu-chau-dnd-save-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  importJSON(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target.result);
          if (!parsed.player || !parsed.storyLogs) {
            throw new Error('Dữ liệu file save không đúng định dạng!');
          }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
          resolve(parsed);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Không thể đọc file!'));
      reader.readAsText(file);
    });
  }
};
