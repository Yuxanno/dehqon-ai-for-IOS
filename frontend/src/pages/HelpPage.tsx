import { useState } from 'react';
import { ArrowLeft, ChevronDown, MessageCircle, Bot, Store, Heart, User, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguageStore } from '../store/useLanguageStore';

interface FAQItem {
  question: { uz: string; ru: string };
  answer: { uz: string; ru: string };
  icon: React.ElementType;
}

const faqItems: FAQItem[] = [
  {
    icon: Store,
    question: {
      uz: "Qanday qilib e'lon joylashtirsam bo'ladi?",
      ru: "Как разместить объявление?"
    },
    answer: {
      uz: "1. Profilga kiring\n2. \"E'lon qo'shish\" tugmasini bosing\n3. Rasmlar yuklang, nom, narx va kategoriyani kiriting\n4. Viloyat va tumanni tanlang\n5. \"E'lonni joylash\" tugmasini bosing",
      ru: "1. Войдите в профиль\n2. Нажмите кнопку \"Добавить объявление\"\n3. Загрузите фото, введите название, цену и категорию\n4. Выберите область и район\n5. Нажмите \"Опубликовать\""
    }
  },
  {
    icon: Bot,
    question: {
      uz: "AI konsultant qanday ishlaydi?",
      ru: "Как работает AI консультант?"
    },
    answer: {
      uz: "Dehqonjon AI - bu sun'iy intellekt yordamchisi. U o'simliklar kasalliklari, o'g'itlar va dehqonchilik haqida savollarga javob beradi. Rasm yuklasangiz, o'simlik kasalligini aniqlashga yordam beradi. AI xato qilishi mumkin, shuning uchun muhim holatlarda mutaxassisga murojaat qiling.",
      ru: "Dehqonjon AI - это помощник на основе искусственного интеллекта. Он отвечает на вопросы о болезнях растений, удобрениях и сельском хозяйстве. Если загрузите фото, поможет определить болезнь растения. AI может ошибаться, поэтому в важных случаях обратитесь к специалисту."
    }
  },
  {
    icon: Heart,
    question: {
      uz: "Sevimlilar qanday ishlaydi?",
      ru: "Как работает избранное?"
    },
    answer: {
      uz: "Mahsulot kartasidagi yurak belgisini bosing - u sevimlilaringizga qo'shiladi. Sevimlilarni ko'rish uchun pastki menyudan yurak belgisini yoki profildan \"Sevimlilar\" bo'limini tanlang.",
      ru: "Нажмите на сердечко на карточке товара - он добавится в избранное. Чтобы посмотреть избранное, нажмите на сердечко в нижнем меню или выберите \"Избранное\" в профиле."
    }
  },
  {
    icon: User,
    question: {
      uz: "Profilni qanday tahrirlash mumkin?",
      ru: "Как редактировать профиль?"
    },
    answer: {
      uz: "Profilga kiring va ismingiz yonidagi qalam belgisini bosing. U yerda ism, username va viloyatni o'zgartirishingiz mumkin. Username - bu sizning noyob nomingiz, boshqa foydalanuvchilar sizni shu nom bilan topa oladi.",
      ru: "Зайдите в профиль и нажмите на карандаш рядом с именем. Там можно изменить имя, username и область. Username - это ваше уникальное имя, по которому другие пользователи могут вас найти."
    }
  },
  {
    icon: MessageCircle,
    question: {
      uz: "Sotuvchi bilan qanday bog'lanish mumkin?",
      ru: "Как связаться с продавцом?"
    },
    answer: {
      uz: "Mahsulot sahifasida sotuvchining telefon raqami ko'rsatilgan. \"Qo'ng'iroq qilish\" tugmasini bosib to'g'ridan-to'g'ri bog'lanishingiz mumkin. Tez orada chat funksiyasi ham qo'shiladi.",
      ru: "На странице товара указан номер телефона продавца. Нажмите кнопку \"Позвонить\" чтобы связаться напрямую. Скоро также добавим функцию чата."
    }
  },
  {
    icon: HelpCircle,
    question: {
      uz: "Muammo bo'lsa kimga murojaat qilish kerak?",
      ru: "Куда обращаться при проблемах?"
    },
    answer: {
      uz: "Telegram: @dehqonjon_support\n\nBiz har doim yordam berishga tayyormiz! Savollaringiz, takliflaringiz yoki shikoyatlaringiz bo'lsa, bizga yozing.",
      ru: "Telegram: @dehqonjon_support\n\nМы всегда готовы помочь! Если у вас есть вопросы, предложения или жалобы, напишите нам."
    }
  },
];

export default function HelpPage() {
  const navigate = useNavigate();
  const { language } = useLanguageStore();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-earth-50 pb-24 lg:pb-8">
      {/* Header */}
      <div className="bg-white border-b border-earth-100 sticky top-0 z-10">
        <div className="container-app py-4 flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-earth-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-earth-600" />
          </button>
          <h1 className="text-lg font-semibold text-earth-900">
            {language === 'uz' ? 'Yordam' : 'Помощь'}
          </h1>
        </div>
      </div>

      <div className="container-app py-6">
        {/* Header section */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-100 flex items-center justify-center">
            <HelpCircle className="w-8 h-8 text-primary-600" />
          </div>
          <h2 className="text-xl font-bold text-earth-900 mb-2">
            {language === 'uz' ? "Ko'p so'raladigan savollar" : 'Часто задаваемые вопросы'}
          </h2>
          <p className="text-earth-500">
            {language === 'uz' ? "Javob topa olmadingizmi? Bizga yozing!" : 'Не нашли ответ? Напишите нам!'}
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-3">
          {faqItems.map((item, index) => (
            <div key={index} className="bg-white rounded-xl overflow-hidden">
              <button
                onClick={() => toggleItem(index)}
                className="w-full flex items-center gap-4 p-4 text-left"
              >
                <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-primary-600" />
                </div>
                <span className="flex-1 font-medium text-earth-900">
                  {language === 'uz' ? item.question.uz : item.question.ru}
                </span>
                <ChevronDown 
                  className={`w-5 h-5 text-earth-400 transition-transform ${
                    openIndex === index ? 'rotate-180' : ''
                  }`} 
                />
              </button>
              
              {openIndex === index && (
                <div className="px-4 pb-4 pt-0">
                  <div className="pl-14 text-earth-600 whitespace-pre-line">
                    {language === 'uz' ? item.answer.uz : item.answer.ru}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact section */}
        <div className="mt-8 bg-primary-50 rounded-xl p-6 text-center">
          <p className="text-primary-800 font-medium mb-3">
            {language === 'uz' ? "Boshqa savollaringiz bormi?" : 'Остались вопросы?'}
          </p>
          <a
            href="https://t.me/dehqonjon_support"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            {language === 'uz' ? "Telegram'da yozish" : 'Написать в Telegram'}
          </a>
        </div>
      </div>
    </div>
  );
}
