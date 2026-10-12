/**
 * CHRONICLE.JS - Long-Term AI Memory & Story Journal Manager
 * Solves the LLM "Lost in the Middle" & Context Limit Problem by maintaining:
 * 1. Milestones Chronicle (Biên niên sử mốc sự kiện lớn)
 * 2. World Lorebook & Entity Journal (Sổ tay nhân vật, môn phái, địa danh)
 * 3. Quest / Oath Tracker (Nhiệm vụ & Lời thề giang hồ)
 * Generates compact, high-density memory summaries to inject into DM prompts.
 */

export class ChronicleManager {
  constructor(initialData = {}) {
    this.campaignId = initialData.campaignId || 'van-yeu-co-son';
    this.campaignTitle = initialData.campaignTitle || 'Vạn Yêu Cô Sơn: Oán Khí Quán Trọ';
    this.mainObjective = initialData.mainObjective || 'Điều tra bí ẩn tại trạm dịch và hóa giải oán linh.';
    this.milestones = Array.isArray(initialData.milestones) ? initialData.milestones : [];
    this.loreJournal = Array.isArray(initialData.loreJournal) ? initialData.loreJournal : [];
    this.quests = Array.isArray(initialData.quests) ? initialData.quests : [];
  }

  // Set active campaign
  setCampaign(campaign) {
    this.campaignId = campaign.id;
    this.campaignTitle = campaign.title;
    this.mainObjective = campaign.mainObjective;
    if (this.quests.length === 0) {
      this.quests.push({
        id: `quest-main-${Date.now()}`,
        title: campaign.title,
        description: campaign.mainObjective,
        status: 'in_progress'
      });
    }
  }

  // Add an important story milestone
  addMilestone({ turn = 1, chapter = '', title = '', summary = '', type = 'major' }) {
    if (!summary) return;
    // Avoid exact duplicate summaries
    const exists = this.milestones.some(m => m.summary.trim() === summary.trim());
    if (exists) return;

    this.milestones.push({
      id: `ms-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      turn,
      chapter: chapter || 'Diễn biến giang hồ',
      title: title || `Mốc sự kiện (Lượt ${turn})`,
      summary: summary.trim(),
      type, // 'major' | 'combat' | 'lore' | 'quest'
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    });
  }

  // Add or update an entity in the Lorebook
  addOrUpdateLore({ name, category = 'npc', description = '', attitude = 'neutral' }) {
    if (!name || !description) return;
    const cleanName = name.trim();
    const existing = this.loreJournal.find(l => l.name.toLowerCase() === cleanName.toLowerCase());
    if (existing) {
      existing.description = description.trim();
      if (attitude) existing.attitude = attitude;
    } else {
      this.loreJournal.push({
        id: `lore-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: cleanName,
        category, // 'npc' | 'faction' | 'location' | 'artifact'
        description: description.trim(),
        attitude
      });
    }
  }

  // Update Quest status
  updateQuest({ title, description, status = 'in_progress' }) {
    if (!title) return;
    const existing = this.quests.find(q => q.title.toLowerCase() === title.trim().toLowerCase());
    if (existing) {
      if (description) existing.description = description;
      existing.status = status;
    } else {
      this.quests.push({
        id: `quest-${Date.now()}`,
        title: title.trim(),
        description: (description || '').trim(),
        status
      });
    }
  }

  // Generate dense, token-efficient memory prompt to inject into DM Agent
  getDenseMemoryPrompt() {
    let memoryStr = `[KÝ ỨC DÀI HẠN & BIÊN NIÊN SỬ (CHRONICLE MEMORY)]:\n`;
    memoryStr += `- Chiến dịch: ${this.campaignTitle}\n`;
    memoryStr += `- Mục tiêu cốt lõi: ${this.mainObjective}\n`;

    // Active Quests
    const activeQuests = this.quests.filter(q => q.status === 'in_progress');
    if (activeQuests.length > 0) {
      memoryStr += `- Nhiệm vụ đang theo đuổi: ${activeQuests.map(q => `"${q.title}" (${q.description})`).join('; ')}\n`;
    }

    // Milestones (take up to 8 most impactful chronological milestones)
    if (this.milestones.length > 0) {
      memoryStr += `\n- CÁC MỐC SỰ KIỆN QUÁ KHỨ ĐÃ QUA:\n`;
      const recentMilestones = this.milestones.slice(-8);
      recentMilestones.forEach(m => {
        memoryStr += `  + [Lượt ${m.turn} | ${m.chapter}]: ${m.summary}\n`;
      });
    }

    // Key Lore Entities (up to 6 entities)
    if (this.loreJournal.length > 0) {
      memoryStr += `\n- NHÂN VẬT & THẾ LỰC ĐÃ GHI NHẬN:\n`;
      const keyEntities = this.loreJournal.slice(-6);
      keyEntities.forEach(e => {
        const catMap = { npc: 'NPC', faction: 'Môn phái', location: 'Địa danh', artifact: 'Bảo vật' };
        memoryStr += `  + ${e.name} (${catMap[e.category] || 'Đối tượng'}): ${e.description}\n`;
      });
    }

    return memoryStr;
  }

  // Parse automatic memory tags from DM Agent reply
  // Format supported:
  // [MILESTONE: Tóm tắt sự kiện]
  // [LORE: Tên | Phân loại | Mô tả]
  // [QUEST: Tiêu đề | in_progress / completed | Mô tả]
  parseMemoryTagsFromResponse(rawText, currentTurn = 1, currentChapter = '') {
    let cleanText = rawText;

    // 1. [MILESTONE: ...]
    const msRegex = /\[MILESTONE:\s*([^\]]+)\]/gi;
    let msMatch;
    while ((msMatch = msRegex.exec(rawText)) !== null) {
      this.addMilestone({
        turn: currentTurn,
        chapter: currentChapter,
        summary: msMatch[1].trim(),
        type: 'major'
      });
    }
    cleanText = cleanText.replace(msRegex, '');

    // 2. [LORE: Name | category | description]
    const loreRegex = /\[LORE:\s*([^\|\]]+)(?:\|\s*([^\|\]]+))?(?:\|\s*([^\]]+))?\]/gi;
    let loreMatch;
    while ((loreMatch = loreRegex.exec(rawText)) !== null) {
      const name = loreMatch[1].trim();
      const cat = (loreMatch[2] || 'npc').trim().toLowerCase();
      const desc = (loreMatch[3] || 'Đối tượng giang hồ đã tương tác').trim();
      this.addOrUpdateLore({ name, category: cat, description: desc });
    }
    cleanText = cleanText.replace(loreRegex, '');

    // 3. [QUEST: Title | status | description]
    const questRegex = /\[QUEST:\s*([^\|\]]+)(?:\|\s*([^\|\]]+))?(?:\|\s*([^\]]+))?\]/gi;
    let qMatch;
    while ((qMatch = questRegex.exec(rawText)) !== null) {
      const title = qMatch[1].trim();
      const status = (qMatch[2] || 'in_progress').trim().toLowerCase();
      const desc = (qMatch[3] || '').trim();
      this.updateQuest({ title, status, description: desc });
    }
    cleanText = cleanText.replace(questRegex, '');

    return cleanText;
  }

  serialize() {
    return {
      campaignId: this.campaignId,
      campaignTitle: this.campaignTitle,
      mainObjective: this.mainObjective,
      milestones: this.milestones,
      loreJournal: this.loreJournal,
      quests: this.quests
    };
  }

  static deserialize(data) {
    return new ChronicleManager(data || {});
  }
}
