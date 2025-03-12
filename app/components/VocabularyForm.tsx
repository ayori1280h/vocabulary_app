'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  useToast,
  Spinner,
  Text,
  Flex
} from '@chakra-ui/react';
import { createVocabularyItem } from '../utils/wordGenerator';
import { VocabularyItem } from '../models/types';

interface VocabularyFormProps {
  onAddWord: (item: VocabularyItem) => void;
}

export default function VocabularyForm({ onAddWord }: VocabularyFormProps) {
  const [word, setWord] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!word.trim()) {
      setError('単語を入力してください');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const newItem = await createVocabularyItem(word);
      onAddWord(newItem);
      setWord('');
      
      toast({
        title: '単語が追加されました',
        description: `"${word}"が単語リストに追加されました`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error creating vocabulary item:', error);
      setError('単語の追加中にエラーが発生しました');
      
      toast({
        title: 'エラー',
        description: '単語の追加中にエラーが発生しました',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Box as="form" onSubmit={handleSubmit} p={4} borderWidth="1px" borderRadius="lg" boxShadow="md">
      <VStack spacing={4} align="stretch">
        <FormControl isRequired isInvalid={!!error}>
          <FormLabel htmlFor="word">新しい単語</FormLabel>
          <Input
            id="word"
            placeholder="単語を入力してください"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            disabled={isLoading}
          />
          {error && <Text color="red.500" fontSize="sm" mt={1}>{error}</Text>}
        </FormControl>
        
        <Flex justifyContent="flex-end">
          <Button
            type="submit"
            colorScheme="blue"
            isLoading={isLoading}
            loadingText="生成中..."
            leftIcon={isLoading ? <Spinner size="sm" /> : undefined}
          >
            追加
          </Button>
        </Flex>
      </VStack>
    </Box>
  );
} 