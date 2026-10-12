/**
 * CAMPAIGNS.JS - Cửu Châu Phong Ma Lục Campaign Registry
 * Provides 4 distinct Asian Fantasy / Wuxia / Xianxia D&D Campaigns
 * with unique storylines, hooks, starter scenes, and primary objectives.
 */

export const CAMPAIGN_DEFINITIONS = [
  {
    id: 'van-yeu-co-son',
    title: 'Vạn Yêu Cô Sơn: Oán Khí Quán Trọ',
    genre: 'Kỳ Án / Ma Đạo / Yêu Ma',
    icon: '🏮',
    scene: 'inn',
    chapterName: 'Hồi 1: Quán Trọ Vong Hồn (Cô Sơn Trạm)',
    shortDesc: 'Điều tra chuỗi vụ mất tích kỳ quái và yêu khí tại trạm dịch biên giới người - yêu.',
    hook: 'Dưới chân Cô Sơn quanh năm mây mù bao phủ, Quán Trọ Vong Hồn là chốn dừng chân duy nhất. Tiếng tỳ bà ai oán trong đêm cùng những vị khách trùm kín đầu báo hiệu một âm mưu ma quái.',
    mainObjective: 'Lật tẩy thân phận thật của chủ quán trọ, tìm tung tích đoàn thương nhân mất tích và hóa giải oán linh.',
    starterPrompt: 'Lanterns flickered as the party stepped inside the eerie Vong Hon Inn at the foot of Co Son mountain...',
    starterSceneTitle: '🏮 QUÁN TRỌ VONG HỒN (CÔ SƠN TRẠM)',
    starterWeather: 'Khí trời: Gió thu lạnh buốt, tà khí vương vấn sau rèm liếp',
    starterDC: { dice: 'd20', target: 12, stat: 'WIS', reason: 'Dò xét sát khí và nhận diện khách lạ khả nghi trong quán trọ' }
  },
  {
    id: 'ma-mon-truc-lam',
    title: 'Rừng Trúc U Tăm: Huyết Kiếm Ma Môn',
    genre: 'Kiếm Hiệp / Phục Kích / Tranh Đoạt Bí Kíp',
    icon: '🎋',
    scene: 'bamboo',
    chapterName: 'Hồi 1: Phục Kích Giữa Trúc Lâm',
    shortDesc: 'Đột phá vòng vây tử sĩ U Minh Các và bảo vệ mảnh tàn kiếm bí truyền của Kiếm Tông.',
    hook: 'Lá trúc xào xạc bay theo làn kiếm khí lạnh lẽo. Nhóm của bạn đang hộ tống hộp gấm chứa bí đồ Ma Môn thì rơi vào trận địa mai phục của thích khách áo đen.',
    mainObjective: 'Phá vỡ Thập Diện Mai Phục Trận, tìm đến Ẩn Cư Kiếm Lư và giải mã tung tích Lạc Hồn Kiếm.',
    starterPrompt: 'Bamboo leaves swirled violently as shadowy assassins leaped from the canopy, drawing dark steel...',
    starterSceneTitle: '🎋 RỪNG TRÚC U TĂM (THẬP DIỆN MA TRẬN)',
    starterWeather: 'Khí trời: Sương độc mờ mịt, tiếng trúc va đập như binh đao',
    starterDC: { dice: 'd20', target: 13, stat: 'AGI', reason: 'Thân pháp lách mình né trận mưa ám khí tẩm độc từ trên ngọn trúc' }
  },
  {
    id: 'co-tran-van-tien',
    title: 'Cổ Trận Di Tích: Thần Binh Viễn Cổ',
    genre: 'Thám Hiểm Cổ Mộ / Trận Pháp / Cơ Quan Cổ Đại',
    icon: '🏛️',
    scene: 'ruins',
    chapterName: 'Hồi 1: Bước Vào Di Tích Vạn Tiên',
    shortDesc: 'Khảo sát tàn tích tông môn vạn năm dưới lòng đất, giải mã cơ quan và đánh bại thạch thú canh cổng.',
    hook: 'Cánh cổng đá vĩ đại khắc đầy kim văn cổ vừa hé mở sau địa chấn. Bên trong là điện thờ đổ nát của Vạn Tiên Chủng rực sáng ánh lân tinh và tiếng máy móc cơ quan ngàn năm chuyển động.',
    mainObjective: 'Vượt qua 3 tầng cạm bẫy cổ trận, thu thập 3 Chân Linh Tinh Thạch để kích hoạt Thần Khí Trấn Phái.',
    starterPrompt: 'Dust rained from massive broken pillars as the heavy rune stone doors groaned open into the ancient ruins...',
    starterSceneTitle: '🏛️ TÀN TÍCH MA MÔN (DI TÍCH VẠN TIÊN)',
    starterWeather: 'Khí trời: Bụi đá mịt mù, luồng linh lực thượng cổ cuộn trào',
    starterDC: { dice: 'd20', target: 13, stat: 'INT', reason: 'Phân tích cổ phù văn khắc trên trụ đá để tránh kích hoạt trận bẫy sấm sét' }
  },
  {
    id: 'thien-kiep-phong-ma',
    title: 'Phong Ma Nhai: Huyết Nguyệt Thiên Kiếp',
    genre: 'Tiên Hiệp / Đại Chiến Phong Ma / Nghịch Thiên',
    icon: '⛰️',
    scene: 'cliff',
    chapterName: 'Hồi 1: Sấm Sét Phong Ma Nhai',
    shortDesc: 'Đối mặt cuồng phong và lôi kiếp trên đỉnh vực thẳm trước khi Huyết Nguyệt giải phong ma đầu.',
    hook: 'Trên đỉnh Phong Ma Nhai nghìn trượng, vầng trăng máu khổng lồ chiếu rọi đỉnh băng tuyết. Dây xích huyền thiết trói giữ Ma Tổ đang rung lên bần bật theo từng tiếng sấm rền trời.',
    mainObjective: 'Gia cố 4 Trụ Phong Ma trước canh ba và đánh bại Hộ Pháp Ma Đạo đang tìm cách chặt đứt xiềng xích.',
    starterPrompt: 'Thunder rattled the frozen precipice of Wind Demon Cliff as a blood moon cast sinister crimson light...',
    starterSceneTitle: '⛰️ PHONG MA NHAI (ĐỈNH HUYẾT NGUYỆT)',
    starterWeather: 'Khí trời: Cuồng phong gầm rú, tuyết bay mù mịt quyện cùng lôi hỏa',
    starterDC: { dice: 'd20', target: 14, stat: 'CON', reason: 'Vận chân khí định thân trước luồng kình phong bão tuyết xô ngã xuống vực' }
  }
];

export function getCampaignById(id) {
  return CAMPAIGN_DEFINITIONS.find(c => c.id === id) || CAMPAIGN_DEFINITIONS[0];
}

export function getRandomCampaign() {
  const idx = Math.floor(Math.random() * CAMPAIGN_DEFINITIONS.length);
  return CAMPAIGN_DEFINITIONS[idx];
}
