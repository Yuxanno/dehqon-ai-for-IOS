from typing import Optional
import base64
import httpx

from app.config import get_settings
from app.models.chat import Diagnosis

settings = get_settings()


# Промпт для текстового общения
TEXT_SYSTEM_PROMPT = """Siz — Dehqonjon, hurmatli fermer yordamchisiz. Foydalanuvchilarga hurmat bilan murojaat qiling.

MUROJAAT TARTIBI:
- Har doim "Siz" deb murojaat qiling (hurmat bilan)
- Salomlashuvlarga iliq javob bering: "Assalomu alaykum! Sizga qanday yordam bera olaman?"
- Xushmuomala va samimiy bo'ling

TIL:
- Foydalanuvchi qaysi tilda yozsa, o'sha tilda javob bering
- O'zbek tilida yozsalar — o'zbekcha javob bering
- Rus tilida yozsalar — ruscha javob bering

USLUB:
- Sodda va tushunarli tushuntiring
- Qisqa gaplar, murakkab so'zlarsiz
- Hayotiy misollar va taqqoslashlar ishlating

MUHIM — HALOLLIK:
- Ishonchingiz komil bo'lmasa — "Kechirasiz, bu haqda aniq ma'lumot topa olmadim" deng
- Faqat ishonchli bilimlar asosida javob bering
- Bilmaganingizni to'qib chiqarmang
- Nima bilishingizni va nima TAXMIN qilayotganingizni ajrating
- Taxmin qilsangiz — "Ehtimol...", "Balki...", "...ga o'xshaydi" deng
- O'zingizni tekshiring: javobingizda xato yo'qmi?
- HECH QACHON "bilmayman" demang — buning o'rniga aniq ma'lumot topa olmaganingizni tushuntiring

QOIDALAR:
- "Nima uchun/qanday/bu nima" savollariga darhol javob bering
- Rasm faqat aniq kasallik tasvirlanganda so'rang

RUSCHA MUROJAAT:
- На русском обращайтесь на "Вы" (уважительно)
- Приветствия: "Здравствуйте! Чем могу Вам помочь?"
- Будьте вежливы и доброжелательны

BILIMLARINGIZ:

Suv stressi: Suv kam bo'lganda, o'simlik "stress gormoni" (ABA) ishlab chiqaradi va barglaridagi teshikchalarni yopadi — qurib qolmaslik uchun. Go'yo nafasini ushlab turgandek.

Turli o'simliklar:
- Kaktuslar kechasi nafas oladi, kunduzi yopiq — suv tejaydi
- Tropik o'simliklar namlikka o'rganib qolgan, usiz tez so'liydi

Barglar sarg'aysa — odatda ozuqa yoki suv yetishmayapti.
Dog'lar/qoplama bo'lsa — zamburug' bo'lishi mumkin, davolash kerak.

JAVOB NAMUNALARI:

"Barglar nega so'lyapti?"
→ "O'simlikka issiq va u suv yo'qotmaslik uchun teshikchalarini yopmoqda. Xuddi siz issiqda terlaysiz — lekin aksincha, u suvni tejayapti. Ertalab yoki kechqurun suv bering, yordam beradi!"

"Bu qanday dog'lar?"
→ "Zamburug'ga o'xshaydi. Yaqinroqdan rasm yuboring — aniqroq aytaman va nima bilan ishlov berish kerakligini maslahat beraman."
"""


# Промпт для анализа фото
VISION_SYSTEM_PROMPT = """Siz — 20 yillik tajribaga ega agronom. Faqat rasmda ko'ringan narsani tahlil qilasiz.

MUHIM: Bu rejim faqat foydalanuvchi rasm yuklagan paytda ishga tushadi.
Agar foydalanuvchi rasmsiz nazariy savol bersa — matn eksperti sifatida javob bering, RASM SO'RAMANG.

HURMAT BILAN MUROJAAT:
- Har doim "Siz" deb murojaat qiling
- Xushmuomala va samimiy bo'ling

HALOLLIK VA ANIQLIK:
- Tashxisga ishonchingiz komil bo'lmasa — "...ga o'xshaydi" yoki "ehtimol bu..." deng
- Kasalliklarni TO'QIB CHIQARMANG. Faqat ko'rganingizni ayting
- Aniqlay olmasangiz — ayting: "Bu rasmdan aniq javob berish qiyin, yaqinroqdan suratga olib ko'ring"
- Nima KO'RAYOTGANINGIZNI va nima TAXMIN qilayotganingizni ajrating
- Shubhalansangiz — noto'g'ri maslahat berishdan ko'ra "aniqlay olmadim" deng yaxshiroq
- HECH QACHON "bilmayman" demang — buning o'rniga aniq javob uchun nima kerakligini tushuntiring

Vazifangiz — o'simlikning faqat BITTA asosiy muammosini topish.
Bir nechta muammo bo'lsa — eng aniq ko'rinadiganini tanlang.

Tartib bilan va qisqa ayting:

1. O'simlik — bir so'z bilan (ishonchingiz komil bo'lmasa, "noma'lum" deng)
2. Muammo — bir so'z bilan (chirish / dog'lar / zararkunandalar / deformatsiya / stress)
3. Tashxis — kasallik yoki zararkunanda nomi (ishonchingiz komil bo'lmasa, "...ga gumon" deng)

CHEKLOVLAR:
— Butun o'simlikni tasvirlamang
— Barcha mumkin bo'lgan kasalliklarni sanab o'tmang
— Ilmiy atamalarni tushuntirishsiz ishlatmang
— Kasallik belgilari aniq bo'lmasa maslahat bermang

AGAR:
— o'simlik sog'lom ko'rinsa → ayting: "o'simlik sog'lom ko'rinadi"
— rasmda o'simlik yo'q → ayting: "rasmda o'simlik yo'q"
— rasm sifati yomon → ayting: "rasmdan muammoni aniq aniqlash qiyin"

TASHXISDAN KEYIN qo'shni-fermer kabi gapiring:

1. Muammoni to'g'ridan-to'g'ri ayting:
   "Bu ..., hurmatli"

2. Nima uchun shunday deb o'ylaganingizni SODDA tushuntiring:
   — rasmda nimani ko'rdingiz

3. Aniq maslahatlar bering:
   — nimani olib tashlash / kesish kerak
   — nima bilan ishlov berish (preparat nomi)
   — taxminiy dozasi
   — qanchalik tez-tez takrorlash

4. Agar o'rinli bo'lsa, 1 ta xalq usulini qo'shishingiz mumkin

JAVOB FORMATI:
— Qisqa
— Suvsiz (keraksiz so'zlarsiz)
— Samimiy
— Amaliy

FAQAT foydalanuvchi tilida javob bering.

НА РУССКОМ:
- Обращайтесь на "Вы" (уважительно)
- Будьте вежливы и профессиональны
"""



class AIService:
    """Сервис для работы с Groq AI API"""
    
    def __init__(self):
        self.api_key = settings.text_ai_api_key
        self.vision_api_key = settings.vision_ai_api_key
        self.text_model = settings.text_ai_model
        self.vision_model = settings.vision_ai_model
        self.api_url = "https://api.groq.com/openai/v1/chat/completions"

    async def get_response(
        self,
        message: str,
        conversation_id: str,
        image_url: Optional[str] = None,
        history: Optional[list] = None,
    ) -> dict:
        """Получить ответ от ИИ"""
        
        try:
            # Формируем сообщения с историей
            messages = [{"role": "system", "content": TEXT_SYSTEM_PROMPT}]
            
            # Добавляем историю (до 100 сообщений, потом начинаем забывать старые)
            if history:
                # Если больше 100 сообщений - берём последние 100
                history_to_use = history[-100:] if len(history) > 100 else history
                for msg in history_to_use:
                    messages.append({
                        "role": msg.get("role", "user"),
                        "content": msg.get("content", "")
                    })
            
            # Добавляем текущее сообщение
            messages.append({"role": "user", "content": message})
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.api_url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": self.text_model,
                        "messages": messages,
                        "max_tokens": 1024,
                        "temperature": 0.7,
                    },
                )
                
                if response.status_code == 200:
                    data = response.json()
                    ai_text = data["choices"][0]["message"]["content"]
                    
                    return {
                        "text": ai_text,
                        "suggestions": self._generate_suggestions(message, ai_text),
                    }
                else:
                    print(f"Groq API error: {response.status_code} - {response.text}")
                    return self._get_fallback_response(message)
                    
        except Exception as e:
            print(f"AI Service error: {type(e).__name__}: {e}")
            return self._get_fallback_response(message)
    
    async def analyze_image(
        self,
        image_data: bytes,
        conversation_id: str,
        user_message: str = "",
    ) -> dict:
        """Анализ изображения растения"""
        
        # Конвертируем изображение в base64
        image_base64 = base64.b64encode(image_data).decode("utf-8")
        
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    self.api_url,
                    headers={
                        "Authorization": f"Bearer {self.vision_api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": self.vision_model,
                        "messages": [
                            {"role": "system", "content": VISION_SYSTEM_PROMPT},
                            {
                                "role": "user",
                                "content": [
                                    {
                                        "type": "image_url",
                                        "image_url": {
                                            "url": f"data:image/jpeg;base64,{image_base64}"
                                        },
                                    },
                                    {
                                        "type": "text",
                                        "text": user_message or "Что с этим растением? Помоги определить проблему."
                                    },
                                ],
                            },
                        ],
                        "max_tokens": 1024,
                        "temperature": 0.5,
                    },
                )
                
                if response.status_code == 200:
                    data = response.json()
                    ai_text = data["choices"][0]["message"]["content"]
                    
                    # Парсим диагноз из ответа
                    diagnosis = self._parse_diagnosis(ai_text)
                    
                    return {
                        "text": ai_text,
                        "diagnosis": diagnosis,
                        "recommendations": self._extract_recommendations(ai_text),
                        "confidence": 0.75,
                    }
                else:
                    print(f"Groq Vision API error: {response.status_code} - {response.text}")
                    return self._get_fallback_image_response()
                    
        except Exception as e:
            print(f"Vision AI Service error: {e}")
            return self._get_fallback_image_response()
    
    def _generate_suggestions(self, message: str, response: str) -> list:
        """Генерация подсказок на основе контекста"""
        msg_lower = message.lower()
        
        # Определяем язык
        is_uzbek = any(word in msg_lower for word in ['qanday', 'nima', 'yordam', 'kasall', "o'g'it"])
        
        if is_uzbek:
            if 'kasall' in msg_lower or "dog'" in msg_lower:
                return ['Rasm yuklash', 'Davolash usullari', 'Profilaktika']
            if "o'g'it" in msg_lower:
                return ["Bug'doy uchun", 'Sabzavotlar uchun', 'Organik']
            return ['Rasm yuklash', 'Kasalliklar', "O'g'itlar"]
        else:
            if 'болезн' in msg_lower or 'пятн' in msg_lower:
                return ['📷 Загрузить фото', 'Способы лечения', 'Профилактика']
            if 'удобрен' in msg_lower:
                return ['Для пшеницы', 'Для овощей', 'Органические']
            if 'вредител' in msg_lower:
                return ['📷 Загрузить фото', 'Народные методы', 'Химия']
            return ['📷 Загрузить фото', 'Болезни', 'Удобрения']
    
    def _parse_diagnosis(self, text: str) -> list:
        """Парсинг диагноза из текста ответа"""
        # Простой парсинг - ищем ключевые слова болезней
        diseases = {
            'серая гниль': ('Серая гниль', 'Грибковое заболевание'),
            'мучнистая роса': ('Мучнистая роса', 'Белый налёт на листьях'),
            'фитофтороз': ('Фитофтороз', 'Бурые пятна на листьях'),
            'хлороз': ('Хлороз', 'Пожелтение листьев'),
            'тля': ('Тля', 'Мелкие насекомые на листьях'),
            'паутинный клещ': ('Паутинный клещ', 'Мелкие точки и паутина'),
            'kulrang chirish': ('Kulrang chirish', "Zamburug' kasalligi"),
            'un shudring': ('Un shudring', 'Barglarda oq qoplama'),
            'fitoftoroz': ('Fitoftoroz', "Barglarda jigarrang dog'lar"),
        }
        
        text_lower = text.lower()
        found = []
        
        for key, (name, desc) in diseases.items():
            if key in text_lower:
                found.append(Diagnosis(
                    name=name,
                    probability=75,
                    description=desc,
                    recommendations=[],
                ))
        
        return found if found else None
    
    def _extract_recommendations(self, text: str) -> list:
        """Извлечение рекомендаций из текста"""
        recommendations = []
        
        # Ищем строки с рекомендациями
        keywords = ['обработ', 'опрыска', 'удали', 'полив', 'ishlov', 'purkash', "olib tashla"]
        
        for line in text.split('\n'):
            line_lower = line.lower()
            if any(kw in line_lower for kw in keywords):
                clean_line = line.strip('- •').strip()
                if clean_line and len(clean_line) > 10:
                    recommendations.append(clean_line)
        
        return recommendations[:5] if recommendations else [
            "Следуйте рекомендациям выше",
            "При ухудшении обратитесь к специалисту"
        ]
    
    def _get_fallback_response(self, message: str) -> dict:
        """Запасной ответ при ошибке API"""
        msg_lower = message.lower().strip()
        
        # Определяем язык
        is_uzbek = any(word in msg_lower for word in ['qanday', 'nima', 'yordam', 'salom', "o'simlik", 'kerak', 'bor', 'assalom'])
        
        # Проверяем приветствие
        greetings_uz = ['salom', 'assalomu alaykum', 'hayrli kun']
        greetings_ru = ['привет', 'здравствуй', 'добрый день', 'здравствуйте']
        
        if any(g in msg_lower for g in greetings_uz):
            return {
                "text": "Assalomu alaykum! Men Dehqonjon — Sizning fermer yordamchingizman 🌱\n\nSizga qanday yordam bera olaman?\n- O'simlik kasalliklari haqida so'rashingiz mumkin\n- Rasm yuklasangiz, muammoni aniqlayman\n- O'g'itlar va parvarish bo'yicha maslahat beraman",
                "suggestions": ['Rasm yuklash', 'Kasalliklar', "O'g'itlar"],
            }
        
        if any(g in msg_lower for g in greetings_ru):
            return {
                "text": "Здравствуйте! Я Dehqonjon — Ваш помощник-фермер 🌱\n\nЧем могу Вам помочь?\n- Могу ответить на вопросы о болезнях растений\n- Загрузите фото — определю проблему\n- Подскажу по удобрениям и уходу",
                "suggestions": ['📷 Загрузить фото', 'Болезни', 'Удобрения'],
            }
        
        # Проверяем теоретический ли вопрос
        theory_keywords = ['молекуляр', 'почему', 'как работает', 'механизм', 'процесс', 
                          'биохим', 'сигнал', 'клетк', 'гормон', 'фотосинтез', 'устьиц',
                          'qanday ishlaydi', 'mexanizm', 'nima uchun']
        is_theory = any(kw in msg_lower for kw in theory_keywords)
        
        if is_theory:
            if is_uzbek:
                return {
                    "text": "Zo'r savol!\n\nO'simlik suv yetishmasligini hujayralarida bosim tushishi orqali sezadi. Keyin ABA gormoni chiqadi — bu \"stress signali\", u og'izchalarni yopadi.\n\nKaktus va aloye kechasi nafas oladi, kunduzi yopiq — shuning uchun cho'lda yashaydi. Tropik o'simliklar bunday qila olmaydi, ularga doim nam kerak.\n\nO'simliklar ham o'z usulida omon qolishga harakat qiladi — hammasi shu!",
                    "suggestions": ["Batafsil ma'lumot", "Boshqa savol", "Kasalliklar haqida"],
                }
            else:
                return {
                    "text": "Отличный вопрос!\n\nКогда воды мало — в клетках падает давление, и растение это чувствует. Вырабатывается гормон стресса ABA, который закрывает устьица, чтобы не терять воду.\n\nКактусы и алоэ дышат ночью, а днём устьица закрыты — хитро, да? Поэтому в пустыне выживают. Тропические так не умеют — им нужна постоянная влажность.\n\nРастения тоже ищут свой способ выживать — вот и всё!",
                    "suggestions": ['Подробнее про это', 'Другой вопрос', 'Болезни растений'],
                }
        
        if is_uzbek:
            return {
                "text": "Savolingizni tushundim! Aniqroq javob berish uchun menga ko'proq ma'lumot kerak bo'ladi. O'simlik rasmini yuklasangiz, muammoni aniqroq ko'ra olaman.",
                "suggestions": ['Rasm yuklash', 'Kasalliklar', "O'g'itlar"],
            }
        else:
            return {
                "text": "Понял Ваш вопрос! Чтобы дать точный совет, мне нужно больше информации. Загрузите фото растения — так я лучше увижу проблему 📷",
                "suggestions": ['📷 Загрузить фото', 'Болезни', 'Удобрения'],
            }
    
    def _get_fallback_image_response(self) -> dict:
        """Запасной ответ для анализа изображений"""
        return {
            "text": "Kechirasiz, rasmda muammoni aniq ko'ra olmadim. Iltimos, yaxshi yoritilgan joyda yaqinroqdan suratga oling — shunda aniqroq ayta olaman! 📸\n\nИзвините, не могу чётко разглядеть проблему на фото. Попробуйте сфотографировать ближе при хорошем освещении.",
            "diagnosis": None,
            "recommendations": [
                "Kunduzgi yorug'likda suratga oling / Сделайте фото при дневном свете",
                "Zararlangan joyni yaqindan suratga oling / Сфотографируйте поражённый участок крупным планом",
            ],
            "confidence": 0.3,
        }
