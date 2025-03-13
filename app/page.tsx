'use client';

import { useState, useEffect } from 'react';
import {
  useDisclosure,
  useToast,
  Box,
  Flex,
  Heading,
  Text,
} from '@chakra-ui/react';
import Layout from './components/Layout';
import VocabularyGrid from './components/VocabularyGrid';
import AddWordModal from './components/AddWordModal';
import { VocabularyItem, ProficiencyLevel } from './models/types';
import { ApiService } from './services/api';

export default function Home() {
  const [vocabularyItems, setVocabularyItems] = useState<VocabularyItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<VocabularyItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(true);

  // DBから初期データを読み込み
  useEffect(() => {
    const loadVocabularyItems = async () => {
      try {
        setIsLoading(true);
        const items = await ApiService.getWords();
        setVocabularyItems(items);
      } catch (error) {
        console.error('単語データの読み込みエラー:', error);
        toast({
          title: 'データ読み込みエラー',
          description: '単語データの読み込みに失敗しました',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadVocabularyItems();
  }, [toast]);

  // カテゴリが変更されたときにDBからデータを取得
  useEffect(() => {
    const fetchCategoryItems = async () => {
      setIsLoading(true);
      try {
        let items: VocabularyItem[] = [];
        
        // カテゴリによる取得
        if (activeCategory === 'all') {
          items = await ApiService.getWords();
        } else if (['unknown', 'learning', 'mastered'].includes(activeCategory)) {
          const proficiencyLevel = activeCategory.toUpperCase() as ProficiencyLevel;
          items = await ApiService.getWordsByStatus(proficiencyLevel);
        }
        
        setFilteredItems(items);
      } catch (error) {
        console.error('カテゴリデータの取得エラー:', error);
        toast({
          title: 'データ取得エラー',
          description: 'カテゴリデータの取得に失敗しました',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCategoryItems();
  }, [activeCategory, toast]);

  // 単語追加時の処理
  const handleAddWord = async (newWord: Partial<VocabularyItem>) => {
    try {
      const newItem = await ApiService.addWord(newWord);
      
      // 状態更新
      setVocabularyItems(prev => [...prev, newItem]);
      
      toast({
        title: '単語が追加されました',
        description: `"${newItem.word}"が単語リストに追加されました`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('単語追加エラー:', error);
      toast({
        title: '単語追加エラー',
        description: '単語の追加に失敗しました',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // 単語削除時の処理
  const handleDeleteItem = async (itemId: string) => {
    try {
      // 該当する単語を検索
      const itemToDelete = vocabularyItems.find(item => item.id === itemId);
      
      if (!itemToDelete) {
        throw new Error('削除する単語が見つかりません');
      }
      
      // DBから削除
      await ApiService.deleteWord(parseInt(itemId));
      
      // 状態更新
      setVocabularyItems(prev => prev.filter(item => item.id !== itemId));
      
      // 削除通知
      toast({
        title: '単語が削除されました',
        description: `"${itemToDelete.word}"が削除されました`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('単語削除エラー:', error);
      toast({
        title: '単語削除エラー',
        description: '単語の削除に失敗しました',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // サイドバーのカテゴリ選択時の処理
  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
  };

  // 習得レベルの更新処理
  const handleUpdateProficiency = async (itemId: string, level: ProficiencyLevel) => {
    try {
      // 該当する単語を検索
      const item = vocabularyItems.find(item => item.id === itemId);
      
      if (!item) {
        throw new Error('更新する単語が見つかりません');
      }
      
      // DBで状態を更新
      const updatedItem = await ApiService.updateWordStatus(parseInt(itemId), level);
      
      // 状態更新
      setVocabularyItems(prev => prev.map(item => 
        item.id === itemId ? updatedItem : item
      ));
      
      toast({
        title: '習得状態が更新されました',
        description: `"${item.word}"の習得状態が更新されました`,
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error('単語状態更新エラー:', error);
      toast({
        title: '状態更新エラー',
        description: '単語の状態更新に失敗しました',
        status: 'error',
        duration: 3000,
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
      <Flex direction="column" px={4} pb={4}>
        <Box mt={4}>
          <Heading size="md" mb={4}>単語カード</Heading>
          <VocabularyGrid 
            items={activeCategory === 'all' ? vocabularyItems : filteredItems}
            onDelete={handleDeleteItem} 
            onAddClick={handleAddClick} 
            onUpdateProficiency={handleUpdateProficiency}
            isLoading={isLoading}
          />
        </Box>
      </Flex>
      
      {/* 単語追加用のモーダル */}
      <AddWordModal 
        isOpen={isOpen} 
        onClose={onClose} 
        onAddWord={handleAddWord} 
      />
    </Layout>
  );
} 