from fastapi import APIRouter, HTTPException
import httpx

router = APIRouter()

# Маппинг названий регионов из OSM к нашим ключам
REGION_MAPPING = {
    # Узбекские названия
    "toshkent shahri": "tashkent_city",
    "toshkent viloyati": "tashkent",
    "andijon viloyati": "andijan",
    "buxoro viloyati": "bukhara",
    "farg'ona viloyati": "fergana",
    "jizzax viloyati": "jizzakh",
    "qashqadaryo viloyati": "kashkadarya",
    "xorazm viloyati": "khorezm",
    "namangan viloyati": "namangan",
    "navoiy viloyati": "navoi",
    "samarqand viloyati": "samarkand",
    "sirdaryo viloyati": "sirdarya",
    "surxondaryo viloyati": "surkhandarya",
    "qoraqalpog'iston": "karakalpakstan",
    # Русские названия
    "ташкент": "tashkent_city",
    "ташкентская область": "tashkent",
    "андижанская область": "andijan",
    "бухарская область": "bukhara",
    "ферганская область": "fergana",
    "джизакская область": "jizzakh",
    "кашкадарьинская область": "kashkadarya",
    "хорезмская область": "khorezm",
    "наманганская область": "namangan",
    "навоийская область": "navoi",
    "самаркандская область": "samarkand",
    "сырдарьинская область": "sirdarya",
    "сурхандарьинская область": "surkhandarya",
    "каракалпакстан": "karakalpakstan",
    # Английские/альтернативные
    "tashkent": "tashkent_city",
    "tashkent region": "tashkent",
    "andijan": "andijan",
    "bukhara": "bukhara",
    "fergana": "fergana",
    "jizzakh": "jizzakh",
    "kashkadarya": "kashkadarya",
    "khorezm": "khorezm",
    "namangan": "namangan",
    "navoi": "navoi",
    "samarkand": "samarkand",
    "sirdarya": "sirdarya",
    "surkhandarya": "surkhandarya",
    "karakalpakstan": "karakalpakstan",
}


@router.get("/reverse")
async def reverse_geocode(lat: float, lon: float, lang: str = "uz"):
    """Reverse geocoding через Nominatim API с маппингом регионов"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://nominatim.openstreetmap.org/reverse",
                params={
                    "format": "json",
                    "lat": lat,
                    "lon": lon,
                    "accept-language": lang,
                    "zoom": 14,  # Более детальный zoom
                    "addressdetails": 1
                },
                headers={
                    "User-Agent": "Dehqonjon/1.0 (contact@dehqonjon.uz)"
                },
                timeout=10.0
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Добавляем маппинг региона
                if "address" in data:
                    address = data["address"]
                    state = (address.get("state") or address.get("region") or 
                            address.get("province") or "").lower()
                    
                    # Ищем соответствие в маппинге
                    region_key = None
                    for name, key in REGION_MAPPING.items():
                        if name in state or state in name:
                            region_key = key
                            break
                    
                    if region_key:
                        data["region_key"] = region_key
                    
                    # Также добавляем district info
                    district = (address.get("city") or address.get("town") or 
                               address.get("village") or address.get("county") or
                               address.get("district") or address.get("suburb") or "")
                    data["detected_district"] = district
                
                return data
            else:
                raise HTTPException(status_code=response.status_code, detail="Geocoding failed")
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Geocoding timeout")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
