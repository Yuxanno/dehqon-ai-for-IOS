"""
Database module with MongoDB primary and SQLite fallback.

ВАЖНО: Предыдущая реализация была ошибочной потому что:
1. aiosqlite.connect() создаёт внутренний thread для работы с SQLite
2. Этот thread нельзя переиспользовать после закрытия соединения
3. Сохранение connection в переменной и повторное использование вызывает
   "RuntimeError: threads can only be started once"

РЕШЕНИЕ: Каждая операция открывает НОВОЕ соединение через async with.
Это безопасно для SQLite т.к. он поддерживает множественные соединения.
"""

from motor.motor_asyncio import AsyncIOMotorClient
from app.config import get_settings
import certifi
import aiosqlite
import json
import os
from typing import Optional, Any, List
from datetime import datetime
import re

settings = get_settings()

# Global database instance
_db_instance = None
_db_type = None  # "mongodb" or "sqlite"

SQLITE_DB_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 
    "dehqonjon.db"
)


def json_serializer(obj):
    """Сериализатор для datetime и других объектов."""
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")


def json_deserializer(data: str) -> dict:
    """Десериализатор с восстановлением datetime."""
    obj = json.loads(data)
    # Восстанавливаем datetime поля
    for key in ["created_at", "updated_at"]:
        if key in obj and obj[key]:
            try:
                obj[key] = datetime.fromisoformat(obj[key])
            except (ValueError, TypeError):
                pass
    return obj


# =============================================================================
# SQLite Implementation - каждая операция открывает новое соединение
# =============================================================================

class SQLiteCollection:
    """
    Эмулирует MongoDB Collection API для SQLite.
    
    КРИТИЧНО: Не сохраняем connection! Каждый метод открывает своё соединение.
    """
    
    def __init__(self, table_name: str):
        self.table_name = table_name
        self.db_path = SQLITE_DB_PATH
    
    async def find_one(self, query: dict) -> Optional[dict]:
        """Найти один документ по запросу."""
        async with aiosqlite.connect(self.db_path) as conn:
            conn.row_factory = aiosqlite.Row
            
            # Поиск по _id
            if "_id" in query:
                cursor = await conn.execute(
                    f"SELECT data FROM {self.table_name} WHERE id = ?",
                    (query["_id"],)
                )
                row = await cursor.fetchone()
                if row:
                    return json_deserializer(row["data"])
                return None
            
            # Поиск по другим полям (сканируем все записи)
            cursor = await conn.execute(f"SELECT data FROM {self.table_name}")
            rows = await cursor.fetchall()
            
            for row in rows:
                doc = json_deserializer(row["data"])
                if self._matches(doc, query):
                    return doc
            
            return None
    
    async def insert_one(self, document: dict) -> Any:
        """Вставить документ."""
        doc_id = document.get("_id", "")
        
        async with aiosqlite.connect(self.db_path) as conn:
            await conn.execute(
                f"INSERT OR REPLACE INTO {self.table_name} (id, data) VALUES (?, ?)",
                (doc_id, json.dumps(document, default=json_serializer))
            )
            await conn.commit()
        
        # Возвращаем объект с inserted_id как в MongoDB
        class InsertResult:
            def __init__(self, id):
                self.inserted_id = id
        
        return InsertResult(doc_id)
    
    async def update_one(self, query: dict, update: dict) -> Any:
        """Обновить один документ."""
        doc = await self.find_one(query)
        modified = 0
        
        if doc:
            # Применяем $set
            if "$set" in update:
                doc.update(update["$set"])
            
            # Применяем $inc
            if "$inc" in update:
                for key, value in update["$inc"].items():
                    doc[key] = doc.get(key, 0) + value
            
            # Сохраняем обновлённый документ
            async with aiosqlite.connect(self.db_path) as conn:
                await conn.execute(
                    f"UPDATE {self.table_name} SET data = ? WHERE id = ?",
                    (json.dumps(doc, default=json_serializer), doc["_id"])
                )
                await conn.commit()
            modified = 1
        
        class UpdateResult:
            def __init__(self, count):
                self.modified_count = count
        
        return UpdateResult(modified)
    
    async def delete_one(self, query: dict) -> Any:
        """Удалить один документ."""
        # Сначала находим документ
        doc = await self.find_one(query)
        deleted = 0
        
        if doc:
            async with aiosqlite.connect(self.db_path) as conn:
                await conn.execute(
                    f"DELETE FROM {self.table_name} WHERE id = ?",
                    (doc["_id"],)
                )
                await conn.commit()
            deleted = 1
        
        class DeleteResult:
            def __init__(self, count):
                self.deleted_count = count
        
        return DeleteResult(deleted)
    
    async def count_documents(self, query: dict) -> int:
        """Подсчитать документы по запросу."""
        async with aiosqlite.connect(self.db_path) as conn:
            cursor = await conn.execute(f"SELECT data FROM {self.table_name}")
            rows = await cursor.fetchall()
        
        count = 0
        for row in rows:
            doc = json_deserializer(row[0])
            if self._matches(doc, query):
                count += 1
        
        return count
    
    def find(self, query: dict = None) -> "SQLiteCursor":
        """Вернуть курсор для поиска множества документов."""
        return SQLiteCursor(self, query or {})
    
    def _matches(self, doc: dict, query: dict) -> bool:
        """Проверить, соответствует ли документ запросу."""
        for key, value in query.items():
            # Оператор $or
            if key == "$or":
                if not any(self._matches(doc, sub_q) for sub_q in value):
                    return False
                continue
            
            # Вложенные операторы
            if isinstance(value, dict):
                doc_value = doc.get(key)
                
                # $regex
                if "$regex" in value:
                    pattern = value["$regex"]
                    flags = re.IGNORECASE if value.get("$options") == "i" else 0
                    if not re.search(pattern, str(doc_value or ""), flags):
                        return False
                
                # $gte, $lte
                if "$gte" in value:
                    if (doc_value or 0) < value["$gte"]:
                        return False
                if "$lte" in value:
                    if (doc_value or 0) > value["$lte"]:
                        return False
                
                # $in
                if "$in" in value:
                    if doc_value not in value["$in"]:
                        return False
            else:
                # Простое сравнение
                if doc.get(key) != value:
                    return False
        
        return True


class SQLiteCursor:
    """Эмулирует MongoDB Cursor для цепочки .sort().skip().limit()"""
    
    def __init__(self, collection: SQLiteCollection, query: dict):
        self.collection = collection
        self.query = query
        self._sort_field = None
        self._sort_direction = 1
        self._skip_count = 0
        self._limit_count = 100
    
    def sort(self, field: str, direction: int = 1) -> "SQLiteCursor":
        self._sort_field = field
        self._sort_direction = direction
        return self
    
    def skip(self, count: int) -> "SQLiteCursor":
        self._skip_count = count
        return self
    
    def limit(self, count: int) -> "SQLiteCursor":
        self._limit_count = count
        return self
    
    async def to_list(self, length: int = None) -> List[dict]:
        """Выполнить запрос и вернуть список документов."""
        # Открываем НОВОЕ соединение для этого запроса
        async with aiosqlite.connect(self.collection.db_path) as conn:
            cursor = await conn.execute(
                f"SELECT data FROM {self.collection.table_name}"
            )
            rows = await cursor.fetchall()
        
        # Фильтруем
        results = []
        for row in rows:
            doc = json_deserializer(row[0])
            if self.collection._matches(doc, self.query):
                results.append(doc)
        
        # Сортируем
        if self._sort_field:
            results.sort(
                key=lambda x: x.get(self._sort_field) or "",
                reverse=(self._sort_direction == -1)
            )
        
        # Skip и Limit
        limit = length or self._limit_count
        results = results[self._skip_count : self._skip_count + limit]
        
        return results


class SQLiteDatabase:
    """Эмулирует MongoDB Database с коллекциями."""
    
    def __init__(self):
        self.users = SQLiteCollection("users")
        self.products = SQLiteCollection("products")
        self.favorites = SQLiteCollection("favorites")
    
    async def init_tables(self):
        """Создать таблицы если не существуют."""
        async with aiosqlite.connect(SQLITE_DB_PATH) as conn:
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    data TEXT NOT NULL
                )
            """)
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS products (
                    id TEXT PRIMARY KEY,
                    data TEXT NOT NULL
                )
            """)
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS favorites (
                    id TEXT PRIMARY KEY,
                    data TEXT NOT NULL
                )
            """)
            await conn.commit()


# =============================================================================
# Database Connection Management
# =============================================================================

async def connect_db():
    """Подключиться к базе данных (MongoDB или SQLite fallback)."""
    global _db_instance, _db_type
    
    # Попытка 1: MongoDB Atlas
    try:
        print("[INFO] Connecting to MongoDB Atlas...")
        client = AsyncIOMotorClient(
            settings.mongodb_url,
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000,
        )
        # Проверяем соединение
        await client.admin.command('ping')
        _db_instance = client.dehqonjon
        _db_type = "mongodb"
        print("[OK] Connected to MongoDB Atlas")
        return
    except Exception as e:
        print(f"[WARNING] MongoDB connection failed: {str(e)[:100]}...")
    
    # Попытка 2: SQLite fallback
    print("[INFO] Falling back to SQLite...")
    _db_instance = SQLiteDatabase()
    await _db_instance.init_tables()
    _db_type = "sqlite"
    print(f"[OK] SQLite database ready: {SQLITE_DB_PATH}")


async def close_db():
    """Закрыть соединение с базой данных."""
    global _db_instance, _db_type
    
    if _db_type == "mongodb" and _db_instance is not None:
        _db_instance.client.close()
        print("[OK] MongoDB connection closed")
    
    _db_instance = None
    _db_type = None


def get_db():
    """Получить текущий экземпляр базы данных."""
    return _db_instance
