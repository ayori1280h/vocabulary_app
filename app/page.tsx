'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Heading,
  Text,
  SimpleGrid,
  Box,
  VStack,
  useToast,
} from '@chakra-ui/react';
import VocabularyForm from './components/VocabularyForm';
import DraggableContainer from './components/DraggableContainer';
import { VocabularyItem, ProficiencyLevel, Container as VocContainer } from './models/types';
import { getVocabularyItems, saveVocabularyItems } from './utils/storage';

export default function Home() {
  const [vocabularyItems, setVocabularyItems] = useState<VocabularyItem[]>([]);
  const [containers, setContainers] = useState<VocContainer[]>([
    { id: 'unknown', title: '未習得', items: [] },
    { id: 'learning', title: '学習中', items: [] },
    { id: 'mastered', title: '習得済み', items: [] },
  ]);
  const toast = useToast();

  // 初期データの読み込み
  useEffect(() => {
    const items = getVocabularyItems();
    setVocabularyItems(items);
    
    // コンテナにアイテムを振り分ける
    distributeItemsToContainers(items);
  }, []);

  // アイテムをコンテナに振り分ける関数
  const distributeItemsToContainers = (items: VocabularyItem[]) => {
    const newContainers = [...containers];
    
    // コンテナのアイテムをクリア
    newContainers.forEach(container => {
      container.items = [];
    });
    
    // アイテムを習得度に応じて振り分ける
    items.forEach(item => {
      const containerId = item.proficiency;
      const containerIndex = newContainers.findIndex(c => c.id === containerId);
      
      if (containerIndex !== -1) {
        newContainers[containerIndex].items.push(item);
      } else {
        // デフォルトは未習得コンテナに追加
        newContainers[0].items.push(item);
      }
    });
    
    setContainers(newContainers);
  };

  // 単語追加時の処理
  const handleAddWord = (newItem: VocabularyItem) => {
    const updatedItems = [...vocabularyItems, newItem];
    setVocabularyItems(updatedItems);
    saveVocabularyItems(updatedItems);
    
    // コンテナに追加
    const newContainers = [...containers];
    const containerIndex = newContainers.findIndex(c => c.id === newItem.proficiency);
    
    if (containerIndex !== -1) {
      newContainers[containerIndex].items.push(newItem);
      setContainers(newContainers);
    }
  };

  // 単語削除時の処理
  const handleDeleteItem = (itemId: string) => {
    // 該当する単語を削除
    const itemToDelete = vocabularyItems.find(item => item.id === itemId);
    const updatedItems = vocabularyItems.filter(item => item.id !== itemId);
    
    setVocabularyItems(updatedItems);
    saveVocabularyItems(updatedItems);
    
    // コンテナも更新
    distributeItemsToContainers(updatedItems);
    
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

  // ドラッグ＆ドロップ時の処理
  const handleDrop = (item: VocabularyItem, targetContainerId: string) => {
    // 同じコンテナ内でのドロップは無視
    if (item.proficiency === targetContainerId) {
      return;
    }
    
    // アイテムの習得度を更新
    const updatedItems = vocabularyItems.map(vocItem => {
      if (vocItem.id === item.id) {
        return {
          ...vocItem,
          proficiency: targetContainerId as ProficiencyLevel,
          updatedAt: Date.now(),
        };
      }
      return vocItem;
    });
    
    setVocabularyItems(updatedItems);
    saveVocabularyItems(updatedItems);
    
    // コンテナを更新
    distributeItemsToContainers(updatedItems);
    
    toast({
      title: '単語が移動されました',
      description: `"${item.word}"が${containers.find(c => c.id === targetContainerId)?.title || ''}に移動されました`,
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Heading as="h1" size="xl" mb={2}>ボキャブラリー学習アプリ</Heading>
          <Text color="gray.600">単語を登録して、ドラッグ＆ドロップで整理しましょう</Text>
        </Box>
        
        <VocabularyForm onAddWord={handleAddWord} />
        
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
          {containers.map(container => (
            <DraggableContainer
              key={container.id}
              id={container.id}
              title={container.title}
              items={container.items}
              onDrop={handleDrop}
              onDelete={handleDeleteItem}
            />
          ))}
        </SimpleGrid>
      </VStack>
    </Container>
  );
} 