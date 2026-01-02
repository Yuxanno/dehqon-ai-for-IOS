export type Language = 'uz' | 'ru';

export const translations = {
  uz: {
    // Common
    loading: 'Yuklanmoqda...',
    error: 'Xatolik yuz berdi',
    save: 'Saqlash',
    cancel: 'Bekor qilish',
    delete: 'O\'chirish',
    edit: 'Tahrirlash',
    search: 'Qidirish...',
    all: 'Hammasi',
    
    // Navigation
    marketplace: 'Bozor',
    favorites: 'Sevimlilar',
    profileNav: 'Profil',
    aiAssistant: 'Dehqonjon AI',
    chats: 'Chatlar',
    
    // Categories
    categories: {
      seeds: 'Urug\'lar',
      fertilizers: 'O\'g\'itlar',
      equipment: 'Texnika',
      services: 'Xizmatlar',
      animals: 'Hayvonlar',
      other: 'Boshqa',
    },
    
    // Auth
    auth: {
      login: 'Kirish',
      register: 'Ro\'yxatdan o\'tish',
      logout: 'Chiqish',
      phone: 'Telefon raqami',
      password: 'Parol',
      name: 'Ismingiz',
      phonePlaceholder: '+998 90 123 45 67',
      passwordPlaceholder: 'Parolingiz',
      namePlaceholder: 'Ismingizni kiriting',
      loginButton: 'Kirish',
      registerButton: 'Ro\'yxatdan o\'tish',
      noAccount: 'Akkauntingiz yo\'qmi?',
      hasAccount: 'Akkauntingiz bormi?',
      loginError: 'Noto\'g\'ri raqam yoki parol',
      registerError: 'Bu raqam allaqachon ro\'yxatdan o\'tgan',
      phoneError: 'Noto\'g\'ri format. Foydalaning: +998 XX XXX XX XX',
      passwordError: 'Parol kamida 4 ta belgidan iborat bo\'lishi kerak',
      loginToAccess: 'Davom etish uchun tizimga kiring',
    },
    
    // Profile
    profile: {
      myProfile: 'Mening profilim',
      myListings: 'Mening e\'lonlarim',
      settings: 'Sozlamalar',
      becomeSeller: 'Sotuvchi bo\'lish',
      version: 'Versiya',
      language: 'Til',
      region: 'Viloyat',
      editProfile: 'Profilni tahrirlash',
    },
    
    // Products
    products: {
      price: 'Narxi',
      currency: 'so\'m',
      views: 'ko\'rishlar',
      addToFavorites: 'Sevimlilarga qo\'shish',
      removeFromFavorites: 'Sevimlilardan o\'chirish',
      contactSeller: 'Sotuvchiga yozish',
      call: 'Qo\'ng\'iroq qilish',
      noProducts: 'Mahsulotlar topilmadi',
      filters: 'Filtrlar',
      sortBy: 'Saralash',
      newest: 'Eng yangi',
      cheapest: 'Arzon',
      expensive: 'Qimmat',
    },
    
    // AI
    ai: {
      title: 'Dehqonjon AI',
      subtitle: 'Agronom-maslahatchi',
      disclaimer: 'AI xato qilishi mumkin. Aniq tashxis uchun mutaxassisga murojaat qiling.',
      inputPlaceholder: 'Savolingizni yozing...',
      uploadPhoto: 'Rasm yuklash',
      newChat: 'Yangi chat',
      chatHistory: 'Chat tarixi',
      quickQuestions: {
        diseases: 'Kasalliklar',
        fertilizers: 'O\'g\'itlar',
        planting: 'Ekish',
        pests: 'Zararkunandalar',
      },
    },
    
    // Regions
    regions: {
      tashkent: 'Toshkent',
      samarkand: 'Samarqand',
      bukhara: 'Buxoro',
      fergana: 'Farg\'ona',
      andijan: 'Andijon',
      namangan: 'Namangan',
      kashkadarya: 'Qashqadaryo',
      surkhandarya: 'Surxondaryo',
      jizzakh: 'Jizzax',
      syrdarya: 'Sirdaryo',
      khorezm: 'Xorazm',
      navoi: 'Navoiy',
      karakalpakstan: 'Qoraqalpog\'iston',
    },
  },
  
  ru: {
    // Common
    loading: 'Загрузка...',
    error: 'Произошла ошибка',
    save: 'Сохранить',
    cancel: 'Отмена',
    delete: 'Удалить',
    edit: 'Редактировать',
    search: 'Поиск...',
    all: 'Все',
    
    // Navigation
    marketplace: 'Маркет',
    favorites: 'Избранное',
    profileNav: 'Профиль',
    aiAssistant: 'Dehqonjon AI',
    chats: 'Чаты',
    
    // Categories
    categories: {
      seeds: 'Семена',
      fertilizers: 'Удобрения',
      equipment: 'Техника',
      services: 'Услуги',
      animals: 'Животные',
      other: 'Другое',
    },
    
    // Auth
    auth: {
      login: 'Вход',
      register: 'Регистрация',
      logout: 'Выйти',
      phone: 'Номер телефона',
      password: 'Пароль',
      name: 'Ваше имя',
      phonePlaceholder: '+998 90 123 45 67',
      passwordPlaceholder: 'Ваш пароль',
      namePlaceholder: 'Введите имя',
      loginButton: 'Войти',
      registerButton: 'Зарегистрироваться',
      noAccount: 'Нет аккаунта?',
      hasAccount: 'Уже есть аккаунт?',
      loginError: 'Неверный номер или пароль',
      registerError: 'Этот номер уже зарегистрирован',
      phoneError: 'Неверный формат. Используйте: +998 XX XXX XX XX',
      passwordError: 'Пароль минимум 4 символа',
      loginToAccess: 'Войдите, чтобы продолжить',
    },
    
    // Profile
    profile: {
      myProfile: 'Мой профиль',
      myListings: 'Мои объявления',
      settings: 'Настройки',
      becomeSeller: 'Стать продавцом',
      version: 'Версия',
      language: 'Язык',
      region: 'Регион',
      editProfile: 'Редактировать профиль',
    },
    
    // Products
    products: {
      price: 'Цена',
      currency: 'сум',
      views: 'просмотров',
      addToFavorites: 'В избранное',
      removeFromFavorites: 'Убрать из избранного',
      contactSeller: 'Написать продавцу',
      call: 'Позвонить',
      noProducts: 'Товары не найдены',
      filters: 'Фильтры',
      sortBy: 'Сортировка',
      newest: 'Новые',
      cheapest: 'Дешевле',
      expensive: 'Дороже',
    },
    
    // AI
    ai: {
      title: 'Dehqonjon AI',
      subtitle: 'Агроном-консультант',
      disclaimer: 'ИИ может ошибаться. Для точной диагностики обратитесь к специалисту.',
      inputPlaceholder: 'Введите вопрос...',
      uploadPhoto: 'Загрузить фото',
      newChat: 'Новый чат',
      chatHistory: 'История чатов',
      quickQuestions: {
        diseases: 'Болезни',
        fertilizers: 'Удобрения',
        planting: 'Посадка',
        pests: 'Вредители',
      },
    },
    
    // Regions
    regions: {
      tashkent: 'Ташкент',
      samarkand: 'Самарканд',
      bukhara: 'Бухара',
      fergana: 'Фергана',
      andijan: 'Андижан',
      namangan: 'Наманган',
      kashkadarya: 'Кашкадарья',
      surkhandarya: 'Сурхандарья',
      jizzakh: 'Джизак',
      syrdarya: 'Сырдарья',
      khorezm: 'Хорезм',
      navoi: 'Навои',
      karakalpakstan: 'Каракалпакстан',
    },
  },
};

export type TranslationKeys = typeof translations.uz;
