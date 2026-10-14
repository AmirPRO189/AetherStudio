// public/js/app.js - Клиентская логика Aether Network

document.addEventListener('DOMContentLoaded', () => {
  initSpaceCanvas();
  initAuthModal();
  initPostModal();
  initBotFaq();
  initConstructor();
  initAdminPanel();
  startGuestTimer();
  loadPlatformData();
});

// 1. Космический Canvas фон (звездное скопление)
function initSpaceCanvas() {
  const canvas = document.getElementById('spaceCanvas');
  const ctx = canvas.getContext('2d');
  
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const stars = Array.from({ length: 250 }, () => ({
    x: (Math.random() - 0.5) * width,
    y: (Math.random() - 0.5) * height,
    z: Math.random() * width,
    o: Math.random()
  }));

  function animate() {
    ctx.fillStyle = '#050508';
    ctx.fillRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;

    stars.forEach(star => {
      star.z -= 0.5;
      if (star.z <= 0) star.z = width;

      const k = 250 / star.z;
      const px = star.x * k + cx;
      const py = star.y * k + cy;

      if (px >= 0 && px <= width && py >= 0 && py <= height) {
        const size = Math.max(1, (1 - star.z / width) * 2.5);
        ctx.fillStyle = `rgba(0, 243, 255, ${star.o})`;
        ctx.fillRect(px, py, size, size);
      }
    });

    requestAnimationFrame(animate);
  }
  animate();
}

// 2. Управление модальным окном Авторизации и гостевым таймером
function initAuthModal() {
  const modal = document.getElementById('authModal');
  const openBtn = document.getElementById('openAuthModalBtn');
  const closeBtn = document.getElementById('closeAuthModal');
  const guestBtn = document.getElementById('submitGuestAuthBtn');

  openBtn.addEventListener('click', () => modal.classList.remove('hidden'));
  closeBtn.addEventListener('click', () => modal.classList.add('hidden'));

  guestBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
    alert('[Aether Network] Активирован гостевой режим. У вас есть 20 минут.');
  });
}

// Таймер гостевого режима (20 минут)
function startGuestTimer() {
  let timeLeft = 20 * 60; // 20 минут в секундах
  const timerDisplay = document.getElementById('timerCountdown');
  const timerBox = document.getElementById('guestTimerAlert');

  const interval = setInterval(() => {
    if (timeLeft <= 0) {
      clearInterval(interval);
      timerBox.classList.remove('hidden');
      alert('Время гостевого режима истекло. Пожалуйста, зарегистрируйтесь.');
      return;
    }
    timeLeft--;
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    if (timerDisplay) {
      timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  }, 1000);
}

// 3. Создание поста и DROP файлов
function initPostModal() {
  const modal = document.getElementById('postModal');
  const openBtn = document.getElementById('openPostModalBtn');
  const closeBtn = document.getElementById('closePostModal');
  const dropZone = document.getElementById('dropZoneContainer');
  const fileInput = document.getElementById('hiddenFileInput');

  openBtn.addEventListener('click', () => modal.classList.remove('hidden'));
  closeBtn.addEventListener('click', () => modal.classList.add('hidden'));

  dropZone.addEventListener('click', () => fileInput.click());
  
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--neon-cyan)';
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.style.borderColor = 'var(--border-color)';
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--border-color);';
    const files = e.dataTransfer.files;
    handleFiles(files);
  });

  fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
  });
}

function handleFiles(files) {
  const preview = document.getElementById('selectedFilesPreview');
  preview.innerHTML = '';
  Array.from(files).forEach(file => {
    const item = document.createElement('div');
    item.textContent = `[Файл] ${file.name} (${Math.round(file.size / 1024 / 1024)} MB)`;
    preview.appendChild(item);
  });
}

// 4. Загрузка данных и Aether Bot (10 фиксированных вопросов)
async function loadPlatformData() {
  try {
    const res = await fetch('/api/data');
    const data = await res.json();
    
    if (data.officialChannel) {
      document.getElementById('officialSubCount').textContent = data.officialChannel.subscribersCount || 0;
    }

    renderFaqButtons(data.faqQuestions || []);
  } catch (err) {
    console.error('Ошибка загрузки данных платформы:', err);
  }
}

function renderFaqButtons(questions) {
  const container = document.getElementById('faqButtonsContainer');
  container.innerHTML = '';

  questions.forEach((q, index) => {
    const btn = document.createElement('button');
    btn.className = 'faq-btn';
    btn.textContent = `${index + 1}. ${q}`;
    btn.addEventListener('click', () => askBot(index));
    container.appendChild(btn);
  });
}

async function askBot(index) {
  try {
    const res = await fetch('/api/bot/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionIndex: index })
    });
    const data = await res.json();
    
    const card = document.getElementById('botAnswerCard');
    const text = document.getElementById('botAnswerText');
    
    card.classList.remove('hidden');
    text.textContent = data.answer;
  } catch (err) {
    console.error('Ошибка обращения к боту:', err);
  }
}

// 5. Конструктор кода и горячие клавиши (Ctrl+S, Ctrl+Enter)
function initConstructor() {
  const toggleBtn = document.getElementById('openConstructorBtn');
  const section = document.getElementById('constructorSection');
  const area = document.getElementById('codeEditorArea');

  toggleBtn.addEventListener('click', () => {
    section.classList.toggle('hidden');
  });

  // Горячие клавиши
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      alert('[Aether Network] Проект успешно сохранен в памяти редактора!');
    }
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('runCodePreviewBtn').click();
    }
  });

  document.getElementById('runCodePreviewBtn').addEventListener('click', () => {
    const previewBox = document.getElementById('previewContainer');
    const frame = document.getElementById('previewFrame');
    
    previewBox.classList.toggle('hidden');
    const code = area.value;
    
    const doc = frame.contentDocument || frame.contentWindow.document;
    doc.open();
    doc.write(code);
    doc.close();
  });
}

// 6. Админ-панель (Владелец a.32332354@gmail.com)
function initAdminPanel() {
  const adminEmail = "a.32332354@gmail.com";
  
  // Для проверки показываем панель администратору
  const adminCard = document.getElementById('adminPanelCard');
  if (adminCard) {
    adminCard.classList.remove('hidden');
  }

  document.getElementById('adminToggleBadgeBtn').addEventListener('click', async () => {
    const targetEmail = document.getElementById('adminTargetUserEmail').value;
    if (!targetEmail) return alert('Введите email пользователя!');

    const res = await fetch('/api/admin/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminEmail, action: 'toggle_badge', targetUserId: targetEmail })
    });
    const data = await res.json();
    alert(data.message || data.error);
  });
}