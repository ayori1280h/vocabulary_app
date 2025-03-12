// 習得度の定義
export enum ProficiencyLevel {
  UNKNOWN = 'unknown',
  LEARNING = 'learning',
  MASTERED = 'mastered'
}

// 単語データの型定義
export interface VocabularyItem {
  id: string;
  word: string;
  meaning: string;
  examples: string[];
  etymology?: string;
  relatedWords?: string[];
  proficiency: ProficiencyLevel;
  category?: string;
  createdAt: number;
  updatedAt: number;
}

// カテゴリーの型定義
export interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

// ドラッグ＆ドロップ用のコンテナ型定義
export interface Container {
  id: string;
  title: string;
  items: VocabularyItem[];
} 