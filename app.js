const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const data = require("./words.json");

const app = express();
const PORT = 5000;

// Временное хранилище пользователей
const users = [];

const userWords = data;

// Временное хранилище статистики пользователей
const userStatistics = {
  // // пример данных
  // 1: { gamesPlayed: 10, wins: 7, losses: 3 },
  // 2: { gamesPlayed: 5, wins: 2, losses: 3 },
  // // добавьте свои данные по необходимости
};

// Секретный ключ для JWT
const JWT_SECRET = "your_secret_key_here";

// Middleware
app.use(cors());
app.use(express.json()); // парсинг JSON тела

// Регистрация нового пользователя
app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = users.find((user) => user.email === email);
  if (existingUser) {
    return res
      .status(400)
      .json({ message: "Пользователь с этим email уже существует" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = {
    id: Date.now().toString(),
    username: name,
    email,
    password: hashedPassword,
  };
  users.push(newUser);

  res.status(201).json({ message: "Пользователь зарегистрирован" });
});

// Вход (авторизация)
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  const user = users.find((u) => u.email === email);
  if (!user) {
    return res.status(400).json({ message: "Неверная почта" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: "Неверный пароль" });
  }

  const token = jwt.sign(
    { userId: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.json({ token, userId: user.id, name: user.username });
});

// Middleware для проверки JWT токена
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.sendStatus(401); // Не авторизован
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.sendStatus(403); // Запрещено
    req.user = decoded; // decoded содержит payload при подписании токена
    next();
  });
}

// Защищённый маршрут (пример)
app.get("/api/profile", authenticateToken, (req, res) => {
  res.json({ message: `Добро пожаловать, ${req.user.username}` });
});

// Маршрут для получения всех пользователей
app.get("/api/users", (req, res) => {
  const publicUsers = users.map((user) => ({
    id: user.id,
    username: user.username,
    email: user.email,
  }));
  res.json(publicUsers);
});

// --- Получение статистики пользователя ---
app.get("/api/users/:userId/statistics", authenticateToken, (req, res) => {
  const { userId } = req.params;

  // Проверка совпадения пользователя с токеном
  if (req.user.userId !== userId) {
    return res.sendStatus(403);
  }

  const stats = userStatistics[userId];

  if (!stats) {
    return res.status(404).json({ message: "Статистика не найдена" });
  }

  res.json({ userId, statistics: stats });
});

// --- Обновление статистики пользователя ---
app.put("/api/users/:userId/statistics", authenticateToken, (req, res) => {
  const { userId } = req.params;

  if (req.user.userId !== userId) {
    return res.sendStatus(403);
  }

  // Здесь должна быть логика обновления статистики в базе данных
  // Для примера просто возвращаем полученные данные
  const statData = req.body;

  // Можно сохранить или обновить статистику тут

  res.json({ message: "Статистика обновлена", data: statData });
});

// --- Создание слова пользователя ---
app.post("/api/users/:userId/words/:wordId", authenticateToken, (req, res) => {
  const { userId, wordId } = req.params;
  const wordData = req.body;

  if (req.user.userId !== userId) {
    return res.sendStatus(403);
  }

  // Логика сохранения слова в базе данных

  res.json({ message: "Слово добавлено", word: wordData });
});

// --- Обновление слова пользователя ---
app.put("/api/users/:userId/words/:wordId", authenticateToken, (req, res) => {
  const { userId, wordId } = req.params;
  const wordData = req.body;

  if (req.user.userId !== userId) {
    return res.sendStatus(403);
  }

  // Логика обновления слова

  res.json({ message: "Слово обновлено", word: wordData });
});

// --- Удаление слова пользователя ---
app.delete(
  "/api/users/:userId/words/:wordId",
  authenticateToken,
  (req, res) => {
    const { userId, wordId } = req.params;

    if (req.user.userId !== userId) {
      return res.sendStatus(403);
    }

    // Логика удаления слова

    res.status(204).send();
  }
);

// Маршрут для получения агрегированных слов по userId и wordId
// app.get(
//   // "/api/users/:userId/aggregatedWords/:wordId",
//   "/api/users/:userId/aggregatedWords/",
//   authenticateToken,
//   (req, res) => {
//     const { userId, wordId } = req.params;
//     const { group, page, wordsPerPage, filter } = req.query;

//     // Проверка совпадения пользователя с токеном
//     if (req.user.userId !== userId) {
//       return res.sendStatus(403);
//     }

//     // Здесь должна быть логика получения агрегированных слов из базы данных,
//     // учитывая параметры group, page, wordsPerPage и filter.
//     // Для примера возвращаем фиктивные данные:

//     const aggregatedData = {
//       userId,
//       wordId,
//       group: group || null,
//       page: page || null,
//       wordsPerPage: wordsPerPage || null,
//       filter: filter || null,
//       learnedWords: 0,
//       optional: {
//         newWordsAudioGame: 0,
//         newWordsSprintGame: 0,
//         wordsInRowAudioGame: 0,
//         wordsInRowSprintGame: 0,
//         totalQuestionsAudioGame: 0,
//         totalQuestionsSprintGame: 0,
//         totalCorrectAnswersAudioGame: 0,
//         totalCorrectAnswersSprintGame: 0,
//         // дополнительные данные по необходимости
//       },
//     };

//     res.json(aggregatedData);
//   }
// );

// Получить агрегированные слова по ID
app.get("/users/:userId/aggregatedWords/:wordId", (req, res) => {
  const { userId, wordId } = req.params;
  const uw = userWords.find(
    (uw) => uw.userId === userId && uw.wordId === wordId
  );
  if (uw) {
    // Возвращаем пример структуры DataAggregatedWordsByID
    res.json({
      userWord: {
        difficulty: "easy",
        optional: {
          guessedCount: "5",
          notGuessedCount: "2",
          inGame: true,
        },
      },
    });
  } else {
    res.status(404).json({ message: "Word not found" });
  }
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
