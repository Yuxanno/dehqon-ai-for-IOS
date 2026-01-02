from fastapi import APIRouter, HTTPException, UploadFile, File
from typing import List
import uuid
from pathlib import Path
from PIL import Image
import io

router = APIRouter()

# Создаём папку uploads
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Максимальный размер файла (10 MB)
MAX_FILE_SIZE = 10 * 1024 * 1024
ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]

# Настройки сжатия
MAX_WIDTH = 1200
MAX_HEIGHT = 1200
JPEG_QUALITY = 85


def compress_image(content: bytes) -> bytes:
    """Сжать изображение до оптимального размера"""
    img = Image.open(io.BytesIO(content))
    
    # Конвертируем RGBA в RGB если нужно
    if img.mode in ('RGBA', 'P'):
        img = img.convert('RGB')
    
    # Изменяем размер если слишком большое
    if img.width > MAX_WIDTH or img.height > MAX_HEIGHT:
        img.thumbnail((MAX_WIDTH, MAX_HEIGHT), Image.Resampling.LANCZOS)
    
    # Сохраняем в JPEG с оптимальным качеством
    output = io.BytesIO()
    img.save(output, format='JPEG', quality=JPEG_QUALITY, optimize=True)
    return output.getvalue()


@router.post("/image")
async def upload_image(image: UploadFile = File(...)):
    """Загрузить одно изображение"""
    # Проверка типа файла
    if image.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Недопустимый тип файла. Разрешены: {', '.join(ALLOWED_TYPES)}"
        )
    
    # Проверка размера
    content = await image.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"Файл слишком большой. Максимум: {MAX_FILE_SIZE // (1024*1024)} MB"
        )
    
    # Сжимаем изображение
    compressed = compress_image(content)
    
    # Генерируем уникальное имя файла (всегда .jpg после сжатия)
    file_id = str(uuid.uuid4())
    filename = f"{file_id}.jpg"
    filepath = UPLOAD_DIR / filename
    
    # Сохраняем сжатый файл
    with open(filepath, "wb") as f:
        f.write(compressed)
    
    return {
        "url": f"/uploads/{filename}",
        "filename": filename,
    }


@router.post("/images")
async def upload_images(images: List[UploadFile] = File(...)):
    """Загрузить несколько изображений"""
    if len(images) > 8:
        raise HTTPException(status_code=400, detail="Максимум 8 изображений")
    
    urls = []
    for image in images:
        if image.content_type not in ALLOWED_TYPES:
            continue
        
        content = await image.read()
        if len(content) > MAX_FILE_SIZE:
            continue
        
        # Сжимаем изображение
        compressed = compress_image(content)
        
        file_id = str(uuid.uuid4())
        filename = f"{file_id}.jpg"
        filepath = UPLOAD_DIR / filename
        
        with open(filepath, "wb") as f:
            f.write(compressed)
        
        urls.append({
            "url": f"/uploads/{filename}",
            "filename": filename,
        })
    
    return {"images": urls}
