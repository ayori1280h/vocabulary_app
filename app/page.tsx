'use client';

import { useState, useEffect } from 'react';
import {
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import Layout from './components/Layout';
import VocabularyGrid from './components/VocabularyGrid';
import AddWordModal from './components/AddWordModal';
import { VocabularyItem, ProficiencyLevel } from './models/types';
import { getVocabularyItems, saveVocabularyItems } from './utils/storage';

export default function Home() {
  const [vocabularyItems, setVocabularyItems] = useState<VocabularyItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<VocabularyItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  // 初期データの読み込み
  useEffect(() => {
    const items = getVocabularyItems();
    setVocabularyItems(items);
  }, []);

  // カテゴリが変更されたとき、またはvocabularyItemsが変更されたときにフィルタリング
  useEffect(() => {
    let filtered = [...vocabularyItems];
    
    // カテゴリによるフィルタリング
    switch (activeCategory) {
      case 'unknown':
        filtered = filtered.filter(item => item.proficiency === ProficiencyLevel.UNKNOWN);
        break;
      case 'learning':
        filtered = filtered.filter(item => item.proficiency === ProficiencyLevel.LEARNING);
        break;
      case 'mastered':
        filtered = filtered.filter(item => item.proficiency === ProficiencyLevel.MASTERED);
        break;
      case 'favorite':
        filtered = filtered.filter(item => item.category === 'お気に入り');
        break;
      case 'new':
        // 最近追加された単語（例: 1週間以内）
        const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        filtered = filtered.filter(item => item.createdAt > oneWeekAgo);
        break;
      // 'all'の場合はフィルタリングなし
    }
    
    setFilteredItems(filtered);
  }, [vocabularyItems, activeCategory]);

  // 単語追加時の処理
  const handleAddWord = (newItem: VocabularyItem) => {
    const updatedItems = [...vocabularyItems, newItem];
    setVocabularyItems(updatedItems);
    saveVocabularyItems(updatedItems);
    
    toast({
      title: '単語が追加されました',
      description: `"${newItem.word}"が単語リストに追加されました`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  // 単語削除時の処理
  const handleDeleteItem = (itemId: string) => {
    // 該当する単語を削除
    const itemToDelete = vocabularyItems.find(item => item.id === itemId);
    const updatedItems = vocabularyItems.filter(item => item.id !== itemId);
    
    setVocabularyItems(updatedItems);
    saveVocabularyItems(updatedItems);
    
    // 削除通知
    if (itemToDelete) {
      toast({
        title: '単語が削除されました',
        description: `"${itemToDelete.word}"が削除されました`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // ドラッグ＆ドロップによる順序変更の処理
  const handleUpdateItems = (newItems: VocabularyItem[]) => {
    setVocabularyItems(newItems);
    saveVocabularyItems(newItems);
    
    toast({
      title: '単語の順序が更新されました',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  // サイドバーのカテゴリ選択時の処理
  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
  };

  // 習得レベルの更新処理
  const handleUpdateProficiency = (itemId: string, level: ProficiencyLevel) => {
    const updatedItems = vocabularyItems.map(item => 
      item.id === itemId 
        ? { ...item, proficiency: level, updatedAt: Date.now() } 
        : item
    );
    
    setVocabularyItems(updatedItems);
    saveVocabularyItems(updatedItems);
    
    const item = updatedItems.find(item => item.id === itemId);
    if (item) {
      toast({
        title: '習得状態が更新されました',
        description: `"${item.word}"の習得状態が更新されました`,
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    }
  };

  // 追加ボタンクリック時の処理
  const handleAddClick = () => {
    onOpen(); // 追加フォームを開く
  };

  return (
    <Layout onCategoryChange={handleCategoryChange} activeCategory={activeCategory}>
      <VocabularyGrid 
        items={vocabularyItems} // 全てのアイテムを表示するように変更
        onDelete={handleDeleteItem}
        onAddClick={handleAddClick}
        onUpdateItems={handleUpdateItems}
        onUpdateProficiency={handleUpdateProficiency}
      />
      
      {/* 単語追加用のモーダル */}
      <AddWordModal 
        isOpen={isOpen} 
        onClose={onClose} 
        onAddWord={handleAddWord} 
      />
    </Layout>
  );
} 