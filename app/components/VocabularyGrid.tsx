'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  SimpleGrid, 
  Text, 
  IconButton, 
  useColorModeValue, 
  Flex,
  Grid,
  GridItem,
  Heading,
  Divider,
  Badge,
  List,
  ListItem,
} from '@chakra-ui/react';
import { AddIcon, InfoIcon } from '@chakra-ui/icons';
import VocabularyCard from './VocabularyCard';
import { VocabularyItem, ProficiencyLevel } from '../models/types';

interface VocabularyGridProps {
  items: VocabularyItem[];
  onDelete: (id: string) => void;
  onAddClick: () => void;
  onUpdateItems?: (items: VocabularyItem[]) => void;
  onUpdateProficiency?: (itemId: string, level: ProficiencyLevel) => void;
}

export default function VocabularyGrid({ 
  items, 
  onDelete, 
  onAddClick, 
  onUpdateItems,
  onUpdateProficiency
}: VocabularyGridProps) {
  const [selectedItem, setSelectedItem] = useState<VocabularyItem | null>(null);
  const [draggedItem, setDraggedItem] = useState<VocabularyItem | null>(null);
  const unknownAreaRef = useRef<HTMLDivElement>(null);
  const learningAreaRef = useRef<HTMLDivElement>(null);
  const masteredAreaRef = useRef<HTMLDivElement>(null);
  
  // 習得レベル別の単語リスト
  const unknownItems = items.filter(item => item.proficiency === ProficiencyLevel.UNKNOWN);
  const learningItems = items.filter(item => item.proficiency === ProficiencyLevel.LEARNING);
  const masteredItems = items.filter(item => item.proficiency === ProficiencyLevel.MASTERED);
  
  const headerBg = useColorModeValue('white', 'gray.800');
  const addButtonBg = useColorModeValue('blue.500', 'blue.600');
  const detailsBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // エリアの背景色
  const unknownBg = useColorModeValue('gray.50', 'gray.800');
  const learningBg = useColorModeValue('blue.50', 'blue.900');
  const masteredBg = useColorModeValue('green.50', 'green.900');
  
  // カードクリック時の処理
  const handleCardClick = (item: VocabularyItem) => {
    setSelectedItem(item);
  };
  
  // ドラッグ＆ドロップの処理
  useEffect(() => {
    // 型アサーションを使用して、型エラーを解決
    type AnyRef = React.RefObject<any>;
    const setupDragEvents = (areaRef: AnyRef, targetProficiency: ProficiencyLevel) => {
      const areaElement = areaRef.current;
      if (!areaElement) return null;
      
      const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer) {
          e.dataTransfer.dropEffect = 'move';
        }
        areaElement.classList.add('drag-over');
      };
      
      const handleDragLeave = () => {
        areaElement.classList.remove('drag-over');
      };
      
      const handleDrop = (e: DragEvent) => {
        e.preventDefault();
        areaElement.classList.remove('drag-over');
        
        const itemId = e.dataTransfer?.getData('text/plain');
        if (!itemId) return;
        
        const draggedItem = items.find(item => item.id === itemId);
        if (!draggedItem) return;
        
        // 現在と同じエリアにドロップした場合は何もしない
        if (draggedItem.proficiency === targetProficiency) return;
        
        // 習得レベルを更新
        if (onUpdateProficiency) {
          onUpdateProficiency(itemId, targetProficiency);
        }
        
        setDraggedItem(null);
      };
      
      // イベントリスナーの登録
      areaElement.addEventListener('dragover', handleDragOver);
      areaElement.addEventListener('dragleave', handleDragLeave);
      areaElement.addEventListener('drop', handleDrop);
      
      // クリーンアップ関数
      return () => {
        areaElement.removeEventListener('dragover', handleDragOver);
        areaElement.removeEventListener('dragleave', handleDragLeave);
        areaElement.removeEventListener('drop', handleDrop);
      };
    };
    
    // カードのドラッグ開始処理
    const handleCardDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      const card = target.closest('[data-item-id]');
      if (!card) return;
      
      const itemId = card.getAttribute('data-item-id');
      if (!itemId) return;
      
      const item = items.find(item => item.id === itemId);
      if (!item) return;
      
      setDraggedItem(item);
      
      // ドラッグ中の見た目を設定
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', itemId);
      }
    };
    
    const handleDragEnd = () => {
      setDraggedItem(null);
      
      // すべてのエリアから drag-over クラスを削除
      document.querySelectorAll('.proficiency-area').forEach(area => {
        area.classList.remove('drag-over');
      });
    };
    
    // 各エリアごとにイベントをセットアップ
    const cleanupUnknown = setupDragEvents(unknownAreaRef, ProficiencyLevel.UNKNOWN);
    const cleanupLearning = setupDragEvents(learningAreaRef, ProficiencyLevel.LEARNING);
    const cleanupMastered = setupDragEvents(masteredAreaRef, ProficiencyLevel.MASTERED);
    
    // カードのドラッグイベントのセットアップ
    document.addEventListener('dragstart', handleCardDragStart);
    document.addEventListener('dragend', handleDragEnd);
    
    // スタイルシートの追加
    const style = document.createElement('style');
    style.textContent = `
      .proficiency-area.drag-over {
        box-shadow: inset 0 0 0 2px #3182CE !important;
        opacity: 0.8;
      }
    `;
    document.head.appendChild(style);
    
    // クリーンアップ関数
    return () => {
      if (cleanupUnknown) cleanupUnknown();
      if (cleanupLearning) cleanupLearning();
      if (cleanupMastered) cleanupMastered();
      document.removeEventListener('dragstart', handleCardDragStart);
      document.removeEventListener('dragend', handleDragEnd);
      document.head.removeChild(style);
    };
  }, [items, onUpdateProficiency]);
  
  return (
    <Box>
      {/* ヘッダー */}
      <Box bg={headerBg} borderRadius="md" p={4} mb={4} boxShadow="sm">
        <Text fontSize="xl" fontWeight="bold">単語カード</Text>
      </Box>
      
      {/* グリッドレイアウト - 習得エリアと詳細ビュー */}
      <Grid 
        templateColumns="3fr 1fr" 
        gap={4}
      >
        {/* 習得レベル別エリア */}
        <GridItem>
          <Grid 
            templateRows="repeat(3, 1fr)" 
            gap={4} 
            h="calc(100vh - 280px)"
          >
            {/* 未習得エリア */}
            <GridItem>
              <Box 
                ref={unknownAreaRef}
                className="proficiency-area"
                borderWidth="1px" 
                borderColor={borderColor}
                borderRadius="md" 
                p={4} 
                bg={unknownBg}
                h="full"
                overflowY="auto"
                transition="all 0.2s"
                css={{
                  '&::-webkit-scrollbar': {
                    width: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: useColorModeValue('gray.100', 'gray.700'),
                    borderRadius: '4px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: useColorModeValue('gray.300', 'gray.600'),
                    borderRadius: '4px',
                  },
                }}
              >
                <Heading size="md" mb={3}>未習得 ({unknownItems.length})</Heading>
                <SimpleGrid columns={{ base: 2, sm: 3, md: 4, lg: 5, xl: 6 }} spacing={3}>
                  {unknownItems.length > 0 ? (
                    unknownItems.map(item => (
                      <VocabularyCard
                        key={item.id}
                        item={item}
                        onDelete={onDelete}
                        onClick={handleCardClick}
                        isDragging={draggedItem?.id === item.id}
                        isDraggable={true}
                      />
                    ))
                  ) : (
                    <Text color="gray.500" gridColumn="span 5">
                      単語カードがありません。右下の「+」ボタンをクリックして単語を追加してください。
                    </Text>
                  )}
                </SimpleGrid>
              </Box>
            </GridItem>
            
            {/* 習得中エリア */}
            <GridItem>
              <Box 
                ref={learningAreaRef}
                className="proficiency-area"
                borderWidth="1px" 
                borderColor={borderColor}
                borderRadius="md" 
                p={4} 
                bg={learningBg}
                h="full"
                overflowY="auto"
                transition="all 0.2s"
                css={{
                  '&::-webkit-scrollbar': {
                    width: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: useColorModeValue('gray.100', 'gray.700'),
                    borderRadius: '4px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: useColorModeValue('gray.300', 'gray.600'),
                    borderRadius: '4px',
                  },
                }}
              >
                <Heading size="md" mb={3}>習得中 ({learningItems.length})</Heading>
                <SimpleGrid columns={{ base: 2, sm: 3, md: 4, lg: 5, xl: 6 }} spacing={3}>
                  {learningItems.length > 0 ? (
                    learningItems.map(item => (
                      <VocabularyCard
                        key={item.id}
                        item={item}
                        onDelete={onDelete}
                        onClick={handleCardClick}
                        isDragging={draggedItem?.id === item.id}
                        isDraggable={true}
                      />
                    ))
                  ) : (
                    <Text color="gray.500" gridColumn="span 5">
                      未習得からドラッグして単語を追加してください。
                    </Text>
                  )}
                </SimpleGrid>
              </Box>
            </GridItem>
            
            {/* 習得済みエリア */}
            <GridItem>
              <Box 
                ref={masteredAreaRef}
                className="proficiency-area"
                borderWidth="1px" 
                borderColor={borderColor}
                borderRadius="md" 
                p={4} 
                bg={masteredBg}
                h="full"
                overflowY="auto"
                transition="all 0.2s"
                css={{
                  '&::-webkit-scrollbar': {
                    width: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: useColorModeValue('gray.100', 'gray.700'),
                    borderRadius: '4px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: useColorModeValue('gray.300', 'gray.600'),
                    borderRadius: '4px',
                  },
                }}
              >
                <Heading size="md" mb={3}>習得済み ({masteredItems.length})</Heading>
                <SimpleGrid columns={{ base: 2, sm: 3, md: 4, lg: 5, xl: 6 }} spacing={3}>
                  {masteredItems.length > 0 ? (
                    masteredItems.map(item => (
                      <VocabularyCard
                        key={item.id}
                        item={item}
                        onDelete={onDelete}
                        onClick={handleCardClick}
                        isDragging={draggedItem?.id === item.id}
                        isDraggable={true}
                      />
                    ))
                  ) : (
                    <Text color="gray.500" gridColumn="span 5">
                      習得中からドラッグして単語を追加してください。
                    </Text>
                  )}
                </SimpleGrid>
              </Box>
            </GridItem>
          </Grid>
          
          {/* 追加ボタン */}
          <IconButton
            aria-label="単語を追加"
            icon={<AddIcon />}
            size="lg"
            colorScheme="blue"
            bg={addButtonBg}
            isRound
            position="fixed"
            bottom={8}
            right={8}
            boxShadow="lg"
            onClick={onAddClick}
          />
        </GridItem>
        
        {/* 詳細表示 */}
        <GridItem>
          <Box 
            borderWidth="1px" 
            borderColor={borderColor}
            borderRadius="md" 
            p={4} 
            bg={detailsBg}
            h="calc(100vh - 280px)"
            overflowY="auto"
            css={{
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: useColorModeValue('gray.100', 'gray.700'),
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: useColorModeValue('gray.300', 'gray.600'),
                borderRadius: '4px',
              },
            }}
          >
            {selectedItem ? (
              <>
                <Heading as="h2" size="lg" mb={2}>
                  {selectedItem.word}
                </Heading>
                
                <Divider my={3} />
                
                <Text fontSize="md" fontWeight="bold" mb={1}>
                  意味:
                </Text>
                <Text mb={4}>{selectedItem.meaning || "意味が登録されていません"}</Text>
                
                {/* 習得レベル表示 */}
                <Box mb={4}>
                  <Text fontSize="md" fontWeight="bold" mb={1}>
                    習得状態:
                  </Text>
                  <Badge 
                    colorScheme={
                      selectedItem.proficiency === ProficiencyLevel.MASTERED ? "green" : 
                      selectedItem.proficiency === ProficiencyLevel.LEARNING ? "blue" : 
                      "gray"
                    }
                  >
                    {selectedItem.proficiency === ProficiencyLevel.MASTERED ? "習得済み" : 
                     selectedItem.proficiency === ProficiencyLevel.LEARNING ? "習得中" : 
                     "未習得"}
                  </Badge>
                </Box>
                
                {selectedItem.etymology && (
                  <Box mb={4}>
                    <Text fontSize="md" fontWeight="bold" mb={1}>
                      語源:
                    </Text>
                    <Text>{selectedItem.etymology}</Text>
                  </Box>
                )}
                
                {selectedItem.examples && selectedItem.examples.length > 0 && (
                  <Box mb={4}>
                    <Text fontSize="md" fontWeight="bold" mb={1}>
                      例文:
                    </Text>
                    <List spacing={2}>
                      {selectedItem.examples.map((example, index) => (
                        <ListItem key={index} pl={2} borderLeft="2px" borderColor="blue.400">
                          {example}
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
                
                {selectedItem.category && (
                  <Box mb={4}>
                    <Text fontSize="md" fontWeight="bold" mb={1}>
                      カテゴリー:
                    </Text>
                    <Badge colorScheme="green">{selectedItem.category}</Badge>
                  </Box>
                )}
              </>
            ) : (
              <Flex 
                direction="column" 
                align="center" 
                justify="center" 
                h="full" 
                color="gray.500"
                textAlign="center"
              >
                <InfoIcon boxSize={10} mb={4} />
                <Text>カードをクリックすると、単語の詳細情報がここに表示されます</Text>
              </Flex>
            )}
          </Box>
        </GridItem>
      </Grid>
    </Box>
  );
} 