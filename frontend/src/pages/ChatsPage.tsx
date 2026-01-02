import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, MessageCircle, Package, User, Send, Check, CheckCheck } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguageStore } from '../store/useLanguageStore';
import { useAuthStore } from '../store/useAuthStore';
import { conversationsApi, Conversation, ConversationDetail, ConversationMessage, productsApi } from '../services/api';
import clsx from 'clsx';

export default function ChatsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, language } = useLanguageStore();
  const { token, isAuthenticated, user } = useAuthStore();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Active conversation state
  const [activeConversation, setActiveConversation] = useState<ConversationDetail | null>(null);
  const [activeLoading, setActiveLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check URL params for seller/product
  const sellerIdParam = searchParams.get('seller');
  const productIdParam = searchParams.get('product');

  useEffect(() => {
    if (isAuthenticated && token) {
      loadConversations();
    }
  }, [isAuthenticated, token]);

  // Handle seller param - create/open conversation
  useEffect(() => {
    if (sellerIdParam && token && !loading) {
      handleStartConversation(sellerIdParam, productIdParam || undefined);
    }
  }, [sellerIdParam, productIdParam, token, loading]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages]);

  const loadConversations = async () => {
    if (!token) return;
    
    try {
      const data = await conversationsApi.getAll(token);
      setConversations(data);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartConversation = async (sellerId: string, productId?: string) => {
    if (!token) return;
    
    // Check if conversation already exists
    const existing = conversations.find(c => 
      c.participant_ids.includes(sellerId) && 
      (productId ? c.product_id === productId : true)
    );
    
    if (existing) {
      // Open existing conversation
      openConversation(existing.id);
      // Clear URL params
      setSearchParams({});
      return;
    }
    
    // Get product info for initial message
    let productTitle = '';
    if (productId) {
      try {
        const product = await productsApi.getById(productId);
        productTitle = product.title;
      } catch (err) {
        console.error('Failed to get product:', err);
      }
    }
    
    // Create new conversation with initial message
    setActiveLoading(true);
    try {
      const initialMessage = productTitle
        ? (language === 'uz' 
            ? `Salom! Men "${productTitle}" e'loniga qiziqyapman.`
            : `Здравствуйте! Меня интересует объявление "${productTitle}".`)
        : (language === 'uz' ? 'Salom!' : 'Здравствуйте!');
      
      const newConv = await conversationsApi.start(token, sellerId, initialMessage, productId);
      
      // Reload conversations list
      await loadConversations();
      
      // Open the new conversation
      openConversation(newConv.id);
      
      // Clear URL params
      setSearchParams({});
    } catch (err) {
      console.error('Failed to start conversation:', err);
    } finally {
      setActiveLoading(false);
    }
  };

  const openConversation = async (conversationId: string) => {
    if (!token) return;
    
    setActiveLoading(true);
    try {
      const data = await conversationsApi.getById(token, conversationId);
      setActiveConversation(data);
      
      // Update unread count in list
      setConversations(prev => prev.map(c => 
        c.id === conversationId ? { ...c, unread_count: 0 } : c
      ));
      
      // Focus input
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (err) {
      console.error('Failed to load conversation:', err);
    } finally {
      setActiveLoading(false);
    }
  };

  const closeConversation = () => {
    setActiveConversation(null);
  };

  const handleSend = async () => {
    if (!message.trim() || !activeConversation || !token || sending) return;
    
    const text = message.trim();
    setMessage('');
    setSending(true);
    
    // Optimistic update
    const tempMessage: ConversationMessage = {
      id: Date.now().toString(),
      sender_id: user?.id || '',
      content: text,
      created_at: new Date().toISOString(),
      read: false,
    };
    
    setActiveConversation(prev => prev ? {
      ...prev,
      messages: [...prev.messages, tempMessage],
    } : null);
    
    try {
      const newMessage = await conversationsApi.sendMessage(token, activeConversation.id, text);
      
      // Replace temp message with real one
      setActiveConversation(prev => prev ? {
        ...prev,
        messages: prev.messages.map(m => 
          m.id === tempMessage.id ? newMessage : m
        ),
      } : null);
      
      // Update conversation in list
      setConversations(prev => prev.map(c => 
        c.id === activeConversation.id 
          ? { ...c, last_message: text, last_message_at: newMessage.created_at }
          : c
      ));
    } catch (err) {
      console.error('Failed to send message:', err);
      // Remove temp message on error
      setActiveConversation(prev => prev ? {
        ...prev,
        messages: prev.messages.filter(m => m.id !== tempMessage.id),
      } : null);
      setMessage(text);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getOtherParticipantName = (conv: Conversation | ConversationDetail) => {
    if (!user) return 'User';
    const otherId = conv.participant_ids.find(id => id !== user.id);
    return otherId ? conv.participant_names[otherId] || 'User' : 'User';
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString(language === 'uz' ? 'uz-UZ' : 'ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    if (days === 1) {
      return language === 'uz' ? 'Kecha' : 'Вчера';
    }
    if (days < 7) {
      return `${days} ${language === 'uz' ? 'kun' : 'дн.'}`;
    }
    return date.toLocaleDateString(language === 'uz' ? 'uz-UZ' : 'ru-RU', {
      day: 'numeric',
      month: 'short',
    });
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(language === 'uz' ? 'uz-UZ' : 'ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isAuthenticated) {
    navigate('/profile');
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-earth-50">
      {/* Header */}
      <div className="bg-white border-b border-earth-100 sticky top-0 z-10">
        <div className="container-app py-4 flex items-center gap-4">
          <button 
            onClick={() => activeConversation ? closeConversation() : navigate(-1)}
            className="p-2 -ml-2 hover:bg-earth-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-earth-600" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-earth-900 truncate">
              {activeConversation ? getOtherParticipantName(activeConversation) : t.chats}
            </h1>
            {activeConversation?.product_title && (
              <p className="text-xs text-earth-500 truncate flex items-center gap-1">
                <Package className="w-3 h-3" />
                {activeConversation.product_title}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {activeConversation ? (
        // Active conversation view
        <>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {activeConversation.messages.map((msg) => {
              const isOwn = msg.sender_id === user?.id;
              return (
                <div
                  key={msg.id}
                  className={clsx(
                    'flex mb-3',
                    isOwn ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={clsx(
                      'max-w-[75%] px-4 py-2.5 rounded-2xl',
                      isOwn
                        ? 'bg-primary-500 text-white rounded-br-md'
                        : 'bg-white text-earth-900 rounded-bl-md shadow-sm'
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    <div
                      className={clsx(
                        'flex items-center justify-end gap-1 mt-1',
                        isOwn ? 'text-primary-100' : 'text-earth-400'
                      )}
                    >
                      <span className="text-[10px]">{formatMessageTime(msg.created_at)}</span>
                      {/* Read status - only for own messages */}
                      {isOwn && (
                        msg.read ? (
                          <CheckCheck className="w-3.5 h-3.5 text-blue-300" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="bg-white border-t border-earth-200 p-3">
            <div className="flex items-center gap-2 max-w-3xl mx-auto">
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={language === 'uz' ? 'Xabar yozing...' : 'Напишите сообщение...'}
                className="flex-1 h-11 px-4 rounded-full bg-earth-100 text-earth-900 placeholder:text-earth-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                onClick={handleSend}
                disabled={!message.trim() || sending}
                className={clsx(
                  'w-11 h-11 rounded-full flex items-center justify-center transition-colors',
                  message.trim() && !sending
                    ? 'bg-primary-500 text-white hover:bg-primary-600'
                    : 'bg-earth-200 text-earth-400'
                )}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </>
      ) : (
        // Conversations list
        <div className="flex-1 overflow-y-auto">
          <div className="container-app py-4">
            {loading || activeLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-earth-100 flex items-center justify-center">
                  <MessageCircle className="w-10 h-10 text-earth-300" />
                </div>
                <p className="text-earth-600 text-lg font-medium">
                  {language === 'uz' ? "Hozircha xabarlar yo'q" : 'Пока нет сообщений'}
                </p>
                <p className="text-earth-400 text-sm mt-2">
                  {language === 'uz' 
                    ? "E'lonlarga yozing va sotuvchilar bilan bog'laning"
                    : 'Напишите по объявлениям и свяжитесь с продавцами'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => openConversation(conv.id)}
                    className="w-full flex items-center gap-3 p-3 bg-white rounded-xl hover:bg-earth-50 transition-colors text-left"
                  >
                    {/* Avatar */}
                    <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-7 h-7 text-primary-600" />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-earth-900 truncate">
                          {getOtherParticipantName(conv)}
                        </span>
                        <span className="text-xs text-earth-400 flex-shrink-0">
                          {formatTime(conv.last_message_at)}
                        </span>
                      </div>
                      
                      {conv.product_title && (
                        <p className="text-xs text-primary-600 truncate flex items-center gap-1 mt-0.5">
                          <Package className="w-3 h-3" />
                          {conv.product_title}
                        </p>
                      )}
                      
                      <p className="text-sm text-earth-500 truncate mt-0.5">
                        {conv.last_message || (language === 'uz' ? 'Yangi chat' : 'Новый чат')}
                      </p>
                    </div>
                    
                    {/* Unread badge */}
                    {conv.unread_count > 0 && (
                      <div className="w-6 h-6 rounded-full bg-primary-500 text-white text-xs font-medium flex items-center justify-center flex-shrink-0">
                        {conv.unread_count > 9 ? '9+' : conv.unread_count}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
