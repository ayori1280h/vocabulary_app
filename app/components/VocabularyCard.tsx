'use client';

import { useState } from 'react';
import { 
  Box, 
  Text, 
  Flex, 
  IconButton, 
  useColorModeValue,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Button,
  useDisclosure
} from '@chakra-ui/react';
import { VocabularyItem } from '../models/types';
import { DeleteIcon } from '@chakra-ui/icons';
import { useRef } from 'react';

interface VocabularyCardProps {
  item: VocabularyItem;
  onDelete?: (id: string) => void;
  onClick?: (item: VocabularyItem) => void;
  isDragging?: boolean;
  isDraggable?: boolean;
}

export default function VocabularyCard({ item, onDelete, onClick, isDragging, isDraggable = true }: VocabularyCardProps) {
  // 削除確認ダイアログの状態
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);
  
  // カードの背景色
  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('gray.200', 'gray.700');
  const btnBg = useColorModeValue('gray.100', 'gray.700');
  
  // カテゴリーを取得（実際のアプリでは適切に設定）
  const category = item.category || 'その他';
  
  // 削除処理を実行する関数
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // カードのクリックイベントが発火しないようにする
    onOpen(); // 削除確認ダイアログを開く
  };
  
  // 削除を確定する関数
  const confirmDelete = () => {
    if (onDelete) {
      onDelete(item.id);
    }
    onClose();
  };
  
  // カードクリック時の処理
  const handleCardClick = () => {
    if (onClick) {
      onClick(item);
    }
  };
  
  return (
    <>
      <Box
        maxW="180px"
        h="70px"
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
          <Text fontWeight="bold" fontSize="lg" noOfLines={2} flex="1">
            {item.word}
          </Text>
          
          {onDelete && (
            <IconButton
              aria-label="削除"
              icon={<DeleteIcon />}
              size="sm"
              isRound
              bg={btnBg}
              color="gray.600"
              onClick={handleDelete}
              _hover={{ bg: 'red.100', color: 'red.500' }}
            />
          )}
        </Flex>
      </Box>
      
      {/* 削除確認ダイアログ */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              単語の削除
            </AlertDialogHeader>

            <AlertDialogBody>
              「{item.word}」を削除してもよろしいですか？この操作は元に戻せません。
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                キャンセル
              </Button>
              <Button colorScheme="red" onClick={confirmDelete} ml={3}>
                削除する
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
} 