/**
 * CHARACTER.JS - Player Character Data Model & Inventory / Skill Mechanics
 * Full D&D 5E Stat Modifiers, Hit Dice, Point Buy, and Backgrounds.
 */

import { sound } from './audio.js';

export const POINT_BUY_COST = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9
};

export const BACKGROUND_DEFINITIONS = {
  'tan-tu': {
    id: 'tan-tu',
    name: 'Tán Tu Tự Do',
    desc: 'Bôn ba giang hồ, độc lai độc vãng. Thân thủ linh hoạt, khả năng sinh tồn cực cao.',
    bonusStat: 'AGI',
    feature: 'Thân Pháp Linh Động (+1 Thân Pháp AGI)'
  },
  'mon-phai': {
    id: 'mon-phai',
    name: 'Đệ Tử Danh Môn',
    desc: 'Được giáo dưỡng trong tông môn lớn, am tường kinh văn, thông tuệ hơn người.',
    bonusStat: 'INT',
    feature: 'Kinh Viện Uy Danh (+1 Ngộ Tính INT)'
  },
  'the-gia': {
    id: 'the-gia',
    name: 'Thế Gia Vọng Tộc',
    desc: 'Xuất thân trâm anh thế phiệt, lời nói uy tín, giàu sang hào sảng.',
    bonusStat: 'CHA',
    feature: 'Kim Tiền Mị Lực (+1 Mị Lực CHA, +25 Linh Thạch)'
  },
  'san-yeu': {
    id: 'san-yeu',
    name: 'Thợ Săn Yêu Ma',
    desc: 'Nhiều năm mai phục săn bắt yêu ma quỷ quái, thần thức cảnh giác cao độ.',
    bonusStat: 'WIS',
    feature: 'Giác Quan Yêu Khí (+1 Thần Thức WIS)'
  },
  'hoa-thi': {
    id: 'hoa-thi',
    name: 'Hỏa Đầu Quân / Thợ Rèn',
    desc: 'Thân thể tôi luyện cùng gang thép lửa đỏ, cơ bắp cuồn cuộn, khí huyết sung mãn.',
    bonusStat: 'CON',
    feature: 'Kim Cương Bì (+1 Thể Chất CON, +3 HP)'
  }
};

export const CLASS_DEFINITIONS = {
  'kiem-khach': {
    id: 'kiem-khach',
    name: 'Kiếm Khách',
    icon: '🗡️',
    realmBase: 'Cửu Kiếm Tông',
    hitDie: 10,
    baseQi: 14,
    defaultStats: { STR: 15, AGI: 14, CON: 13, INT: 12, WIS: 10, CHA: 8 },
    starterWeapon: 'Thanh Phong Cổ Kiếm (1d8+STR)',
    starterArmor: 'Hắc Sa Kiếm Bào (AC 12+AGI)',
    starterTrinket: 'Ngọc Bội Hộ Mệnh',
    skills: [
      { id: 'kiem-1', name: 'Bạt Kiếm Thuật', qiCost: 3, dice: '1d8+STR', desc: 'Rút kiếm chém chớp nhoáng, gây sát thương chém cực nhanh.' },
      { id: 'kiem-2', name: 'Kiếm Khí Tung Hoành', qiCost: 6, dice: '2d6+AGI', desc: 'Phóng kiếm khí tầm xa, phong tỏa kẻ địch.' },
      { id: 'kiem-3', name: 'Vạn Kiếm Quy Tông', qiCost: 10, dice: '3d8+STR', desc: 'Tuyệt chiêu kiếm quyết chém nát ma chướng.' }
    ]
  },
  'tu-si': {
    id: 'tu-si',
    name: 'Tu Sĩ Khí Công',
    icon: '🥋',
    realmBase: 'Kim Cang Thiền Môn',
    hitDie: 12,
    baseQi: 16,
    defaultStats: { STR: 14, AGI: 12, CON: 15, INT: 10, WIS: 14, CHA: 8 },
    starterWeapon: 'Thiết Côn Hàng Ma (1d10+STR)',
    starterArmor: 'Tăng Bào Bất Hoại (AC 13+CON)',
    starterTrinket: 'Bồ Đề Niệm Châu',
    skills: [
      { id: 'tusi-1', name: 'Kim Cương Chưởng', qiCost: 4, dice: '1d10+STR', desc: 'Một chưởng nện xuống như núi thái sơn đè bẹp.' },
      { id: 'tusi-2', name: 'Bất Hoại Thể', qiCost: 5, dice: 'Buff CON', desc: 'Vận chân khí toàn thân, giảm 50% sát thương lượt tới.' },
      { id: 'tusi-3', name: 'Sư Tử Hống', qiCost: 8, dice: '2d6+WIS', desc: 'Hét lớn làm rung chuyển tâm can đối thủ, gây choáng.' }
    ]
  },
  'am-duong-su': {
    id: 'am-duong-su',
    name: 'Âm Dương Sư',
    icon: '☯️',
    realmBase: 'Mao Sơn Đạo Phái',
    hitDie: 6,
    baseQi: 22,
    defaultStats: { STR: 8, AGI: 13, CON: 12, INT: 15, WIS: 15, CHA: 10 },
    starterWeapon: 'Đào Mộc Linh Kiếm (1d6+INT)',
    starterArmor: 'Thái Cực Đạo Bào (AC 11+AGI)',
    starterTrinket: 'Bát Quái Kính Trừ Ma',
    skills: [
      { id: 'ads-1', name: 'Ngũ Lôi Chánh Pháp', qiCost: 4, dice: '2d8+INT', desc: 'Triệu hồi thiên lôi trừng trị yêu ma quỷ quái.' },
      { id: 'ads-2', name: 'Định Thân Phù', qiCost: 4, dice: 'DC WIS', desc: 'Dán bùa phong tỏa hành động của mục tiêu.' },
      { id: 'ads-3', name: 'Thức Thần Triệu Hoán', qiCost: 8, dice: 'Summon', desc: 'Triệu hồi Hắc Bạch Vô Thường phụ chiến.' }
    ]
  },
  'han-si': {
    id: 'han-si',
    name: 'Hàn Sĩ Đan Đạo',
    icon: '📜',
    realmBase: 'Văn Khúc Nho Gia',
    hitDie: 8,
    baseQi: 18,
    defaultStats: { STR: 10, AGI: 12, CON: 13, INT: 15, WIS: 12, CHA: 14 },
    starterWeapon: 'Phán Quan Bút Điểm Huyệt (1d8+INT)',
    starterArmor: 'Nho Sinh Ngũ Sắc Bào (AC 12+AGI)',
    starterTrinket: 'Cổ Đan Lô Tụ Linh',
    skills: [
      { id: 'hansi-1', name: 'Hạo Nhiên Chính Khí', qiCost: 3, dice: '1d8+CHA', desc: 'Lời văn uy nghiêm xua tan ma khí, tăng sĩ khí nhóm.' },
      { id: 'hansi-2', name: 'Châm Cứu Chỉ Huyết', qiCost: 4, dice: 'Heal 2d6', desc: 'Hồi phục sinh lực và chân khí cho đồng đội.' },
      { id: 'hansi-3', name: 'Đan Lôi Bạo Liệt', qiCost: 7, dice: '3d6+INT', desc: 'Ném đan dược phát nổ thiêu đốt trận địa.' }
    ]
  },
  'thich-khach': {
    id: 'thich-khach',
    name: 'Ám Dạ Thích Khách',
    icon: '🥷',
    realmBase: 'Ám Nguyệt Các',
    hitDie: 8,
    baseQi: 16,
    defaultStats: { STR: 10, AGI: 16, CON: 12, INT: 13, WIS: 10, CHA: 12 },
    starterWeapon: 'Hắc Thần Song Chủy Thủ (1d6+AGI)',
    starterArmor: 'Dạ Hành Y (AC 13+AGI)',
    starterTrinket: 'Tị Độc Châu',
    skills: [
      { id: 'thich-1', name: 'Ám Ảnh Nhất Kích', qiCost: 3, dice: '1d6+AGI+2d6 (Ám)', desc: 'Xuất hiện sau lưng chém chí mạng vào chỗ yếu.' },
      { id: 'thich-2', name: 'Mãn Thiên Hoa Vũ', qiCost: 5, dice: '2d8+AGI', desc: 'Phóng hàng loạt phi tiêu tẩm độc phủ đầu.' },
      { id: 'thich-3', name: 'Huyễn Ảnh Phân Thân', qiCost: 6, dice: 'Dodge +5', desc: 'Hóa thành tàn ảnh, né tránh hoàn toàn đòn đánh kế.' }
    ]
  }
};

export class Character {
  constructor(data = {}) {
    this.name = data.name || 'Vô Danh Hiệp';
    this.title = data.title || 'Hiệp Khách';
    this.classId = data.classId || 'kiem-khach';
    this.backgroundId = data.backgroundId || 'tan-tu';
    this.avatarId = data.avatarId || this.classId;
    this.level = data.level || 1;
    this.exp = data.exp || 0;
    this.expToNext = data.expToNext || 100;
    this.cultivationRealm = data.cultivationRealm || 'Luyện Khí Tầng 1';
    this.gold = data.gold ?? (this.backgroundId === 'the-gia' ? 75 : 50);

    const classDef = CLASS_DEFINITIONS[this.classId] || CLASS_DEFINITIONS['kiem-khach'];
    const bgDef = BACKGROUND_DEFINITIONS[this.backgroundId] || BACKGROUND_DEFINITIONS['tan-tu'];

    this.className = classDef.name;
    this.backgroundName = bgDef.name;

    // 6 Core Stats
    this.stats = {
      STR: data.stats?.STR ?? classDef.defaultStats.STR,
      AGI: data.stats?.AGI ?? classDef.defaultStats.AGI,
      CON: data.stats?.CON ?? classDef.defaultStats.CON,
      INT: data.stats?.INT ?? classDef.defaultStats.INT,
      WIS: data.stats?.WIS ?? classDef.defaultStats.WIS,
      CHA: data.stats?.CHA ?? classDef.defaultStats.CHA
    };

    // D&D 5E Level 1 HP: Max Hit Die + CON Modifier (+ background bonus)
    const conMod = Math.floor((this.stats.CON - 10) / 2);
    const bgHpBonus = this.backgroundId === 'hoa-thi' ? 3 : 0;
    const calcMaxHp = classDef.hitDie + conMod + bgHpBonus;
    this.maxHp = data.maxHp || Math.max(8, calcMaxHp);
    this.hp = data.hp ?? this.maxHp;

    // Qi: Base Qi + INT/WIS bonus
    const mentalBonus = Math.max(0, Math.floor((this.stats.INT - 10) / 2) + Math.floor((this.stats.WIS - 10) / 2));
    this.maxQi = data.maxQi || (classDef.baseQi + mentalBonus);
    this.qi = data.qi ?? this.maxQi;

    // Equipment
    this.equipment = data.equipment || {
      weapon: classDef.starterWeapon,
      armor: classDef.starterArmor,
      trinket: classDef.starterTrinket
    };

    // Inventory
    this.inventory = data.inventory || [
      { id: 'item-hoan-hon', name: 'Đại Hoàn Đan', count: 2, icon: '💊', type: 'heal', value: 20, desc: 'Đan dược quý phục hồi 20 HP Khí Huyết.' },
      { id: 'item-tu-khi', name: 'Tụ Khí Tán', count: 3, icon: '🧪', type: 'qi', value: 15, desc: 'Dược dịch ngưng tụ chân khí, hồi phục 15 Qi.' },
      { id: 'item-than-hanh', name: 'Thần Hành Bùa', count: 1, icon: '📜', type: 'buff', stat: 'AGI', value: 5, desc: 'Gia tăng Thân Pháp trong lượt kế.' },
      { id: 'item-bich-ngoc', name: 'Bích Ngọc Giải Độc Đan', count: 1, icon: '🟢', type: 'cure', desc: 'Thanh lọc độc tố ma đạo trong cơ thể.' }
    ];

    // Skills
    this.skills = data.skills || [...classDef.skills];
  }

  // Calculate standard D&D 5E Modifier: floor((score - 10) / 2)
  getModifier(statName) {
    const score = this.stats[statName] ?? 10;
    return Math.floor((score - 10) / 2);
  }

  getModifierFormatted(statName) {
    const mod = this.getModifier(statName);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  }

  takeDamage(amount) {
    const finalAmount = Math.max(1, amount);
    this.hp = Math.max(0, this.hp - finalAmount);
    sound.playAttack();
    return this.hp;
  }

  heal(amount) {
    const prev = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    sound.playMagic();
    return this.hp - prev;
  }

  spendQi(amount) {
    if (this.qi < amount) return false;
    this.qi -= amount;
    return true;
  }

  restoreQi(amount) {
    const prev = this.qi;
    this.qi = Math.min(this.maxQi, this.qi + amount);
    return this.qi - prev;
  }

  addExp(amount) {
    this.exp += amount;
    let leveledUp = false;
    while (this.exp >= this.expToNext) {
      this.exp -= this.expToNext;
      this.level += 1;
      this.expToNext = Math.floor(this.expToNext * 1.5);
      const conMod = Math.floor((this.stats.CON - 10) / 2);
      this.maxHp += Math.max(4, Math.floor(CLASS_DEFINITIONS[this.classId].hitDie / 2) + 1 + conMod);
      this.hp = this.maxHp;
      this.maxQi += 4;
      this.qi = this.maxQi;
      this.updateRealm();
      leveledUp = true;
    }
    if (leveledUp) {
      sound.playCritSuccess();
    }
    return leveledUp;
  }

  updateRealm() {
    const realms = [
      'Phàm Nhân',
      'Luyện Khí Tầng 1', 'Luyện Khí Tầng 2', 'Luyện Khí Tầng 3',
      'Luyện Khí Đại Viên Mãn',
      'Trúc Cơ Sơ Kỳ', 'Trúc Cơ Trung Kỳ', 'Trúc Cơ Đỉnh Phong',
      'Kim Đan Cảnh', 'Nguyên Anh Kỳ'
    ];
    this.cultivationRealm = realms[Math.min(realms.length - 1, this.level)];
  }

  useItem(itemId) {
    const itemIndex = this.inventory.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return { success: false, msg: 'Không tìm thấy vật phẩm!' };

    const item = this.inventory[itemIndex];
    if (item.count <= 0) return { success: false, msg: 'Vật phẩm đã hết!' };

    let msg = '';
    if (item.type === 'heal') {
      const recovered = this.heal(item.value);
      msg = `Đã dùng ${item.name}, hồi phục +${recovered} HP!`;
    } else if (item.type === 'qi') {
      const recovered = this.restoreQi(item.value);
      msg = `Đã dùng ${item.name}, hồi phục +${recovered} Chân Khí (Qi)!`;
    } else {
      msg = `Đã sử dụng ${item.name}!`;
    }

    item.count -= 1;
    if (item.count <= 0) {
      this.inventory.splice(itemIndex, 1);
    }

    return { success: true, msg };
  }

  serialize() {
    return {
      name: this.name,
      title: this.title,
      classId: this.classId,
      backgroundId: this.backgroundId,
      avatarId: this.avatarId,
      level: this.level,
      exp: this.exp,
      expToNext: this.expToNext,
      cultivationRealm: this.cultivationRealm,
      gold: this.gold,
      maxHp: this.maxHp,
      hp: this.hp,
      maxQi: this.maxQi,
      qi: this.qi,
      stats: { ...this.stats },
      equipment: { ...this.equipment },
      inventory: JSON.parse(JSON.stringify(this.inventory)),
      skills: JSON.parse(JSON.stringify(this.skills))
    };
  }

  static deserialize(data) {
    return new Character(data);
  }
}
