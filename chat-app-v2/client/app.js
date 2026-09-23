const API_URL = '/api';
let socket;
let currentUser = localStorage.getItem('username');

let chatTarget = { type: null, id: null };

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

  document.querySelectorAll('.toggle-visibility').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const toggleSpan = e.currentTarget;
      const input = toggleSpan.previousElementSibling;
      const eyeIcon = toggleSpan.querySelector('.eye-icon');
      const eyeOffIcon = toggleSpan.querySelector('.eye-off-icon');

      if (input.type === 'password') {
        input.type = 'text';
        eyeIcon.classList.remove('hidden');
        eyeOffIcon.classList.add('hidden');
      } else {
        input.type = 'password';
        eyeIcon.classList.add('hidden');
        eyeOffIcon.classList.remove('hidden');
      }
    });
  });

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;

      try {
        const res = await fetch(`${API_URL}/auth/login`, {
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
        const res = await fetch(`${API_URL}/auth/register`, {
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

const getUniqueRoomId = (user1, user2) => {
  return [user1, user2].sort().join('_');
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

const fetchUsers = async () => {
  try {
    const res = await fetch(`${API_URL}/users`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    if (res.ok) {
      const users = await res.json();
      const list = document.getElementById('users-list');
      list.innerHTML = '';
      
      users.forEach(user => {
        const div = document.createElement('div');
        div.className = 'user-item';
        div.textContent = `@${user.username}`;
        div.onclick = async () => {
          document.querySelectorAll('.user-item').forEach(el => el.classList.remove('active'));
          div.classList.add('active');
          
          chatTarget = { type: 'dm', id: user.username };
          localStorage.setItem('lastChatUser', user.username);
          document.getElementById('current-room-badge').textContent = `- DM with ${user.username}`;
          const container = document.getElementById('messages-container');
          container.innerHTML = '';

          const expectedDmRoom = getUniqueRoomId(currentUser, user.username);
          try {
            const msgRes = await fetch(`${API_URL}/messages/${expectedDmRoom}`, {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (msgRes.ok) {
              const messages = await msgRes.json();
              messages.forEach(msg => {
                const isSelf = msg.sender === currentUser;
                appendMessage(msg.sender, msg.content, isSelf);
              });
            }
          } catch(e) {
            console.error("Failed to load history");
          }
        };
        list.appendChild(div);
      });

      const lastChatUser = localStorage.getItem('lastChatUser');
      if (lastChatUser === 'global_room') {
        const globalItem = document.getElementById('global-room-item');
        if (globalItem) globalItem.click();
      } else if (lastChatUser) {
        const userDivs = document.querySelectorAll('#users-list .user-item');
        userDivs.forEach(div => {
          if (div.textContent === `@${lastChatUser}`) {
            div.click();
          }
        });
      }
    }
  } catch(e) {
    console.error("Failed to fetch users");
  }
}

const initChat = () => {
  const token = localStorage.getItem('token');
  if (!token) return;

  fetchUsers();

  socket = io({
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
    let shouldDisplay = false;
    
    if (chatTarget.type === 'room' && data.room === chatTarget.id) {
      shouldDisplay = true;
    } else if (chatTarget.type === 'dm') {
      const expectedDmRoom = getUniqueRoomId(currentUser, chatTarget.id);
      if (data.room === expectedDmRoom) {
        shouldDisplay = true;
      }
    }

    if (shouldDisplay) {
      const isSelf = data.sender === currentUser;
      appendMessage(data.sender, data.content, isSelf);
    }
  });

  const globalRoomItem = document.getElementById('global-room-item');
  if (globalRoomItem) {
    globalRoomItem.addEventListener('click', async () => {
      document.querySelectorAll('.user-item').forEach(el => el.classList.remove('active'));
      globalRoomItem.classList.add('active');
      
      chatTarget = { type: 'room', id: 'global' };
      localStorage.setItem('lastChatUser', 'global_room');
      document.getElementById('current-room-badge').textContent = `- Global Chat`;
      const container = document.getElementById('messages-container');
      container.innerHTML = '';

      socket.emit('joinRoom', 'global');

      try {
        const msgRes = await fetch(`${API_URL}/messages/global`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (msgRes.ok) {
          const messages = await msgRes.json();
          messages.forEach(msg => {
            const isSelf = msg.sender === currentUser;
            appendMessage(msg.sender, msg.content, isSelf);
          });
        }
      } catch(e) {
        console.error("Failed to load global history");
      }
    });
  }

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

  if (chatForm && messageInput) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const content = messageInput.value.trim();
      if (content && chatTarget.id) {
        if (chatTarget.type === 'room') {
          socket.emit('sendMessage', { room: chatTarget.id, content });
        } else if (chatTarget.type === 'dm') {
          socket.emit('sendDirectMessage', { toUsername: chatTarget.id, content });
        }
        messageInput.value = '';
      } else if (!chatTarget.id) {
        showError('Please join a room or select a user first');
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
