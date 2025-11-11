import * as tf from '@tensorflow/tfjs';

/**
 * Vocabulary từ các từ khóa không lành mạnh và các từ thông thường
 * Được sử dụng để tạo feature vector
 */
const VOCABULARY = [
  // Từ không lành mạnh
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
  'fuck',
  'fucking',
  'fucked',
  'fucker',
  'shit',
  'damn',
  'bitch',
  'ass',
  'asshole',
  'bastard',
  'crap',
  'piss',
  'hell',
  'dick',
  'cock',
  'pussy',
  'sex',
  'sexual',
  'sexy',
  'porn',
  'porno',
  'pornography',
  'xxx',
  'nsfw',
  'nude',
  'naked',
  'idiot',
  'stupid',
  'moron',
  'retard',
  'hate',
  'kill',
  'murder',
  'death',
  'drug',
  'suicide',
  'die',
  // Từ thông thường (để tạo context)
  'hello',
  'hi',
  'thanks',
  'thank',
  'you',
  'good',
  'nice',
  'great',
  'like',
  'love',
  'happy',
  'sad',
  'angry',
  'time',
  'day',
  'today',
  'tomorrow',
  'friend',
  'people',
  'think',
  'know',
  'see',
  'look',
  'come',
  'go',
  'get',
  'make',
  'take',
  'give',
  'say',
  'tell',
  'ask',
  'help',
  'work',
  'play',
  'eat',
  'drink',
  'sleep',
  'wake',
  'home',
  'house',
  'car',
  'book',
  'read',
  'write',
  'learn',
  'study',
  'school',
  'work',
  'job',
  'money',
  'buy',
  'sell'
];

const VOCAB_SIZE = VOCABULARY.length;
const MAX_SEQUENCE_LENGTH = 50; // Độ dài tối đa của câu

/**
 * Tạo feature vector từ text sử dụng bag-of-words
 */
function textToVector(text: string): number[] {
  const normalized = normalizeText(text);
  const words = normalized.split(/\s+/);
  const vector = new Array(VOCAB_SIZE).fill(0);

  words.forEach((word) => {
    const index = VOCABULARY.indexOf(word);
    if (index !== -1) {
      vector[index] += 1;
    }
  });

  // Normalize vector
  const sum = vector.reduce((a, b) => a + b, 0);
  if (sum > 0) {
    return vector.map((v) => v / sum);
  }
  return vector;
}

/**
 * Chuẩn hóa text
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Tạo model đơn giản để phân loại nội dung
 */
export function createModel(): tf.Sequential {
  const model = tf.sequential({
    layers: [
      // Input layer
      tf.layers.dense({
        inputShape: [VOCAB_SIZE],
        units: 64,
        activation: 'relu',
        name: 'dense1'
      }),
      tf.layers.dropout({ rate: 0.3 }),
      // Hidden layer
      tf.layers.dense({
        units: 32,
        activation: 'relu',
        name: 'dense2'
      }),
      tf.layers.dropout({ rate: 0.3 }),
      // Output layer (binary classification: 0 = safe, 1 = unsafe)
      tf.layers.dense({
        units: 1,
        activation: 'sigmoid',
        name: 'output'
      })
    ]
  });

  model.compile({
    optimizer: 'adam',
    loss: 'binaryCrossentropy',
    metrics: ['accuracy']
  });

  return model;
}

/**
 * Train model với dữ liệu mẫu
 * Lưu ý: Trong production, nên train model với dataset lớn hơn
 */
export async function trainModel(model: tf.Sequential): Promise<void> {
  // Dữ liệu training mẫu (safe = 0, unsafe = 1)
  const trainingData = [
    // Safe examples - mở rộng dataset
    { text: 'hello how are you', label: 0 },
    { text: 'this is a nice day', label: 0 },
    { text: 'thanks for your help', label: 0 },
    { text: 'i like this post', label: 0 },
    { text: 'great work keep it up', label: 0 },
    { text: 'have a good day', label: 0 },
    { text: 'see you tomorrow', label: 0 },
    { text: 'what do you think', label: 0 },
    { text: 'i love this', label: 0 },
    { text: 'nice to meet you', label: 0 },
    { text: 'that is interesting', label: 0 },
    { text: 'i agree with you', label: 0 },
    { text: 'good morning everyone', label: 0 },
    { text: 'have a nice weekend', label: 0 },
    { text: 'looking forward to it', label: 0 },
    { text: 'thanks for sharing', label: 0 },
    { text: 'this is helpful', label: 0 },
    { text: 'i understand now', label: 0 },
    { text: 'great job on this', label: 0 },
    { text: 'keep up the good work', label: 0 },
    // Edge cases - có thể bị nhầm
    { text: 'kill time', label: 0 }, // "kill time" là an toàn
    { text: 'sex education', label: 0 }, // Context quan trọng
    { text: 'drug store', label: 0 }, // "drug store" là an toàn
    // Unsafe examples
    { text: 'fuck you', label: 1 },
    { text: 'this is shit', label: 1 },
    { text: 'you are an idiot', label: 1 },
    { text: 'dcm you', label: 1 },
    { text: 'kill yourself', label: 1 },
    { text: 'this is porn', label: 1 },
    { text: 'fucking stupid', label: 1 },
    { text: 'damn it', label: 1 },
    { text: 'you bitch', label: 1 },
    { text: 'dkm', label: 1 },
    { text: 'fuck off', label: 1 },
    { text: 'go to hell', label: 1 },
    { text: 'you are stupid', label: 1 },
    { text: 'this is fucking bad', label: 1 },
    { text: 'dcm may', label: 1 },
    { text: 'clmm', label: 1 },
    { text: 'you are a moron', label: 1 },
    { text: 'shut up bitch', label: 1 },
    { text: 'fuck this shit', label: 1 },
    { text: 'damn you', label: 1 }
  ];

  const xs: number[][] = [];
  const ys: number[] = [];

  trainingData.forEach((item) => {
    xs.push(textToVector(item.text));
    ys.push(item.label);
  });

  const xsTensor = tf.tensor2d(xs);
  const ysTensor = tf.tensor2d(ys, [ys.length, 1]);

  await model.fit(xsTensor, ysTensor, {
    epochs: 100,
    batchSize: 8,
    validationSplit: 0.2,
    verbose: 0
  });

  xsTensor.dispose();
  ysTensor.dispose();
}

/**
 * Dự đoán xem nội dung có không lành mạnh không
 * @param model Model đã được train
 * @param text Text cần kiểm tra
 * @returns Probability (0-1) của việc nội dung không lành mạnh
 */
export async function predict(
  model: tf.Sequential,
  text: string
): Promise<number> {
  const vector = textToVector(text);
  const input = tf.tensor2d([vector]);
  const prediction = model.predict(input) as tf.Tensor;
  const value = await prediction.data();
  input.dispose();
  prediction.dispose();
  return value[0];
}

/**
 * Singleton model instance
 */
let modelInstance: tf.Sequential | null = null;
let isModelReady = false;

/**
 * Khởi tạo và train model (chỉ chạy một lần)
 */
export async function initializeModel(): Promise<void> {
  if (isModelReady && modelInstance) {
    return;
  }

  try {
    console.log('🤖 Initializing ML content filter model...');
    modelInstance = createModel();
    await trainModel(modelInstance);
    isModelReady = true;
    console.log('✅ ML model ready');
  } catch (error) {
    console.error('❌ Error initializing ML model:', error);
    // Fallback to rule-based only
    isModelReady = false;
  }
}

/**
 * Kiểm tra nội dung sử dụng ML model
 * @param text Text cần kiểm tra
 * @param threshold Ngưỡng để xác định không lành mạnh (mặc định 0.5)
 * @returns true nếu nội dung không lành mạnh
 */
export async function containsProfanityML(
  text: string,
  threshold: number = 0.5
): Promise<boolean> {
  if (!isModelReady || !modelInstance) {
    // Fallback nếu model chưa sẵn sàng
    return false;
  }

  try {
    const probability = await predict(modelInstance, text);
    return probability >= threshold;
  } catch (error) {
    console.error('Error in ML prediction:', error);
    return false;
  }
}

/**
 * Lấy model instance (nếu cần)
 */
export function getModel(): tf.Sequential | null {
  return modelInstance;
}
