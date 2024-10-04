import express, { json } from "express";
import { createClient } from "redis";
import { isUri } from "valid-url";
const { nanoid } = await import("nanoid");
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(json());

const client = createClient({
  url: process.env.REDIS_URL,
});

client.on("error", (err) => {
  console.error("Ошибка Redis:", err);
});

try {
  await client.connect();
} catch (error) {
  console.log("Ошибка подключения к редис: ", error);
  process.exit(1);
}

app.post("/shorten", async (req, res) => {
  try {
    console.log("Тело запроса:", req.body);

    const { url } = req.body;

    console.log("Полученный URL:", url);

    if (!isUri(url)) {
      return res.status(400).json({ error: "Некорректный URL" });
    }

    const shortcode = nanoid(8);

    await client.set(shortcode, url);

    res.status(200).json({
      shortcode,
      redirect: `${process.env.API_URL$}${shortcode}`,
    });
  } catch (error) {
    console.error("Ошибка при создании короткой ссылки:", error);
    res.status(500).json({ error: `Ошибка сервера: ${error}` });
  }
});

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
    res.status(500).json({ error: `Ошибка сервера: ${error}` });
  }
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
