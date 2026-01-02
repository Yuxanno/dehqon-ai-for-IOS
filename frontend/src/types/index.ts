// Product types
export type Category = 
  | 'seeds' 
  | 'fertilizers' 
  | 'equipment' 
  | 'services' 
  | 'animals'
  | 'fruits_vegetables'
  | 'other';

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: 'UZS' | 'USD' | 'RUB';
  category: Category;
  images: string[];
  region: string;
  sellerId: string;
  seller: UserPreview;
  createdAt: string;
  views: number;
  status: 'active' | 'sold' | 'hidden' | 'archived';
}

export interface UserPreview {
  id: string;
  name: string;
  avatarUrl?: string;
  rating: number;
  reviewsCount: number;
}

// Chat types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  diagnosis?: Diagnosis[];
  suggestions?: string[];
  createdAt: string;
}

export interface Diagnosis {
  name: string;
  probability: number;
  description: string;
  recommendations: string[];
}

export interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  createdAt: string;
}

// User types
export interface User {
  id: string;
  phone: string;
  name: string;
  avatarUrl?: string;
  region: string;
  rating: number;
  reviewsCount: number;
  productsCount: number;
}

// Category labels
export const CATEGORY_LABELS: Record<Category, string> = {
  seeds: 'Семена',
  fertilizers: 'Удобрения',
  equipment: 'Техника',
  services: 'Услуги',
  animals: 'Животные',
  fruits_vegetables: 'Фрукты и овощи',
  other: 'Другое',
};

export const CATEGORY_ICONS: Record<Category, string> = {
  seeds: '🌱',
  fertilizers: '🧪',
  equipment: '🚜',
  services: '🔧',
  animals: '🐄',
  fruits_vegetables: '🍎',
  other: '📦',
};
