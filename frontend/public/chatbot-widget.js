(function() {
  const styles = document.createElement('style');
  styles.textContent = `
    .chatbot-widget-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
      font-family: system-ui, -apple-system, sans-serif;
    }
    .chatbot-widget-button {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background-color: #0070f3;
      color: white;
      border: none;
      cursor: pointer;
      font-size: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s;
    }
    .chatbot-widget-button:hover {
      transform: scale(1.05);
    }
    .chatbot-widget-chat {
      position: fixed;
      bottom: 100px;
      right: 20px;
      width: 800px;
      height: 600px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: none;
      flex-direction: column;
      overflow: hidden;
    }
    .chatbot-header {
      padding: 16px;
      background: #0070f3;
      color: white;
      font-weight: bold;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .chatbot-close {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      font-size: 20px;
    }
    .chatbot-content {
      display: flex;
      flex: 1;
      overflow: hidden;
    }
    .chatbot-avatar-pane {
      width: 300px;
      background: #f5f5f5;
      border-right: 1px solid #eee;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .chatbot-avatar-placeholder {
      font-size: 14px;
      color: #666;
      text-align: center;
    }
    .chatbot-chat-pane {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .chatbot-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .message {
      max-width: 80%;
      padding: 8px 12px;
      border-radius: 12px;
      margin: 4px 0;
    }
    .user-message {
      background: #0070f3;
      color: white;
      align-self: flex-end;
    }
    .bot-message {
      background: #f0f0f0;
      color: black;
      align-self: flex-start;
    }
    .chatbot-input {
      padding: 16px;
      border-top: 1px solid #eee;
      display: flex;
      gap: 8px;
    }
    .chatbot-input input {
      flex: 1;
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 20px;
      outline: none;
    }
    .chatbot-input button {
      background: #0070f3;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 20px;
      cursor: pointer;
    }
    .chatbot-input button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
  `;
  document.head.appendChild(styles);

  let apiKey = '';
  let chatWindow = null;
  let messagesContainer = null;
  let isProcessing = false;

  function createChatInterface() {
    const container = document.createElement('div');
    container.className = 'chatbot-widget-container';
    
    // Create chat button
    const button = document.createElement('button');
    button.className = 'chatbot-widget-button';
    button.innerHTML = '💬';
    
    // Create chat window
    chatWindow = document.createElement('div');
    chatWindow.className = 'chatbot-widget-chat';
    
    // Create chat header
    const header = document.createElement('div');
    header.className = 'chatbot-header';
    header.innerHTML = `
      <span>Chat Assistant</span>
      <button class="chatbot-close">&times;</button>
    `;

    // Create content container with split panes
    const content = document.createElement('div');
    content.className = 'chatbot-content';

    // Create avatar pane
    const avatarPane = document.createElement('div');
    avatarPane.className = 'chatbot-avatar-pane';
    avatarPane.innerHTML = `
      <div class="chatbot-avatar-placeholder">
        3D Avatar will be rendered here
      </div>
    `;

    // Create chat pane
    const chatPane = document.createElement('div');
    chatPane.className = 'chatbot-chat-pane';

    // Create messages container
    messagesContainer = document.createElement('div');
    messagesContainer.className = 'chatbot-messages';
    
    // Create input area
    const inputArea = document.createElement('div');
    inputArea.className = 'chatbot-input';
    inputArea.innerHTML = `
      <input type="text" placeholder="Type your message..." />
      <button>Send</button>
    `;

    // Assemble chat pane
    chatPane.appendChild(messagesContainer);
    chatPane.appendChild(inputArea);

    // Assemble content
    content.appendChild(avatarPane);
    content.appendChild(chatPane);
    
    // Assemble chat window
    chatWindow.appendChild(header);
    chatWindow.appendChild(content);
    
    // Add everything to container
    container.appendChild(button);
    container.appendChild(chatWindow);
    document.body.appendChild(container);
    
    // Event Listeners
    button.addEventListener('click', toggleChat);
    header.querySelector('.chatbot-close').addEventListener('click', toggleChat);
    
    const input = inputArea.querySelector('input');
    const sendButton = inputArea.querySelector('button');
    
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !isProcessing) {
        sendMessage(input.value);
      }
    });
    
    sendButton.addEventListener('click', () => {
      if (!isProcessing) {
        sendMessage(input.value);
      }
    });
  }

  function toggleChat() {
    chatWindow.style.display = chatWindow.style.display === 'flex' ? 'none' : 'flex';
  }

  function addMessage(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    messageDiv.textContent = content;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function sendMessage(content) {
  if (!content.trim()) return;

  const input = document.querySelector('.chatbot-input input');
  const sendButton = document.querySelector('.chatbot-input button');
  
  isProcessing = true;
  input.disabled = true;
  sendButton.disabled = true;
  
  // Add user message
  addMessage(content, true);
  input.value = '';

  try {
      const response = await fetch(`http://localhost:8000/external-chat/${apiKey}`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ message: content })
      });

      if (!response.ok) {
          throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      // Add bot's response to the chat
      if (data && data.response) {
          // Small delay to make the conversation feel more natural
          setTimeout(() => {
              addMessage(data.response, false);
          }, 500);
      } else {
          throw new Error('Invalid response format');
      }
  } catch (error) {
      console.error('Error:', error);
      addMessage('Sorry, I encountered an error. Please try again.', false);
  } finally {
      isProcessing = false;
      input.disabled = false;
      sendButton.disabled = false;
      input.focus();
  }
}

  window.initChatbot = function(config) {
    apiKey = config.apiKey;
    createChatInterface();
    addMessage('Hello! How can I help you today?');
  };
})();
