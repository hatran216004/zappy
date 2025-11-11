/**
 * Danh sách từ khóa không lành mạnh, tục tĩu, hoặc nội dung 18+
 * Có thể mở rộng thêm từ khóa khi cần
 */
const PROFANITY_WORDS = [
  // Từ tục tĩu tiếng Việt (viết dưới dạng không dấu để dễ so sánh)
  'dcm',
  'dkm',
  'clmm',
  'clgt',
  'vl',
  'dm',
  'cl',
  'djtme',
  'djt',
  'dcmm',
  'dcmmme',
  'cc',
  'dit',
  'ditme',
  'ditmay',
  'ditcu',
  // Từ tục tĩu tiếng Anh
  'fuck',
  'fucking',
  'fucked',
  'fucker',
  'fuckin',
  'fucks',
  'shit',
  'shitting',
  'shitted',
  'shitter',
  'shits',
  'damn',
  'damned',
  'damning',
  'damns',
  'bitch',
  'bitches',
  'bitching',
  'bitched',
  'ass',
  'asses',
  'asshole',
  'assholes',
  'bastard',
  'bastards',
  'crap',
  'crappy',
  'craps',
  'piss',
  'pissing',
  'pissed',
  'pisses',
  'hell',
  'hells',
  'dick',
  'dicks',
  'cock',
  'cocks',
  'pussy',
  'pussies',
  // Nội dung 18+
  'sex',
  'sexual',
  'sexy',
  'porn',
  'porno',
  'pornography',
  'xxx',
  'nsfw',
  'adult',
  'erotic',
  'erotica',
  'nude',
  'nudes',
  'naked',
  'nudity',
  // Từ khác không phù hợp
  'idiot',
  'stupid',
  'moron',
  'retard',
  'retarded',
  'hate',
  'killing',
  'kill',
  'murder',
  'death',
  'drug',
  'drugs',
  'cocaine',
  'heroin',
  'marijuana',
  'suicide',
  'kill yourself',
  'die',
  'kys'
];

/**
 * Chuẩn hóa chuỗi để so sánh (bỏ dấu, chuyển lowercase)
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Bỏ dấu tiếng Việt
    .replace(/[^\w\s]/g, ' ') // Bỏ ký tự đặc biệt
    .replace(/\s+/g, ' ') // Chuẩn hóa khoảng trắng
    .trim();
}

/**
 * Kiểm tra xem nội dung có chứa từ khóa không lành mạnh không
 * @param content Nội dung cần kiểm tra
 * @returns true nếu có từ khóa không lành mạnh, false nếu không
 */
export function containsProfanity(content: string): boolean {
  if (!content || content.trim().length === 0) {
    return false;
  }

  const normalizedContent = normalizeText(content);
  const words = normalizedContent.split(/\s+/);

  // Kiểm tra từng từ trong danh sách
  for (const word of words) {
    if (
      PROFANITY_WORDS.some((profanity) => {
        // So sánh chính xác hoặc chứa từ khóa
        return (
          word === profanity ||
          word.includes(profanity) ||
          profanity.includes(word)
        );
      })
    ) {
      return true;
    }
  }

  // Kiểm tra cụm từ (để bắt các cụm từ như "fuck you", "kill yourself")
  for (const profanity of PROFANITY_WORDS) {
    if (normalizedContent.includes(profanity)) {
      return true;
    }
  }

  return false;
}

/**
 * Validate nội dung comment (kết hợp rule-based và ML)
 * @param content Nội dung cần validate
 * @returns Object với isValid và errorMessage
 */
export async function validateCommentContent(content: string): Promise<{
  isValid: boolean;
  errorMessage?: string;
}> {
  if (!content || content.trim().length === 0) {
    return {
      isValid: false,
      errorMessage: 'Nội dung comment không được để trống'
    };
  }

  if (content.trim().length < 2) {
    return {
      isValid: false,
      errorMessage: 'Nội dung comment quá ngắn'
    };
  }

  // Kiểm tra rule-based trước (nhanh hơn)
  if (containsProfanity(content)) {
    return {
      isValid: false,
      errorMessage:
        'Nội dung comment chứa từ ngữ không phù hợp. Vui lòng sử dụng ngôn ngữ lành mạnh.'
    };
  }

  // Kiểm tra bằng ML (để bắt các trường hợp phức tạp hơn)
  try {
    const { containsProfanityML } = await import('./mlContentFilter');
    const isUnsafe = await containsProfanityML(content, 0.6); // Threshold 0.6

    if (isUnsafe) {
      return {
        isValid: false,
        errorMessage:
          'Nội dung comment không phù hợp. Vui lòng sử dụng ngôn ngữ lành mạnh.'
      };
    }
  } catch (error) {
    // Nếu ML model chưa sẵn sàng, chỉ dùng rule-based
    console.warn('ML model not available, using rule-based only:', error);
  }

  return { isValid: true };
}
