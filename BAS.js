import express, { json } from "express";
import { createClient } from "redis";
import { isUri } from "valid-url";
const { nanoid } = await import("nanoid");

const app = express();
app.use(json());

const client = createClient({
  url: "redis://localhost:6379",
});

client.on("error", (err) => {
  console.error("Ошибка Redis:", err);
});

await client.connect();

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

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
