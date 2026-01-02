import { registerPlugin } from '@capacitor/core';

// ==================== TYPE DEFINITIONS ====================

export interface User {
  id: string;
  phone: string;
  name: string | null;
  username: string | null;
  avatar_url: string | null;
  region: string | null;
  role: string;
  seller_name: string | null;
  seller_type: string | null;
  is_verified_seller: boolean;
}

export interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  currency: string;
  category: string;
  images: string[];
  region: string | null;
  status: string;
  views: number;
  seller_id: string;
  seller_name: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  role: string;
  content: string;
  image_url?: string;
  created_at: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

export interface Diagnosis {
  name: string;
  probability: number;
  description: string;
  recommendations: string[];
}

// ==================== AI PLUGIN INTERFACE ====================

interface AiPluginInterface {
  sendMessage(options: {
    message: string;
    conversationId?: string;
    history?: Array<{ role: string; content: string }>;
  }): Promise<{
    response: string;
    conversation_id: string;
    suggestions: string[];
  }>;

  analyzeImage(options: {
    imageBase64: string;
    conversationId?: string;
    message?: string;
  }): Promise<{
    analysis: string;
    diagnosis: Diagnosis[];
    recommendations: string[];
    confidence: number;
  }>;
}

// ==================== DATABASE PLUGIN INTERFACE ====================

interface DatabasePluginInterface {
  // Auth
  register(options: {
    phone: string;
    password: string;
    name?: string;
  }): Promise<{ user: User; token: string }>;

  login(options: {
    phone: string;
    password: string;
  }): Promise<{ user: User; token: string }>;

  getMe(options?: { token?: string }): Promise<User>;

  updateProfile(options: {
    token?: string;
    name?: string;
    region?: string;
    username?: string;
  }): Promise<User>;

  becomeSeller(options: {
    token?: string;
    seller_name: string;
    region: string;
    seller_type: string;
  }): Promise<User>;

  logout(): Promise<{ success: boolean }>;

  getStoredTokenMethod(): Promise<{ token: string | null }>;

  // Products
  getProducts(options?: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    products: Product[];
    total: number;
    page: number;
    pages: number;
  }>;

  getProductById(options: { id: string }): Promise<Product>;

  createProduct(options: {
    token?: string;
    title: string;
    description?: string;
    price: number;
    category: string;
    images?: string[];
    region?: string;
  }): Promise<Product>;

  updateProduct(options: {
    token?: string;
    id: string;
    title?: string;
    description?: string;
    price?: number;
    category?: string;
    images?: string[];
    status?: string;
  }): Promise<Product>;

  deleteProduct(options: {
    token?: string;
    id: string;
  }): Promise<{ success: boolean }>;

  // Favorites
  getFavorites(options?: { token?: string }): Promise<{
    favorites: Product[];
    total: number;
  }>;

  addFavorite(options: {
    token?: string;
    product_id: string;
  }): Promise<{ success: boolean }>;

  removeFavorite(options: {
    token?: string;
    product_id: string;
  }): Promise<{ success: boolean }>;

  checkFavorite(options: {
    token?: string;
    product_id: string;
  }): Promise<{ is_favorite: boolean }>;

  // Chat Sessions
  createChatSession(options: {
    token?: string;
    title?: string;
  }): Promise<ChatSession>;

  getChatSessions(options?: { token?: string }): Promise<{
    sessions: ChatSession[];
  }>;

  getChatSession(options: {
    token?: string;
    sessionId: string;
  }): Promise<ChatSession>;

  addChatMessage(options: {
    token?: string;
    sessionId: string;
    message: ChatMessage;
  }): Promise<{ success: boolean }>;

  deleteChatSession(options: {
    token?: string;
    sessionId: string;
  }): Promise<{ success: boolean }>;
}

// ==================== REGISTER PLUGINS ====================

const AiPlugin = registerPlugin<AiPluginInterface>('AiPlugin');
const DatabasePlugin = registerPlugin<DatabasePluginInterface>('DatabasePlugin');

// ==================== NATIVE API WRAPPER ====================

/**
 * Native API - все вызовы идут через Kotlin Native Modules
 * Никаких HTTP запросов к внешнему бэкенду!
 */
export const NativeApi = {
  // ==================== AI ====================
  
  ai: {
    /**
     * Отправить сообщение AI ассистенту
     */
    sendMessage: async (
      message: string,
      conversationId?: string,
      history?: Array<{ role: string; content: string }>
    ) => {
      return AiPlugin.sendMessage({ message, conversationId, history });
    },

    /**
     * Анализ изображения растения
     */
    analyzeImage: async (
      imageBase64: string,
      conversationId?: string,
      message?: string
    ) => {
      return AiPlugin.analyzeImage({ imageBase64, conversationId, message });
    },
  },

  // ==================== AUTH ====================
  
  auth: {
    /**
     * Регистрация нового пользователя
     */
    register: async (phone: string, password: string, name?: string) => {
      return DatabasePlugin.register({ phone, password, name });
    },

    /**
     * Вход в систему
     */
    login: async (phone: string, password: string) => {
      return DatabasePlugin.login({ phone, password });
    },

    /**
     * Получить текущего пользователя
     */
    getMe: async (token?: string) => {
      return DatabasePlugin.getMe({ token });
    },

    /**
     * Обновить профиль
     */
    updateProfile: async (
      data: { name?: string; region?: string; username?: string },
      token?: string
    ) => {
      return DatabasePlugin.updateProfile({ ...data, token });
    },

    /**
     * Стать продавцом
     */
    becomeSeller: async (
      data: { seller_name: string; region: string; seller_type: string },
      token?: string
    ) => {
      return DatabasePlugin.becomeSeller({ ...data, token });
    },

    /**
     * Выход из системы
     */
    logout: async () => {
      return DatabasePlugin.logout();
    },

    /**
     * Получить сохранённый токен
     */
    getStoredToken: async () => {
      const result = await DatabasePlugin.getStoredTokenMethod();
      return result.token;
    },
  },

  // ==================== PRODUCTS ====================
  
  products: {
    /**
     * Получить список продуктов
     */
    getAll: async (params?: {
      category?: string;
      search?: string;
      page?: number;
    }) => {
      return DatabasePlugin.getProducts(params);
    },

    /**
     * Получить продукт по ID
     */
    getById: async (id: string) => {
      return DatabasePlugin.getProductById({ id });
    },

    /**
     * Создать продукт
     */
    create: async (
      data: {
        title: string;
        description?: string;
        price: number;
        category: string;
        images?: string[];
        region?: string;
      },
      token?: string
    ) => {
      return DatabasePlugin.createProduct({ ...data, token });
    },

    /**
     * Обновить продукт
     */
    update: async (
      id: string,
      data: {
        title?: string;
        description?: string;
        price?: number;
        category?: string;
        images?: string[];
        status?: string;
      },
      token?: string
    ) => {
      return DatabasePlugin.updateProduct({ id, ...data, token });
    },

    /**
     * Удалить продукт
     */
    delete: async (id: string, token?: string) => {
      return DatabasePlugin.deleteProduct({ id, token });
    },
  },

  // ==================== FAVORITES ====================
  
  favorites: {
    /**
     * Получить избранное
     */
    getAll: async (token?: string) => {
      return DatabasePlugin.getFavorites({ token });
    },

    /**
     * Добавить в избранное
     */
    add: async (productId: string, token?: string) => {
      return DatabasePlugin.addFavorite({ product_id: productId, token });
    },

    /**
     * Удалить из избранного
     */
    remove: async (productId: string, token?: string) => {
      return DatabasePlugin.removeFavorite({ product_id: productId, token });
    },

    /**
     * Проверить, в избранном ли продукт
     */
    check: async (productId: string, token?: string) => {
      return DatabasePlugin.checkFavorite({ product_id: productId, token });
    },
  },

  // ==================== CHAT ====================
  
  chat: {
    /**
     * Создать сессию чата
     */
    createSession: async (title?: string, token?: string) => {
      return DatabasePlugin.createChatSession({ title, token });
    },

    /**
     * Получить все сессии
     */
    getSessions: async (token?: string) => {
      return DatabasePlugin.getChatSessions({ token });
    },

    /**
     * Получить сессию по ID
     */
    getSession: async (sessionId: string, token?: string) => {
      return DatabasePlugin.getChatSession({ sessionId, token });
    },

    /**
     * Добавить сообщение в сессию
     */
    addMessage: async (
      sessionId: string,
      message: ChatMessage,
      token?: string
    ) => {
      return DatabasePlugin.addChatMessage({ sessionId, message, token });
    },

    /**
     * Удалить сессию
     */
    deleteSession: async (sessionId: string, token?: string) => {
      return DatabasePlugin.deleteChatSession({ sessionId, token });
    },
  },
};

export default NativeApi;
