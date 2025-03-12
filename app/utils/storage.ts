'use client';

import { VocabularyItem, Category, Container } from '../models/types';

// ローカルストレージのキー
const VOCABULARY_ITEMS_KEY = 'vocabulary_items';
const CATEGORIES_KEY = 'vocabulary_categories';
const CONTAINERS_KEY = 'vocabulary_containers';

// ローカルストレージからデータを取得する関数
export function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error getting item from localStorage: ${error}`);
    return defaultValue;
  }
}

// ローカルストレージにデータを保存する関数
export function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving item to localStorage: ${error}`);
  }
}

// 単語データの取得
export function getVocabularyItems(): VocabularyItem[] {
  return getFromStorage<VocabularyItem[]>(VOCABULARY_ITEMS_KEY, []);
}

// 単語データの保存
export function saveVocabularyItems(items: VocabularyItem[]): void {
  saveToStorage(VOCABULARY_ITEMS_KEY, items);
}

// カテゴリーの取得
export function getCategories(): Category[] {
  return getFromStorage<Category[]>(CATEGORIES_KEY, []);
}

// カテゴリーの保存
export function saveCategories(categories: Category[]): void {
  saveToStorage(CATEGORIES_KEY, categories);
}

// コンテナの取得
export function getContainers(): Container[] {
  return getFromStorage<Container[]>(CONTAINERS_KEY, []);
}

// コンテナの保存
export function saveContainers(containers: Container[]): void {
  saveToStorage(CONTAINERS_KEY, containers);
} 