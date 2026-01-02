import { useRef, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  PanelLeftClose, 
  PanelLeft, 
  Plus, 
  Store, 
  Bot,
  Send,
  Camera,
  MoreHorizontal,
  Share2,
  Pencil,
  Trash2,
  X,
  Check,
  UserPlus
} from 'lucide-react';
import { useLanguageStore } from '../store/useLanguageStore';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import { chatApi } from '../services/api';
import clsx from 'clsx';

// Auth Modal Component
function AuthModal({ isOpen, onClose, language }: { isOpen: boolean; onClose: () => void; language: string }) {
  const navigate = useNavigate();
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-earth-400 hover:text-earth-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-primary-600" />
          </div>
          
          <h3 className="text-xl font-semibold text-earth-900 mb-2">
            {language === 'uz' ? 'Ro\'yxatdan o\'ting!' : 'Зарегистрируйтесь!'}
          </h3>
          
          <p className="text-earth-500 mb-6">
            {language === 'uz' 
              ? 'Chat tarixini saqlash va barcha imkoniyatlardan foydalanish uchun ro\'yxatdan o\'ting'
              : 'Зарегистрируйтесь, чтобы сохранять историю чатов и пользоваться всеми возможностями'}
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => navigate('/auth?mode=register')}
              className="w-full py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
            >
              {language === 'uz' ? 'Ro\'yxatdan o\'tish' : 'Зарегистрироваться'}
            </button>
            
            <button
              onClick={() => navigate('/auth?mode=login')}
              className="w-full py-3 bg-earth-100 text-earth-700 rounded-xl font-medium hover:bg-earth-200 transition-colors"
            >
              {language === 'uz' ? 'Kirish' : 'Войти'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AIConsultantPage() {
  const navigate = useNavigate();
  const { chatId } = useParams<{ chatId: string }>();
  const { language } = useLanguageStore();
  const { token, isAuthenticated } = useAuthStore();
  const {
    sessions,
    currentSessionId,
    sidebarOpen,
    createSession,
    deleteSession,
    setCurrentSession,
    addMessage,
    toggleSidebar,
    getCurrentSession,
    loadFromServer,
    updateSessionTitle,
  } = useChatStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomInputRef = useRef<HTMLTextAreaElement>(null);
  const loadedRef = useRef(false);
  
  // Menu state
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const currentSession = getCurrentSession();
  const messages = currentSession?.messages || [];

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load sessions from server on mount if authenticated
  useEffect(() => {
    if (isAuthenticated && token && !loadedRef.current) {
      loadedRef.current = true;
      loadFromServer(token);
    }
  }, [isAuthenticated, token, loadFromServer]);

  // Sync URL chatId with store
  useEffect(() => {
    if (chatId) {
      // URL has chatId - set it as current session
      const sessionExists = sessions.some(s => s.id === chatId);
      if (sessionExists && currentSessionId !== chatId) {
        setCurrentSession(chatId);
      } else if (!sessionExists && sessions.length > 0) {
        // Chat not found, redirect to /ai
        navigate('/ai', { replace: true });
      }
    } else {
      // No chatId in URL - clear current session (welcome screen)
      if (currentSessionId) {
        setCurrentSession(null);
      }
    }
  }, [chatId, sessions, currentSessionId, setCurrentSession, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
  };

  const handleSend = async () => {
    // Используем активный инпут в зависимости от состояния
    const input = messages.length > 0 ? bottomInputRef.current : inputRef.current;
    if (!input || !input.value.trim()) return;

    const text = input.value.trim();
    input.value = '';
    input.style.height = 'auto';

    // Создаём сессию если нет
    let sessionId = chatId || currentSessionId;
    if (!sessionId) {
      console.log('[handleSend] No session, creating new one...');
      sessionId = await createSession(token);
      console.log('[handleSend] Created session:', sessionId);
      // Редирект на URL с chatId
      navigate(`/ai/${sessionId}`, { replace: true });
    }

    // Добавляем сообщение пользователя
    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: text,
      createdAt: new Date().toISOString(),
    };
    
    console.log('[handleSend] Adding user message to session:', sessionId);
    addMessage(sessionId, userMessage, token);

    try {
      // Берём актуальные сообщения из store напрямую
      const currentMessages = useChatStore.getState().sessions.find(s => s.id === sessionId)?.messages || [];
      // История без последнего сообщения (которое мы только что добавили)
      const historyForApi = currentMessages.slice(0, -1).map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      console.log('[handleSend] Sending to API...', { text, sessionId, historyLength: historyForApi.length });
      const response = await chatApi.sendMessage(text, sessionId, historyForApi);
      console.log('[handleSend] Got response:', response);
      
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: response.response,
        createdAt: new Date().toISOString(),
      };
      addMessage(sessionId, aiMessage, token);
      
      // Show auth modal for unauthenticated users after AI response
      if (!isAuthenticated) {
        setShowAuthModal(true);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: language === 'uz' 
          ? 'Xatolik yuz berdi. Qayta urinib ko\'ring.'
          : 'Произошла ошибка. Попробуйте ещё раз.',
        createdAt: new Date().toISOString(),
      };
      addMessage(sessionId, errorMessage, token);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    let sessionId = chatId || currentSessionId;
    if (!sessionId) {
      sessionId = await createSession(token);
      navigate(`/ai/${sessionId}`, { replace: true });
    }

    const imageUrl = URL.createObjectURL(file);
    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: language === 'uz' ? 'Bu rasmga qarang' : 'Посмотрите на это фото',
      imageUrl,
      createdAt: new Date().toISOString(),
    };
    addMessage(sessionId, userMessage, token);

    try {
      const response = await chatApi.uploadImage(file, sessionId);
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: response.analysis,
        createdAt: new Date().toISOString(),
      };
      addMessage(sessionId, aiMessage, token);
    } catch (error) {
      console.error('Image error:', error);
    }
  };

  const handleNewChat = async () => {
    // Don't allow creating new chats for unauthenticated users
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    const newSessionId = await createSession(token);
    navigate(`/ai/${newSessionId}`);
  };

  // Menu handlers
  const handleMenuToggle = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setMenuOpenId(menuOpenId === sessionId ? null : sessionId);
  };

  const handleShare = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      const text = session.messages.map(m => `${m.role === 'user' ? '👤' : '🤖'}: ${m.content}`).join('\n\n');
      navigator.clipboard.writeText(text);
      alert(language === 'uz' ? 'Chat nusxalandi!' : 'Чат скопирован!');
    }
    setMenuOpenId(null);
  };

  const handleStartRename = (sessionId: string, currentTitle: string) => {
    setEditingId(sessionId);
    setEditTitle(currentTitle);
    setMenuOpenId(null);
  };

  const handleSaveRename = (sessionId: string) => {
    if (editTitle.trim()) {
      updateSessionTitle(sessionId, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle('');
  };

  const handleCancelRename = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const handleDelete = (sessionId: string) => {
    if (confirm(language === 'uz' ? 'Chatni o\'chirmoqchimisiz?' : 'Удалить чат?')) {
      deleteSession(sessionId, token);
      // Если удаляем текущий чат - редирект на /ai
      if (chatId === sessionId) {
        navigate('/ai', { replace: true });
      }
    }
    setMenuOpenId(null);
  };

  return (
    <div className="h-screen flex overflow-hidden bg-white">
      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'flex flex-col bg-earth-50 border-r border-earth-200 transition-all duration-300 z-50',
          'fixed md:relative h-full',
          sidebarOpen ? 'w-72 left-0' : 'w-0 -left-72 md:left-0 md:w-0'
        )}
      >
        {sidebarOpen && (
          <>
            {/* Sidebar Header */}
            <div className="p-3 flex items-center justify-between border-b border-earth-200">
              {isAuthenticated ? (
                <button
                  onClick={handleNewChat}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-earth-200 transition-colors flex-1 text-earth-700"
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-sm font-medium">{language === 'uz' ? 'Yangi chat' : 'Новый чат'}</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 flex-1 text-earth-400">
                  <Bot className="w-5 h-5" />
                  <span className="text-sm">{language === 'uz' ? 'Demo rejim' : 'Демо режим'}</span>
                </div>
              )}
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-earth-200 transition-colors text-earth-600"
              >
                <PanelLeftClose className="w-5 h-5" />
              </button>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto px-2 py-2">
              <p className="px-3 py-2 text-xs text-earth-500 uppercase font-medium">
                {language === 'uz' ? 'Chatlar' : 'Чаты'}
              </p>
              <div className="space-y-1">
                {sessions.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-earth-400">
                    {language === 'uz' ? 'Chatlar yo\'q' : 'Нет чатов'}
                  </p>
                ) : (
                  sessions.map((session) => (
                    <div
                      key={session.id}
                      className={clsx(
                        'group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors relative',
                        chatId === session.id
                          ? 'bg-primary-100 text-primary-700'
                          : 'hover:bg-earth-200 text-earth-700'
                      )}
                      onClick={() => {
                        if (editingId !== session.id) {
                          navigate(`/ai/${session.id}`);
                          if (window.innerWidth < 768) toggleSidebar();
                        }
                      }}
                    >
                      {editingId === session.id ? (
                        // Editing mode
                        <div className="flex items-center gap-1 flex-1" onClick={e => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename(session.id);
                              if (e.key === 'Escape') handleCancelRename();
                            }}
                            className="flex-1 text-sm bg-white px-2 py-1 rounded border border-earth-300 focus:outline-none focus:border-primary-500"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveRename(session.id)}
                            className="p-1 text-green-600 hover:bg-green-100 rounded"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancelRename}
                            className="p-1 text-earth-500 hover:bg-earth-200 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        // Normal mode
                        <>
                          <span className="flex-1 text-sm truncate">{session.title}</span>
                          <div className="relative" ref={menuOpenId === session.id ? menuRef : null}>
                            <button
                              onClick={(e) => handleMenuToggle(e, session.id)}
                              className="p-1 hover:bg-earth-300 rounded transition-all text-earth-400 hover:text-earth-600"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                            
                            {/* Dropdown Menu */}
                            {menuOpenId === session.id && (
                              <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-earth-200 py-1 z-50">
                                <button
                                  onClick={() => handleShare(session.id)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-earth-700 hover:bg-earth-50"
                                >
                                  <Share2 className="w-4 h-4" />
                                  {language === 'uz' ? 'Ulashish' : 'Поделиться'}
                                </button>
                                <button
                                  onClick={() => handleStartRename(session.id, session.title)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-earth-700 hover:bg-earth-50"
                                >
                                  <Pencil className="w-4 h-4" />
                                  {language === 'uz' ? 'Nomini o\'zgartirish' : 'Переименовать'}
                                </button>
                                <button
                                  onClick={() => handleDelete(session.id)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  {language === 'uz' ? 'O\'chirish' : 'Удалить'}
                                </button>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Sidebar Footer - removed Bozor button, moved to header */}
          </>
        )}
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-earth-200">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-earth-100 transition-colors"
              >
                <PanelLeft className="w-5 h-5 text-earth-600" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <Bot className="w-6 h-6 text-primary-600" />
              <span className="font-semibold text-earth-900">Dehqonjon AI</span>
            </div>
          </div>
          
          {/* Bozor button */}
          <button
            onClick={() => navigate('/marketplace')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-earth-100 transition-colors text-earth-600"
          >
            <Store className="w-5 h-5" />
            <span className="text-sm font-medium hidden sm:inline">{language === 'uz' ? 'Bozor' : 'Маркетплейс'}</span>
          </button>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            // Welcome Screen with centered input (like ChatGPT)
            <div className="h-full flex flex-col items-center justify-center px-4 pb-48">
              <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mb-4">
                <Bot className="w-10 h-10 text-primary-600" />
              </div>
              <h1 className="text-2xl font-semibold text-earth-900 mb-8">
                {language === 'uz' ? 'Salom! Men Dehqonjon AI' : 'Привет! Я Dehqonjon AI'}
              </h1>
              
              {/* Centered Input for empty chat */}
              <div className="w-full max-w-xl">
                <div className="flex items-center gap-2 bg-earth-100 rounded-full px-4 py-2 shadow-sm border border-earth-200">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 text-earth-500 hover:text-primary-600 transition-colors"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <textarea
                    ref={inputRef}
                    placeholder={language === 'uz' ? 'Savol yozing...' : 'Напишите вопрос...'}
                    rows={1}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent resize-none outline-none text-earth-900 placeholder:text-earth-400 max-h-[120px] text-sm py-1"
                  />
                  <button
                    onClick={handleSend}
                    className="w-8 h-8 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors flex items-center justify-center"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // Messages
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={clsx(
                    'flex gap-4',
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-primary-600" />
                    </div>
                  )}
                  <div
                    className={clsx(
                      'max-w-[80%] rounded-2xl px-4 py-3',
                      msg.role === 'user'
                        ? 'bg-primary-500 text-white'
                        : 'bg-earth-100 text-earth-900'
                    )}
                  >
                    {msg.imageUrl && (
                      <img
                        src={msg.imageUrl}
                        alt=""
                        className="rounded-lg mb-2 max-w-full max-h-64 object-cover"
                      />
                    )}
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Bottom Input Area - only shown when there are messages */}
        {messages.length > 0 && (
          <div className="border-t border-earth-200 p-3">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-2 bg-earth-100 rounded-full px-4 py-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 text-earth-500 hover:text-primary-600 transition-colors"
                >
                  <Camera className="w-5 h-5" />
                </button>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <textarea
                  ref={bottomInputRef}
                  placeholder={language === 'uz' ? 'Savol yozing...' : 'Напишите вопрос...'}
                  rows={1}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent resize-none outline-none text-earth-900 placeholder:text-earth-400 max-h-[120px] text-sm py-1"
                />
                <button
                  onClick={handleSend}
                  className="w-8 h-8 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-earth-400 text-center mt-1.5">
                {language === 'uz' 
                  ? 'AI xato qilishi mumkin'
                  : 'AI может ошибаться'}
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Auth Modal for unauthenticated users */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        language={language} 
      />
    </div>
  );
}
