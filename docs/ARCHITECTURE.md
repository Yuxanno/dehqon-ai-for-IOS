# 🏗️ Arxitektura — Dehqonjon loyihasi

## Структура проекта

```
farmer-app/
├── frontend/                    # React + TypeScript
│   ├── public/
│   │   ├── index.html
│   │   ├── manifest.json       # PWA манифест
│   │   └── icons/              # Иконки приложения
│   ├── src/
│   │   ├── components/         # UI компоненты
│   │   │   ├── common/         # Общие компоненты
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   └── Loader.tsx
│   │   │   ├── layout/         # Компоненты разметки
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── BottomNav.tsx      # Mobile-меню
│   │   │   │   └── PageContainer.tsx
│   │   │   ├── marketplace/    # Компоненты маркетплейса
│   │   │   │   ├── ProductCard.tsx
│   │   │   │   ├── ProductGrid.tsx
│   │   │   │   ├── CategoryFilter.tsx
│   │   │   │   ├── SearchBar.tsx
│   │   │   │   └── ProductDetail.tsx
│   │   │   ├── ai/             # Компоненты ИИ-чата
│   │   │   │   ├── ChatContainer.tsx
│   │   │   │   ├── ChatMessage.tsx
│   │   │   │   ├── ChatInput.tsx
│   │   │   │   ├── QuickActions.tsx
│   │   │   │   ├── DiagnosisCard.tsx
│   │   │   │   └── ImageUpload.tsx
│   │   │   └── profile/        # Компоненты профиля
│   │   │       ├── UserInfo.tsx
│   │   │       ├── MyListings.tsx
│   │   │       └── ChatHistory.tsx
│   │   ├── pages/              # Страницы
│   │   │   ├── MarketplacePage.tsx
│   │   │   ├── ProductPage.tsx
│   │   │   ├── AIConsultantPage.tsx
│   │   │   ├── ProfilePage.tsx
│   │   │   ├── CreateListingPage.tsx
│   │   │   └── SellerPage.tsx
│   │   ├── hooks/              # Кастомные хуки
│   │   │   ├── useProducts.ts
│   │   │   ├── useChat.ts
│   │   │   ├── useAuth.ts
│   │   │   └── useImageUpload.ts
│   │   ├── services/           # API сервисы
│   │   │   ├── api.ts          # Базовый API клиент
│   │   │   ├── products.ts
│   │   │   ├── chat.ts
│   │   │   └── auth.ts
│   │   ├── store/              # Состояние (Zustand)
│   │   │   ├── useAppStore.ts
│   │   │   ├── useProductStore.ts
│   │   │   └── useChatStore.ts
│   │   ├── types/              # TypeScript типы
│   │   │   ├── product.ts
│   │   │   ├── chat.ts
│   │   │   ├── user.ts
│   │   │   └── api.ts
│   │   ├── utils/              # Утилиты
│   │   │   ├── formatters.ts
│   │   │   ├── validators.ts
│   │   │   └── constants.ts
│   │   ├── styles/             # Глобальные стили
│   │   │   └── globals.css
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   ├── .env.example
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/                     # Python + FastAPI
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py             # Точка входа FastAPI
│   │   ├── config.py           # Конфигурация из .env
│   │   ├── routers/            # API роутеры
│   │   │   ├── __init__.py
│   │   │   ├── chat.py         # /api/chat
│   │   │   ├── products.py     # /api/products
│   │   │   ├── upload.py       # /api/upload-image
│   │   │   ├── orders.py       # /api/orders
│   │   │   └── auth.py         # /api/auth
│   │   ├── models/             # Pydantic модели
│   │   │   ├── __init__.py
│   │   │   ├── chat.py
│   │   │   ├── product.py
│   │   │   ├── user.py
│   │   │   └── order.py
│   │   ├── services/           # Бизнес-логика
│   │   │   ├── __init__.py
│   │   │   ├── ai_service.py   # Интеграция с AI API
│   │   │   ├── vision_service.py
│   │   │   ├── product_service.py
│   │   │   └── storage_service.py
│   │   ├── db/                 # База данных
│   │   │   ├── __init__.py
│   │   │   ├── database.py
│   │   │   └── models.py       # SQLAlchemy модели
│   │   └── utils/
│   │       ├── __init__.py
│   │       └── helpers.py
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_chat.py
│   │   └── test_products.py
│   ├── .env.example
│   ├── requirements.txt
│   └── Dockerfile
│
├── docs/                        # Документация
│   ├── PRODUCT_DESIGN.md
│   ├── ARCHITECTURE.md
│   └── API.md
│
├── .gitignore
├── docker-compose.yml
└── README.md
```

---

## 🔌 API Эндпоинты

### Chat API (`/api/chat`)

```
POST /api/chat/message
  Body: { message: string, conversation_id?: string }
  Response: { 
    response: string, 
    conversation_id: string,
    suggestions: string[],
    diagnosis?: { name: string, probability: number }[]
  }

POST /api/chat/upload-image
  Body: FormData { image: File, conversation_id: string }
  Response: { 
    analysis: string,
    diagnosis: { name: string, probability: number }[],
    recommendations: string[]
  }

GET /api/chat/history
  Response: { conversations: Conversation[] }

GET /api/chat/conversation/{id}
  Response: { messages: Message[] }
```

### Products API (`/api/products`)

```
GET /api/products
  Query: { category?, region?, min_price?, max_price?, search?, page?, limit? }
  Response: { products: Product[], total: number, page: number }

GET /api/products/{id}
  Response: Product

POST /api/products
  Body: CreateProductDTO
  Response: Product

PUT /api/products/{id}
  Body: UpdateProductDTO
  Response: Product

DELETE /api/products/{id}
  Response: { success: boolean }

GET /api/products/categories
  Response: { categories: Category[] }
```

### Upload API (`/api/upload`)

```
POST /api/upload/image
  Body: FormData { image: File }
  Response: { url: string, thumbnail_url: string }

POST /api/upload/images
  Body: FormData { images: File[] }
  Response: { urls: string[] }
```

### Orders API (`/api/orders`)

```
POST /api/orders
  Body: { product_id: string, message?: string }
  Response: Order

GET /api/orders
  Response: { orders: Order[] }

GET /api/orders/{id}
  Response: Order
```

### Auth API (`/api/auth`)

```
POST /api/auth/register
  Body: { phone: string, name: string, region: string }
  Response: { user: User, token: string }

POST /api/auth/login
  Body: { phone: string, code: string }
  Response: { user: User, token: string }

POST /api/auth/send-code
  Body: { phone: string }
  Response: { success: boolean }

GET /api/auth/me
  Response: User
```

---

## 🗄️ Модели данных

### Product

```typescript
interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: 'RUB';
  category: Category;
  images: string[];
  region: string;
  seller_id: string;
  seller: UserPreview;
  created_at: string;
  updated_at: string;
  views: number;
  status: 'active' | 'sold' | 'hidden';
}

type Category = 
  | 'seeds'      // Семена
  | 'fertilizers' // Удобрения
  | 'equipment'   // Техника
  | 'services'    // Услуги
  | 'animals'     // Животные
  | 'other';      // Другое
```

### Chat Message

```typescript
interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  image_url?: string;
  diagnosis?: Diagnosis[];
  suggestions?: string[];
  created_at: string;
}

interface Diagnosis {
  name: string;
  probability: number; // 0-100
  description: string;
  recommendations: string[];
}

interface Conversation {
  id: string;
  user_id: string;
  title: string;
  last_message: string;
  created_at: string;
  updated_at: string;
}
```

### User

```typescript
interface User {
  id: string;
  phone: string;
  name: string;
  avatar_url?: string;
  region: string;
  rating: number;
  reviews_count: number;
  products_count: number;
  created_at: string;
}
```

---

## 🔐 Переменные окружения

### Frontend (.env)

```env
# API
VITE_API_URL=http://localhost:8000/api

# Feature flags
VITE_ENABLE_VOICE_INPUT=true
VITE_ENABLE_OFFLINE_MODE=true
```

### Backend (.env)

```env
# AI APIs
TEXT_AI_API_KEY=your_text_ai_api_key
VISION_AI_API_KEY=your_vision_ai_api_key
AI_MODEL=gpt-4o-mini

# Database
MONGODB_URL=mongodb+srv://user:password@cluster.mongodb.net/dehqonjon

# Storage (S3-compatible)
STORAGE_URL=https://storage.example.com
STORAGE_ACCESS_KEY=your_access_key
STORAGE_SECRET_KEY=your_secret_key
STORAGE_BUCKET=dehqonjon-images

# Auth
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=7d

# App
DEBUG=false
CORS_ORIGINS=http://localhost:5173,https://dehqonjon.uz
```

---

## 🐳 Docker Compose

```yaml
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    environment:
      - VITE_API_URL=http://backend:8000/api
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    env_file:
      - ./backend/.env

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

---

## 📱 PWA Конфигурация

```json
{
  "name": "Dehqonjon",
  "short_name": "Dehqonjon",
  "description": "Fermerlar uchun marketplace va AI-yordamchi",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#fafaf9",
  "theme_color": "#22c55e",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## 🔄 Состояние приложения (Zustand)

```typescript
// useAppStore.ts
interface AppState {
  // UI
  isLoading: boolean;
  activeTab: 'marketplace' | 'ai' | 'profile';
  
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  
  // Actions
  setActiveTab: (tab: AppState['activeTab']) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
}

// useChatStore.ts
interface ChatState {
  messages: ChatMessage[];
  conversationId: string | null;
  isTyping: boolean;
  
  addMessage: (message: ChatMessage) => void;
  setTyping: (isTyping: boolean) => void;
  clearChat: () => void;
}

// useProductStore.ts
interface ProductState {
  products: Product[];
  filters: ProductFilters;
  isLoading: boolean;
  
  setProducts: (products: Product[]) => void;
  setFilters: (filters: Partial<ProductFilters>) => void;
  fetchProducts: () => Promise<void>;
}
```
