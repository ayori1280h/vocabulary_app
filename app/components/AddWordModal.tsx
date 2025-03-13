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
  Select,
  Checkbox,
} from '@chakra-ui/react';
import { useState } from 'react';
import { ProficiencyLevel } from '../models/types';
import { fetchWordInfo } from '../utils/wordGenerator';
import { geminiClient } from '../services/geminiApi';

interface AddWordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWord: (word: Partial<{
    word: string;
    meaning: string;
    examples: string[];
    examplesTranslation?: string[];
    category?: string;
    proficiency: ProficiencyLevel;
    etymology?: string;
    relatedWords?: string[];
    phonetic?: string;
    partOfSpeech?: string;
  }>) => void;
}

export default function AddWordModal({ isOpen, onClose, onAddWord }: AddWordModalProps) {
  const [word, setWord] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [manualInput, setManualInput] = useState(false);
  const [meaning, setMeaning] = useState('');
  const [category, setCategory] = useState('');
  const [phonetic, setPhonetic] = useState('');
  const [partOfSpeech, setPartOfSpeech] = useState('');
  const [examples, setExamples] = useState('');
  const [proficiency, setProficiency] = useState<ProficiencyLevel>(ProficiencyLevel.UNKNOWN);

  const modalBg = useColorModeValue('white', 'gray.800');
  const inputBg = useColorModeValue('white', 'gray.700');

  // フォームをリセットする
  const resetForm = () => {
    setWord('');
    setMeaning('');
    setCategory('');
    setPhonetic('');
    setPartOfSpeech('');
    setExamples('');
    setProficiency(ProficiencyLevel.UNKNOWN);
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
        wordData = {
          word: word.trim(),
          meaning: meaning.trim() || `${word}の意味`,
          examples: examples ? examples.split('\n').map(e => e.trim()).filter(e => e) : [],
          proficiency: proficiency,
          category: category.trim() || undefined,
          phonetic: phonetic.trim() || undefined,
          partOfSpeech: partOfSpeech.trim() || undefined,
        };
      } else {
        // バックエンドのGemini APIエンドポイントを呼び出す
        const response = await fetch(`/api/sqlite-proxy/gemini-word-info?word=${encodeURIComponent(word.trim())}`);
        
        if (!response.ok) {
          throw new Error('AI情報の取得に失敗しました');
        }
        
        const aiWordInfo = await response.json();
        
        wordData = {
          word: word.trim(),
          meaning: aiWordInfo.meaning || `${word}の意味`,
          examples: aiWordInfo.examples || [],
          examplesTranslation: aiWordInfo.examplesTranslation || [],
          etymology: aiWordInfo.etymology || undefined,
          relatedWords: aiWordInfo.relatedWords || [],
          phonetic: aiWordInfo.phonetic || undefined,
          partOfSpeech: aiWordInfo.partOfSpeech || undefined,
          proficiency: proficiency,
          category: category.trim() || undefined,
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
              <FormLabel>習得状態</FormLabel>
              <Select 
                value={proficiency} 
                onChange={(e) => setProficiency(e.target.value as ProficiencyLevel)} 
                bg={inputBg}
              >
                <option value={ProficiencyLevel.UNKNOWN}>未習得</option>
                <option value={ProficiencyLevel.LEARNING}>学習中</option>
                <option value={ProficiencyLevel.MASTERED}>習得済み</option>
              </Select>
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
            
            <Checkbox 
              isChecked={manualInput} 
              onChange={(e) => setManualInput(e.target.checked)}
              colorScheme="blue"
              alignSelf="flex-start"
            >
              手動で単語情報を入力する（チェックしない場合はAI生成）
            </Checkbox>
            
            {manualInput && (
              <>
                <FormControl>
                  <FormLabel>意味</FormLabel>
                  <Textarea
                    placeholder="単語の意味を入力"
                    value={meaning}
                    onChange={(e) => setMeaning(e.target.value)}
                    bg={inputBg}
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>発音記号（オプション）</FormLabel>
                  <Input
                    placeholder="発音記号を入力"
                    value={phonetic}
                    onChange={(e) => setPhonetic(e.target.value)}
                    bg={inputBg}
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>品詞（オプション）</FormLabel>
                  <Input
                    placeholder="品詞を入力"
                    value={partOfSpeech}
                    onChange={(e) => setPartOfSpeech(e.target.value)}
                    bg={inputBg}
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>例文（オプション、1行に1例文）</FormLabel>
                  <Textarea
                    placeholder="例文を入力（1行に1例文）"
                    value={examples}
                    onChange={(e) => setExamples(e.target.value)}
                    bg={inputBg}
                  />
                </FormControl>
              </>
            )}
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