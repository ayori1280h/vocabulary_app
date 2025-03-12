'use client';

import { ReactNode } from 'react';
import { Box, Flex, Text, Input, InputGroup, InputLeftElement, HStack, Grid, useColorModeValue } from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: ReactNode;
  activeCategory?: string;
  onCategoryChange?: (category: string) => void;
}

export default function Layout({ children, activeCategory = 'all', onCategoryChange }: LayoutProps) {
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const headerBgColor = useColorModeValue('blue.500', 'blue.600');

  return (
    <Box minH="100vh" bg={bgColor}>
      {/* ヘッダー */}
      <Flex
        as="header"
        align="center"
        justify="space-between"
        py={4}
        px={8}
        bg={headerBgColor}
        color="white"
        h="60px"
      >
        <Text fontSize="2xl" fontWeight="bold">
          Vocabank
        </Text>
        
        <InputGroup maxW="md">
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.400" />
          </InputLeftElement>
          <Input 
            placeholder="単語を検索..." 
            bg="white" 
            color="gray.700" 
            borderRadius="full"
            _placeholder={{ color: 'gray.400' }}
          />
        </InputGroup>
        
        <HStack spacing={4}>
          {/* ここにユーザーメニューなどを追加できます */}
        </HStack>
      </Flex>

      {/* メインコンテンツ */}
      <Flex pos="relative" h="calc(100vh - 60px)">
        {/* サイドバー */}
        <Sidebar activeCategory={activeCategory} onCategoryChange={onCategoryChange} />
        
        {/* メインコンテンツエリア */}
        <Box 
          w="full" 
          h="full" 
          p={5}
          overflowY="auto"
        >
          {children}
        </Box>
      </Flex>
    </Box>
  );
} 