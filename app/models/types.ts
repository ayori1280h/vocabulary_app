// 習得度の定義
export enum ProficiencyLevel {
  UNKNOWN = 'UNKNOWN',
  LEARNING = 'LEARNING',
  MASTERED = 'MASTERED'
}

// 単語データの型定義
export interface VocabularyItem {
  id: string;
  word: string;
  meaning: string;
  examples: string[];
  examplesTranslation?: string[];
  etymology?: string;
  relatedWords?: string[];
  proficiency: ProficiencyLevel;
  category?: string;
  createdAt: number;
  updatedAt?: number;
  lastReviewed?: number;
  reviewCount?: number;
  phonetic?: string;
  partOfSpeech?: string;
  notes?: string;
  tags?: string[];
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