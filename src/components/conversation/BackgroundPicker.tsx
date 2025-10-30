import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Palette, Check } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface BackgroundPickerProps {
  currentBackground: {
    type: 'color' | 'gradient' | 'image';
    value: string;
  };
  onSelect: (type: 'color' | 'gradient' | 'image', value: string) => void;
  trigger?: React.ReactNode;
}

// Predefined solid colors
const SOLID_COLORS = [
  { name: 'White', value: '#FFFFFF' },
  { name: 'Light Gray', value: '#F5F5F5' },
  { name: 'Lavender', value: '#E6E6FA' },
  { name: 'Mint', value: '#E0F8F1' },
  { name: 'Peach', value: '#FFE5D9' },
  { name: 'Sky Blue', value: '#E3F2FD' },
  { name: 'Pink', value: '#FCE4EC' },
  { name: 'Light Yellow', value: '#FFFDE7' },
  { name: 'Light Green', value: '#F1F8E9' },
  { name: 'Light Coral', value: '#FFCCBC' },
  { name: 'Light Purple', value: '#E1BEE7' },
  { name: 'Light Cyan', value: '#B2EBF2' },
];

// Predefined gradients (Messenger-style)
const GRADIENTS = [
  {
    name: 'Sunset',
    value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  {
    name: 'Ocean',
    value: 'linear-gradient(135deg, #2E3192 0%, #1BFFFF 100%)',
  },
  {
    name: 'Peach',
    value: 'linear-gradient(135deg, #FFDEE9 0%, #B5FFFC 100%)',
  },
  {
    name: 'Berry',
    value: 'linear-gradient(135deg, #F093FB 0%, #F5576C 100%)',
  },
  {
    name: 'Mint',
    value: 'linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%)',
  },
  {
    name: 'Rose',
    value: 'linear-gradient(135deg, #FA709A 0%, #FEE140 100%)',
  },
  {
    name: 'Purple Dream',
    value: 'linear-gradient(135deg, #A18CD1 0%, #FBC2EB 100%)',
  },
  {
    name: 'Fire',
    value: 'linear-gradient(135deg, #FF9A56 0%, #FF6A88 100%)',
  },
  {
    name: 'Sky',
    value: 'linear-gradient(135deg, #A8EDEA 0%, #FED6E3 100%)',
  },
  {
    name: 'Emerald',
    value: 'linear-gradient(135deg, #D299C2 0%, #FEF9D7 100%)',
  },
  {
    name: 'Night Fade',
    value: 'linear-gradient(135deg, #A9C9FF 0%, #FFBBEC 100%)',
  },
  {
    name: 'Orange',
    value: 'linear-gradient(135deg, #FFA751 0%, #FFE259 100%)',
  },
];

// Predefined background images
const BACKGROUND_IMAGES = [
  {
    name: 'Bubbles',
    url: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=800&auto=format&fit=crop',
  },
  {
    name: 'Abstract',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop',
  },
  {
    name: 'Pastel',
    url: 'https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?w=800&auto=format&fit=crop',
  },
  {
    name: 'Waves',
    url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop',
  },
  {
    name: 'Gradient Blur',
    url: 'https://images.unsplash.com/photo-1557682268-e3955ed5d83f?w=800&auto=format&fit=crop',
  },
  {
    name: 'Purple',
    url: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=800&auto=format&fit=crop',
  },
];

export const BackgroundPicker: React.FC<BackgroundPickerProps> = ({
  currentBackground,
  onSelect,
  trigger,
}) => {
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState(currentBackground.type);
  const [selectedValue, setSelectedValue] = useState(currentBackground.value);

  const handleSelect = (type: 'color' | 'gradient' | 'image', value: string) => {
    setSelectedType(type);
    setSelectedValue(value);
    onSelect(type, value);
    setOpen(false);
  };

  const isSelected = (type: string, value: string) => {
    return selectedType === type && selectedValue === value;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="gap-2">
            <Palette className="h-4 w-4" />
            Background
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Chọn Background Chat</DialogTitle>
          <DialogDescription>
            Tùy chỉnh giao diện cuộc trò chuyện với màu sắc, gradient hoặc hình ảnh
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="colors" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="colors">Màu sắc</TabsTrigger>
            <TabsTrigger value="gradients">Gradient</TabsTrigger>
            <TabsTrigger value="images">Hình ảnh</TabsTrigger>
          </TabsList>

          {/* Solid Colors */}
          <TabsContent value="colors">
            <ScrollArea className="h-[400px] pr-4">
              <div className="grid grid-cols-4 gap-3">
                {SOLID_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => handleSelect('color', color.value)}
                    className="relative aspect-square rounded-lg border-2 transition-all hover:scale-105"
                    style={{
                      backgroundColor: color.value,
                      borderColor: isSelected('color', color.value)
                        ? '#5865F2'
                        : '#E5E7EB',
                    }}
                  >
                    {isSelected('color', color.value) && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-lg">
                        <Check className="h-6 w-6 text-white drop-shadow-lg" />
                      </div>
                    )}
                    {/* <div className="absolute -bottom-6 left-0 right-0 text-center">
                      <span className="text-xs text-gray-600">{color.name}</span>
                    </div> */}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Gradients */}
          <TabsContent value="gradients">
            <ScrollArea className="h-[400px] pr-4">
              <div className="grid grid-cols-3 gap-3">
                {GRADIENTS.map((gradient) => (
                  <button
                    key={gradient.name}
                    onClick={() => handleSelect('gradient', gradient.value)}
                    className="relative aspect-square rounded-lg border-2 transition-all hover:scale-105"
                    style={{
                      background: gradient.value,
                      borderColor: isSelected('gradient', gradient.value)
                        ? '#5865F2'
                        : '#E5E7EB',
                    }}
                  >
                    {isSelected('gradient', gradient.value) && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-lg">
                        <Check className="h-6 w-6 text-white drop-shadow-lg" />
                      </div>
                    )}
                    {/* <div className="absolute -bottom-6 left-0 right-0 text-center">
                      <span className="text-xs text-gray-600">{gradient.name}</span>
                    </div> */}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Background Images */}
          <TabsContent value="images">
            <ScrollArea className="h-[400px] pr-4">
              <div className="grid grid-cols-3 gap-3">
                {BACKGROUND_IMAGES.map((image) => (
                  <button
                    key={image.url}
                    onClick={() => handleSelect('image', image.url)}
                    className="relative aspect-square rounded-lg border-2 transition-all hover:scale-105 overflow-hidden"
                    style={{
                      borderColor: isSelected('image', image.url)
                        ? '#5865F2'
                        : '#E5E7EB',
                    }}
                  >
                    <img
                      src={image.url}
                      alt={image.name}
                      className="w-full h-full object-cover"
                    />
                    {isSelected('image', image.url) && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                        <Check className="h-6 w-6 text-white drop-shadow-lg" />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <span className="text-xs text-white font-medium">
                        {image.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-gray-500">
            Thay đổi sẽ áp dụng cho tất cả thành viên
          </p>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

