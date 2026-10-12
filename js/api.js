/**
 * API.JS - 9router Custom OpenAI-Compatible Integration
 * Connects to 9router proxy (via internal proxy or direct http://127.0.0.1:20128/v1),
 * manages DM & Companion Agents, and provides an intelligent offline fallback engine.
 */

export const DM_SYSTEM_PROMPT = `Bạn là một Dungeon Master (DM) chuyên nghiệp trong trò chơi D&D lấy bối cảnh Châu Á huyền bí (Thần thoại, Võ hiệp, Tiên hiệp phương Đông).

Quy tắc vận hành:

1. Mô tả bối cảnh sống động, tràn ngập không khí phương Đông (quán trọ trần gian, rừng trúc u tăm, tàn tích ma đạo, linh thú...).
2. Mỗi khi Người chơi hoặc AI Player thực hiện hành động có rủi ro, hãy yêu cầu kiểm tra kỹ năng bằng cách chỉ định loại xí ngầu (thường là d20) và Độ khó (DC).
3. Điều khiển lời thoại và hành động của quái vật, NPC thế giới.
4. Nhận kết quả xúc xắc từ hệ thống web và đưa ra diễn biến tiếp theo (Thành công rực rỡ, Thành công vừa đủ, Thất bại nhẹ, hoặc Thất bại thảm hại).
5. Trả về phản hồi định dạng ngắn gọn, trực quan, dễ đọc trên giao diện Pixel.

ĐẶC BIỆT: Để hệ thống web tự động hiển thị nút kiểm tra xúc xắc, đổi cảnh và lưu ký ức biên niên sử, hãy chèn thẻ lệnh vào cuối phản hồi khi thích hợp:
- Khi cần kiểm tra xúc xắc: [DC_CHECK: d20 | DC: 14 | STAT: AGI | REASON: Tên lý do] (STAT có thể là STR, AGI, CON, INT, WIS, CHA).
- Khi đổi bối cảnh: [SCENE: inn | bamboo | ruins | cliff | TITLE: Tên địa điểm]
- Khi người chơi mất/được máu: [HP_CHANGE: -5] hoặc [EXP_GAIN: 20]
- Khi có bước ngoặt/chiến công lớn cần ghi vào Biên Niên Sử Ký Ức: [MILESTONE: Tóm tắt ngắn gọn 1 câu về sự kiện then chốt]
- Khi có thực thể/môn phái/NPC mới xuất hiện: [LORE: Tên Đối Tượng | npc | Mô tả ngắn gọn]
- Khi cập nhật mục tiêu/nhiệm vụ: [QUEST: Tên nhiệm vụ | in_progress | Mô tả mục tiêu]`;

export class NineRouterClient {
  constructor() {
    this.routeMode = localStorage.getItem('dnd_api_route_mode') || 'proxy'; // 'proxy' | 'direct'
    this.baseUrl = localStorage.getItem('dnd_api_base_url') || 'http://127.0.0.1:20128/v1';
    const savedKey = localStorage.getItem('dnd_api_key');
    this.apiKey = savedKey || '';
    this.model = localStorage.getItem('dnd_api_model') || 'owner';
    this.temperature = parseFloat(localStorage.getItem('dnd_api_temp') || '0.7');
    this.offlineFallback = localStorage.getItem('dnd_api_offline') !== 'false';
    this._isRequestInProgress = false;
  }

  getEffectiveUrl(endpoint = '/chat/completions') {
    if (this.routeMode === 'proxy') {
      return `/proxy/v1${endpoint}`;
    }
    return `${this.baseUrl}${endpoint}`;
  }

  saveConfig({ routeMode, baseUrl, apiKey, model, temperature, offlineFallback }) {
    this.routeMode = routeMode || 'proxy';
    this.baseUrl = (baseUrl || 'http://127.0.0.1:20128/v1').trim().replace(/\/+$/, '');
    this.apiKey = (apiKey || '').trim();
    this.model = (model || 'owner').trim();
    this.temperature = parseFloat(temperature);
    this.offlineFallback = !!offlineFallback;

    localStorage.setItem('dnd_api_route_mode', this.routeMode);
    localStorage.setItem('dnd_api_base_url', this.baseUrl);
    localStorage.setItem('dnd_api_key', this.apiKey);
    localStorage.setItem('dnd_api_model', this.model);
    localStorage.setItem('dnd_api_temp', this.temperature.toString());
    localStorage.setItem('dnd_api_offline', this.offlineFallback.toString());
  }

  getConfig() {
    return {
      routeMode: this.routeMode,
      baseUrl: this.baseUrl,
      apiKey: this.apiKey,
      model: this.model,
      temperature: this.temperature,
      offlineFallback: this.offlineFallback
    };
  }

  // Test connection to 9router
  async testConnection() {
    const targetUrl = this.getEffectiveUrl('/chat/completions');
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const compRes = await fetch(targetUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 10,
          stream: false
        })
      });

      if (compRes.ok) {
        return { success: true, msg: `Kết nối thành công tới 9router model [${this.model}] (${this.routeMode === 'proxy' ? 'qua Proxy /proxy/v1' : 'Direct'})!` };
      }

      const errText = await compRes.text().catch(() => '');
      return {
        success: false,
        msg: `Lỗi phản hồi (${compRes.status}: ${compRes.statusText}) ${errText}`
      };
    } catch (err) {
      const advice = this.routeMode === 'direct'
        ? ' (Mẹo: Hãy chuyển sang chế độ "Qua Local Proxy /proxy/v1" trong Cài Đặt để vượt qua rào cản CORS của trình duyệt!)'
        : ' (Hãy kiểm tra xem 9router đã được bật tại cổng 20128 chưa)';
      return {
        success: false,
        msg: `Không thể kết nối đến ${targetUrl} (${err.message}).${advice}`
      };
    }
  }

  // Send message to Dungeon Master Agent
  async callDMAgent(conversationHistory, contextInfo = {}) {
    if (this._isRequestInProgress) {
      console.warn('Yêu cầu trước đó đang chạy, vui lòng chờ...');
    }
    this._isRequestInProgress = true;

    const formattedMessages = [
      {
        role: 'system',
        content: `${DM_SYSTEM_PROMPT}\n\n[THÔNG TIN NHÂN VẬT]:\n- Tên: ${contextInfo.playerName || 'Vô Danh'}\n- Hệ/Lớp: ${contextInfo.playerClass || 'Kiếm Khách'}\n- Xuất Thân: ${contextInfo.playerBackground || 'Tán Tu Tự Do'}\n- Cảnh Giới: ${contextInfo.playerRealm || 'Luyện Khí Tầng 1'}\n- Khí Huyết (HP): ${contextInfo.playerHp || 20}\n- Chân Khí (Qi): ${contextInfo.playerQi || 14}\n- Đồng đội: Lãnh Hàn (Kiếm Khách), Thanh Vân (Đạo Sĩ), Dạ Nguyệt (Thích Khách).\n\n${contextInfo.chronicleMemory || ''}`
      },
      ...conversationHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))
    ];

    const targetUrl = this.getEffectiveUrl('/chat/completions');

    try {
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream'
      };
      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const response = await fetch(targetUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: this.model,
          messages: formattedMessages,
          temperature: this.temperature,
          max_tokens: 800,
          stream: false
        })
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        throw new Error(`HTTP Error ${response.status}: ${response.statusText} ${errorBody}`);
      }

      const contentType = response.headers.get('content-type') || '';
      let reply = '';

      // Gracefully handle SSE stream if 9router overrides stream: false
      if (contentType.includes('text/event-stream') && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let done = false;
        while (!done) {
          const { value, done: streamDone } = await reader.read();
          done = streamDone;
          if (value) {
            const chunk = decoder.decode(value, { stream: !done });
            const lines = chunk.split('\n');
            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('data:') && !trimmed.includes('[DONE]')) {
                try {
                  const parsed = JSON.parse(trimmed.slice(5).trim());
                  const delta = parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.text || '';
                  reply += delta;
                } catch (e) {}
              }
            }
          }
        }
      } else {
        const json = await response.json();
        reply = json.choices?.[0]?.message?.content || json.choices?.[0]?.text || '';
      }

      this._isRequestInProgress = false;
      return {
        success: true,
        content: reply.trim() || 'Quản trò trầm ngâm chưa đưa ra phản hồi...',
        source: '9router'
      };
    } catch (err) {
      this._isRequestInProgress = false;
      console.warn('9router request failed:', err);
      if (this.offlineFallback) {
        const fallbackReply = this._generateOfflineDMResponse(conversationHistory, contextInfo);
        const advice = this.routeMode === 'direct' ? ' (Khuyên: Bật chế độ "Local Proxy" trong Cài Đặt)' : '';
        return {
          success: true,
          content: fallbackReply,
          source: 'offline_fallback',
          errorNotice: `(Đang dùng DM Nội Bộ do 9router chưa phản hồi: ${err.message}${advice})`
        };
      }
      throw err;
    }
  }

  // Request AI Companion banter or combat action
  async callCompanionAgent(companion, situation) {
    const prompt = `Bạn đang nhập vai vào đồng đội AI "${companion.name}" (${companion.title}, tính cách: "${companion.quote}") trong nhóm phiêu lưu D&D Đông phương.
Tình huống hiện tại: "${situation}".
Hãy đưa ra một câu thoại hoặc hành động ngắn gọn (1-2 câu), thể hiện đúng khí chất của nhân vật.`;

    const targetUrl = this.getEffectiveUrl('/chat/completions');

    try {
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`;

      const res = await fetch(targetUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.8,
          max_tokens: 150,
          stream: false
        })
      });

      if (res.ok) {
        const json = await res.json();
        return json.choices?.[0]?.message?.content || companion.banterResponses[0];
      }
    } catch (e) {
      // Fallback to local quotes
    }

    return companion.banterResponses[Math.floor(Math.random() * companion.banterResponses.length)];
  }

  // Intelligent Offline Story Simulation
  _generateOfflineDMResponse(history, context) {
    const lastUserMsg = [...history].reverse().find(m => m.role === 'user')?.content || '';
    const lower = lastUserMsg.toLowerCase();

    // Opening greeting for new character based on active campaign
    if (lower.includes('bước chân vào giang hồ') || lower.includes('đặt chân tới') || lower.includes('ta là')) {
      const camp = context.campaign || {};
      if (camp.id === 'ma-mon-truc-lam') {
        return `🎋 **HUYẾT KIẾM MA MÔN: PHỤC KÍCH RỪNG TRÚC**\n\nTiếng lá trúc xào xạc bay theo làn kiếm khí lạnh buốt xé toạc màn sương độc. Nhóm của ${context.playerName || 'ngươi'} (${context.playerClass || 'Hiệp Khách'}) vừa đặt chân vào Thập Diện Trúc Lâm thì tiếng dây cung bật vang lách cách!\n\nLãnh Hàn vung kiếm chém đứt ba đạo ám tiễn: *"Có tử sĩ U Minh Các mai phục trên ngọn trúc!"*\nDạ Nguyệt rút song nhận thủ thế: *"Chúng nhắm vào hộp gấm bí đồ Ma Môn!"*\n\nQuản trò yêu cầu kiểm tra Thân Pháp (AGI) để né tránh cơn mưa ám khí:\n\n[DC_CHECK: d20 | DC: 13 | STAT: AGI | REASON: Né trận mưa độc tiễn từ ngọn trúc]\n[SCENE: bamboo | TITLE: Rừng Trúc U Tăm (Thập Diện Trúc Lâm)]\n[MILESTONE: Nhóm chạm trán thích khách U Minh Các tại Rừng Trúc Thập Diện]`;
      }
      if (camp.id === 'co-tran-van-tien') {
        return `🏛️ **DI TÍCH VẠN TIÊN: CỔ TRẬN MỞ KHÓA**\n\nSau cơn chấn động kinh hoàng, cánh cửa đá cổ xưa ngàn năm chầm chậm hé mở. Bụi phong trần bay mù mịt trước mắt ${context.playerName || 'ngươi'} (${context.playerClass || 'Hiệp Khách'}). Trước mặt là điện thờ đổ nát của Vạn Tiên Chủng, nơi những cột đá khắc kim văn cổ phát ra luồng lôi quang màu lam bập bùng.\n\nThanh Vân bấm quyết hộ thể: *"Cơ quan thượng cổ vẫn đang hoạt động, cẩn thận bước chân!"*\n\nQuản trò yêu cầu kiểm tra Ngộ Tính (INT) để giải mã phù văn bảo hộ:\n\n[DC_CHECK: d20 | DC: 13 | STAT: INT | REASON: Phân tích cổ tự phù văn trên phiến đá]\n[SCENE: ruins | TITLE: Tàn Tích Di Tích Vạn Tiên]\n[MILESTONE: Khám phá cửa ngõ điện thờ đổ nát Vạn Tiên Chủng]`;
      }
      if (camp.id === 'thien-kiep-phong-ma') {
        return `⛰️ **PHONG MA NHAI: HUYẾT NGUYỆT THIÊN KIẾP**\n\nTrên đỉnh Phong Ma Nhai nghìn trượng, vầng trăng máu khổng lồ chiếu rọi đỉnh núi tuyết trắng xóa. Sấm sét bổ rách toang màn đêm buốt giá, từng sợi xích huyền thiết trói giữ Ma Tổ đang rung lên bần bật như muốn đứt tung!\n\nLãnh Hàn trầm giọng: *"Huyết nguyệt đã đến đỉnh, phong ấn sắp vỡ!"*\n\nQuản trò yêu cầu kiểm tra Thể Chất (CON) để đứng vững trước luồng cuồng phong lốc tuyết:\n\n[DC_CHECK: d20 | DC: 14 | STAT: CON | REASON: Vận khí định thân trước cuồng phong đỉnh tuyết]\n[SCENE: cliff | TITLE: Phong Ma Nhai (Đỉnh Huyết Nguyệt)]\n[MILESTONE: Tiến vào trận địa phong ấn trên đỉnh Phong Ma Nhai]`;
      }
      // Default: Inn
      return `🏮 **HOÀNG HÔN DƯỚI CHÂN NÚI VẠN YÊU**\n\nMặt trời khuất dần sau dãy Cô Sơn, nhuộm đỏ tầng mây như biển lửa. Gió thu lạnh buốt cuốn từng đợt lá trúc xào xạc trên bậc đá.\n\nTrước mặt ${context.playerName || 'ngươi'} (${context.playerClass || 'Hiệp Khách'}) và nhóm đồng hành là "Quán Trọ Vong Hồn" — trạm dịch duy nhất giữa vùng ranh giới người và yêu. Bên trong quán trọ, tiếng tỳ bà ngân nga lạnh lẽo, phảng phất mùi rượu pha lẫn mùi hương trầm bí ẩn.\n\nLãnh Hàn khẽ siết chuôi kiếm: *"Linh khí nơi này rất bất thường."*\nThanh Vân bấm đốt ngón tay: *"Âm thịnh dương suy, hãy cẩn trọng."*\n\nQuản trò yêu cầu kiểm tra Thần Thức (WIS) để cảm nhận mối nguy đang rình rập:\n\n[DC_CHECK: d20 | DC: 12 | STAT: WIS | REASON: Dò xét dị tượng và sát khí trong quán trọ]\n[SCENE: inn | TITLE: Quán Trọ Vong Hồn (Cô Sơn Trạm)]\n[MILESTONE: Đặt chân tới Quán Trọ Vong Hồn dưới chân núi Cô Sơn]`;
    }

    // Dice result submissions
    if (lower.includes('kết quả xúc xắc') || lower.includes('đổ được') || lower.includes('thành công') || lower.includes('thất bại')) {
      if (lower.includes('đại thành công') || lower.includes('nat 20') || lower.includes('20')) {
        return `🎯 **ĐẠI THÀNH CÔNG RỰC RỠ!**\n\nKhí kình của ${context.playerName || 'ngươi'} bùng nổ như sấm sét xé toạc màn đêm! Đòn thế không chỉ vô hiệu hóa hoàn toàn cạm bẫy mà còn đẩy lùi luồng sát khí đen ngòm, làm lộ ra một rương cổ giấu dưới chân bàn!\n\nLãnh Hàn khẽ nhếch mép gật đầu: *"Đòn vừa rồi... quả không hổ danh bản lĩnh của đạo hữu."*\n\nTừ trong tay áo đối phương rơi ra 25 viên Linh Thạch và 1 bình Bích Ngọc Đan.\n\n[EXP_GAIN: 35]\n[SCENE: inn | TITLE: Quán Trọ Vong Hồn - Giải Mã Bí Ẩn]`;
      }
      if (lower.includes('thất bại')) {
        return `💥 **THẤT BẠI!**\n\nBước chân ngươi lỡ nhịp khi thanh xà gồ mục phát ra tiếng rắc kinh động! Lưỡi độc tiễn từ bóng tối bay vụt qua, sượt qua bờ vai để lại vết thương rát bỏng.\n\nThanh Vân lập tức quát: *"Có kịch độc! Mau né sau bình phong!"*\n\n[HP_CHANGE: -4]\n[DC_CHECK: d20 | DC: 13 | STAT: CON | REASON: Vận khí áp chế độc tính trong kinh mạch]`;
      }
      return `⚔️ **THÀNH CÔNG VỪA ĐỦ!**\n\nNhờ phản xạ bén nhạy, ${context.playerName || 'ngươi'} kịp thời lách mình né tránh hiểm chiêu. Mũi dao cắm phập vào cột gỗ lim kêu vang một tiếng trầm đục.\n\nDạ Nguyệt từ trên xà nhà mỉm cười: *"Sơ hở của hắn lộ ra rồi, bồi thêm một chiêu đi!"*\n\nNgươi định làm gì tiếp theo?`;
    }

    // Combat
    if (lower.includes('tấn công') || lower.includes('chém') || lower.includes('kiếm') || lower.includes('đánh')) {
      return `⚔️ Ngươi vận kình phóng ra luồng kiếm khí chói lòa nhắm thẳng vào bóng đen sau quầy rượu! Kẻ áo đen gầm lên một tiếng quỷ dị, vung đôi thiết trảo chống đỡ!\n\nQuản trò yêu cầu kiểm tra Sức Mạnh (STR) để phân định ưu thế:\n\n[DC_CHECK: d20 | DC: 13 | STAT: STR | REASON: Áp đảo kiếm pháp ma tu]`;
    }

    // Rest
    if (lower.includes('đan dược') || lower.includes('uống') || lower.includes('điều tức') || lower.includes('vận khí')) {
      return `🧘 Ngươi tĩnh tâm ngồi xếp bằng, hít một hơi chân khí dịu mát dung hòa vào đan điền. Linh lực từ từ chảy khắp các huyệt đạo, phục hồi thể lực.\n\n[EXP_GAIN: 10]\nCả nhóm đã sẵn sàng cho bước đi tiếp theo.`;
    }

    // Default narrative progress
    return `🏮 Tiếng gió rít qua rèm liếp. Ngọn nến leo lét trên bàn bỗng đổi sang màu xanh lục ma quái. Từ phía sau vườn trúc, tiếng bước chân nặng nề đang tiến lại gần...\n\nThanh Vân Đạo Trưởng hạ giọng: *"Âm khí đang hội tụ, chuẩn bị đối phó!"*\n\nCác ngươi sẽ làm gì?\n\n[DC_CHECK: d20 | DC: 13 | STAT: AGI | REASON: Ẩn mình hoặc chuẩn bị nghênh chiến]`;
  }
}

export const apiClient = new NineRouterClient();
