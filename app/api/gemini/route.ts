import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// APIキーを環境変数から取得 (サーバー側専用)
const API_KEY = process.env.GEMINI_API_KEY || '';

// Gemini AIクライアントの初期化
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Gemini APIにリクエストを送信するエンドポイント
 */
export async function POST(request: NextRequest) {
  try {
    // リクエストボディからプロンプトとモデル設定を取得
    const body = await request.json();
    const { prompt, model = 'gemini-1.5-flash' } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'プロンプトが指定されていません' },
        { status: 400 }
      );
    }

    // APIキーが設定されていない場合はエラー
    if (!API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API Keyが設定されていません' },
        { status: 500 }
      );
    }

    // Gemini APIモデルを取得
    const geminiModel = genAI.getGenerativeModel({ model });

    // コンテンツ生成リクエスト
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({
      text,
      model,
      success: true
    });
  } catch (error: any) {
    console.error('Gemini API エラー:', error);
    return NextResponse.json(
      { 
        error: 'Gemini APIリクエストに失敗しました', 
        details: error.message || 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 