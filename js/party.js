/**
 * PARTY.JS - Customizable & Procedural AI Party Companions Manager
 * Supports:
 * 1. Default Roster of 8 distinct Asian Fantasy companions.
 * 2. Procedural random companion generation with D&D 5E stats and martial arts moves.
 * 3. Custom companion creation and active party swapping (pick any 3).
 */

import { sound } from './audio.js';

export const DEFAULT_ROSTER = [
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
      dice: '1d10+3 (Trảm Kích)',
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
      dice: '2d6+3 (Độc Kích)',
      desc: 'Dạ Nguyệt lướt đi như ảo ảnh, phóng ba cây độc châm xuyên qua tử huyệt đối thủ!'
    },
    banterResponses: [
      'Hì hì, ta đã nhìn thấy điểm yếu dưới nách tên đó rồi. Cần ta đâm một nhát không?',
      'Bốc mùi máu tanh nồng nặc. Kẻ đứng sau chắc chắn không phải người sống.',
      'Đừng có lỗ mãng thế chứ đội trưởng. Để ta đi vòng qua hông xem có kho báu hay cạm bẫy gì.'
    ]
  },
  {
    id: 'loi-bang',
    name: 'Lôi Bằng',
    title: 'Kim Cang Cuồng Nộ',
    class: 'Thể Tu Khí Công',
    avatarId: 'tu-si',
    maxHp: 32,
    hp: 32,
    stats: { STR: 17, AGI: 10, CON: 16, INT: 8, WIS: 12, CHA: 11 },
    quote: 'Thân thể ta là sắt nguội, nắm đấm ta là sấm sét!',
    signatureMove: {
      name: 'Bá Vương Khí Công Quyền',
      dice: '1d12+4 (Đập Nát)',
      desc: 'Lôi Bằng dậm chân nứt toác mặt đất, quyền kình màu hoàng kim đập vỡ khiên giáp đối thủ!'
    },
    banterResponses: [
      'Ha ha ha! Lũ tiểu tốt này cứ để nắm đấm của ta dạy dỗ!',
      'Đứng nép sau lưng ta! Tên nào dám bước qua một bước, ta bẻ gãy xương sống tên đó!',
      'Khí huyết đang sôi sục, mau tìm đối thủ xứng tầm cho ta đấu một trận!'
    ]
  },
  {
    id: 'linh-nhi',
    name: 'Linh Nhi',
    title: 'Diệu Thủ Y Tiên',
    class: 'Hàn Sĩ Đan Đạo',
    avatarId: 'han-si',
    maxHp: 20,
    hp: 20,
    stats: { STR: 9, AGI: 13, CON: 12, INT: 16, WIS: 16, CHA: 14 },
    quote: 'Một chén đan trà cứu nhân độ thế, một mũi ngân châm định đoạn sinh tử.',
    signatureMove: {
      name: 'Vạn Mộc Hồi Xuân Điểm Huyệt',
      dice: 'Hồi phục 2d6+4 HP & Tăng Tốc',
      desc: 'Linh Nhi múa tay áo lướt qua, châm bạc điểm khắp kỳ kinh bát mạch làm vết thương khép miệng ngay lập tức!'
    },
    banterResponses: [
      'Đan dược trong hồ lô của muội vẫn còn nhiều, chư vị chớ liều mạng kẻo tổn hao căn cơ.',
      'Khí độc nơi này ăn mòn phổi rất nhanh. Uống viên Thanh Tâm Đan này trước đã!',
      'Có muội ở đây, không ai trong nhóm phải bỏ mạng giữa chốn hoang vu này.'
    ]
  },
  {
    id: 'mac-duc',
    name: 'Mặc Dực',
    title: 'Truy Hồn Xạ Thủ',
    class: 'Thần Xạ Đoạt Mạng',
    avatarId: 'thich-khach',
    maxHp: 22,
    hp: 22,
    stats: { STR: 12, AGI: 18, CON: 13, INT: 12, WIS: 14, CHA: 10 },
    quote: 'Cung tên rời tay, vạn dặm không tiếng động.',
    signatureMove: {
      name: 'Xuyên Vân Thần Tiễn',
      dice: '1d10+4 (Bạo Kích Tầm Xa)',
      desc: 'Mặc Dực kéo căng long cung, mũi tên xé gió tạo thành luồng xoáy chân khí bắn thủng yết hầu mục tiêu từ xa!'
    },
    banterResponses: [
      'Tầm bắn 100 trượng không có kẻ nào thoát được mắt ta.',
      'Cứ dụ chúng ra chỗ đất trống, một phát tiễn của ta là đủ lấy đầu thủ lĩnh.',
      'Gió đang đổi chiều... sát khí từ cự ly xa đang nhắm vào nhóm chúng ta.'
    ]
  }
];

// Procedural Companion Generator Utility
export function generateRandomCompanion() {
  const SURNAMES = ['Sở', 'Tiêu', 'Mộ Dung', 'Diệp', 'Liễu', 'Đoạn', 'Bạch', 'Âu Dương', 'Lục', 'Hàn', 'Tư Mã', 'Nhiễm'];
  const GIVEN_NAMES = ['Nhược Trần', 'Vô Ngân', 'Thanh Phong', 'Thiên Nhai', 'Như Yên', 'Trường Không', 'Ngọc Dao', 'Huyền Chân', 'Bất Phàm', 'Minh Nguyệt', 'Vô Tà', 'Thu Thủy'];
  const TITLES = ['Cuồng Phong Kiếm', 'Ẩn Thế Cao Nhân', 'Ám Dạ Hành Giả', 'Bất Động Minh Vương', 'Diệu Âm Cầm Sư', 'Thần Cơ Diệu Toán', 'Vạn Kiếm Tiên Nhân', 'Huyết Đao Ma Quân'];
  
  const CLASSES = [
    { name: 'Kiếm Khách', hitDie: 10, priStat: 'STR', secStat: 'AGI', avatar: 'kiem-khach', move: 'Nhất Kiếm Đoạt Mệnh (1d10+3)', moveDesc: 'Vung kiếm chém ra luồng kiếm quang sắc bén như sương mai!' },
    { name: 'Đạo Sĩ', hitDie: 8, priStat: 'WIS', secStat: 'INT', avatar: 'am-duong-su', move: 'Thiên Lôi Chấn Phù (2d6+3 Sét)', moveDesc: 'Niệm chú vung phù, một đạo sấm sét giáng thẳng xuống đầu địch!' },
    { name: 'Thích Khách', hitDie: 8, priStat: 'AGI', secStat: 'INT', avatar: 'thich-khach', move: 'Huyết Nhận Ám Sát (2d6+4)', moveDesc: 'Lách mình ra sau bóng tối, đoản đao rạch ngang cổ họng mục tiêu!' },
    { name: 'Thể Tu', hitDie: 12, priStat: 'CON', secStat: 'STR', avatar: 'tu-si', move: 'Bá Vương Toái Thạch (1d12+3)', moveDesc: 'Tụ khí đan điền, nắm đấm giáng xuống như thiên thạch rơi!' },
    { name: 'Hàn Sĩ', hitDie: 8, priStat: 'INT', secStat: 'CHA', avatar: 'han-si', move: 'Hạo Nhiên Chính Khí (Hồi 1d8+3 HP & Tăng Đỡ)', moveDesc: 'Tụng kinh văn hạo nhiên, hào quang hộ thể bao bọc cả nhóm!' }
  ];

  const QUOTES = [
    'Giang hồ hiểm ác, chỉ có bản lĩnh mới quyết định sống còn.',
    'Chính nghĩa trong tâm ta, thanh kiếm trong tay ta.',
    'Chết vì đạo nghĩa, có gì phải hối tiếc?',
    'Kho báu và hiểm nguy luôn đi liền với nhau.',
    'Đừng lo lắng, có ta ở đây bảo bọc chư vị.'
  ];

  const sur = SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
  const giv = GIVEN_NAMES[Math.floor(Math.random() * GIVEN_NAMES.length)];
  const tit = TITLES[Math.floor(Math.random() * TITLES.length)];
  const cls = CLASSES[Math.floor(Math.random() * CLASSES.length)];
  const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];

  // D&D 5E stats roll
  const stats = { STR: 10, AGI: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 };
  stats[cls.priStat] = 16;
  stats[cls.secStat] = 14;
  const otherStats = ['STR', 'AGI', 'CON', 'INT', 'WIS', 'CHA'].filter(s => s !== cls.priStat && s !== cls.secStat);
  const remainingValues = [13, 12, 10, 8];
  otherStats.forEach((st, idx) => {
    stats[st] = remainingValues[idx] || 10;
  });

  const conMod = Math.floor((stats.CON - 10) / 2);
  const hp = Math.max(16, cls.hitDie + conMod + 10);
  const id = `comp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  return {
    id,
    name: `${sur} ${giv}`,
    title: tit,
    class: cls.name,
    avatarId: cls.avatar,
    maxHp: hp,
    hp: hp,
    stats,
    quote,
    signatureMove: {
      name: cls.move.split('(')[0].trim(),
      dice: cls.move,
      desc: `${sur} ${giv} ${cls.moveDesc}`
    },
    banterResponses: [
      `Cứ tiến lên, ${sur} ${giv} ta luôn theo sát phía sau.`,
      `Âm khí nơi này rất nặng, hãy nâng cao cảnh giác.`,
      `Sơ hở của đối phương đã lộ rõ, mau ra tay dứt điểm!`
    ]
  };
}

export class PartyManager {
  constructor(initialData = null) {
    if (initialData && typeof initialData === 'object' && Array.isArray(initialData.active)) {
      this.allRoster = initialData.allRoster || JSON.parse(JSON.stringify(DEFAULT_ROSTER));
      this.activeIds = initialData.active;
    } else if (Array.isArray(initialData)) {
      this.allRoster = JSON.parse(JSON.stringify(initialData));
      this.activeIds = initialData.slice(0, 3).map(c => c.id);
    } else {
      this.allRoster = JSON.parse(JSON.stringify(DEFAULT_ROSTER));
      this.activeIds = ['lanh-han', 'thanh-van', 'da-nguyet'];
    }
  }

  // Get only the active 3 party companions
  getAll() {
    return this.activeIds
      .map(id => this.allRoster.find(c => c.id === id))
      .filter(Boolean);
  }

  // Get full roster in reserve
  getFullRoster() {
    return this.allRoster;
  }

  getCompanion(id) {
    return this.allRoster.find(c => c.id === id);
  }

  // Change active party members (up to 3)
  setActiveParty(ids) {
    if (!Array.isArray(ids) || ids.length === 0) return false;
    this.activeIds = ids.slice(0, 3);
    return true;
  }

  // Add a newly created companion to the roster
  addCompanion(comp) {
    if (!comp || !comp.id) return;
    const exists = this.allRoster.some(c => c.id === comp.id);
    if (!exists) {
      this.allRoster.push(comp);
    }
  }

  // Generate and add a procedural companion
  addRandomCompanion() {
    const comp = generateRandomCompanion();
    this.allRoster.push(comp);
    return comp;
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

  getRandomBanter(id = null) {
    const activeComps = this.getAll();
    const comp = id ? this.getCompanion(id) : activeComps[Math.floor(Math.random() * activeComps.length)];
    if (!comp) return null;

    const quote = comp.banterResponses[Math.floor(Math.random() * comp.banterResponses.length)];
    return {
      companion: comp,
      text: quote
    };
  }

  serialize() {
    return {
      allRoster: this.allRoster,
      active: this.activeIds
    };
  }
}
