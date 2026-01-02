# Настройка Codemagic для сборки Android и iOS

## Быстрый старт

### 1. Регистрация на Codemagic

1. Перейди на [codemagic.io](https://codemagic.io)
2. Зарегистрируйся через GitHub/GitLab/Bitbucket
3. Подключи свой репозиторий

### 2. Запуск сборки

После подключения репозитория ты увидишь 4 workflow:

| Workflow | Описание | Бесплатно? |
|----------|----------|------------|
| **Android Build** | Debug APK для тестирования | ✅ Да |
| **Android Release** | Подписанный APK для Play Store | ✅ Да |
| **iOS Build** | Сборка для симулятора | ✅ 500 мин/месяц |
| **iOS Release** | IPA для App Store | ✅ 500 мин/месяц |

Нажми **Start new build** → выбери нужный workflow → **Start build**

---

## Настройка Android Release (подписанный APK)

### Создание keystore

```bash
keytool -genkey -v -keystore dehqonjon-release.keystore -alias dehqonjon -keyalg RSA -keysize 2048 -validity 10000
```

### Добавление в Codemagic

1. Settings → Environment variables → Add group: `android_signing`
2. Добавь переменные:
   - `CM_KEYSTORE` — загрузи файл keystore (Base64)
   - `CM_KEYSTORE_PASSWORD` — пароль от keystore
   - `CM_KEY_ALIAS` — `dehqonjon`
   - `CM_KEY_PASSWORD` — пароль от ключа

---

## Настройка iOS Release (для App Store)

### Требования

1. **Apple Developer Account** ($99/год)
2. **App Store Connect API Key**

### Шаги

1. Создай API Key в [App Store Connect](https://appstoreconnect.apple.com/access/api)
   - Users and Access → Keys → Generate API Key
   - Скачай `.p8` файл

2. В Codemagic: Settings → Integrations → App Store Connect
   - Загрузи API Key
   - Укажи Issuer ID и Key ID

3. Создай App ID в Apple Developer Portal:
   - Identifier: `uz.dehqonjon.app`

4. Создай приложение в App Store Connect

---

## Локальные команды (для разработки)

```bash
# Android
cd frontend
npm run build
npx cap sync android
npx cap open android  # Откроет Android Studio

# iOS (только на Mac)
cd frontend
npm install @capacitor/ios
npx cap add ios
npm run build
npx cap sync ios
npx cap open ios  # Откроет Xcode
```

---

## Бесплатные лимиты Codemagic

- **Linux (Android)**: 500 минут/месяц
- **macOS M1 (iOS)**: 500 минут/месяц
- Одна Android сборка ≈ 5-10 минут
- Одна iOS сборка ≈ 10-15 минут

Этого хватит на ~30-50 сборок в месяц.

---

## Troubleshooting

### iOS: "No signing certificate"
Убедись что настроена интеграция с App Store Connect и создан App ID.

### Android: "Keystore not found"
Проверь что группа `android_signing` добавлена и содержит все переменные.

### Build failed: "npm install"
Проверь что `package-lock.json` закоммичен в репозиторий.
