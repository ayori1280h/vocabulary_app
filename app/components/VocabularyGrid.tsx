'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  Button,
  Spinner,
  useToast
} from '@chakra-ui/react';
import { AddIcon, InfoIcon, RepeatIcon } from '@chakra-ui/icons';
import VocabularyCard from './VocabularyCard';
import { VocabularyItem, ProficiencyLevel } from '../models/types';
import { pronounceWord } from '../utils/speechEngine';
import { FaPause, FaVolumeUp, FaInfoCircle, FaRobot } from 'react-icons/fa';
import { Icon } from '@chakra-ui/react';
import { HStack } from '@chakra-ui/react';
import { ApiService } from '../services/api';

interface VocabularyGridProps {
  items: VocabularyItem[];
  onDelete: (id: string) => void;
  onAddClick: () => void;
  onUpdateProficiency?: (itemId: string, level: ProficiencyLevel) => void;
  isLoading?: boolean;
}

export default function VocabularyGrid({ 
  items, 
  onDelete, 
  onAddClick, 
  onUpdateProficiency,
  isLoading = false
}: VocabularyGridProps) {
  const [selectedItem, setSelectedItem] = useState<VocabularyItem | null>(null);
  const [draggedItem, setDraggedItem] = useState<VocabularyItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDetailLoaded, setIsDetailLoaded] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const unknownAreaRef = useRef<HTMLDivElement>(null);
  const learningAreaRef = useRef<HTMLDivElement>(null);
  const masteredAreaRef = useRef<HTMLDivElement>(null);
  const toast = useToast();
  
  // 習得レベル別の単語リスト
  const unknownItems = items.filter(item => item.proficiency === ProficiencyLevel.UNKNOWN);
  const learningItems = items.filter(item => item.proficiency === ProficiencyLevel.LEARNING);
  const masteredItems = items.filter(item => item.proficiency === ProficiencyLevel.MASTERED);
  
  const headerBg = useColorModeValue('white', 'gray.800');
  const addButtonBg = useColorModeValue('blue.500', 'blue.600');
  const detailsBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const soundBtnBg = useColorModeValue('gray.100', 'gray.700');
  
  // エリアの背景色
  const unknownBg = useColorModeValue('gray.50', 'gray.800');
  const learningBg = useColorModeValue('blue.50', 'blue.900');
  const masteredBg = useColorModeValue('green.50', 'green.900');
  
  // カードクリック時の処理
  const handleCardClick = useCallback(async (item: VocabularyItem) => {
    setSelectedItem(item);
    setIsDetailLoaded(false);
    
    // 単語の詳細情報をサーバーから取得
    try {
      setLoadingDetail(true);
      
      // IDを使用して単語の詳細情報をDBから取得
      const wordDetails = await ApiService.getWordDetails(parseInt(item.id));
      
      // 詳細情報を更新
      setSelectedItem(wordDetails);
      setIsDetailLoaded(true);
    } catch (error) {
      console.error('単語情報の取得エラー:', error);
      toast({
        title: '情報取得エラー',
        description: '単語の詳細情報を取得できませんでした。',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoadingDetail(false);
    }
  }, [toast]);
  
  // 単語を発音する関数
  const handlePronounce = async () => {
    if (!selectedItem) return;
    
    try {
      setIsPlaying(true);
      await pronounceWord(selectedItem.word);
    } catch (error) {
      console.error('発音エラー:', error);
      toast({
        title: '発音エラー',
        description: '単語の発音に失敗しました。',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsPlaying(false);
    }
  };
  
  // AIによる単語情報の取得
  const handleFetchAIInfo = async () => {
    if (!selectedItem) return;
    
    try {
      setLoadingDetail(true);
      
      // バックエンドのGemini APIエンドポイントを呼び出す
      const response = await fetch(`/api/sqlite-proxy/gemini-word-info?word=${encodeURIComponent(selectedItem.word)}`);
      
      if (!response.ok) {
        throw new Error('AIリクエストに失敗しました');
      }
      
      const data = await response.json();
      
      // AI生成の詳細情報を更新
      if (data && data.word) {
        // まずUIの状態を更新
        const updatedItem = {
          ...selectedItem,
          meaning: data.meaning || selectedItem.meaning,
          examples: data.examples || selectedItem.examples,
          examplesTranslation: data.examplesTranslation || selectedItem.examplesTranslation,
          etymology: data.etymology || selectedItem.etymology,
          relatedWords: data.relatedWords || selectedItem.relatedWords,
          phonetic: data.phonetic || selectedItem.phonetic,
          partOfSpeech: data.partOfSpeech || selectedItem.partOfSpeech
        };
        
        setSelectedItem(updatedItem);
        
        // DBに保存（情報を上書き）
        try {
          // DBに渡すデータ形式に変換
          const dbWordData = {
            phonetic: data.phonetic || '',
            part_of_speech: data.partOfSpeech || '',
            definitions: [
              {
                definition: data.meaning || '',
                part_of_speech: data.partOfSpeech || ''
              }
            ],
            examples: (data.examples || []).map((example: string, index: number) => ({
              example,
              translation: data.examplesTranslation?.[index] || ''
            })),
            etymologies: data.etymology ? [{ etymology: data.etymology }] : [],
            related_words: (data.relatedWords || []).map((word: string) => ({
              related_word: word,
              relationship_type: ''
            }))
          };
          
          // DBを更新
          await ApiService.updateWordDetails(parseInt(selectedItem.id), dbWordData);
          
          // 親コンポーネントの単語リストも更新が必要ないので削除
          if (onUpdateProficiency) {
            // 状態の更新のみ
            onUpdateProficiency(selectedItem.id, updatedItem.proficiency);
          }
          
          toast({
            title: 'AI情報取得完了',
            description: '単語の詳細情報がAIによって更新されDBに保存されました。',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        } catch (error) {
          console.error('DB更新エラー:', error);
          toast({
            title: 'DB更新エラー',
            description: 'AIが生成した単語情報のDB保存に失敗しました。',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
        }
      }
    } catch (error) {
      console.error('AI情報取得エラー:', error);
      toast({
        title: 'AI情報取得エラー',
        description: 'AIによる単語情報の取得に失敗しました。',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoadingDetail(false);
    }
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
    <Box position="relative">
      {isLoading ? (
        <Flex justifyContent="center" alignItems="center" p={10}>
          <Spinner size="xl" thickness="4px" speed="0.65s" color="blue.500" />
          <Text ml={4} fontSize="lg">データを読み込んでいます...</Text>
        </Flex>
      ) : (
        <Box>
          {/* ヘッダー */}
          <Box bg={headerBg} borderRadius="md" p={4} mb={4} boxShadow="sm">
            <Text fontSize="xl" fontWeight="bold">単語カード</Text>
          </Box>
          
          {/* グリッドレイアウト - 習得エリアと詳細ビュー */}
          <Grid 
            templateColumns={{ base: "1fr", lg: "3fr 1fr" }}
            gap={4}
          >
            {/* 習得レベル別エリア */}
            <GridItem>
              <Grid 
                templateColumns="1fr" 
                gap={4}
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
                    overflowY="auto"
                    maxH="30vh"
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
                          単語を追加してください。
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
                    overflowY="auto"
                    maxH="30vh"
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
                    <Heading size="md" mb={3}>学習中 ({learningItems.length})</Heading>
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
                    overflowY="auto"
                    maxH="30vh"
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
                          学習中からドラッグして単語を追加してください。
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
                zIndex={1000}
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
                position="relative"
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
                    {loadingDetail && (
                      <Flex 
                        position="absolute" 
                        top={0} 
                        left={0} 
                        right={0} 
                        bottom={0} 
                        bg="blackAlpha.200" 
                        zIndex={1}
                        align="center"
                        justify="center"
                      >
                        <Spinner size="xl" />
                      </Flex>
                    )}
                    
                    <Flex justify="space-between" align="center" mb={4}>
                      <Heading size="lg">{selectedItem.word}</Heading>
                      
                      <HStack>
                        <IconButton
                          aria-label="発音"
                          icon={isPlaying ? <Icon as={FaPause} /> : <Icon as={FaVolumeUp} />}
                          size="sm"
                          colorScheme="blue"
                          isLoading={isPlaying}
                          onClick={handlePronounce}
                        />
                      </HStack>
                    </Flex>
                    
                    {selectedItem.phonetic && (
                      <Text fontSize="lg" mb={2} color="gray.500">
                        {selectedItem.phonetic}
                      </Text>
                    )}
                    
                    <Divider my={3} />
                    
                    <Box mb={4}>
                      <Heading size="md" mb={2}>意味</Heading>
                      <Text>{selectedItem.meaning}</Text>
                    </Box>
                    
                    {selectedItem.partOfSpeech && (
                      <Box mb={4}>
                        <Heading size="md" mb={2}>品詞</Heading>
                        <Badge colorScheme="purple">{selectedItem.partOfSpeech}</Badge>
                      </Box>
                    )}
                    
                    {selectedItem.examples && selectedItem.examples.length > 0 && (
                      <Box mb={4}>
                        <Heading size="md" mb={2}>例文</Heading>
                        <List spacing={3}>
                          {selectedItem.examples.map((example, index) => (
                            <ListItem key={index} mb={2}>
                              <Flex align="center">
                                <Text fontWeight="medium" flex="1">• {example}</Text>
                                <IconButton
                                  aria-label="例文を発音"
                                  icon={<FaVolumeUp />}
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="blue"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    pronounceWord(example);
                                  }}
                                />
                              </Flex>
                              {selectedItem.examplesTranslation && selectedItem.examplesTranslation[index] && (
                                <Text fontSize="sm" color="gray.600" ml={4} mt={1}>
                                  {selectedItem.examplesTranslation[index]}
                                </Text>
                              )}
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                    
                    {selectedItem.etymology && (
                      <Box mb={4}>
                        <Heading size="md" mb={2}>語源</Heading>
                        <Text>{selectedItem.etymology}</Text>
                      </Box>
                    )}
                    
                    {selectedItem.relatedWords && selectedItem.relatedWords.length > 0 && (
                      <Box mb={4}>
                        <Heading size="md" mb={2}>関連語</Heading>
                        <Flex wrap="wrap" gap={2}>
                          {selectedItem.relatedWords.map((word, index) => (
                            <Badge key={index} colorScheme="green" fontSize="sm" p={1}>
                              {word}
                            </Badge>
                          ))}
                        </Flex>
                      </Box>
                    )}
                    
                    <Divider my={4} />
                    
                    <Button
                      leftIcon={<Icon as={FaRobot} />}
                      colorScheme="teal"
                      size="sm"
                      onClick={handleFetchAIInfo}
                      isLoading={loadingDetail}
                      w="full"
                    >
                      AIで単語情報を更新
                    </Button>
                  </>
                ) : (
                  <Flex 
                    direction="column" 
                    align="center" 
                    justify="center" 
                    h="full" 
                    color="gray.500"
                  >
                    <Icon as={FaInfoCircle} boxSize={10} mb={4} />
                    <Text fontSize="lg">単語をクリックすると詳細が表示されます</Text>
                  </Flex>
                )}
              </Box>
            </GridItem>
          </Grid>
        </Box>
      )}
    </Box>
  );
} 