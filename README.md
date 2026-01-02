# 🌾 Dehqonjon

Fermerlar uchun marketplace va AI-yordamchi.

## Tez boshlash

### Bitta buyruq bilan

```bash
# 1. Barcha bog'liqliklarni o'rnatish (bir marta)
npm run install:all

# 2. Frontend + backend ishga tushirish
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

### Docker (alternativa)

```bash
docker-compose up -d
```

## Loyiha tuzilishi

```
/
├── frontend/          # React + TypeScript + Tailwind
├── backend/           # Python + FastAPI
├── docs/              # Hujjatlar
└── docker-compose.yml
```

## Hujjatlar

- [Mahsulot dizayni](docs/PRODUCT_DESIGN.md)
- [Arxitektura](docs/ARCHITECTURE.md)

## Texnologiyalar

**Frontend:** React 18, TypeScript, Tailwind CSS, Zustand, React Router

**Backend:** Python 3.11+, FastAPI, Motor, MongoDB

## Litsenziya

MIT
