import { NextResponse } from 'next/server';
import axios from 'axios';

// サーバー側からアクセスするGemini APIエンドポイント
const GEMINI_API_ENDPOINT = 'http://localhost:3000/api/gemini';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const word = searchParams.get('word');

  if (!word) {
    return NextResponse.json(
      { error: '単語パラメータが必要です' },
      { status: 400 }
    );
  }

  try {
    // Gemini APIリクエストの構築
    const prompt = `
あなたは言語学習アプリケーションの言語AIアシスタントです。
以下の単語またはイディオム「${word}」について、詳細な情報を提供してください。

結果は以下のJSON形式で返してください:
{
  "word": "単語またはイディオム",
  "phonetic": "発音記号 (IPA形式)",
  "partOfSpeech": "品詞(複数ある場合はカンマ区切り)",
  "meaning": "日本語での意味",
  "examples": [
    {
      "example": "英語での例文1",
      "translation": "日本語訳1"
    },
    {
      "example": "英語での例文2",
      "translation": "日本語訳2"
    },
    {
      "example": "英語での例文3",
      "translation": "日本語訳3"
    }
  ],
  "etymology": "語源情報",
  "relatedWords": ["関連語1", "関連語2", "関連語3"]
}

必ず有用な例文を3つ以上含め、各例文には正確な日本語訳をつけてください。
語源情報がわかる場合は追加してください。
JSONフォーマットのみを返し、余分な文章は含めないでください。
`;

    // サーバー側のGemini APIエンドポイントにリクエスト
    const response = await axios.post(GEMINI_API_ENDPOINT, {
      prompt,
      model: 'gemini-1.5-flash'
    });

    // レスポンスからテキストを取得
    const text = response.data.text;

    // JSONの部分だけを抽出して解析
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('レスポンスからJSONデータを抽出できませんでした');
    }

    // 解析したJSONから必要な情報を抽出
    const data = JSON.parse(jsonMatch[0]);
    
    // 例文が配列形式でない場合（examplesがオブジェクト配列でない場合）の対応
    const examples = Array.isArray(data.examples) 
      ? data.examples.map((ex: any) => typeof ex === 'string' ? { example: ex, translation: '' } : ex)
      : [];
    
    // 整形されたデータを返す
    return NextResponse.json({
      word: data.word || word,
      phonetic: data.phonetic || '',
      partOfSpeech: data.partOfSpeech || '',
      meaning: data.meaning || '',
      examples: examples.map((ex: any) => ex.example),
      examplesTranslation: examples.map((ex: any) => ex.translation),
      etymology: data.etymology || '',
      relatedWords: Array.isArray(data.relatedWords) ? data.relatedWords : []
    });
  } catch (error) {
    console.error('AI単語情報取得エラー:', error);
    
    // エラー時のフォールバック対応
    return NextResponse.json(
      { error: 'AI単語情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// APIが利用できない場合のフォールバックデータ
function getFallbackWordInfo(word: string) {
  // 例として一部の単語にはより詳細な情報を設定
  const aiGeneratedData: Record<string, any> = {
    'apple': {
      word: 'apple',
      phonetic: '/ˈæpl/',
      partOfSpeech: 'noun',
      meaning: 'りんご。赤色や緑色の丸い果物で、甘酸っぱい味がする。栄養価が高く、健康によいとされる。',
      examples: [
        'I eat an apple every day to stay healthy.',
        'She prefers green apples over red ones.',
        'The apple pie my grandmother makes is delicious.'
      ],
      examplesTranslation: [
        '健康のために毎日りんごを食べています。',
        '彼女は赤いりんごより緑のりんごを好みます。',
        '祖母が作るアップルパイはとても美味しいです。'
      ],
      etymology: '古英語の「æppel」に由来し、印欧祖語の「*abel-」（果物）が語源とされています。',
      relatedWords: ['fruit', 'orchard', 'cider']
    },
    'book': {
      word: 'book',
      phonetic: '/bʊk/',
      partOfSpeech: 'noun, verb',
      meaning: '本、書籍（複数の紙を綴じて表紙をつけたもの）。また、予約する、記録するという動詞の意味もある。',
      examples: [
        'I\'m reading an interesting book about space exploration.',
        'Please book the restaurant for tonight at 8pm.',
        'He wrote his experiences in a book that became a bestseller.'
      ],
      examplesTranslation: [
        '宇宙探査についての興味深い本を読んでいます。',
        '今夜8時にレストランを予約してください。',
        '彼は自分の経験をベストセラーになった本に書きました。'
      ],
      etymology: '古英語の「bōc」は「樹皮の板」を意味し、初期の書き物が樹皮に記されていたことに由来します。',
      relatedWords: ['read', 'library', 'bookstore', 'publication']
    }
  };
  
  const lowerWord = word.toLowerCase();
  
  if (aiGeneratedData[lowerWord]) {
    return aiGeneratedData[lowerWord];
  }
  
  // 未知の単語の場合は、パターンに基づく生成データを返す
  return {
    word: word,
    phonetic: '',
    partOfSpeech: 'unknown',
    meaning: `${word}は英語の単語で、日本語での意味は現在調査中です。`,
    examples: [
      `The ${word} was something everyone talked about.`,
      `She studied the concept of ${word} in her research.`,
      `Many people don't understand what ${word} really means.`
    ],
    examplesTranslation: [
      `${word}はみんなが話題にしていたものでした。`,
      `彼女は研究の中で${word}の概念を研究しました。`,
      `多くの人は${word}が実際に何を意味するのか理解していません。`
    ],
    etymology: `この単語の語源は様々な言語に由来しています。詳細は追加調査中です。`,
    relatedWords: []
  };
} 