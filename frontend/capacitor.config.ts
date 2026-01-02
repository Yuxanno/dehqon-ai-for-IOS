import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'uz.dehqonjon.app',
  appName: 'Dehqonjon',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // Handle SPA routing - all paths should load index.html
    hostname: 'localhost',
    // Для разработки - подключение к локальному серверу
    // url: 'http://192.168.1.100:5173',
    // cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#22c55e',
      showSpinner: false
    },
    StatusBar: {
      style: 'light',
      backgroundColor: '#22c55e'
    }
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
