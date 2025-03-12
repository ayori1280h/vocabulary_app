'use client';

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { useState } from 'react';
import { VocabularyItem, ProficiencyLevel } from '../models/types';
import { nanoid } from 'nanoid';
import { fetchWordInfo } from '../utils/wordGenerator';

interface AddWordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWord: (word: VocabularyItem) => void;
}

export default function AddWordModal({ isOpen, onClose, onAddWord }: AddWordModalProps) {
  const [word, setWord] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [manualInput, setManualInput] = useState(false);
  const [meaning, setMeaning] = useState('');
  const [category, setCategory] = useState('');

  const modalBg = useColorModeValue('white', 'gray.800');
  const inputBg = useColorModeValue('white', 'gray.700');

  // フォームをリセットする
  const resetForm = () => {
    setWord('');
    setMeaning('');
    setCategory('');
    setManualInput(false);
  };

  // モーダルを閉じる時にフォームもリセット
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // 単語を追加する
  const handleSubmit = async () => {
    if (!word.trim()) return;

    setIsLoading(true);

    try {
      let wordData;
      
      if (manualInput) {
        // 手動入力データを使用
        const now = Date.now();
        wordData = {
          id: nanoid(),
          word: word.trim(),
          meaning: meaning.trim() || `${word}の意味`,
          examples: [],
          proficiency: ProficiencyLevel.UNKNOWN,
          category: category.trim() || undefined,
          createdAt: now,
          updatedAt: now,
        };
      } else {
        // APIから単語情報を取得
        const wordInfo = await fetchWordInfo(word);
        const now = Date.now();
        
        wordData = {
          id: nanoid(),
          word: word.trim(),
          meaning: wordInfo.meaning,
          examples: wordInfo.examples,
          etymology: wordInfo.etymology,
          relatedWords: wordInfo.relatedWords,
          proficiency: ProficiencyLevel.UNKNOWN,
          category: category.trim() || undefined,
          createdAt: now,
          updatedAt: now,
        };
      }

      onAddWord(wordData);
      handleClose();
    } catch (error) {
      console.error('単語情報の取得に失敗しました:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <ModalOverlay />
      <ModalContent bg={modalBg}>
        <ModalHeader>新しい単語を追加</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>単語</FormLabel>
              <Input
                placeholder="追加する単語を入力"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                bg={inputBg}
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>カテゴリ（オプション）</FormLabel>
              <Input
                placeholder="カテゴリを入力"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                bg={inputBg}
              />
            </FormControl>
            
            {manualInput && (
              <FormControl>
                <FormLabel>意味（オプション）</FormLabel>
                <Textarea
                  placeholder="単語の意味を入力（空白の場合は自動取得されます）"
                  value={meaning}
                  onChange={(e) => setMeaning(e.target.value)}
                  bg={inputBg}
                />
              </FormControl>
            )}
            
            <Button 
              variant="link" 
              alignSelf="flex-start" 
              onClick={() => setManualInput(!manualInput)}
              size="sm"
            >
              {manualInput ? '自動取得に切り替え' : '手動で意味を入力'}
            </Button>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClose}>
            キャンセル
          </Button>
          <Button 
            colorScheme="blue" 
            onClick={handleSubmit} 
            isLoading={isLoading}
            isDisabled={!word.trim()}
          >
            追加
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 