// src/backup.js - Автоматическое локальное создание бэкапов базы данных каждые 24 часа
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'database.json');
const BACKUP_DIR = path.join(__dirname, 'backups');
const INTERVAL_MS = 24 * 60 * 60 * 1000; // Ровно 1 сутки

function startBackupService() {
  console.log('[Aether Backup] Локальная служба резервного копирования активирована.');

  // Убеждаемся, что папка для бэкапов существует
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  // Запуск таймера на каждые 24 часа
  setInterval(() => {
    createLocalBackup();
  }, INTERVAL_MS);
}

function createLocalBackup() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      console.error('[Aether Backup] Ошибка: Файл database.json не найден для бэкапа!');
      return;
    }

    const fileData = fs.readFileSync(DB_PATH);
    const dateStr = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const backupFileName = `database_backup_${dateStr}.json`;
    const targetPath = path.join(BACKUP_DIR, backupFileName);

    // Записываем файл резервной копии
    fs.writeFileSync(targetPath, fileData);
    console.log(`[Aether Backup] Успешно создан локальный бэкап: ${backupFileName}`);

    // Очистка старых бэкапов (оставляем только за последние 7 дней)
    cleanOldBackups();
  } catch (err) {
    console.error('[Aether Backup] Ошибка при создании бэкапа:', err);
  }
}

function cleanOldBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    const now = Date.now();
    const maxAgeMs = 7 * 24 * 60 * 60 * 1000; // 7 дней

    files.forEach(file => {
      const filePath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filePath);
      
      // Если файл старше 7 дней — удаляем
      if (now - stats.mtimeMs > maxAgeMs) {
        fs.unlinkSync(filePath);
        console.log(`[Aether Backup] Удален устаревший бэкап: ${file}`);
      }
    });
  } catch (err) {
    console.error('[Aether Backup] Ошибка при очистке старых бэкапов:', err);
  }
}

module.exports = { startBackupService, createLocalBackup };