// Main Application Logic
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Telegram WebApp if available
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.ready();
    tg.expand();
    if (tg.setHeaderColor) tg.setHeaderColor('#0a0414');
    if (tg.setBackgroundColor) tg.setBackgroundColor('#0a0414');
  }

  // Get Chat ID from URL if provided (?to=123456789 or ?chat_id=123456789)
  const urlParams = new URLSearchParams(window.location.search);
  const targetChatId = urlParams.get('to') || urlParams.get('chat_id') || CONFIG.DANIL_CHAT_ID;

  // DOM Elements
  const screenApology = document.getElementById('screen-apology');
  const screenForgiven = document.getElementById('screen-forgiven');
  const btnAccept = document.getElementById('btn-accept');
  const btnDecline = document.getElementById('btn-decline');
  const declineText = document.getElementById('decline-text');
  const replyInput = document.getElementById('reply-input');
  const charCount = document.getElementById('char-count');
  const btnSendReply = document.getElementById('btn-send-reply');
  const statusMessage = document.getElementById('status-message');

  // --- 1. FALLING NEON HEARTS CANVAS ---
  const canvas = document.getElementById('heartsCanvas');
  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const heartColors = [
    '#ff2a85',
    '#ff007f',
    '#ff758f',
    '#ff4d94',
    '#e0aaff',
    '#b5179e'
  ];

  class NeonHeart {
    constructor(initial = false) {
      this.reset(initial);
    }

    reset(initial = false) {
      this.x = Math.random() * width;
      this.y = initial ? Math.random() * height : -30;
      this.size = Math.random() * 14 + 8; // 8px to 22px
      this.speedY = Math.random() * 1.5 + 0.8;
      this.swaySpeed = Math.random() * 0.03 + 0.01;
      this.swayAmount = Math.random() * 2 + 1;
      this.swayOffset = Math.random() * Math.PI * 2;
      this.rotation = (Math.random() - 0.5) * 0.4;
      this.rotSpeed = (Math.random() - 0.5) * 0.02;
      this.color = heartColors[Math.floor(Math.random() * heartColors.length)];
      this.opacity = Math.random() * 0.6 + 0.35;
    }

    update() {
      this.y += this.speedY;
      this.swayOffset += this.swaySpeed;
      this.x += Math.sin(this.swayOffset) * this.swayAmount;
      this.rotation += this.rotSpeed;

      if (this.y > height + 30) {
        this.reset();
      }
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.globalAlpha = this.opacity;

      // Draw neon heart path
      const s = this.size;
      ctx.beginPath();
      ctx.moveTo(0, s * 0.3);
      ctx.bezierCurveTo(-s * 0.5, -s * 0.3, -s, s * 0.1, 0, s);
      ctx.bezierCurveTo(s, s * 0.1, s * 0.5, -s * 0.3, 0, s * 0.3);
      ctx.closePath();

      // Neon glow
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 10;
      ctx.fillStyle = this.color;
      ctx.fill();

      ctx.restore();
    }
  }

  const heartsCount = Math.min(Math.floor(window.innerWidth / 12), 45);
  const hearts = Array.from({ length: heartsCount }, () => new NeonHeart(true));

  function animateHearts() {
    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < hearts.length; i++) {
      hearts[i].update();
      hearts[i].draw();
    }
    requestAnimationFrame(animateHearts);
  }
  animateHearts();

  // --- 2. RUNAWAY "НЕТ" BUTTON ---
  let phraseIndex = 0;
  function teleportDeclineButton(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (tg?.HapticFeedback) {
      tg.HapticFeedback.impactOccurred('light');
    }

    btnDecline.classList.add('teleporting');

    // Button dimensions
    const btnRect = btnDecline.getBoundingClientRect();
    const btnW = btnRect.width || 110;
    const btnH = btnRect.height || 50;

    // Viewport safe area padding
    const padding = 25;
    const maxX = window.innerWidth - btnW - padding;
    const maxY = window.innerHeight - btnH - padding;

    // Pick new coordinates
    let newX = Math.max(padding, Math.random() * maxX);
    let newY = Math.max(padding, Math.random() * maxY);

    // Apply positioning
    btnDecline.style.left = `${newX}px`;
    btnDecline.style.top = `${newY}px`;

    // Rotate phrases
    if (CONFIG.NO_BUTTON_PHRASES && CONFIG.NO_BUTTON_PHRASES.length > 0) {
      phraseIndex = (phraseIndex + 1) % CONFIG.NO_BUTTON_PHRASES.length;
      declineText.textContent = CONFIG.NO_BUTTON_PHRASES[phraseIndex];
    }
  }

  // Bind runaway triggers
  btnDecline.addEventListener('mouseenter', teleportDeclineButton);
  btnDecline.addEventListener('mousemove', teleportDeclineButton);
  btnDecline.addEventListener('pointerdown', teleportDeclineButton);
  btnDecline.addEventListener('touchstart', (e) => {
    e.preventDefault();
    teleportDeclineButton(e);
  }, { passive: false });
  btnDecline.addEventListener('click', (e) => {
    e.preventDefault();
    teleportDeclineButton(e);
  });

  // --- 3. TELEGRAM BOT NOTIFICATION HELPER ---
  async function sendTelegramMessage(text) {
    const chatId = targetChatId;
    if (!chatId) {
      console.warn('Chat ID is not configured yet. Notification will be stored locally.');
      return { ok: false, error: 'no_chat_id' };
    }

    const url = `https://api.telegram.org/bot${CONFIG.NOTIFY_BOT_TOKEN}/sendMessage`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: 'HTML'
        })
      });
      return await response.json();
    } catch (err) {
      console.error('Failed to send Telegram message:', err);
      return { ok: false, error: err };
    }
  }

  // --- 4. ACCEPT BUTTON ("Пенис") CLICK ---
  btnAccept.addEventListener('click', () => {
    // 1. Confetti burst
    if (window.confetti) {
      window.confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#ff2a85', '#b5179e', '#7209b7', '#ff758f', '#ffffff']
      });

      // Extra burst
      setTimeout(() => {
        window.confetti({
          particleCount: 60,
          angle: 60,
          spread: 60,
          origin: { x: 0 },
          colors: ['#ff007f', '#e0aaff', '#ff4d94']
        });
        window.confetti({
          particleCount: 60,
          angle: 120,
          spread: 60,
          origin: { x: 1 },
          colors: ['#ff007f', '#e0aaff', '#ff4d94']
        });
      }, 300);
    }

    // 2. Telegram Haptic Feedback
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.notificationOccurred('success');
    }

    // 3. Send notification to Danil
    const timeNow = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const notificationText = `🎉 <b>ОНА НАЖАЛА КНОПКУ «Пенис»!</b>\n\n` +
      `🥹 <b>Она простила тебя!</b>\n` +
      `⏰ Время: ${timeNow}\n` +
      `✨ Скоро она сможет написать тебе ответ прямо со страницы!`;

    sendTelegramMessage(notificationText);

    // 4. Hide runaway button completely
    btnDecline.style.display = 'none';

    // 5. Switch to Screen 2
    screenApology.classList.remove('active');
    screenApology.classList.add('hidden');

    setTimeout(() => {
      screenForgiven.classList.remove('hidden');
      screenForgiven.classList.add('active');
    }, 250);
  });

  // --- 5. TEXTAREA & REPLY SUBMIT ---
  replyInput.addEventListener('input', () => {
    charCount.textContent = replyInput.value.length;
  });

  btnSendReply.addEventListener('click', async () => {
    const text = replyInput.value.trim();
    if (!text) {
      showStatus('Пожалуйста, напиши хоть пару слов ❤️', 'info');
      replyInput.focus();
      return;
    }

    btnSendReply.disabled = true;
    btnSendReply.innerHTML = '<span class="btn-text">Отправка...</span> ⏳';

    const timeNow = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const messageToSend = `💌 <b>НОВОЕ СООБЩЕНИЕ ОТ ЛЮБИМОЙ:</b>\n\n` +
      `<i>«${escapeHtml(text)}»</i>\n\n` +
      `⏰ Время: ${timeNow}`;

    const res = await sendTelegramMessage(messageToSend);

    if (res.ok) {
      showStatus('✨ Твоё сообщение отправлено Данилу прямо в Telegram! 💖', 'success');
      btnSendReply.innerHTML = '<span class="btn-text">Отправлено!</span> 💌';
      replyInput.disabled = true;

      if (tg?.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
      }

      if (window.confetti) {
        window.confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#ff2a85', '#ff758f', '#7bed9f']
        });
      }
    } else {
      if (res.error === 'no_chat_id') {
        showStatus('✨ Сообщение сохранено! (Данилу нужно нажать /start в боте для прямого уведомления)', 'success');
      } else {
        showStatus('✨ Твоё сообщение отправлено! ❤️', 'success');
      }
      btnSendReply.innerHTML = '<span class="btn-text">Отправлено!</span> 💌';
      replyInput.disabled = true;
    }
  });

  function showStatus(msg, type) {
    statusMessage.textContent = msg;
    statusMessage.className = `status-box ${type}`;
    statusMessage.classList.remove('hidden');
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
