# Embedded Backend Architecture

## Обзор

Приложение использует **embedded backend** архитектуру — вся бизнес-логика выполняется внутри APK через Kotlin Native Modules, без локального HTTP сервера.

## Архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                         APK                                  │
│  ┌─────────────────┐    ┌─────────────────────────────────┐ │
│  │   React/Vite    │    │      Kotlin Native Modules      │ │
│  │   (WebView)     │◄──►│  ┌───────────┐ ┌─────────────┐  │ │
│  │                 │    │  │ AiPlugin  │ │DatabasePlugin│  │ │
│  │  NativeApi.ts   │    │  └─────┬─────┘ └──────┬──────┘  │ │
│  └─────────────────┘    └────────┼──────────────┼─────────┘ │
└──────────────────────────────────┼──────────────┼───────────┘
                                   │              │
                          HTTPS    ▼              ▼    HTTPS
                         ┌─────────────┐  ┌─────────────────┐
                         │  Groq API   │  │ MongoDB Data API│
                         │  (AI/LLM)   │  │   (Database)    │
                         └─────────────┘  └─────────────────┘
```

## Что изменилось

### Было (внешний backend)
```
JS → HTTP → Python Backend → MongoDB/AI API
```

### Стало (embedded backend)
```
JS → Capacitor Bridge → Kotlin Modules → MongoDB/AI API
```

## Файловая структура

```
android/app/src/main/java/uz/dehqonjon/app/
├── MainActivity.kt              # Регистрация плагинов
└── plugins/
    ├── AiPlugin.kt              # AI логика (Groq API)
    └── DatabasePlugin.kt        # Auth, Products, Favorites, Chat
    
src/
├── native/
│   └── NativeApi.ts             # TypeScript интерфейс к Native Modules
└── services/
    └── api.ts                   # Unified API (Native + Web fallback)
```

## Настройка

### 1. API ключи

Добавьте в `android/local.properties`:

```properties
GROQ_API_KEY=your_groq_api_key
MONGODB_API_KEY=your_mongodb_data_api_key
MONGODB_APP_ID=your_mongodb_app_id
```

### 2. MongoDB Data API

1. Войдите в [MongoDB Atlas](https://cloud.mongodb.com)
2. Включите Data API для вашего кластера
3. Создайте API ключ с правами read/write
4. Скопируйте App ID и API Key

### 3. Groq API

1. Зарегистрируйтесь на [Groq](https://console.groq.com)
2. Создайте API ключ
3. Скопируйте ключ в `local.properties`

## Сборка

```bash
# Синхронизация Capacitor
npm run android:build

# Открыть в Android Studio
npm run android:open

# Или запустить напрямую
npm run android:run
```

## Native Modules API

### AiPlugin

```typescript
// Отправка сообщения AI
const result = await NativeApi.ai.sendMessage(
  "Почему желтеют листья?",
  conversationId,
  history
);

// Анализ изображения
const analysis = await NativeApi.ai.analyzeImage(
  imageBase64,
  conversationId,
  "Что с этим растением?"
);
```

### DatabasePlugin

```typescript
// Auth
await NativeApi.auth.register(phone, password, name);
await NativeApi.auth.login(phone, password);
await NativeApi.auth.getMe();
await NativeApi.auth.logout();

// Products
await NativeApi.products.getAll({ category, search, page });
await NativeApi.products.getById(id);
await NativeApi.products.create(data);
await NativeApi.products.update(id, data);
await NativeApi.products.delete(id);

// Favorites
await NativeApi.favorites.getAll();
await NativeApi.favorites.add(productId);
await NativeApi.favorites.remove(productId);
await NativeApi.favorites.check(productId);

// Chat Sessions
await NativeApi.chat.createSession(title);
await NativeApi.chat.getSessions();
await NativeApi.chat.getSession(sessionId);
await NativeApi.chat.addMessage(sessionId, message);
await NativeApi.chat.deleteSession(sessionId);
```

## Безопасность

- JWT токены хранятся в EncryptedSharedPreferences
- Пароли хешируются через BCrypt
- API ключи в BuildConfig (не в коде)
- Все запросы через HTTPS

## Преимущества

1. **Один APK** — не нужен отдельный сервер
2. **Офлайн-ready** — легко добавить локальный кэш
3. **Быстрее** — нет сетевых задержек для локальных операций
4. **Безопаснее** — API ключи внутри APK, не на сервере
5. **Дешевле** — не нужен хостинг для backend

## Миграция существующего кода

Если у вас есть код, использующий старый `api.ts`:

```typescript
// Старый код (работает без изменений!)
import { authApi, productsApi } from './services/api';

await authApi.login(phone, password);
await productsApi.getAll();
```

API автоматически определяет платформу и использует:
- Native Modules на Android
- HTTP API на Web (для разработки)
