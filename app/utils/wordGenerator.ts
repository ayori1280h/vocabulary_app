'use client';

import axios from 'axios';
import { nanoid } from 'nanoid';
import { VocabularyItem, ProficiencyLevel } from '../models/types';

// モックデータ（APIが利用できない場合のフォールバック）
const mockMeanings: Record<string, string> = {
  'apple': 'リンゴ。バラ科リンゴ属の落葉高木果樹およびその果実。',
  'book': '書籍、本。印刷または手書きの紙を綴じたもの。',
  'computer': 'コンピュータ。電子計算機。データを処理する電子機器。',
  'dictionary': '辞書、辞典。単語の意味や用法を説明した参考書。',
  'elephant': '象。アフリカやアジアに生息する大型哺乳類。',
};

const mockExamples: Record<string, string[]> = {
  'apple': ['彼女はリンゴを一日一個食べる。', 'このリンゴは甘くて美味しい。'],
  'book': ['私は毎晩本を読む習慣がある。', '彼女は新しい本を出版した。'],
  'computer': ['コンピュータを使って文書を作成した。', '彼はコンピュータの専門家だ。'],
  'dictionary': ['わからない単語は辞書で調べなさい。', '彼女は常に辞書を手元に置いている。'],
  'elephant': ['象は記憶力が良いと言われている。', '私たちは動物園で象を見た。'],
};

// 新しく追加: 語源情報のモックデータ
const mockEtymologies: Record<string, string> = {
  'apple': '古英語の "æppel" に由来し、ゲルマン語の "*aplaz" から派生。',
  'book': '古英語の "bōc" に由来し、「樺の木の皮」を意味するゲルマン語の "*bōkō" から派生。',
  'computer': 'ラテン語の "computare"（計算する）から派生し、英語の "compute"（計算する）に "-er" を付けたもの。',
  'dictionary': 'ラテン語の "dictionarium"（単語集）から派生し、"dictio"（言葉）に由来。',
  'elephant': 'ギリシャ語の "elephas" から派生し、古代エジプト語やセム語に起源がある。',
};

// Dictionary API を使用して単語情報を取得する関数
export async function fetchWordInfo(word: string): Promise<{
  meaning: string;
  examples: string[];
  etymology?: string;
  relatedWords?: string[];
}> {
  try {
    // Free Dictionary API を使用
    const response = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    
    if (response.data && response.data.length > 0) {
      const data = response.data[0];
      
      // 意味の抽出
      let meaning = '';
      if (data.meanings && data.meanings.length > 0) {
        meaning = data.meanings.map((m: any) => 
          `${m.partOfSpeech}: ${m.definitions[0].definition}`
        ).join('\n');
      }
      
      // 例文の抽出
      let examples: string[] = [];
      data.meanings.forEach((m: any) => {
        m.definitions.forEach((def: any) => {
          if (def.example) examples.push(def.example);
        });
      });
      
      // 語源の抽出
      let etymology = data.origin || '';
      
      // 関連語の抽出
      let relatedWords: string[] = [];
      data.meanings.forEach((m: any) => {
        if (m.synonyms) relatedWords = [...relatedWords, ...m.synonyms];
      });
      
      return {
        meaning: meaning || mockMeanings[word.toLowerCase()] || `${word}の意味`,
        examples: examples.length > 0 ? examples : mockExamples[word.toLowerCase()] || [`${word}を使った例文です。`],
        etymology: etymology || mockEtymologies[word.toLowerCase()],
        relatedWords: relatedWords.length > 0 ? relatedWords : undefined
      };
    }
    
    throw new Error('Word not found');
  } catch (error) {
    console.error('Error fetching word info:', error);
    
    // APIが失敗した場合はモックデータを返す
    return {
      meaning: mockMeanings[word.toLowerCase()] || `${word}の意味`,
      examples: mockExamples[word.toLowerCase()] || [`${word}を使った例文です。`, `これは${word}の別の例文です。`],
      etymology: mockEtymologies[word.toLowerCase()],
      relatedWords: []
    };
  }
}

// 単語の意味を生成する関数
export async function generateMeaning(word: string): Promise<string> {
  try {
    const wordInfo = await fetchWordInfo(word);
    return wordInfo.meaning;
  } catch (error) {
    return mockMeanings[word.toLowerCase()] || `${word}の意味`;
  }
}

// 単語の例文を生成する関数
export async function generateExamples(word: string): Promise<string[]> {
  try {
    const wordInfo = await fetchWordInfo(word);
    return wordInfo.examples;
  } catch (error) {
    return mockExamples[word.toLowerCase()] || [`${word}を使った例文です。`, `これは${word}の別の例文です。`];
  }
}

// 単語の語源を生成する関数
export async function generateEtymology(word: string): Promise<string | undefined> {
  try {
    const wordInfo = await fetchWordInfo(word);
    return wordInfo.etymology;
  } catch (error) {
    return mockEtymologies[word.toLowerCase()];
  }
}

// 関連語を生成する関数
export async function generateRelatedWords(word: string): Promise<string[] | undefined> {
  try {
    const wordInfo = await fetchWordInfo(word);
    return wordInfo.relatedWords;
  } catch (error) {
    return [];
  }
}

// 新しい単語アイテムを作成する関数
export async function createVocabularyItem(word: string): Promise<VocabularyItem> {
  try {
    const wordInfo = await fetchWordInfo(word);
    const now = Date.now();
    
    return {
      id: nanoid(),
      word,
      meaning: wordInfo.meaning,
      examples: wordInfo.examples,
      etymology: wordInfo.etymology,
      relatedWords: wordInfo.relatedWords,
      proficiency: ProficiencyLevel.UNKNOWN,
      createdAt: now,
      updatedAt: now,
    };
  } catch (error) {
    // APIが失敗した場合は基本的な情報だけで作成
    const meaning = await generateMeaning(word);
    const examples = await generateExamples(word);
    const now = Date.now();
    
    return {
      id: nanoid(),
      word,
      meaning,
      examples,
      proficiency: ProficiencyLevel.UNKNOWN,
      createdAt: now,
      updatedAt: now,
    };
  }
} 