// src/server.js
// Главный серверный файл Aether Network (Node.js + Express)

const express = require('express');
const fs = require('fs');
const path = require('path');
const { antiFraudProtection, validateUploadLimits } = require('./middleware/protection');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

const DB_PATH = path.join(__dirname, 'database.json');
const ADMIN_CONFIG_PATH = path.join(__dirname, 'config/admin.json');

// Чтение базы данных
function readDB() {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return { users: [], posts: [], officialChannel: {} };
  }
}

// Запись в базу данных
function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

// Чтение конфига админа
function readAdminConfig() {
  try {
    const data = fs.readFileSync(ADMIN_CONFIG_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return { adminAccount: { email: "a.32332354@gmail.com" } };
  }
}

// Применение защиты ко всем запросам API
app.use('/api/', antiFraudProtection);

// 1. Получение данных платформы (каналы, посты, FAQ)
app.get('/api/data', (req, res) => {
  const db = readDB();
  res.json(db);
});

// 2. Регистрация / Вход (Google, гость или обычный аккаунт)
app.post('/api/auth', (req, res) => {
  const { email, nickname, type } = req.body;
  const db = readDB();

  if (nickname && nickname.length > 20) {
    return res.status(400).json({ error: "Никнейм не должен превышать 20 символов." });
  }

  let user = db.users.find(u => u.email === email);
  if (!user) {
    user = {
      id: "user_" + Date.now(),
      email: email || "guest_" + Date.now() + "@aether.local",
      nickname: nickname || "Guest",
      avatar: "/assets/default.png",
      role: email === readAdminConfig().adminAccount.email ? "SuperOwner" : "User",
      subscribers: 0,
      verifiedBadge: false,
      createdAt: new Date().toISOString()
    };
    db.users.push(user);
    writeDB(db);
  }

  res.json({ success: true, user });
});

// 3. Бот с 10 фиксированными вопросами
app.post('/api/bot/ask', (req, res) => {
  const { questionIndex } = req.body;
  const db = readDB();

  if (questionIndex === undefined || questionIndex < 0 || questionIndex >= db.faqQuestions.length) {
    return res.status(400).json({ error: "Бот отвечает строго на 10 утвержденных вопросов." });
  }

  const question = db.faqQuestions[questionIndex];
  let answer = "Информация обрабатывается сервером Aether Network.";

  // Ответы на 10 фиксированных вопросов
  const answers = [
    "Для входа используйте кнопку регистрации через Google или выберите гостевой режим (доступно 20 минут до появления плашки).",
    "Галочка 'ПОПУЛЯРНЫЙ ПОЛЬЗОВАТЕЛЬ' запрашивается при достижении отметки от 1000 подписчиков (проходит проверку на накрутку).",
    "Максимальный размер загружаемого файла — 500 МБ, видео — до 1 часа, текстов — до 1000 символов, фото — до 10 штук.",
    "Конструктор поддерживает работу с HTML, CSS, JS и JSON с возможностью живого предпросмотра и экспорта в ZIP/JSON.",
    "Исходный код и файлы защищены серверной обфускацией и блокировкой прямого доступа в клиенте.",
    "Под каждым постом можно оставлять текстовые отзывы (до 5 звезд) и предлагать свои идеи разработчикам.",
    "Связаться с создателями можно через официальный канал Aether Studio с честным счетчиком подписчиков.",
    "По истечении 20 минут гостевого режима система попросит вас пройти быструю регистрацию для сохранения прогресса.",
    "Aether Bot автоматически проверяет контент на спам, а пользователи могут отправлять жалобы через интерфейс.",
    "Вы можете в любой момент экспортировать свой проект или базу данных в файлы формата JSON или ZIP."
  ];

  answer = answers[questionIndex];
  res.json({ question, answer });
});

// 4. АДМИН-ПАНЕЛЬ: Выдача галочек и Вход без пароля под любым пользователем (для a.32332354@gmail.com)
app.post('/api/admin/action', (req, res) => {
  const { adminEmail, action, targetUserId, newPassword } = req.body;
  const adminConfig = readAdminConfig();

  if (adminEmail !== adminConfig.adminAccount.email) {
    return res.status(403).json({ error: "Доступ запрещен. Требуются права владельца." });
  }

  const db = readDB();

  if (action === 'toggle_badge') {
    const targetUser = db.users.find(u => u.id === targetUserId);
    if (targetUser) {
      targetUser.verifiedBadge = !targetUser.verifiedBadge;
      writeDB(db);
      return res.json({ success: true, message: `Статус галочки пользователя ${targetUser.nickname} изменен.` });
    }
  }

  if (action === 'bypass_login') {
    // Вход под любым аккаунтом на случай взлома
    const targetUser = db.users.find(u => u.id === targetUserId);
    if (targetUser) {
      return res.json({ success: true, bypassedUser: targetUser, message: "Успешный вход под учетной записью пострадавшего." });
    }
  }

  res.status(400).json({ error: "Неизвестное действие администратора." });
});

app.listen(PORT, () => {
  console.log(`[Aether Network] Сервер успешно запущен на порту ${PORT}`);
});