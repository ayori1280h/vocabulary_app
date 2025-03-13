import { VocabularyItem, ProficiencyLevel } from '../models/types';

// APIのベースURL（Next.jsのプロキシAPIを使用）
const API_BASE_URL = '/api/sqlite-proxy';

// SQLite APIクライアント
export class ApiService {
  /**
   * 単語の一覧を取得する
   * @returns Promise<VocabularyItem[]>
   */
  static async getWords(): Promise<VocabularyItem[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/words`);
      if (!response.ok) {
        throw new Error('単語の取得に失敗しました');
      }
      
      const data = await response.json();
      return data.map(this.convertToVocabularyItem);
    } catch (error) {
      console.error('API error:', error);
      throw error;
    }
  }

  /**
   * 特定の単語の詳細を取得する
   * @param id 単語ID
   * @returns Promise<VocabularyItem>
   */
  static async getWordDetails(id: number): Promise<VocabularyItem> {
    try {
      const response = await fetch(`${API_BASE_URL}/words/${id}`);
      if (!response.ok) {
        throw new Error('単語詳細の取得に失敗しました');
      }
      
      const data = await response.json();
      return this.convertToVocabularyItem(data);
    } catch (error) {
      console.error('API error:', error);
      throw error;
    }
  }

  /**
   * 新しい単語を追加する
   * @param word 追加する単語データ
   * @returns Promise<VocabularyItem>
   */
  static async addWord(word: Partial<VocabularyItem>): Promise<VocabularyItem> {
    try {
      const wordData = this.convertFromVocabularyItem(word);
      
      const response = await fetch(`${API_BASE_URL}/words`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(wordData),
      });
      
      if (!response.ok) {
        throw new Error('単語の追加に失敗しました');
      }
      
      const data = await response.json();
      return this.convertToVocabularyItem(data);
    } catch (error) {
      console.error('API error:', error);
      throw error;
    }
  }

  /**
   * 単語の状態を更新する
   * @param id 単語ID
   * @param proficiency 熟練度
   * @returns Promise<VocabularyItem>
   */
  static async updateWordStatus(id: number, proficiency: ProficiencyLevel): Promise<VocabularyItem> {
    try {
      const status = proficiency.toLowerCase();
      
      const response = await fetch(`${API_BASE_URL}/words/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        throw new Error('単語状態の更新に失敗しました');
      }
      
      const data = await response.json();
      return this.convertToVocabularyItem(data);
    } catch (error) {
      console.error('API error:', error);
      throw error;
    }
  }

  /**
   * 単語を削除する
   * @param id 単語ID
   * @returns Promise<void>
   */
  static async deleteWord(id: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/words/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('単語の削除に失敗しました');
      }
    } catch (error) {
      console.error('API error:', error);
      throw error;
    }
  }

  /**
   * 特定の状態の単語を取得する
   * @param proficiency 熟練度
   * @returns Promise<VocabularyItem[]>
   */
  static async getWordsByStatus(proficiency: ProficiencyLevel): Promise<VocabularyItem[]> {
    try {
      const status = proficiency.toLowerCase();
      
      const response = await fetch(`${API_BASE_URL}/words-by-status/${status}`);
      if (!response.ok) {
        throw new Error('単語の取得に失敗しました');
      }
      
      const data = await response.json();
      return data.map(this.convertToVocabularyItem);
    } catch (error) {
      console.error('API error:', error);
      throw error;
    }
  }

  /**
   * 単語を検索する
   * @param searchTerm 検索キーワード
   * @returns Promise<VocabularyItem[]>
   */
  static async searchWords(searchTerm: string): Promise<VocabularyItem[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/search?term=${encodeURIComponent(searchTerm)}`);
      if (!response.ok) {
        throw new Error('単語の検索に失敗しました');
      }
      
      const data = await response.json();
      return data.map(this.convertToVocabularyItem);
    } catch (error) {
      console.error('API error:', error);
      throw error;
    }
  }

  /**
   * ローカルストレージのデータをSQLiteに移行する
   * @param words ローカルストレージの単語データ
   * @returns Promise<any>
   */
  static async migrateData(words: VocabularyItem[]): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/migrate-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ words }),
      });
      
      if (!response.ok) {
        throw new Error('データ移行に失敗しました');
      }
      
      return response.json();
    } catch (error) {
      console.error('API error:', error);
      throw error;
    }
  }

  /**
   * 単語の発音音声URLを取得する
   * @param word 単語
   * @returns Promise<string> 音声ファイルのURL
   */
  static async getPronunciation(word: string): Promise<string> {
    try {
      const response = await fetch(`${API_BASE_URL}/speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: word }),
      });
      
      if (!response.ok) {
        throw new Error('発音の取得に失敗しました');
      }
      
      // Blobとして返却
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('API error:', error);
      throw error;
    }
  }

  /**
   * SQLite DB形式からVocabularyItem形式に変換
   * @param dbItem データベースの単語データ
   * @returns VocabularyItem フロントエンドの単語データ形式
   */
  static convertToVocabularyItem(dbItem: any): VocabularyItem {
    return {
      id: dbItem.id.toString(),
      word: dbItem.word,
      meaning: dbItem.definitions && dbItem.definitions.length > 0 
        ? dbItem.definitions[0].definition : '',
      proficiency: dbItem.status.toUpperCase() as ProficiencyLevel,
      lastReviewed: dbItem.last_reviewed_at ? new Date(dbItem.last_reviewed_at).getTime() : undefined,
      reviewCount: dbItem.review_count || 0,
      phonetic: dbItem.phonetic || '',
      partOfSpeech: dbItem.part_of_speech || '',
      examples: dbItem.examples ? dbItem.examples.map((ex: any) => ex.example) : [],
      examplesTranslation: dbItem.examples ? dbItem.examples.map((ex: any) => ex.translation) : [],
      etymology: dbItem.etymologies && dbItem.etymologies.length > 0 
        ? dbItem.etymologies[0].etymology : '',
      relatedWords: dbItem.related_words ? dbItem.related_words.map((rel: any) => rel.related_word) : [],
      notes: '',
      tags: [],
      createdAt: dbItem.created_at ? new Date(dbItem.created_at).getTime() : Date.now(),
    };
  }

  /**
   * VocabularyItem形式からSQLite DB形式に変換
   * @param item フロントエンドの単語データ
   * @returns SQLite DB形式のデータ
   */
  static convertFromVocabularyItem(item: Partial<VocabularyItem>): any {
    // 例文と翻訳を組み合わせる
    const examples = [];
    if (item.examples && item.examples.length > 0) {
      for (let i = 0; i < item.examples.length; i++) {
        examples.push({
          example: item.examples[i],
          translation: item.examplesTranslation && item.examplesTranslation[i] ? item.examplesTranslation[i] : ''
        });
      }
    }

    return {
      word: item.word,
      phonetic: item.phonetic || '',
      part_of_speech: item.partOfSpeech || '',
      status: item.proficiency ? item.proficiency.toLowerCase() : 'unknown',
      definitions: [{
        definition: item.meaning || '',
        part_of_speech: item.partOfSpeech || ''
      }],
      examples: examples,
      etymologies: item.etymology ? [{
        etymology: item.etymology
      }] : [],
      related_words: item.relatedWords ? item.relatedWords.map(word => ({
        related_word: word,
        relationship_type: ''
      })) : []
    };
  }

  /**
   * 単語詳細情報を更新する
   * @param id 単語ID
   * @param wordDetails 更新する詳細情報
   * @returns Promise<VocabularyItem>
   */
  static async updateWordDetails(id: number, wordDetails: any): Promise<VocabularyItem> {
    try {
      const response = await fetch(`${API_BASE_URL}/words/${id}/details`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(wordDetails),
      });
      
      if (!response.ok) {
        throw new Error('単語詳細の更新に失敗しました');
      }
      
      const data = await response.json();
      return this.convertToVocabularyItem(data);
    } catch (error) {
      console.error('API error:', error);
      throw error;
    }
  }
} 