# Сборка Android APK для Dehqonjon

## Требования

1. **Android Studio** - скачать с https://developer.android.com/studio
2. **Java JDK 17+** - обычно идёт с Android Studio

## Шаги сборки

### 1. Сборка веб-приложения
```bash
cd frontend
npm run build
npx cap sync android
```

### 2. Открыть в Android Studio
```bash
npx cap open android
```

Или вручную откройте папку `frontend/android` в Android Studio.

### 3. Сборка Debug APK

В Android Studio:
- Build → Build Bundle(s) / APK(s) → Build APK(s)
- APK будет в `frontend/android/app/build/outputs/apk/debug/app-debug.apk`

### 4. Сборка Release APK (для публикации)

1. Создайте keystore:
```bash
keytool -genkey -v -keystore dehqonjon-release.keystore -alias dehqonjon -keyalg RSA -keysize 2048 -validity 10000
```

2. Добавьте в `android/app/build.gradle`:
```gradle
android {
    signingConfigs {
        release {
            storeFile file('dehqonjon-release.keystore')
            storePassword 'your_password'
            keyAlias 'dehqonjon'
            keyPassword 'your_password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

3. Build → Build Bundle(s) / APK(s) → Build APK(s)

## Быстрые команды

```bash
# Сборка и синхронизация
npm run android:build

# Открыть в Android Studio
npm run android:open

# Запуск на подключённом устройстве/эмуляторе
npm run android:run
```

## Настройка API URL для продакшена

В `capacitor.config.ts` измените:
```typescript
server: {
  url: 'https://your-api-domain.com',
  androidScheme: 'https'
}
```

Или используйте переменные окружения в `.env`:
```
VITE_API_URL=https://your-api-domain.com/api
```

## Иконки приложения

Замените иконки в:
- `android/app/src/main/res/mipmap-*/ic_launcher.png`
- `android/app/src/main/res/mipmap-*/ic_launcher_round.png`

Используйте Android Asset Studio для генерации всех размеров:
https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html
