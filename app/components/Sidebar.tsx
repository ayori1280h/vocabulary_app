'use client';

import { Box, VStack, Text, Button, Progress, Flex, useColorModeValue } from '@chakra-ui/react';
import { ProficiencyLevel } from '../models/types';
import { getVocabularyItems } from '../utils/storage';
import { useEffect, useState } from 'react';

interface SidebarProps {
  activeCategory?: string;
  onCategoryChange?: (category: string) => void;
}

export default function Sidebar({ activeCategory = 'all', onCategoryChange }: SidebarProps) {
  const [learntWords, setLearntWords] = useState(0);
  const [totalWords, setTotalWords] = useState(0);
  
  const bgColor = useColorModeValue('gray.100', 'gray.800');
  const activeItemBg = useColorModeValue('blue.50', 'blue.900');
  const itemHoverBg = useColorModeValue('gray.200', 'gray.700');
  
  // 単語データからの統計情報の取得
  useEffect(() => {
    const items = getVocabularyItems();
    const total = items.length;
    const learnt = items.filter(item => item.proficiency === ProficiencyLevel.MASTERED).length;
    
    setTotalWords(total);
    setLearntWords(learnt);
  }, []);
  
  const progressPercentage = totalWords > 0 ? (learntWords / totalWords) * 100 : 0;
  
  const categories = [
    { id: 'all', name: '📚 全ての単語', isActive: activeCategory === 'all' },
    { id: 'unknown', name: '🔄 未習得', isActive: activeCategory === 'unknown' },
    { id: 'learning', name: '📝 習得中', isActive: activeCategory === 'learning' },
    { id: 'mastered', name: '✅ 習得済み', isActive: activeCategory === 'mastered' },
  ];
  
  const handleCategoryClick = (categoryId: string) => {
    if (onCategoryChange) {
      onCategoryChange(categoryId);
    }
  };
  
  return (
    <Box
      as="aside"
      w="240px"
      h="full"
      bg={bgColor}
      borderRightWidth="1px"
      borderRightColor={useColorModeValue('gray.200', 'gray.700')}
      pt={6}
      px={4}
      overflowY="auto"
      css={{
        '&::-webkit-scrollbar': {
          width: '4px',
        },
        '&::-webkit-scrollbar-track': {
          background: useColorModeValue('gray.100', 'gray.700'),
        },
        '&::-webkit-scrollbar-thumb': {
          background: useColorModeValue('gray.300', 'gray.600'),
          borderRadius: '2px',
        },
      }}
    >
      <Text fontWeight="bold" fontSize="lg" mb={4}>
        カテゴリー
      </Text>
      
      <VStack spacing={2} align="stretch">
        {categories.map((category) => (
          <Button
            key={category.id}
            bg={category.isActive ? activeItemBg : 'transparent'}
            color="gray.700"
            justifyContent="flex-start"
            px={5}
            h="40px"
            borderRadius="md"
            fontWeight={category.isActive ? 'semibold' : 'normal'}
            _hover={{ bg: category.isActive ? activeItemBg : itemHoverBg }}
            variant="ghost"
            onClick={() => handleCategoryClick(category.id)}
          >
            {category.name}
          </Button>
        ))}
      </VStack>
      
      <Box mt={12}>
        <Text mb={2} fontSize="sm" fontWeight="medium">
          学習進捗
        </Text>
        <Progress value={progressPercentage} size="sm" colorScheme="blue" borderRadius="full" />
        <Text mt={2} fontSize="xs" color="gray.600">
          {learntWords}/{totalWords} 単語習得
        </Text>
      </Box>
    </Box>
  );
} 