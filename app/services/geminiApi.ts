'use client';

import axios from 'axios';

/**
 * 単語情報を取得するためのクライアントAPI
 * サーバー側のAIエンドポイントを呼び出します
 */
export class GeminiApiClient {
  private apiEndpoint = '/api/ai-word-info';

  /**
   * 単語情報を取得する
   * @param word 検索する単語またはイディオム
   * @returns 構造化された単語情報
   */
  async getWordInfo(word: string): Promise<any> {
    try {
      // サーバー側のAIエンドポイントにリクエスト
      const response = await axios.get(this.apiEndpoint, {
        params: { word }
      });
      
      return response.data;
    } catch (error) {
      console.error('Gemini API エラー:', error);
      throw error;
    }
  }
}

// クライアントのインスタンスをエクスポート
export const geminiClient = new GeminiApiClient(); 