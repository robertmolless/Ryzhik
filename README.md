# 🐱 Рыжик: Тайна загородного дома

Cozy 2D-adventure об уютном рыжем коте. Помогай соседям, собирай предметы, открывай зоны и раскрой тайну старой теплицы!

Работает в браузере и **Telegram WebApp**.

---

## 🚀 Как запустить на GitHub Pages

### 1. Создай репозиторий

```bash
git init
git add .
git commit -m "🐱 Рыжик: initial commit"
```

Перейди на [github.com/new](https://github.com/new), создай публичный репозиторий, например `ryzhik-game`.

```bash
git remote add origin https://github.com/ВАШ_НИКНЕЙМ/ryzhik-game.git
git push -u origin main
```

### 2. Включи GitHub Pages

1. Зайди в **Settings** репозитория
2. Слева — **Pages**
3. В **Source** выбери **Deploy from a branch**
4. Branch: `main`, папка: `/ (root)`
5. Нажми **Save**

Через 1–2 минуты игра будет доступна по адресу:
```
https://ВАШ_НИКНЕЙМ.github.io/ryzhik-game/
```

---

## 📱 Подключение к Telegram Bot

### 3. Создай бота через BotFather

1. Открой [@BotFather](https://t.me/BotFather) в Telegram
2. Отправь `/newbot`
3. Введи имя и username бота
4. Получи **токен**: `1234567890:ABC...`

### 4. Создай WebApp кнопку

Отправь BotFather:
```
/newapp
```
Выбери своего бота, введи:
- **Title**: Рыжик
- **Description**: Cozy-adventure про рыжего кота
- **URL**: `https://ВАШ_НИКНЕЙМ.github.io/ryzhik-game/`

Или добавь кнопку через `/setmenubutton`:
```
/setmenubutton
```
Выбери бота → введи URL игры → введи название кнопки (например, `🐱 Играть`).

---

## 🐍 Пример Python-бота (python-telegram-bot)

Установка:
```bash
pip install python-telegram-bot
```

```python
import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes

logging.basicConfig(level=logging.INFO)

# Вставь свой токен и ссылку на GitHub Pages
BOT_TOKEN = "ВАШ_ТОКЕН"
GAME_URL  = "https://ВАШ_НИКНЕЙМ.github.io/ryzhik-game/"

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [[
        InlineKeyboardButton(
            text="🐱 Играть в Рыжика",
            web_app=WebAppInfo(url=GAME_URL)
        )
    ]]
    await update.message.reply_text(
        "Привет! 🐱 Это игра про рыжего кота Рыжика.\n\n"
        "Нажми кнопку ниже, чтобы начать!",
        reply_markup=InlineKeyboardMarkup(keyboard)
    )

async def help_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "🐱 Рыжик: Тайна загородного дома\n\n"
        "Управление:\n"
        "• Джойстик слева — движение\n"
        "• ⚡ кнопка справа — действие\n"
        "• 😺 — мяукнуть\n"
        "• 🎒 🗺️ 📋 — инвентарь, карта, квесты\n\n"
        "Помогай жителям двора и раскрой тайну теплицы!"
    )

def main():
    app = ApplicationBuilder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help",  help_cmd))
    print("Бот запущен. Ctrl+C для остановки.")
    app.run_polling()

if __name__ == "__main__":
    main()
```

---

## 🧪 Тестирование на телефоне

### Вариант 1: Telegram WebApp
1. Запусти бота
2. Нажми `/start` → кнопку «Играть»
3. Игра откроется внутри Telegram

### Вариант 2: Браузер напрямую
Просто открой GitHub Pages ссылку в мобильном браузере.

### Вариант 3: ngrok (локальное тестирование)
```bash
npx serve .
# или
python -m http.server 8080
```
Затем через [ngrok.com](https://ngrok.com):
```bash
ngrok http 8080
```
Скопируй HTTPS-ссылку и передай в Telegram BotFather как URL WebApp.

---

## ❓ Если Telegram WebApp API недоступен

Игра автоматически работает как обычный сайт. Все функции доступны, кроме:
- `Telegram.WebApp.expand()` — экран не растягивается автоматически
- `BackButton` — не появляется кнопка «Назад»
- `MainButton` — не появляется кнопка внизу
- `HapticFeedback` — нет тактильного отклика

**Это не ошибка** — игра просто работает как PWA в браузере.

Если видишь ошибку в консоли вроде `Telegram is not defined` — это нормально при открытии вне Telegram.

---

## 🎮 Управление

### Телефон (основное)
| Элемент | Действие |
|---------|----------|
| 🕹️ Джойстик | Движение |
| ⚡ (большая) | Взаимодействие / Продолжить диалог |
| 😺 | Мяукнуть |
| 🎒 | Инвентарь |
| 🗺️ | Карта |
| 📋 | Квесты |
| ⏸️ | Пауза |

### ПК (дополнительно)
| Клавиша | Действие |
|---------|----------|
| WASD / ↑↓←→ | Движение |
| E | Взаимодействие |
| Space | Мяукнуть |
| I | Инвентарь |
| Q | Квесты |
| M | Карта |
| Esc | Пауза |

---

## 📁 Структура проекта

```
ryzhik-game/
├── index.html      # Главный HTML, все экраны и UI
├── style.css       # Mobile-first стили
├── game.js         # Весь игровой движок
├── manifest.json   # PWA манифест
└── README.md       # Эта инструкция
```

---

## 🛠️ Технологии

- **Canvas API** — весь игровой рендеринг (кот, мир, NPC, погода)
- **Web Audio API** — процедуральный звук (мяу, музыка, дождь)
- **localStorage** — сохранение прогресса
- **Telegram WebApp JS** — интеграция с Telegram
- **Touch Events + Pointer Events** — мобильное управление
- **CSS custom properties + safe-area-inset** — адаптация под iPhone

Без внешних зависимостей. Работает офлайн как PWA.

---

## 🐱 О игре

Рыжик живёт у загородного дома. После долгой зимы двор запустел.
Помоги жителям, собери предметы, открой теплицу и найди **Солнечный колокольчик** — символ тепла, дружбы и дома.

**25+ квестов · 20 NPC · 15 зон · 20 достижений · Погода · День/ночь**

---

*v1.0 · Canvas + Web Audio API · Mobile-first · Telegram WebApp Ready*
