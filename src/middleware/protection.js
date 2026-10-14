// src/middleware/protection.js
// Защита от накрутки, спама и контроль лимитов для Aether Network

const ipRequests = new Map();

function antiFraudProtection(req, res, next) {
  const clientIp = req.ip || req.connection.remoteAddress;
  const now = Date.now();

  // Ограничение частоты запросов (Rate Limiting от накрутки)
  if (!ipRequests.has(clientIp)) {
    ipRequests.set(clientIp, { count: 0, lastReset: now });
  }

  const userData = ipRequests.get(clientIp);
  
  // Сброс счетчика раз в минуту
  if (now - userData.lastReset > 60000) {
    userData.count = 0;
    userData.lastReset = now;
  }

  userData.count++;

  // Если с одного IP идет более 60 запросов в минуту — блокируем подозрительную активность (накрутку)
  if (userData.count > 60) {
    return res.status(429).json({ 
      error: "Обнаружена подозрительная активность или попытка накрутки. Запрос временно заблокирован." 
    });
  }

  next();
}

// Проверка лимитов на загрузку (файлы до 10 МБ, видео до 10 минут для безопасности сервера)
function validateUploadLimits(req, res, next) {
  const { fileSizeMb, videoDurationHours, textLength, photosCount } = req.body;

  if (fileSizeMb && fileSizeMb > 10) {
    return res.status(400).json({ error: "Превышен лимит файла. Максимальный размер на бесплатном сервере — 10 МБ." });
  }

  if (videoDurationHours && videoDurationHours > 0.16) { // ~10 минут
    return res.status(400).json({ error: "Превышен лимит видео. Максимальная длительность — 10 минут." });
  }

  if (textLength && textLength > 1000) {
    return res.status(400).json({ error: "Превышен лимит текста. Максимум 1000 символов." });
  }

  if (photosCount && photosCount > 5) {
    return res.status(400).json({ error: "Превышен лимит фотографий. Максимум 5 штук." });
  }

  next();
}

module.exports = {
  antiFraudProtection,
  validateUploadLimits
};