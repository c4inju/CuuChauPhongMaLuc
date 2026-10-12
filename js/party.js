/**
 * PARTY.JS - AI Party Companions Manager
 * Controls the 3 AI Companions: Lãnh Hàn, Thanh Vân, and Dạ Nguyệt.
 */

import { sound } from './audio.js';

export const COMPANION_DATA = [
  {
    id: 'lanh-han',
    name: 'Lãnh Hàn',
    title: 'Băng Lãnh Kiếm Khách',
    class: 'Kiếm Sĩ Tiên Phong',
    avatarId: 'lanh-han',
    maxHp: 28,
    hp: 28,
    stats: { STR: 16, AGI: 14, CON: 15, INT: 10, WIS: 12, CHA: 8 },
    quote: 'Kiếm chưa thấy máu, chưa thể tra vào bao.',
    signatureMove: {
      name: 'Sương Hàn Nhất Kiếm',
      dice: '1d10+3',
      desc: 'Lãnh Hàn lao vút lên, kiếm khí băng tuyết chém rách phòng ngự mục tiêu!'
    },
    banterResponses: [
      'Có động tĩnh ma khí rất gần. Đừng lùi bước, ta sẽ mở đường.',
      'Kẻ thù phía trước không tầm thường, hãy để thanh kiếm của ta nếm thử bản lĩnh của chúng.',
      'Ngươi cứ việc ra tay, lưng của ngươi đã có kiếm của ta che chắn.'
    ]
  },
  {
    id: 'thanh-van',
    name: 'Thanh Vân',
    title: 'Mao Sơn Đạo Trưởng',
    class: 'Đạo Sĩ Trận Pháp',
    avatarId: 'thanh-van',
    maxHp: 22,
    hp: 22,
    stats: { STR: 10, AGI: 12, CON: 13, INT: 15, WIS: 17, CHA: 12 },
    quote: 'Vạn vật tuần hoàn, chớ manh động phạm nghiệp.',
    signatureMove: {
      name: 'Thái Cực Bát Quái Phù',
      dice: 'Hồi phục 1d8+3 HP & Tịnh Hóa',
      desc: 'Thanh Vân ném ra lá linh phù màu vàng kim, linh quang bao phủ đồng đội hồi sinh lực!'
    },
    banterResponses: [
      'Bần đạo bấm quẻ thấy nơi này âm khí ngút trời, ắt có quỷ vương hoặc thi biến.',
      'Chớ nóng vội. Càn khôn tương khắc, lấy tĩnh chế động mới là thượng sách.',
      'Linh phù hộ thân của ta đã sẵn sàng, các vị đạo hữu an tâm tiến lên.'
    ]
  },
  {
    id: 'da-nguyet',
    name: 'Dạ Nguyệt',
    title: 'Ám Tinh U Linh',
    class: 'Thuật Sĩ Ám Kích',
    avatarId: 'da-nguyet',
    maxHp: 24,
    hp: 24,
    stats: { STR: 11, AGI: 17, CON: 12, INT: 14, WIS: 10, CHA: 16 },
    quote: 'Trong bóng tối, sơ hở của ngươi là mạng sống.',
    signatureMove: {
      name: 'U Hồn Huyết Phi Trâm',
      dice: '2d6+3 (Độc)',
      desc: 'Dạ Nguyệt lướt đi như ảo ảnh, phóng ba cây độc châm xuyên qua tử huyệt đối thủ!'
    },
    banterResponses: [
      'Hì hì, ta đã nhìn thấy điểm yếu dưới nách tên đó rồi. Cần ta đâm một nhát không?',
      'Quán trọ này bốc mùi máu tanh nồng nặc. Chủ quán này... chắc chắn không phải người sống.',
      'Đừng có lỗ mãng thế chứ đội trưởng. Để ta đi vòng qua hông xem có kho báu hay cạm bẫy gì.'
    ]
  }
];

export class PartyManager {
  constructor(initialData = null) {
    if (initialData && Array.isArray(initialData)) {
      this.companions = initialData;
    } else {
      this.companions = JSON.parse(JSON.stringify(COMPANION_DATA));
    }
  }

  getCompanion(id) {
    return this.companions.find(c => c.id === id);
  }

  getAll() {
    return this.companions;
  }

  takeDamage(id, amount) {
    const comp = this.getCompanion(id);
    if (!comp) return;
    comp.hp = Math.max(0, comp.hp - amount);
    sound.playAttack();
    return comp.hp;
  }

  heal(id, amount) {
    const comp = this.getCompanion(id);
    if (!comp) return;
    comp.hp = Math.min(comp.maxHp, comp.hp + amount);
    sound.playMagic();
    return comp.hp;
  }

  // Trigger signature move
  executeAction(id) {
    const comp = this.getCompanion(id);
    if (!comp) return null;

    sound.playAttack();
    return {
      companion: comp,
      actionDesc: comp.signatureMove.desc,
      formula: comp.signatureMove.dice
    };
  }

  // Get contextual banter quote
  getRandomBanter(id = null) {
    const comp = id ? this.getCompanion(id) : this.companions[Math.floor(Math.random() * this.companions.length)];
    if (!comp) return null;

    const quote = comp.banterResponses[Math.floor(Math.random() * comp.banterResponses.length)];
    return {
      companion: comp,
      text: quote
    };
  }

  serialize() {
    return JSON.parse(JSON.stringify(this.companions));
  }
}
