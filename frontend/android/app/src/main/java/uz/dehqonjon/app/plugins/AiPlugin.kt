package uz.dehqonjon.app.plugins

import android.util.Log
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.google.gson.Gson
import com.google.gson.JsonArray
import com.google.gson.JsonObject
import kotlinx.coroutines.*
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import uz.dehqonjon.app.BuildConfig
import java.io.IOException
import java.util.concurrent.TimeUnit

@CapacitorPlugin(name = "AiPlugin")
class AiPlugin : Plugin() {
    
    private val TAG = "AiPlugin"
    private val gson = Gson()
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    
    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()
    
    private val apiUrl = "https://api.groq.com/openai/v1/chat/completions"
    private val textModel = "llama-3.3-70b-versatile"
    private val visionModel = "meta-llama/llama-4-scout-17b-16e-instruct"
    
    companion object {
        private const val TEXT_SYSTEM_PROMPT = """Ты — дружелюбный помощник-фермер. Объясняй как для подростка 12-14 лет: понятно, но не слишком просто.

ВАЖНО — ЧЕСТНОСТЬ И ТОЧНОСТЬ:
- Если не уверен — скажи "Извини, не нашёл точную информацию по этому вопросу"
- НЕ выдумывай факты. Отвечай только на основе проверенных знаний
- Разделяй: что ты ЗНАЕШЬ точно, а что только ПРЕДПОЛАГАЕШЬ

СТИЛЬ ОБЩЕНИЯ:
- Короткие предложения, без сложных слов
- Используй сравнения и примеры из жизни
- Говори "ты", а не "вы"
- Не пиши длинные тексты — лучше коротко и по делу

ПРАВИЛА:
- Отвечай на языке пользователя (узбекский или русский)
- На вопросы типа "почему/как/что такое" — отвечай сразу, не проси фото
- Фото проси только если описывают конкретную болячку"""

        private const val VISION_SYSTEM_PROMPT = """Ты — агроном с 20-летним опытом. Анализируешь ТОЛЬКО то, что реально видно на фото.

ЧЕСТНОСТЬ:
- Если не уверен — скажи "похоже на..." или "возможно это..."
- НЕ выдумывай болезни. Говори только о том, что реально видишь

Твоя задача — найти ТОЛЬКО ОДНУ основную проблему растения.

Скажи строго по порядку:
1. Растение — одним словом
2. Проблема — одним словом (гниль / пятна / вредители / деформация / стресс)
3. Диагноз — название болезни или вредителя

ПОСЛЕ ДИАГНОЗА:
1. Назови проблему прямо
2. Объясни ПРОСТО, почему ты так решил
3. Дай конкретные советы: что убрать, чем обработать, дозировка

Отвечай ТОЛЬКО на языке пользователя."""
    }

    
    @PluginMethod
    fun sendMessage(call: PluginCall) {
        val message = call.getString("message") ?: run {
            call.reject("Message is required")
            return
        }
        val conversationId = call.getString("conversationId") ?: ""
        val historyArray = call.getArray("history")
        
        Log.d(TAG, "sendMessage called")
        Log.d(TAG, "Message: $message")
        Log.d(TAG, "ConversationId: $conversationId")
        Log.d(TAG, "History size: ${historyArray?.length() ?: 0}")
        
        scope.launch {
            try {
                val result = getAiResponse(message, conversationId, historyArray)
                call.resolve(result)
            } catch (e: Exception) {
                Log.e(TAG, "sendMessage error: ${e.message}", e)
                call.reject("AI request failed: ${e.message}")
            }
        }
    }
    
    @PluginMethod
    fun analyzeImage(call: PluginCall) {
        val imageBase64 = call.getString("imageBase64") ?: run {
            call.reject("Image data is required")
            return
        }
        val conversationId = call.getString("conversationId") ?: ""
        val userMessage = call.getString("message") ?: "Что с этим растением? Помоги определить проблему."
        
        scope.launch {
            try {
                val result = analyzeImageInternal(imageBase64, conversationId, userMessage)
                call.resolve(result)
            } catch (e: Exception) {
                call.reject("Image analysis failed: ${e.message}")
            }
        }
    }
    
    private suspend fun getAiResponse(
        message: String,
        conversationId: String,
        historyArray: com.getcapacitor.JSArray?
    ): JSObject = withContext(Dispatchers.IO) {
        val apiKey = BuildConfig.GROQ_API_KEY
        Log.d(TAG, "getAiResponse called, message: $message")
        Log.d(TAG, "API Key length: ${apiKey.length}, isEmpty: ${apiKey.isEmpty()}")
        Log.d(TAG, "API Key first 10 chars: ${apiKey.take(10)}...")
        
        if (apiKey.isEmpty()) {
            Log.e(TAG, "API Key is empty! Returning fallback response")
            return@withContext getFallbackResponse(message)
        }
        
        val messagesArray = JsonArray()
        
        // System prompt
        val systemMsg = JsonObject().apply {
            addProperty("role", "system")
            addProperty("content", TEXT_SYSTEM_PROMPT)
        }
        messagesArray.add(systemMsg)
        
        // History
        historyArray?.let { history ->
            try {
                Log.d(TAG, "Processing history, length: ${history.length()}")
                for (i in 0 until minOf(history.length(), 100)) {
                    try {
                        val msgObj = history.getJSONObject(i)
                        val role = msgObj.optString("role", "user")
                        val content = msgObj.optString("content", "")
                        
                        if (content.isNotEmpty()) {
                            val historyMsg = JsonObject().apply {
                                addProperty("role", role)
                                addProperty("content", content)
                            }
                            messagesArray.add(historyMsg)
                            Log.d(TAG, "Added history message $i: role=$role, content=${content.take(50)}...")
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "Error parsing history item $i: ${e.message}")
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error processing history: ${e.message}")
            }
        }
        
        // Current message
        val userMsg = JsonObject().apply {
            addProperty("role", "user")
            addProperty("content", message)
        }
        messagesArray.add(userMsg)
        
        val requestBody = JsonObject().apply {
            addProperty("model", textModel)
            add("messages", messagesArray)
            addProperty("max_tokens", 1024)
            addProperty("temperature", 0.7)
        }
        
        val request = Request.Builder()
            .url(apiUrl)
            .addHeader("Authorization", "Bearer $apiKey")
            .addHeader("Content-Type", "application/json")
            .post(requestBody.toString().toRequestBody("application/json".toMediaType()))
            .build()
        
        try {
            Log.d(TAG, "Sending request to Groq API...")
            val response = client.newCall(request).execute()
            Log.d(TAG, "Response code: ${response.code}")
            
            if (response.isSuccessful) {
                val responseBody = response.body?.string() ?: ""
                Log.d(TAG, "Response body length: ${responseBody.length}")
                val jsonResponse = gson.fromJson(responseBody, JsonObject::class.java)
                val aiText = jsonResponse
                    .getAsJsonArray("choices")
                    .get(0).asJsonObject
                    .getAsJsonObject("message")
                    .get("content").asString
                
                Log.d(TAG, "AI response received, length: ${aiText.length}")
                JSObject().apply {
                    put("response", aiText)
                    put("conversation_id", conversationId.ifEmpty { generateConversationId() })
                    put("suggestions", generateSuggestions(message, aiText))
                }
            } else {
                val errorBody = response.body?.string() ?: "No error body"
                Log.e(TAG, "API error: ${response.code} - $errorBody")
                getFallbackResponse(message)
            }
        } catch (e: IOException) {
            Log.e(TAG, "Network error: ${e.message}", e)
            getFallbackResponse(message)
        }
    }
    
    private suspend fun analyzeImageInternal(
        imageBase64: String,
        conversationId: String,
        userMessage: String
    ): JSObject = withContext(Dispatchers.IO) {
        // Use separate Vision API key if available, otherwise fallback to main key
        val apiKey = BuildConfig.GROQ_VISION_API_KEY.ifEmpty { BuildConfig.GROQ_API_KEY }
        if (apiKey.isEmpty()) {
            return@withContext getFallbackImageResponse()
        }
        
        val messagesArray = JsonArray()
        
        // System prompt
        val systemMsg = JsonObject().apply {
            addProperty("role", "system")
            addProperty("content", VISION_SYSTEM_PROMPT)
        }
        messagesArray.add(systemMsg)
        
        // User message with image
        val contentArray = JsonArray()
        
        val imageContent = JsonObject().apply {
            addProperty("type", "image_url")
            add("image_url", JsonObject().apply {
                addProperty("url", "data:image/jpeg;base64,$imageBase64")
            })
        }
        contentArray.add(imageContent)
        
        val textContent = JsonObject().apply {
            addProperty("type", "text")
            addProperty("text", userMessage)
        }
        contentArray.add(textContent)
        
        val userMsg = JsonObject().apply {
            addProperty("role", "user")
            add("content", contentArray)
        }
        messagesArray.add(userMsg)
        
        val requestBody = JsonObject().apply {
            addProperty("model", visionModel)
            add("messages", messagesArray)
            addProperty("max_tokens", 1024)
            addProperty("temperature", 0.5)
        }
        
        val request = Request.Builder()
            .url(apiUrl)
            .addHeader("Authorization", "Bearer $apiKey")
            .addHeader("Content-Type", "application/json")
            .post(requestBody.toString().toRequestBody("application/json".toMediaType()))
            .build()
        
        try {
            val response = client.newCall(request).execute()
            if (response.isSuccessful) {
                val responseBody = response.body?.string() ?: ""
                val jsonResponse = gson.fromJson(responseBody, JsonObject::class.java)
                val aiText = jsonResponse
                    .getAsJsonArray("choices")
                    .get(0).asJsonObject
                    .getAsJsonObject("message")
                    .get("content").asString
                
                val diagnosis = parseDiagnosis(aiText)
                val recommendations = extractRecommendations(aiText)
                
                JSObject().apply {
                    put("analysis", aiText)
                    put("diagnosis", diagnosis)
                    put("recommendations", recommendations)
                    put("confidence", 0.75)
                }
            } else {
                getFallbackImageResponse()
            }
        } catch (e: IOException) {
            getFallbackImageResponse()
        }
    }
    
    private fun generateSuggestions(message: String, response: String): com.getcapacitor.JSArray {
        val msgLower = message.lowercase()
        val isUzbek = listOf("qanday", "nima", "yordam", "kasall", "o'g'it").any { it in msgLower }
        
        val suggestions = if (isUzbek) {
            when {
                "kasall" in msgLower || "dog'" in msgLower -> listOf("Rasm yuklash", "Davolash usullari", "Profilaktika")
                "o'g'it" in msgLower -> listOf("Bug'doy uchun", "Sabzavotlar uchun", "Organik")
                else -> listOf("Rasm yuklash", "Kasalliklar", "O'g'itlar")
            }
        } else {
            when {
                "болезн" in msgLower || "пятн" in msgLower -> listOf("📷 Загрузить фото", "Способы лечения", "Профилактика")
                "удобрен" in msgLower -> listOf("Для пшеницы", "Для овощей", "Органические")
                "вредител" in msgLower -> listOf("📷 Загрузить фото", "Народные методы", "Химия")
                else -> listOf("📷 Загрузить фото", "Болезни", "Удобрения")
            }
        }
        
        return com.getcapacitor.JSArray().apply {
            suggestions.forEach { put(it) }
        }
    }
    
    private fun parseDiagnosis(text: String): com.getcapacitor.JSArray {
        val diseases = mapOf(
            "серая гниль" to Pair("Серая гниль", "Грибковое заболевание"),
            "мучнистая роса" to Pair("Мучнистая роса", "Белый налёт на листьях"),
            "фитофтороз" to Pair("Фитофтороз", "Бурые пятна на листьях"),
            "хлороз" to Pair("Хлороз", "Пожелтение листьев"),
            "тля" to Pair("Тля", "Мелкие насекомые на листьях"),
            "паутинный клещ" to Pair("Паутинный клещ", "Мелкие точки и паутина"),
            "kulrang chirish" to Pair("Kulrang chirish", "Zamburug' kasalligi"),
            "un shudring" to Pair("Un shudring", "Barglarda oq qoplama"),
            "fitoftoroz" to Pair("Fitoftoroz", "Barglarda jigarrang dog'lar")
        )
        
        val textLower = text.lowercase()
        val found = com.getcapacitor.JSArray()
        
        diseases.forEach { (key, value) ->
            if (key in textLower) {
                found.put(JSObject().apply {
                    put("name", value.first)
                    put("probability", 75)
                    put("description", value.second)
                    put("recommendations", com.getcapacitor.JSArray())
                })
            }
        }
        
        return found
    }
    
    private fun extractRecommendations(text: String): com.getcapacitor.JSArray {
        val keywords = listOf("обработ", "опрыска", "удали", "полив", "ishlov", "purkash", "olib tashla")
        val recommendations = com.getcapacitor.JSArray()
        
        text.split("\n").forEach { line ->
            val lineLower = line.lowercase()
            if (keywords.any { it in lineLower }) {
                val cleanLine = line.trim().trimStart('-', '•', ' ')
                if (cleanLine.length > 10) {
                    recommendations.put(cleanLine)
                }
            }
        }
        
        if (recommendations.length() == 0) {
            recommendations.put("Следуйте рекомендациям выше")
            recommendations.put("При ухудшении обратитесь к специалисту")
        }
        
        return recommendations
    }
    
    private fun getFallbackResponse(message: String): JSObject {
        val msgLower = message.lowercase()
        val isUzbek = listOf("qanday", "nima", "yordam", "salom", "o'simlik").any { it in msgLower }
        
        return if (isUzbek) {
            JSObject().apply {
                put("response", "Savolingizni tushundim! Aniqroq javob berish uchun menga ko'proq ma'lumot kerak. O'simlik rasmini yuklasangiz, muammoni aniqroq ko'ra olaman.")
                put("conversation_id", generateConversationId())
                put("suggestions", com.getcapacitor.JSArray().apply {
                    put("Rasm yuklash")
                    put("Kasalliklar")
                    put("O'g'itlar")
                })
            }
        } else {
            JSObject().apply {
                put("response", "Понял твой вопрос! Чтобы дать точный совет, мне нужно больше информации. Загрузи фото растения — так я лучше увижу проблему 📷")
                put("conversation_id", generateConversationId())
                put("suggestions", com.getcapacitor.JSArray().apply {
                    put("📷 Загрузить фото")
                    put("Болезни")
                    put("Удобрения")
                })
            }
        }
    }
    
    private fun getFallbackImageResponse(): JSObject {
        return JSObject().apply {
            put("analysis", "Хм, не могу чётко разглядеть проблему на фото. Попробуй сфоткать поближе при хорошем освещении — листья или поражённое место. Так смогу точнее сказать что делать! 📸")
            put("diagnosis", com.getcapacitor.JSArray())
            put("recommendations", com.getcapacitor.JSArray().apply {
                put("Сделайте фото при дневном свете")
                put("Сфотографируйте поражённый участок крупным планом")
            })
            put("confidence", 0.3)
        }
    }
    
    private fun generateConversationId(): String {
        return "conv_${System.currentTimeMillis()}_${(1000..9999).random()}"
    }
    
    override fun handleOnDestroy() {
        super.handleOnDestroy()
        scope.cancel()
    }
}
