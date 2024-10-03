// установил express для создания веб-сервера
// установил redis для хранения сокращенных ссылок
// установил valid-url для валидации URL

import express, { json } from "express";
import { createClient } from "redis";
import { isUri } from "valid-url";
const { nanoid } = await import("nanoid");

const app = express();
app.use(json());

const client = createClient({
  url: "redis://localhost:6379",
});

await client.connect();

app.post("/shorten", async (req, res) => {
  const { url } = req.body;

  if (!isUri(url)) {
    return res.status(400).json({ error: "Некорректный URL" });
  }

  const shortcode = nanoid(8);
  await client.set(shortcode, url);

  res.status(200).json({
    shortcode,
    redirect: `http://localhost:3002/${shortcode}`,
  });
});

app.get("/:shortcode", async (req, res) => {
  const { shortcode } = req.params;

  const originalUrl = await client.get(shortcode);

  if (originalUrl) {
    return res.redirect(302, originalUrl);
  }

  res.status(404).json({ error: "Код не найден" });
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`сервер запущен на порту ${PORT}`);
});
