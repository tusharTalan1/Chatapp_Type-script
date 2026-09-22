const API_URL = 'http://localhost:3000/api/auth';
let socket;
let currentRoom = '';
let currentUser = localStorage.getItem('username');

const showError = (msg) => {
  const toast = document.getElementById('error-toast');
  if (toast) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  } else {
    alert(msg);
  }
};

const checkAuth = () => {
  const token = localStorage.getItem('token');
  const isChatPage = window.location.pathname.includes('chat.html');

  if (!token && isChatPage) {
    window.location.href = 'index.html';
  } else if (token && !isChatPage) {
    window.location.href = 'chat.html';
  }
};

const initAuth = () => {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const loginSection = document.getElementById('login-section');
  const registerSection = document.getElementById('register-section');
  const goToRegister = document.getElementById('go-to-register');
  const goToLogin = document.getElementById('go-to-login');

  if (goToRegister && goToLogin) {
    goToRegister.addEventListener('click', () => {
      loginSection.classList.add('hidden');
      registerSection.classList.remove('hidden');
    });

    goToLogin.addEventListener('click', () => {
      registerSection.classList.add('hidden');
      loginSection.classList.remove('hidden');
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;

      try {
        const res = await fetch(`${API_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (res.ok) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('username', data.username);
          window.location.href = 'chat.html';
        } else {
          showError(data.error || 'Login failed');
        }
      } catch (err) {
        showError('Network error');
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('reg-username').value;
      const email = document.getElementById('reg-email').value;
      const password = document.getElementById('reg-password').value;

      try {
        const res = await fetch(`${API_URL}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password })
        });
        const data = await res.json();

        if (res.ok) {
          registerSection.classList.add('hidden');
          loginSection.classList.remove('hidden');
          showError('Registration successful! Please log in.');
        } else {
          showError(data.error || 'Registration failed');
        }
      } catch (err) {
        showError('Network error');
      }
    });
  }
};

const appendMessage = (sender, content, isSelf) => {
  const container = document.getElementById('messages-container');
  if (!container) return;

  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${isSelf ? 'self' : 'other'}`;

  const senderDiv = document.createElement('div');
  senderDiv.className = 'message-sender';
  senderDiv.textContent = sender;

  const contentDiv = document.createElement('div');
  contentDiv.textContent = content;

  if (!isSelf) msgDiv.appendChild(senderDiv);
  msgDiv.appendChild(contentDiv);

  container.appendChild(msgDiv);
  container.scrollTop = container.scrollHeight;
};

const initChat = () => {
  const token = localStorage.getItem('token');
  if (!token) return;

  socket = io('http://localhost:3000', {
    transports: ['websocket'],
    auth: { token }
  });

  socket.on('connect_error', (err) => {
    showError(err.message);
    if (err.message.includes('Authentication')) {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      window.location.href = 'index.html';
    }
  });

  socket.on('error', (msg) => {
    showError(msg);
  });

  socket.on('message', (data) => {
    const isSelf = data.sender === currentUser;
    appendMessage(data.sender, data.content, isSelf);
  });

  const joinBtn = document.getElementById('join-room-btn');
  const roomInput = document.getElementById('room-input');
  const chatForm = document.getElementById('chat-form');
  const messageInput = document.getElementById('message-input');
  const roomBadge = document.getElementById('current-room-badge');
  const logoutBtn = document.getElementById('logout-btn');

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      if (socket) socket.disconnect();
      window.location.href = 'index.html';
    });
  }

  if (joinBtn && roomInput) {
    joinBtn.addEventListener('click', () => {
      const room = roomInput.value.trim();
      if (room) {
        currentRoom = room;
        socket.emit('joinRoom', room);
        roomBadge.textContent = `- ${room}`;
        document.getElementById('messages-container').innerHTML = '';
        roomInput.value = '';
      }
    });
  }

  if (chatForm && messageInput) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const content = messageInput.value.trim();
      if (content && currentRoom) {
        socket.emit('sendMessage', { room: currentRoom, content });
        messageInput.value = '';
      } else if (!currentRoom) {
        showError('Please join a room first');
      }
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  if (window.location.pathname.includes('chat.html')) {
    initChat();
  } else {
    initAuth();
  }
});
