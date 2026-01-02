/**
 * API Service - Unified interface for backend operations
 * 
 * На Android: все вызовы идут через Kotlin Native Modules (embedded backend)
 * На Web: используется HTTP API (для разработки)
 * 
 * Это позволяет:
 * - Один APK с полным backend внутри
 * - Интернет только для MongoDB Data API и AI API
 * - Без локального HTTP сервера
 */

import { Capacitor } from '@capacitor/core';
import { NativeApi, User, Product, ChatSession, ChatMessage, Diagnosis } from '../native/NativeApi';

// Определяем, работаем ли мы на нативной платформе
const isNative = Capacitor.isNativePlatform();
console.log('[API] Platform:', Capacitor.getPlatform(), 'isNative:', isNative);

// Fallback API URL для веб-разработки
const WEB_API_URL = import.meta.env.VITE_API_URL || 'https://dehqon-ai-backend.onrender.com/api';

// ==================== WEB API HELPERS (только для разработки) ====================

async function webApiRequest<T>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: unknown;
    token?: string | null;
  } = {}
): Promise<T> {
  const { method = 'GET', body, token } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${WEB_API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'Произошла ошибка');
  }

  return data;
}

// ==================== AUTH API ====================

export const authApi = {
  register: async (phone: string, password: string, name?: string) => {
    if (isNative) {
      return NativeApi.auth.register(phone, password, name);
    }
    return webApiRequest<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: { phone, password, name },
    });
  },

  login: async (phone: string, password: string) => {
    if (isNative) {
      return NativeApi.auth.login(phone, password);
    }
    return webApiRequest<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: { phone, password },
    });
  },

  getMe: async (token: string) => {
    if (isNative) {
      return NativeApi.auth.getMe(token);
    }
    return webApiRequest<User>('/auth/me', { token });
  },

  updateProfile: async (
    token: string,
    data: { name?: string; region?: string; username?: string }
  ) => {
    if (isNative) {
      return NativeApi.auth.updateProfile(data, token);
    }
    return webApiRequest('/auth/me', {
      method: 'PUT',
      token,
      body: data,
    });
  },

  searchUsers: async (token: string, query: string) => {
    if (isNative) {
      // TODO: Implement in DatabasePlugin if needed
      return [];
    }
    return webApiRequest<Array<{
      id: string;
      name: string | null;
      username: string | null;
      avatar_url: string | null;
      region: string | null;
    }>>(`/auth/users/search?q=${encodeURIComponent(query)}`, { token });
  },

  becomeSeller: async (
    token: string,
    data: { seller_name: string; region: string; seller_type: string }
  ) => {
    if (isNative) {
      return NativeApi.auth.becomeSeller(data, token);
    }
    return webApiRequest('/auth/become-seller', {
      method: 'POST',
      token,
      body: data,
    });
  },

  logout: async () => {
    if (isNative) {
      return NativeApi.auth.logout();
    }
    // Web: just clear local storage
    localStorage.removeItem('token');
    return { success: true };
  },

  getStoredToken: async () => {
    if (isNative) {
      return NativeApi.auth.getStoredToken();
    }
    return localStorage.getItem('token');
  },
};

// ==================== FAVORITES API ====================

export const favoritesApi = {
  getAll: async (token: string) => {
    if (isNative) {
      return NativeApi.favorites.getAll(token);
    }
    return webApiRequest<{ favorites: Product[]; total: number }>('/favorites', { token });
  },

  add: async (token: string, productId: string) => {
    if (isNative) {
      return NativeApi.favorites.add(productId, token);
    }
    return webApiRequest('/favorites', {
      method: 'POST',
      token,
      body: { product_id: productId },
    });
  },

  remove: async (token: string, productId: string) => {
    if (isNative) {
      return NativeApi.favorites.remove(productId, token);
    }
    return webApiRequest(`/favorites/${productId}`, {
      method: 'DELETE',
      token,
    });
  },

  check: async (token: string, productId: string) => {
    if (isNative) {
      return NativeApi.favorites.check(productId, token);
    }
    return webApiRequest<{ is_favorite: boolean }>(`/favorites/check/${productId}`, { token });
  },
};

// ==================== CHAT API ====================

export const chatApi = {
  sendMessage: async (
    message: string,
    conversationId?: string,
    history?: Array<{ role: string; content: string }>
  ) => {
    console.log('[chatApi.sendMessage] isNative:', isNative, 'message:', message);
    if (isNative) {
      try {
        console.log('[chatApi.sendMessage] Calling NativeApi.ai.sendMessage...');
        const result = await NativeApi.ai.sendMessage(message, conversationId, history);
        console.log('[chatApi.sendMessage] Result:', result);
        return {
          response: result.response,
          conversation_id: result.conversation_id,
          suggestions: result.suggestions,
        };
      } catch (error) {
        console.error('[chatApi.sendMessage] Native error:', error);
        throw error;
      }
    }
    console.log('[chatApi.sendMessage] Using web API...');
    return webApiRequest<{
      response: string;
      conversation_id: string;
      suggestions: string[];
      diagnosis?: Diagnosis[];
      warning?: string;
    }>('/chat/message', {
      method: 'POST',
      body: { message, conversation_id: conversationId, history },
    });
  },

  uploadImage: async (file: File, conversationId: string) => {
    if (isNative) {
      // Convert file to base64
      const base64 = await fileToBase64(file);
      const result = await NativeApi.ai.analyzeImage(base64, conversationId);
      return {
        analysis: result.analysis,
        diagnosis: result.diagnosis,
        recommendations: result.recommendations,
        confidence: result.confidence,
      };
    }
    
    const formData = new FormData();
    formData.append('image', file);
    formData.append('conversation_id', conversationId);

    const response = await fetch(`${WEB_API_URL}/chat/upload-image`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    return response.json() as Promise<{
      analysis: string;
      diagnosis: Diagnosis[];
      recommendations: string[];
      confidence: number;
    }>;
  },

  // Session management
  createSession: async (token: string, title?: string) => {
    if (isNative) {
      return NativeApi.chat.createSession(title, token);
    }
    return webApiRequest<ChatSession>('/chat/sessions', {
      method: 'POST',
      token,
      body: { title: title || 'Yangi chat' },
    });
  },

  getSessions: async (token: string) => {
    if (isNative) {
      const result = await NativeApi.chat.getSessions(token);
      return result.sessions;
    }
    return webApiRequest<ChatSession[]>('/chat/sessions', { token });
  },

  getSession: async (token: string, sessionId: string) => {
    if (isNative) {
      return NativeApi.chat.getSession(sessionId, token);
    }
    return webApiRequest<ChatSession>(`/chat/sessions/${sessionId}`, { token });
  },

  addMessage: async (token: string, sessionId: string, message: ChatMessage) => {
    if (isNative) {
      return NativeApi.chat.addMessage(sessionId, message, token);
    }
    return webApiRequest('/chat/sessions/' + sessionId + '/messages', {
      method: 'POST',
      token,
      body: message,
    });
  },

  deleteSession: async (token: string, sessionId: string) => {
    if (isNative) {
      return NativeApi.chat.deleteSession(sessionId, token);
    }
    return webApiRequest(`/chat/sessions/${sessionId}`, {
      method: 'DELETE',
      token,
    });
  },
};

// ==================== PRODUCTS API ====================

export const productsApi = {
  getAll: async (params?: { category?: string; search?: string; page?: number }) => {
    if (isNative) {
      return NativeApi.products.getAll(params);
    }
    return webApiRequest<{
      products: Product[];
      total: number;
      page: number;
      pages: number;
    }>(`/products?${new URLSearchParams(params as Record<string, string> || {}).toString()}`);
  },

  getById: async (id: string) => {
    if (isNative) {
      return NativeApi.products.getById(id);
    }
    return webApiRequest<Product>(`/products/${id}`);
  },

  create: async (
    token: string,
    data: {
      title: string;
      description?: string;
      price: number;
      category: string;
      images?: string[];
      region?: string;
    }
  ) => {
    if (isNative) {
      return NativeApi.products.create(data, token);
    }
    return webApiRequest('/products', {
      method: 'POST',
      token,
      body: data,
    });
  },

  update: async (
    token: string,
    id: string,
    data: {
      title?: string;
      description?: string;
      price?: number;
      category?: string;
      images?: string[];
      status?: string;
    }
  ) => {
    if (isNative) {
      return NativeApi.products.update(id, data, token);
    }
    return webApiRequest(`/products/${id}`, {
      method: 'PUT',
      token,
      body: data,
    });
  },

  delete: async (token: string, id: string) => {
    if (isNative) {
      return NativeApi.products.delete(id, token);
    }
    return webApiRequest(`/products/${id}`, {
      method: 'DELETE',
      token,
    });
  },
};

// ==================== CONVERSATIONS API ====================

export interface ConversationMessage {
  id: string;
  sender_id: string;
  content: string;
  product_id?: string;
  created_at: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participant_ids: string[];
  participant_names: Record<string, string>;
  last_message?: string;
  last_message_at?: string;
  product_id?: string;
  product_title?: string;
  unread_count: number;
  created_at: string;
}

export interface ConversationDetail {
  id: string;
  participant_ids: string[];
  participant_names: Record<string, string>;
  messages: ConversationMessage[];
  product_id?: string;
  product_title?: string;
}

export const conversationsApi = {
  // Start or continue a conversation
  start: async (
    token: string,
    recipientId: string,
    message: string,
    productId?: string
  ): Promise<Conversation> => {
    return webApiRequest('/conversations/start', {
      method: 'POST',
      token,
      body: {
        recipient_id: recipientId,
        message,
        product_id: productId,
      },
    });
  },

  // Get all conversations
  getAll: async (token: string): Promise<Conversation[]> => {
    return webApiRequest('/conversations', { token });
  },

  // Get single conversation with messages
  getById: async (token: string, conversationId: string): Promise<ConversationDetail> => {
    return webApiRequest(`/conversations/${conversationId}`, { token });
  },

  // Send message in conversation
  sendMessage: async (
    token: string,
    conversationId: string,
    content: string,
    productId?: string
  ): Promise<ConversationMessage> => {
    return webApiRequest(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      token,
      body: { content, product_id: productId },
    });
  },
};

// ==================== HELPERS ====================

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data:image/...;base64, prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
  });
}

// Re-export types
export type { User, Product, ChatSession, ChatMessage, Diagnosis };
