import { VocabularyItem, ProficiencyLevel } from '../models/types';
import { ApiService } from './api';

// ローカルストレージキー
const STORAGE_KEY = 'vocabulary_items';

/**
 * ストレージサービス - ローカルストレージとSQLiteの統合管理
 */
export class StorageService {
  private static isUsingSQLite = false;

  /**
   * SQLiteモードに切り替える
   * @param useSQLite SQLiteを使用するかどうか
   */
  static setSQLiteMode(useSQLite: boolean): void {
    this.isUsingSQLite = useSQLite;
  }

  /**
   * SQLiteモードかどうかを取得
   * @returns SQLiteモードかどうか
   */
  static isSQLiteMode(): boolean {
    return this.isUsingSQLite;
  }

  /**
   * ローカルストレージのデータをSQLiteに移行する
   * @returns 移行結果
   */
  static async migrateToSQLite(): Promise<any> {
    try {
      const items = this.getLocalItems();
      const result = await ApiService.migrateData(items);
      
      if (result && result.success > 0) {
        // 移行に成功したらSQLiteモードに切り替え
        this.setSQLiteMode(true);
        
        // 移行完了を保存
        localStorage.setItem('using_sqlite', 'true');
      }
      
      return result;
    } catch (error) {
      console.error('データ移行エラー:', error);
      throw error;
    }
  }

  /**
   * アプリ起動時に使用するデータストレージを決定
   */
  static initializeStorage(): void {
    const usingSQLite = localStorage.getItem('using_sqlite');
    
    if (usingSQLite === 'true') {
      this.setSQLiteMode(true);
    }
  }

  /**
   * すべての単語を取得する
   * @returns Promise<VocabularyItem[]>
   */
  static async getItems(): Promise<VocabularyItem[]> {
    if (this.isUsingSQLite) {
      return ApiService.getWords();
    } else {
      return Promise.resolve(this.getLocalItems());
    }
  }

  /**
   * 単語を追加する
   * @param item 追加する単語データ
   * @returns Promise<VocabularyItem>
   */
  static async addItem(item: Partial<VocabularyItem>): Promise<VocabularyItem> {
    if (this.isUsingSQLite) {
      return ApiService.addWord(item);
    } else {
      const newItem = this.addLocalItem(item);
      return Promise.resolve(newItem);
    }
  }

  /**
   * 単語を更新する
   * @param item 更新する単語データ
   * @returns Promise<VocabularyItem>
   */
  static async updateItem(item: VocabularyItem): Promise<VocabularyItem> {
    if (this.isUsingSQLite) {
      // SQLiteでは単語の状態のみ更新可能
      const id = parseInt(item.id);
      return ApiService.updateWordStatus(id, item.proficiency);
    } else {
      const updatedItem = this.updateLocalItem(item);
      return Promise.resolve(updatedItem);
    }
  }

  /**
   * 単語を削除する
   * @param id 削除する単語のID
   * @returns Promise<void>
   */
  static async deleteItem(id: string): Promise<void> {
    if (this.isUsingSQLite) {
      return ApiService.deleteWord(parseInt(id));
    } else {
      this.deleteLocalItem(id);
      return Promise.resolve();
    }
  }

  /**
   * 特定の状態の単語を取得する
   * @param proficiency 習熟度
   * @returns Promise<VocabularyItem[]>
   */
  static async getItemsByProficiency(proficiency: ProficiencyLevel): Promise<VocabularyItem[]> {
    if (this.isUsingSQLite) {
      return ApiService.getWordsByStatus(proficiency);
    } else {
      const items = this.getLocalItems().filter(item => item.proficiency === proficiency);
      return Promise.resolve(items);
    }
  }

  /**
   * 単語を検索する
   * @param searchTerm 検索キーワード
   * @returns Promise<VocabularyItem[]>
   */
  static async searchItems(searchTerm: string): Promise<VocabularyItem[]> {
    if (this.isUsingSQLite) {
      return ApiService.searchWords(searchTerm);
    } else {
      const term = searchTerm.toLowerCase();
      const items = this.getLocalItems().filter(
        item => item.word.toLowerCase().includes(term) || 
               item.meaning.toLowerCase().includes(term)
      );
      return Promise.resolve(items);
    }
  }

  /**
   * ローカルストレージから単語を取得する
   * @returns VocabularyItem[]
   */
  private static getLocalItems(): VocabularyItem[] {
    const itemsJson = localStorage.getItem(STORAGE_KEY);
    return itemsJson ? JSON.parse(itemsJson) : [];
  }

  /**
   * ローカルストレージに単語を追加する
   * @param item 追加する単語データ
   * @returns VocabularyItem
   */
  private static addLocalItem(item: Partial<VocabularyItem>): VocabularyItem {
    const items = this.getLocalItems();
    
    const newItem: VocabularyItem = {
      id: Date.now().toString(),
      word: item.word || '',
      meaning: item.meaning || '',
      examples: item.examples || [],
      etymology: item.etymology,
      relatedWords: item.relatedWords,
      proficiency: item.proficiency || ProficiencyLevel.UNKNOWN,
      category: item.category,
      createdAt: Date.now(),
      phonetic: item.phonetic || '',
      partOfSpeech: item.partOfSpeech || '',
      notes: item.notes || '',
      tags: item.tags || [],
      reviewCount: 0
    };
    
    items.push(newItem);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    
    return newItem;
  }

  /**
   * ローカルストレージの単語を更新する
   * @param item 更新する単語データ
   * @returns VocabularyItem
   */
  private static updateLocalItem(item: VocabularyItem): VocabularyItem {
    const items = this.getLocalItems();
    const index = items.findIndex(i => i.id === item.id);
    
    if (index !== -1) {
      const updatedItem = {
        ...items[index],
        ...item,
        updatedAt: Date.now()
      };
      
      items[index] = updatedItem;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      
      return updatedItem;
    } else {
      throw new Error('単語が見つかりません');
    }
  }

  /**
   * ローカルストレージから単語を削除する
   * @param id 削除する単語のID
   */
  private static deleteLocalItem(id: string): void {
    const items = this.getLocalItems();
    const filteredItems = items.filter(item => item.id !== id);
    
    if (filteredItems.length !== items.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredItems));
    } else {
      throw new Error('単語が見つかりません');
    }
  }
} 