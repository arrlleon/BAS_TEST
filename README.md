# Серверное приложение для сокращения URL на Node.js

Это приложение использует **Express** и **Redis** для генерации короткого кода для URL и перенаправления на оригинальный адрес по этому коду.

### Используемые библиотеки:

- `express` — для создания веб-сервера.
- `json` — middleware для парсинга JSON в теле запроса.
- `createClient` — создание Redis-клиента для работы с базой данных.
- `isUri` — функция для валидации URL.
- `nanoid` — функция для генерации уникальных кодов.

Redis запускается локально.

---

### Настройка приложения

```js
import express, { json } from "express";
import { createClient } from "redis";
import { isUri } from "valid-url";
const { nanoid } = await import("nanoid");

const app = express();
app.use(json());
```

Создаем экземпляр приложения Express.
Подключаем middleware для обработки JSON-данных.

---

```js
const client = createClient({
  url: "redis://localhost:6379",
});

client.on("error", (err) => {
  console.error("Ошибка Redis:", err);
});

await client.connect();
```

Создаем клиента Redis, который подключается к локальному серверу Redis на порту 6379.
Подписываемся на событие ошибки клиента Redis и выводим сообщение в консоль.

---

```js
app.post("/shorten", async (req, res) => {
  try {
    console.log("Тело запроса:", req.body);
    const { url } = req.body;
    console.log("Полученный URL:", url);

    if (!isUri(url)) {
      return res.status(400).json({ error: "Некорректный URL" });
    }

    let shortcode;
    do {
      shortcode = nanoid(8);
    } while (await client.exists(shortcode));

    await client.set(shortcode, url);

    res.status(200).json({
      shortcode,
      redirect: `http://localhost:3002/${shortcode}`,
    });
  } catch (error) {
    console.error("Ошибка при создании короткой ссылки:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});
```

Обрабатываем POST-запрос для сокращения URL.
Проверяем, является ли переданный URL валидным. Если нет — возвращаем ошибку 400.
Генерируем уникальный код длиной 8 символов и сохраняем его вместе с URL в Redis.
Возвращаем ответ с сгенерированным кодом и ссылкой для редиректа.

---

```js
app.get("/:shortcode", async (req, res) => {
  try {
    const { shortcode } = req.params;
    const originalUrl = await client.get(shortcode);

    if (originalUrl) {
      return res.redirect(302, originalUrl);
    }

    res.status(404).json({ error: "Код не найден" });
  } catch (error) {
    console.error("Ошибка при получении оригинального URL:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});
```

Обрабатываем GET-запрос для перенаправления по короткому коду.
Если код найден, выполняем перенаправление с кодом 302. В противном случае возвращаем ошибку 404.

---

Использование через Postman
POST-запрос для сокращения URL:

В Postman выберите метод POST.
URL запроса: http://localhost:3002/shorten.
В разделе Body выберите raw и JSON.
Вставьте JSON-объект с полем url, например:

```js
{
  "url": "https://google.com"
}
```

Нажмите Send. В ответе вы получите сгенерированный код и ссылку для редиректа.

```js
{
  "shortcode": "ensyxEfas123",
  "redirect": "http://localhost:3002/ensyxEfas123"
}
```

---

GET-запрос для перенаправления:

Скопируйте ссылку из поля redirect в ответе.
Вставьте ее в адресную строку браузера или сделайте GET-запрос через Postman.
Вы будете перенаправлены на исходный URL.

---

Как это работает в браузере
После успешного запроса на POST /shorten вы получите JSON с коротким кодом.

Вставьте сгенерированную ссылку, например http://localhost:3002/ensyxEfas123, в адресную строку вашего браузера.

Браузер перенаправит вас на исходный URL.
