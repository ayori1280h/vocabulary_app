import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

// APIキーをサーバー側の環境変数から取得（クライアント側でアクセスできない）
const API_KEY = process.env.GEMINI_API_KEY || '';

// Gemini AIクライアントの初期化
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Gemini APIを使って単語情報を取得するエンドポイント
 */
export async function POST(request: NextRequest) {
  try {
    // リクエストボディから単語を取得
    const { word } = await request.json();
    
    if (!word) {
      return NextResponse.json(
        { error: '単語が指定されていません' },
        { status: 400 }
      );
    }
    
    // Gemini APIを使用して単語情報を取得
    const model = genAI.getGenerativeModel(
      { model: 'gemini-pro' },
      { apiVersion: 'v1' }
    );
    
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

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // JSONの部分だけを抽出して解析
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: 'レスポンスからJSONデータを抽出できませんでした' },
        { status: 500 }
      );
    }
    
    // 解析したJSONから必要な情報を抽出
    const data = JSON.parse(jsonMatch[0]);
    
    // 例文が配列形式でない場合（examplesがオブジェクト配列でない場合）の対応
    const examples = Array.isArray(data.examples) 
      ? data.examples.map((ex: any) => typeof ex === 'string' ? { example: ex, translation: '' } : ex)
      : [];
    
    // 整形されたデータを返す
    const formattedData = {
      word: data.word || word,
      phonetic: data.phonetic || '',
      partOfSpeech: data.partOfSpeech || '',
      meaning: data.meaning || '',
      examples: examples.map((ex: any) => ex.example),
      examplesTranslation: examples.map((ex: any) => ex.translation),
      etymology: data.etymology || '',
      relatedWords: Array.isArray(data.relatedWords) ? data.relatedWords : []
    };
    
    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Gemini API エラー:', error);
    return NextResponse.json(
      { error: '単語情報の取得に失敗しました' },
      { status: 500 }
    );
  }
} 