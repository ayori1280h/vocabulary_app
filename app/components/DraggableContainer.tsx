'use client';

import { useState, useRef } from 'react';
import { Box, Text, Heading, VStack, useColorModeValue } from '@chakra-ui/react';
import { VocabularyItem } from '../models/types';
import VocabularyCard from './VocabularyCard';

interface DraggableContainerProps {
  id: string;
  title: string;
  items: VocabularyItem[];
  onDrop: (item: VocabularyItem, containerId: string) => void;
  onDelete?: (itemId: string) => void;
}

export default function DraggableContainer({ id, title, items, onDrop, onDelete }: DraggableContainerProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const dragOverColor = useColorModeValue('blue.50', 'blue.900');
  
  const handleDragStart = (e: React.DragEvent, item: VocabularyItem) => {
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  
  const handleDragLeave = () => {
    setIsDragOver(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    try {
      const itemData = e.dataTransfer.getData('application/json');
      const item = JSON.parse(itemData) as VocabularyItem;
      onDrop(item, id);
    } catch (error) {
      console.error('Error parsing dropped item:', error);
    }
  };
  
  // カードの削除を処理するハンドラー
  const handleDeleteItem = (itemId: string) => {
    if (onDelete) {
      onDelete(itemId);
    }
  };
  
  return (
    <Box
      ref={containerRef}
      p={4}
      borderWidth="1px"
      borderRadius="lg"
      borderColor={isDragOver ? 'blue.400' : borderColor}
      bg={isDragOver ? dragOverColor : bgColor}
      boxShadow="md"
      minH="300px"
      transition="all 0.2s"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Heading size="md" mb={4}>{title}</Heading>
      
      <VStack spacing={3} align="stretch">
        {items.length === 0 ? (
          <Text color="gray.500" textAlign="center" py={4}>
            ここにカードをドロップしてください
          </Text>
        ) : (
          items.map((item) => (
            <Box
              key={item.id}
              draggable
              onDragStart={(e) => handleDragStart(e, item)}
            >
              <VocabularyCard 
                item={item} 
                onDelete={handleDeleteItem}
              />
            </Box>
          ))
        )}
      </VStack>
    </Box>
  );
} 