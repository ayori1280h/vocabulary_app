import { GoogleGenerativeAI } from '@google/generative-ai';

// APIキーを環境変数から取得
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

// Gemini AIクライアントの初期化
export const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * 単語情報を構造化して取得するAPIクライアント
 */
export class GeminiApiClient {
  private model;

  constructor() {
    // v1エンドポイントを明示的に使用するよう設定
    // apiVersionは第2引数のオプションとして渡す必要がある
    this.model = genAI.getGenerativeModel(
      { model: 'gemini-pro' },
      { apiVersion: 'v1' } // v1betaではなくv1を明示的に指定
    );
  }

  /**
   * 単語情報を取得する
   * @param word 検索する単語またはイディオム
   * @returns 構造化された単語情報
   */
  async getWordInfo(word: string): Promise<any> {
    try {
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

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

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
      return {
        word: data.word || word,
        phonetic: data.phonetic || '',
        partOfSpeech: data.partOfSpeech || '',
        meaning: data.meaning || '',
        examples: examples.map((ex: any) => ex.example),
        examplesTranslation: examples.map((ex: any) => ex.translation),
        etymology: data.etymology || '',
        relatedWords: Array.isArray(data.relatedWords) ? data.relatedWords : []
      };
    } catch (error) {
      console.error('Gemini API エラー:', error);
      throw error;
    }
  }
}

// クライアントのインスタンスをエクスポート
export const geminiClient = new GeminiApiClient(); 