'use client';

import { useState } from 'react';
import { Box, Text, Flex, IconButton, useColorModeValue } from '@chakra-ui/react';
import { VocabularyItem } from '../models/types';
import { pronounceWord } from '../utils/speechEngine';
import { DeleteIcon, RepeatIcon } from '@chakra-ui/icons';

interface VocabularyCardProps {
  item: VocabularyItem;
  onDelete?: (id: string) => void;
  onClick?: (item: VocabularyItem) => void;
  isDragging?: boolean;
  isDraggable?: boolean;
}

export default function VocabularyCard({ item, onDelete, onClick, isDragging, isDraggable = true }: VocabularyCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  
  // カードの背景色
  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('gray.200', 'gray.700');
  const soundBtnBg = useColorModeValue('gray.100', 'gray.700');
  
  // カテゴリーを取得（実際のアプリでは適切に設定）
  const category = item.category || 'その他';
  
  // 単語を発音する関数
  const handlePronounce = async (e: React.MouseEvent) => {
    e.stopPropagation(); // カードのクリックイベントが発火しないようにする
    try {
      setIsPlaying(true);
      await pronounceWord(item.word);
    } catch (error) {
      console.error('発音エラー:', error);
    } finally {
      setIsPlaying(false);
    }
  };
  
  // 削除処理を実行する関数
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // カードのクリックイベントが発火しないようにする
    if (onDelete) {
      onDelete(item.id);
    }
  };
  
  // カードクリック時の処理
  const handleCardClick = () => {
    if (onClick) {
      onClick(item);
    }
  };
  
  return (
    <Box
      maxW="200px"
      h="80px"
      borderWidth="1px"
      borderColor={cardBorder}
      borderRadius="md"
      p={3}
      bg={cardBg}
      boxShadow={isDragging ? "md" : "sm"}
      position="relative"
      transition="all 0.2s"
      _hover={{ boxShadow: 'md', transform: 'translateY(-2px)' }}
      cursor="pointer"
      onClick={handleCardClick}
      draggable={isDraggable}
      opacity={isDragging ? 0.6 : 1}
      zIndex={isDragging ? 100 : 1}
      // HTML5ドラッグ＆ドロップ用属性
      data-item-id={item.id}
      data-proficiency={item.proficiency}
    >
      <Flex justifyContent="space-between" alignItems="center" h="full">
        <Text fontWeight="bold" fontSize="lg" noOfLines={2}>
          {item.word}
        </Text>
        
        <Flex>
          <IconButton
            aria-label="発音"
            icon={<RepeatIcon />}
            size="sm"
            isRound
            bg={soundBtnBg}
            mr={1}
            color="gray.600"
            isLoading={isPlaying}
            onClick={handlePronounce}
            _hover={{ bg: 'gray.200' }}
          />
          
          {onDelete && (
            <IconButton
              aria-label="削除"
              icon={<DeleteIcon />}
              size="sm"
              isRound
              bg={soundBtnBg}
              color="gray.600"
              onClick={handleDelete}
              _hover={{ bg: 'red.100', color: 'red.500' }}
            />
          )}
        </Flex>
      </Flex>
    </Box>
  );
} 