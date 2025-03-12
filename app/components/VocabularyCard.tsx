'use client';

import { useState } from 'react';
import { 
  Box, 
  Text, 
  Badge, 
  Flex, 
  IconButton, 
  useDisclosure, 
  Collapse, 
  Tooltip,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Button
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon, DeleteIcon } from '@chakra-ui/icons';
import { VocabularyItem, ProficiencyLevel } from '../models/types';
import { pronounceWord } from '../utils/speechEngine';
import { useRef } from 'react';

interface VocabularyCardProps {
  item: VocabularyItem;
  isDragging?: boolean;
  onDelete?: (id: string) => void;
}

// 習得度に応じた色を返す関数
const getProficiencyColor = (proficiency: ProficiencyLevel): string => {
  switch (proficiency) {
    case ProficiencyLevel.UNKNOWN:
      return 'red.400';
    case ProficiencyLevel.LEARNING:
      return 'yellow.400';
    case ProficiencyLevel.MASTERED:
      return 'green.400';
    default:
      return 'gray.400';
  }
};

export default function VocabularyCard({ item, isDragging = false, onDelete }: VocabularyCardProps) {
  const { isOpen, onToggle } = useDisclosure();
  const [isPlaying, setIsPlaying] = useState(false);
  
  // 削除確認ダイアログの状態管理
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  
  const openDeleteDialog = () => setIsDeleteDialogOpen(true);
  const closeDeleteDialog = () => setIsDeleteDialogOpen(false);

  // 単語を発音する関数
  const handlePronounce = async () => {
    try {
      setIsPlaying(true);
      // 音声APIを呼び出して単語を発音
      await pronounceWord(item.word);
    } catch (error) {
      console.error('発音エラー:', error);
    } finally {
      setIsPlaying(false);
    }
  };
  
  // 削除処理を実行する関数
  const handleDelete = () => {
    if (onDelete) {
      onDelete(item.id);
    }
    closeDeleteDialog();
  };
  
  return (
    <Box
      p={4}
      borderWidth="1px"
      borderRadius="lg"
      boxShadow={isDragging ? 'lg' : 'md'}
      bg={isDragging ? 'gray.50' : 'white'}
      transition="all 0.2s"
      opacity={isDragging ? 0.8 : 1}
      mb={3}
      cursor="grab"
      _hover={{ boxShadow: 'lg' }}
    >
      <Flex justifyContent="space-between" alignItems="center">
        <Flex alignItems="center">
          <Text fontWeight="bold" fontSize="lg">{item.word}</Text>
          <Tooltip label="発音を聞く">
            <IconButton
              aria-label="発音"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
                  <path d={isPlaying 
                    ? "M23 9l-4.5 4.5L23 18V9z" 
                    : "M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"}>
                  </path>
                </svg>
              }
              size="sm"
              variant="ghost"
              ml={2}
              isLoading={isPlaying}
              onClick={handlePronounce}
            />
          </Tooltip>
        </Flex>
        <Flex alignItems="center">
          <Badge colorScheme={getProficiencyColor(item.proficiency)} mr={2}>
            {item.proficiency}
          </Badge>
          {onDelete && (
            <Tooltip label="削除">
              <IconButton
                aria-label="削除"
                icon={<DeleteIcon />}
                size="sm"
                variant="ghost"
                colorScheme="red"
                onClick={openDeleteDialog}
              />
            </Tooltip>
          )}
        </Flex>
      </Flex>
      
      <Text mt={2} color="gray.600">{item.meaning}</Text>
      
      <Flex justifyContent="flex-end" mt={2}>
        <IconButton
          aria-label={isOpen ? "Hide examples" : "Show examples"}
          icon={isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
          size="sm"
          variant="ghost"
          onClick={onToggle}
        />
      </Flex>
      
      <Collapse in={isOpen} animateOpacity>
        <Box mt={2} p={2} bg="gray.50" borderRadius="md">
          <Text fontWeight="semibold" mb={1}>例文:</Text>
          {item.examples.map((example, index) => (
            <Text key={index} fontSize="sm" mb={1}>• {example}</Text>
          ))}
          
          {item.etymology && (
            <>
              <Text fontWeight="semibold" mt={2} mb={1}>語源:</Text>
              <Text fontSize="sm">{item.etymology}</Text>
            </>
          )}
          
          {item.relatedWords && item.relatedWords.length > 0 && (
            <>
              <Text fontWeight="semibold" mt={2} mb={1}>関連語:</Text>
              <Flex flexWrap="wrap" gap={1}>
                {item.relatedWords.map((word, index) => (
                  <Badge key={index} colorScheme="blue" variant="outline">
                    {word}
                  </Badge>
                ))}
              </Flex>
            </>
          )}
        </Box>
      </Collapse>
      
      {/* 削除確認ダイアログ */}
      <AlertDialog
        isOpen={isDeleteDialogOpen}
        leastDestructiveRef={cancelRef}
        onClose={closeDeleteDialog}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              単語を削除
            </AlertDialogHeader>

            <AlertDialogBody>
              「{item.word}」を削除しますか？この操作は元に戻せません。
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={closeDeleteDialog}>
                キャンセル
              </Button>
              <Button colorScheme="red" onClick={handleDelete} ml={3}>
                削除
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
} 