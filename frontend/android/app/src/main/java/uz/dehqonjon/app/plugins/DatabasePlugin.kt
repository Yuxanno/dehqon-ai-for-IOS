package uz.dehqonjon.app.plugins

import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.google.gson.Gson
import com.google.gson.JsonObject
import kotlinx.coroutines.*
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

@CapacitorPlugin(name = "DatabasePlugin")
class DatabasePlugin : Plugin() {
    
    private val gson = Gson()
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    
    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()
    
    private lateinit var encryptedPrefs: SharedPreferences
    
    private val baseUrl = "https://dehqon-ai-backend.onrender.com/api"
    
    companion object {
        private const val PREFS_NAME = "dehqonjon_secure_prefs"
    }
    
    override fun load() {
        super.load()
        initEncryptedPrefs()
    }
    
    private fun initEncryptedPrefs() {
        val masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()
        
        encryptedPrefs = EncryptedSharedPreferences.create(
            context,
            PREFS_NAME,
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    }


    @PluginMethod
    fun register(call: PluginCall) {
        val phone = call.getString("phone") ?: return call.reject("Phone required")
        val password = call.getString("password") ?: return call.reject("Password required")
        val name = call.getString("name")
        
        scope.launch {
            try {
                val body = JsonObject().apply {
                    addProperty("phone", phone)
                    addProperty("password", password)
                    name?.let { addProperty("name", it) }
                }
                val response = postRequest("/auth/register", body)
                if (response != null) {
                    response.get("token")?.asString?.let { saveToken(it) }
                    call.resolve(jsonToJSObject(response))
                } else call.reject("Registration failed")
            } catch (e: Exception) { call.reject(e.message) }
        }
    }
    
    @PluginMethod
    fun login(call: PluginCall) {
        val phone = call.getString("phone") ?: return call.reject("Phone required")
        val password = call.getString("password") ?: return call.reject("Password required")
        
        scope.launch {
            try {
                val body = JsonObject().apply {
                    addProperty("phone", phone)
                    addProperty("password", password)
                }
                val response = postRequest("/auth/login", body)
                if (response != null) {
                    response.get("token")?.asString?.let { saveToken(it) }
                    call.resolve(jsonToJSObject(response))
                } else call.reject("Invalid credentials")
            } catch (e: Exception) { call.reject(e.message) }
        }
    }
    
    @PluginMethod
    fun getMe(call: PluginCall) {
        val token = call.getString("token") ?: getStoredToken() ?: return call.reject("Not authenticated")
        scope.launch {
            try {
                val response = getRequest("/auth/me", token)
                if (response != null) call.resolve(jsonToJSObject(response))
                else call.reject("Failed")
            } catch (e: Exception) { call.reject(e.message) }
        }
    }
    
    @PluginMethod
    fun updateProfile(call: PluginCall) {
        val token = call.getString("token") ?: getStoredToken() ?: return call.reject("Not authenticated")
        scope.launch {
            try {
                val body = JsonObject().apply {
                    call.getString("name")?.let { addProperty("name", it) }
                    call.getString("region")?.let { addProperty("region", it) }
                    call.getString("username")?.let { addProperty("username", it) }
                }
                val response = putRequest("/auth/me", body, token)
                if (response != null) call.resolve(jsonToJSObject(response))
                else call.reject("Failed")
            } catch (e: Exception) { call.reject(e.message) }
        }
    }
    
    @PluginMethod
    fun becomeSeller(call: PluginCall) {
        val token = call.getString("token") ?: getStoredToken() ?: return call.reject("Not authenticated")
        scope.launch {
            try {
                val body = JsonObject().apply {
                    addProperty("seller_name", call.getString("seller_name"))
                    addProperty("region", call.getString("region"))
                    addProperty("seller_type", call.getString("seller_type"))
                }
                val response = postRequest("/auth/become-seller", body, token)
                if (response != null) call.resolve(jsonToJSObject(response))
                else call.reject("Failed")
            } catch (e: Exception) { call.reject(e.message) }
        }
    }
    
    @PluginMethod
    fun logout(call: PluginCall) {
        encryptedPrefs.edit().remove("auth_token").apply()
        call.resolve(JSObject().apply { put("success", true) })
    }
    
    @PluginMethod
    fun getStoredTokenMethod(call: PluginCall) {
        call.resolve(JSObject().apply { put("token", getStoredToken()) })
    }


    @PluginMethod
    fun getProducts(call: PluginCall) {
        scope.launch {
            try {
                val params = mutableListOf<String>()
                call.getString("category")?.let { params.add("category=$it") }
                call.getString("search")?.let { params.add("search=$it") }
                call.getInt("page")?.let { params.add("page=$it") }
                val query = if (params.isNotEmpty()) "?${params.joinToString("&")}" else ""
                val response = getRequest("/products$query", null)
                if (response != null) call.resolve(jsonToJSObject(response))
                else call.reject("Failed")
            } catch (e: Exception) { call.reject(e.message) }
        }
    }
    
    @PluginMethod
    fun getProductById(call: PluginCall) {
        val id = call.getString("id") ?: return call.reject("ID required")
        scope.launch {
            try {
                val response = getRequest("/products/$id", null)
                if (response != null) call.resolve(jsonToJSObject(response))
                else call.reject("Not found")
            } catch (e: Exception) { call.reject(e.message) }
        }
    }
    
    @PluginMethod
    fun createProduct(call: PluginCall) {
        val token = call.getString("token") ?: getStoredToken() ?: return call.reject("Not authenticated")
        scope.launch {
            try {
                val body = JsonObject().apply {
                    addProperty("title", call.getString("title"))
                    call.getString("description")?.let { addProperty("description", it) }
                    addProperty("price", call.getDouble("price"))
                    addProperty("category", call.getString("category"))
                    call.getString("region")?.let { addProperty("region", it) }
                }
                val response = postRequest("/products", body, token)
                if (response != null) call.resolve(jsonToJSObject(response))
                else call.reject("Failed")
            } catch (e: Exception) { call.reject(e.message) }
        }
    }
    
    @PluginMethod
    fun updateProduct(call: PluginCall) {
        val token = call.getString("token") ?: getStoredToken() ?: return call.reject("Not authenticated")
        val id = call.getString("id") ?: return call.reject("ID required")
        scope.launch {
            try {
                val body = JsonObject().apply {
                    call.getString("title")?.let { addProperty("title", it) }
                    call.getString("description")?.let { addProperty("description", it) }
                    call.getDouble("price")?.let { addProperty("price", it) }
                    call.getString("category")?.let { addProperty("category", it) }
                    call.getString("status")?.let { addProperty("status", it) }
                }
                val response = putRequest("/products/$id", body, token)
                if (response != null) call.resolve(jsonToJSObject(response))
                else call.reject("Failed")
            } catch (e: Exception) { call.reject(e.message) }
        }
    }
    
    @PluginMethod
    fun deleteProduct(call: PluginCall) {
        val token = call.getString("token") ?: getStoredToken() ?: return call.reject("Not authenticated")
        val id = call.getString("id") ?: return call.reject("ID required")
        scope.launch {
            try {
                val success = deleteRequest("/products/$id", token)
                call.resolve(JSObject().apply { put("success", success) })
            } catch (e: Exception) { call.reject(e.message) }
        }
    }


    @PluginMethod
    fun getFavorites(call: PluginCall) {
        val token = call.getString("token") ?: getStoredToken() ?: return call.reject("Not authenticated")
        scope.launch {
            try {
                val response = getRequest("/favorites", token)
                if (response != null) call.resolve(jsonToJSObject(response))
                else call.reject("Failed")
            } catch (e: Exception) { call.reject(e.message) }
        }
    }
    
    @PluginMethod
    fun addFavorite(call: PluginCall) {
        val token = call.getString("token") ?: getStoredToken() ?: return call.reject("Not authenticated")
        val productId = call.getString("product_id") ?: return call.reject("Product ID required")
        scope.launch {
            try {
                val body = JsonObject().apply { addProperty("product_id", productId) }
                val response = postRequest("/favorites", body, token)
                call.resolve(JSObject().apply { put("success", response != null) })
            } catch (e: Exception) { call.reject(e.message) }
        }
    }
    
    @PluginMethod
    fun removeFavorite(call: PluginCall) {
        val token = call.getString("token") ?: getStoredToken() ?: return call.reject("Not authenticated")
        val productId = call.getString("product_id") ?: return call.reject("Product ID required")
        scope.launch {
            try {
                val success = deleteRequest("/favorites/$productId", token)
                call.resolve(JSObject().apply { put("success", success) })
            } catch (e: Exception) { call.reject(e.message) }
        }
    }
    
    @PluginMethod
    fun checkFavorite(call: PluginCall) {
        val token = call.getString("token") ?: getStoredToken() ?: return call.reject("Not authenticated")
        val productId = call.getString("product_id") ?: return call.reject("Product ID required")
        scope.launch {
            try {
                val response = getRequest("/favorites/check/$productId", token)
                if (response != null) call.resolve(jsonToJSObject(response))
                else call.resolve(JSObject().apply { put("is_favorite", false) })
            } catch (e: Exception) { call.reject(e.message) }
        }
    }
    
    @PluginMethod
    fun createChatSession(call: PluginCall) {
        val token = call.getString("token") ?: getStoredToken() ?: return call.reject("Not authenticated")
        scope.launch {
            try {
                val body = JsonObject().apply { addProperty("title", call.getString("title") ?: "Yangi chat") }
                val response = postRequest("/chat/sessions", body, token)
                if (response != null) call.resolve(jsonToJSObject(response))
                else call.reject("Failed")
            } catch (e: Exception) { call.reject(e.message) }
        }
    }
    
    @PluginMethod
    fun getChatSessions(call: PluginCall) {
        val token = call.getString("token") ?: getStoredToken() ?: return call.reject("Not authenticated")
        scope.launch {
            try {
                val response = getRequestArray("/chat/sessions", token)
                call.resolve(JSObject().apply { put("sessions", response ?: JSArray()) })
            } catch (e: Exception) { call.reject(e.message) }
        }
    }
    
    @PluginMethod
    fun getChatSession(call: PluginCall) {
        val token = call.getString("token") ?: getStoredToken() ?: return call.reject("Not authenticated")
        val sessionId = call.getString("sessionId") ?: return call.reject("Session ID required")
        scope.launch {
            try {
                val response = getRequest("/chat/sessions/$sessionId", token)
                if (response != null) call.resolve(jsonToJSObject(response))
                else call.reject("Not found")
            } catch (e: Exception) { call.reject(e.message) }
        }
    }
    
    @PluginMethod
    fun addChatMessage(call: PluginCall) {
        val token = call.getString("token") ?: getStoredToken() ?: return call.reject("Not authenticated")
        val sessionId = call.getString("sessionId") ?: return call.reject("Session ID required")
        val msg = call.getObject("message") ?: return call.reject("Message required")
        scope.launch {
            try {
                val body = JsonObject().apply {
                    addProperty("id", msg.getString("id"))
                    addProperty("role", msg.getString("role"))
                    addProperty("content", msg.getString("content"))
                    msg.getString("image_url")?.let { addProperty("image_url", it) }
                    addProperty("created_at", msg.getString("created_at"))
                }
                val response = postRequest("/chat/sessions/$sessionId/messages", body, token)
                call.resolve(JSObject().apply { put("success", response != null) })
            } catch (e: Exception) { call.reject(e.message) }
        }
    }
    
    @PluginMethod
    fun deleteChatSession(call: PluginCall) {
        val token = call.getString("token") ?: getStoredToken() ?: return call.reject("Not authenticated")
        val sessionId = call.getString("sessionId") ?: return call.reject("Session ID required")
        scope.launch {
            try {
                val success = deleteRequest("/chat/sessions/$sessionId", token)
                call.resolve(JSObject().apply { put("success", success) })
            } catch (e: Exception) { call.reject(e.message) }
        }
    }


    // HTTP helpers
    private suspend fun getRequest(endpoint: String, token: String?): JsonObject? = withContext(Dispatchers.IO) {
        val req = Request.Builder().url("$baseUrl$endpoint").get()
        token?.let { req.addHeader("Authorization", "Bearer $it") }
        try {
            val res = client.newCall(req.build()).execute()
            if (res.isSuccessful) gson.fromJson(res.body?.string(), JsonObject::class.java) else null
        } catch (e: Exception) { null }
    }
    
    private suspend fun getRequestArray(endpoint: String, token: String?): JSArray? = withContext(Dispatchers.IO) {
        val req = Request.Builder().url("$baseUrl$endpoint").get()
        token?.let { req.addHeader("Authorization", "Bearer $it") }
        try {
            val res = client.newCall(req.build()).execute()
            if (res.isSuccessful) {
                val arr = gson.fromJson(res.body?.string(), com.google.gson.JsonArray::class.java)
                JSArray().apply { arr.forEach { put(jsonToJSObject(it.asJsonObject)) } }
            } else null
        } catch (e: Exception) { null }
    }
    
    private suspend fun postRequest(endpoint: String, body: JsonObject, token: String? = null): JsonObject? = withContext(Dispatchers.IO) {
        val req = Request.Builder()
            .url("$baseUrl$endpoint")
            .post(body.toString().toRequestBody("application/json".toMediaType()))
            .addHeader("Content-Type", "application/json")
        token?.let { req.addHeader("Authorization", "Bearer $it") }
        try {
            val res = client.newCall(req.build()).execute()
            if (res.isSuccessful) gson.fromJson(res.body?.string(), JsonObject::class.java) else null
        } catch (e: Exception) { null }
    }
    
    private suspend fun putRequest(endpoint: String, body: JsonObject, token: String): JsonObject? = withContext(Dispatchers.IO) {
        val req = Request.Builder()
            .url("$baseUrl$endpoint")
            .put(body.toString().toRequestBody("application/json".toMediaType()))
            .addHeader("Content-Type", "application/json")
            .addHeader("Authorization", "Bearer $token")
            .build()
        try {
            val res = client.newCall(req).execute()
            if (res.isSuccessful) gson.fromJson(res.body?.string(), JsonObject::class.java) else null
        } catch (e: Exception) { null }
    }
    
    private suspend fun deleteRequest(endpoint: String, token: String): Boolean = withContext(Dispatchers.IO) {
        val req = Request.Builder()
            .url("$baseUrl$endpoint")
            .delete()
            .addHeader("Authorization", "Bearer $token")
            .build()
        try { client.newCall(req).execute().isSuccessful } catch (e: Exception) { false }
    }
    
    private fun saveToken(token: String) = encryptedPrefs.edit().putString("auth_token", token).apply()
    private fun getStoredToken(): String? = encryptedPrefs.getString("auth_token", null)
    
    private fun jsonToJSObject(json: JsonObject): JSObject {
        val js = JSObject()
        json.entrySet().forEach { (k, v) ->
            when {
                v.isJsonNull -> js.put(k, null)
                v.isJsonPrimitive -> {
                    val p = v.asJsonPrimitive
                    when { p.isBoolean -> js.put(k, p.asBoolean); p.isNumber -> js.put(k, p.asNumber); else -> js.put(k, p.asString) }
                }
                v.isJsonArray -> {
                    val arr = JSArray()
                    v.asJsonArray.forEach { if (it.isJsonObject) arr.put(jsonToJSObject(it.asJsonObject)) else if (it.isJsonPrimitive) arr.put(it.asString) }
                    js.put(k, arr)
                }
                v.isJsonObject -> js.put(k, jsonToJSObject(v.asJsonObject))
            }
        }
        return js
    }
    
    override fun handleOnDestroy() { super.handleOnDestroy(); scope.cancel() }
}
