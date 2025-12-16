import React, { useState , useEffect, useRef} from 'react';
import FAQSection from './FAQSection';
import { Link } from 'react-router-dom';
import ChatBot from '../chatbot/ChatBot'; // Import your chatbot component

const About = () => {
    const [showChatbot, setShowChatbot] = useState(false);
    const chatbotRef = useRef(null);

    const toggleChatbot = () => {
      setShowChatbot(!showChatbot);
    };

    // Handle click outside to close chatbot
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (showChatbot && chatbotRef.current && !chatbotRef.current.contains(event.target)) {
          const toggleButton = document.querySelector('.chatbot-toggle');
          if (toggleButton && !toggleButton.contains(event.target)) {
            setShowChatbot(false);
          }
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [showChatbot]);

  
  useEffect(() => {
    // Load external scripts
    const tailwindScript = document.createElement('script');
    tailwindScript.src = 'https://cdn.tailwindcss.com';
    tailwindScript.async = true;
    document.head.appendChild(tailwindScript);

    const markedScript = document.createElement('script');
    markedScript.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
    markedScript.async = true;
    document.head.appendChild(markedScript);

    // Inline styles
    const style = document.createElement('style');
    style.textContent = `
      .hero-section {
          background-image: url('/about5.jpg');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
        }

        /* Green overlay ONLY on the background image */
        .hero-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(71, 167, 71, 0.7); /* Green overlay */
          z-index: 0;
        }

        /* Content stays above the overlay */
        .hero-content {
          position: relative;
          z-index: 1;
        }

        /* Header should be separate from the hero overlay */
        .header-section {
          background: transparent;
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          z-index: 50;
        }

        .full-screen-hero {
          min-height: 100vh;
          display: flex;
          align-items: center;
        }
      .faq-item {
              border-bottom: 1px solid #006400;
              padding: 10px 0;
          }
          .faq-question {
              color: #006400;
              font-weight: bold;
              margin: 0;
              cursor: pointer;
          }
          .faq-answer {
              display: none;
              margin: 10px 0 0 20px;
              color: #006400;
          }
          .faq-item.active .faq-answer {
              display: block;
          }
      .footer-bg {
        background-image: url('https://imgs.search.brave.com/QC0Kz2bV6USwOeeMbo76JkqEeQmWERmTDN4MXIrYqTE/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tZWRp/YS5nZXR0eWltYWdl/cy5jb20vaWQvMTA0/ODIyMTM0L3Bob3Rv/L3ZhcmlldHktb2Yt/Z3JlZW4tdmVnZXRh/Ymxlcy5qcGc_cz02/MTJ4NjEyJnc9MCZr/PTIwJmM9UTJXUWd6/eVZwQS1nUjJTUVRs/U285N2Z6QnZJSEdC/YzJJY1BnNkhPY3Zw/Yz0');
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        position: relative;
      }

      .footer-bg::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(34, 139, 34, 0.7);
        z-index: 0;
      }

      /* Compact Chatbot Widget Styles */
        .chatbot-window {
          position: fixed;
          bottom: 90px;
          right: 20px;
          z-index: 1000;
          width: 350px;
          height: 600px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          border: 1px solid #e5e7eb;
          display: flex;
          flex-direction: column;
          transition: all 0.3s ease-in-out;
          transform: translateY(20px) scale(0.95);
          opacity: 0;
          visibility: hidden;
        }

        .chatbot-window.visible {
          transform: translateY(0) scale(1);
          opacity: 1;
          visibility: visible;
        }

        @media (max-width: 640px) {
          .chatbot-window {
            width: 90vw;
            height: 70vh;
            bottom: 20px;
            right: 5vw;
            left: 5vw;
          }
        }

        /* Chatbot toggle button */
        .chatbot-toggle {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 1001;
          background: transparent;
          border: none;
          padding: 0;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .chatbot-toggle:hover {
          transform: scale(1.1);
        }

        .chatbot-toggle:active {
          transform: scale(0.95);
        }

        /* Chatbot message tooltip */
        .chatbot-message {
          position: fixed;
          bottom: 110px;
          right: 20px;
          z-index: 1000;
          background: white;
          color: #1f2937;
          padding: 12px 16px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          max-width: 200px;
          font-size: 14px;
          font-weight: 500;
          animation: popMessage 15s ease-in-out infinite;
          opacity: 0;
        }

        @keyframes popMessage {
          0% { opacity: 0; transform: translateY(10px); }
          5% { opacity: 1; transform: translateY(0); }
          33.33% { opacity: 1; transform: translateY(0); }
          40% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 0; transform: translateY(10px); }
        }

        .chatbot-close {
          position: absolute;
          top: 10px;
          right: 10px;
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #6b7280;
          z-index: 1002;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }

        .chatbot-close:hover {
          background: #f3f4f6;
          color: #374151;
        }

        /* Override chatbot internal styles to make it compact */
        .chatbot-container {
          height: 100% !important;
          border-radius: 12px !important;
        }

        .chatbot-container .chat-container {
          height: 100% !important;
          border-radius: 12px !important;
        }

        .chatbot-container .chat-messages-container {
          max-height: 350px !important;
          flex: 1 !important;
        }

        /* Decorative line separator */
        .decorative-line {
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, white 10%, white 90%, transparent 100%);
          margin: 0 auto;
          width: 95%;
          position: absolute;
          top: 120px;
          left: 2.5%;
          right: 2.5%;
          z-index: 45;
          opacity: 0.8;
          box-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
        }
    `;
    document.head.appendChild(style);

    // Inline script logic
    const script = document.createElement('script');
    script.textContent = `
      (function() {
        // FAQ functionality
        document.querySelectorAll('.faq-question').forEach(item => {
          item.addEventListener('click', event => {
            const parent = item.parentElement;
            parent.classList.toggle('active');
          });
        });

        // Chatbot toggle functionality
        const toggle = document.getElementById('chatbot-toggle');
        const windowEl = document.getElementById('chatbot-window');
        const closeBtn = document.getElementById('close-chat');

        if (toggle && windowEl && closeBtn) {
          toggle.addEventListener('click', () => {
            windowEl.classList.toggle('translate-y-full');
            windowEl.classList.toggle('hidden');
            if (!windowEl.classList.contains('hidden')) {
              setTimeout(() => {
                const messageInput = document.getElementById('messageInput');
                if (messageInput) messageInput.focus();
              }, 300);
            }
          });

          closeBtn.addEventListener('click', () => {
            windowEl.classList.add('translate-y-full');
            windowEl.classList.add('hidden');
          });
        }

        // Full BVS Chatbot Script - Integrated into Widget
        let recognition;
        let isListening = false;
        let isConnected = false;
        let isConnecting = false;
        let voices = [];
        let selectedVoice = null;
        let lastTranscriptTime = 0;
        let isSpeaking = false;
        let currentMode = 'text'; // Default mode
        let isMuted = false; // Default: speaking enabled (not muted)
        let currentMenu = null;

        // Business Information
        const OFFICE_ADDRESS = "Gultekdi, Market Yard, Pune - 411037";
        const CONTACT_PHONE = "9881325644";
        const CONTACT_EMAIL = "surajgaikwad9812@gmail.com";
        const BOT_NAME = "BVS Assistant";
        // ElevenLabs Configuration
        const ELEVENLABS_API_KEY = 'sk_ec2a7a1256c2dd230f2e088168134cfee99239d02724eda9';
        const ELEVENLABS_VOICE_ID = '4lxiwACZjh4nni3fNTjx';

        // Function to remove emojis for clean TTS
        function removeEmojis(text) {
          if (!text) return '';
          // Native emoji removal using Unicode ranges
          const emojiPattern = /[\\u{1F600}-\\u{1F64F}\\u{1F300}-\\u{1F5FF}\\u{1F680}-\\u{1F6FF}\\u{1F1E0}-\\u{1F1FF}\\u{2600}-\\u{26FF}\\u{2700}-\\u{27BF}]/gu;
          return text.replace(emojiPattern, '').replace(/\\s+/g, ' ').trim();
        }

        // Markdown rendering function using marked.js
        function renderMarkdown(text) {
          return marked.parse(text);
        }

        // Add language detection in frontend
        function detectLanguage(text) {
          const marathiWords = ['नमस्कार', 'काय', 'आहे', 'किंमत', 'भाजी', 'शेती', 'महाग', 'सस्ता'];
          const hindiWords = ['नमस्ते', 'क्या', 'है', 'कीमत', 'सब्जी', 'भाजी', 'महंगा', 'सस्ता'];
          
          let marathiCount = 0;
          let hindiCount = 0;
          
          marathiWords.forEach(word => {
            if (text.includes(word)) marathiCount++;
          });
          
          hindiWords.forEach(word => {
            if (text.includes(word)) hindiCount++;
          });
          
          if (marathiCount > hindiCount) return 'mr';
          if (hindiCount > marathiCount) return 'hi';
          if (marathiCount > 0 || hindiCount > 0) return 'hi'; // default to Hindi if uncertain
          
          return 'en';
        }

        // Initialize Enhanced Speech Recognition
        function initializeSpeechRecognition() {
          if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('Speech recognition not supported in this browser');
            return;
          }

          try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = 'en-IN'; // Default to Indian English
            recognition.maxAlternatives = 3; // Get multiple alternatives for better accuracy

            recognition.onstart = function() {
              console.log('Speech recognition started');
              isListening = true;
              updateSpeechUI('listening');
              const voiceStatus = document.getElementById('voiceStatus');
              if (voiceStatus) {
                voiceStatus.textContent = 'Listening...';
                voiceStatus.classList.remove('hidden');
              }
            };

            recognition.onresult = function(event) {
              let finalTranscript = '';
              
              for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                  finalTranscript += event.results[i][0].transcript;
                }
              }

              if (finalTranscript.trim().length > 0) {
                const cleanTranscript = finalTranscript.trim();
                addMessage(cleanTranscript, true);
                processUserMessage(cleanTranscript);
                toggleSpeechRecognition();
              }
            };

            recognition.onerror = function(event) {
              console.error('Speech recognition error:', event.error);
              isListening = false;
              updateSpeechUI('ended');
              const voiceStatus = document.getElementById('voiceStatus');
              if (voiceStatus) voiceStatus.classList.add('hidden');
            };

            recognition.onend = function() {
              console.log('Speech recognition ended');
              isListening = false;
              updateSpeechUI('ended');
              const voiceStatus = document.getElementById('voiceStatus');
              if (voiceStatus) voiceStatus.classList.add('hidden');
            };

            console.log('Speech recognition initialized successfully');
            
          } catch (error) {
            console.error('Error initializing speech recognition:', error);
          }
        }

        // Speech Control Functions
        function toggleSpeechRecognition() {
          if (!recognition) {
            console.error('Speech recognition not initialized');
            return;
          }
          
          if (!isListening) {
            try {
              if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                navigator.mediaDevices.getUserMedia({ audio: true })
                  .then(() => {
                    recognition.start();
                    updateSpeechUI('listening');
                  })
                  .catch(error => {
                    console.error('Microphone access denied:', error);
                    showError('Please allow microphone access to use voice commands');
                  });
              } else {
                recognition.start();
                updateSpeechUI('listening');
              }
            } catch (error) {
              console.error('Error starting speech recognition:', error);
            }
          } else {
            try {
              recognition.stop();
              isListening = false;
              updateSpeechUI('ended');
            } catch (error) {
              console.error('Error stopping speech recognition:', error);
            }
          }
        }

        function updateSpeechUI(status) {
          const visualizer = document.getElementById('visualizer');
          const micButtonInput = document.getElementById('micButtonInput');
          const voiceMicBtn = document.getElementById('voiceMicBtn');
          
          if (visualizer) visualizer.classList.add('hidden');
          if (micButtonInput) micButtonInput.classList.remove('listening', 'connecting');
          if (voiceMicBtn) voiceMicBtn.classList.remove('listening', 'connecting');

          switch(status) {
            case 'listening':
              if (micButtonInput) {
                micButtonInput.classList.add('listening');
                micButtonInput.innerHTML = '🔴';
              }
              if (voiceMicBtn) {
                voiceMicBtn.classList.add('listening');
                voiceMicBtn.innerHTML = '🔴';
              }
              if (visualizer) visualizer.classList.remove('hidden');
              break;
            case 'speaking':
              if (micButtonInput) {
                micButtonInput.classList.add('listening');
                micButtonInput.innerHTML = '🔊';
              }
              if (voiceMicBtn) {
                voiceMicBtn.classList.add('listening');
                voiceMicBtn.innerHTML = '🔊';
              }
              if (visualizer) visualizer.classList.remove('hidden');
              break;
            case 'connecting':
              if (micButtonInput) {
                micButtonInput.classList.add('connecting');
                micButtonInput.innerHTML = '🎤';
              }
              if (voiceMicBtn) {
                voiceMicBtn.classList.add('connecting');
                voiceMicBtn.innerHTML = '🎤';
              }
              break;
            default:
              if (micButtonInput) micButtonInput.innerHTML = '🎤';
              if (voiceMicBtn) voiceMicBtn.innerHTML = '🎤';
          }
        }

        function addSystemMessage(message) {
          const chatMessages = document.getElementById('chatMessages');
          if (!chatMessages) return;
          
          const messageDiv = document.createElement('div');
          messageDiv.className = 'message-bubble flex items-start space-x-3';
          messageDiv.innerHTML = '<div class="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0">🔊</div><div class="bg-blue-50 border border-blue-200 rounded-2xl rounded-tl-sm p-3 max-w-xs"><p class="text-gray-800 text-xs">' + message + '</p></div>';
          chatMessages.appendChild(messageDiv);
          chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        function showError(message) {
          addSystemMessage('Error: ' + message);
        }

        // Enhanced Text-to-Speech
        function initializeTTS() {
          if (!('speechSynthesis' in window)) {
            console.warn('Speech synthesis not supported');
            return;
          }
          
          const loadVoices = () => {
            const voices = speechSynthesis.getVoices();
            console.log('Voices loaded:', voices.length);
          };
          
          speechSynthesis.onvoiceschanged = loadVoices;
          loadVoices();
        }

        // Mode Toggle Functions
        function switchToTextMode() {
          currentMode = 'text';
          const chatForm = document.getElementById('chatForm');
          const voiceInput = document.getElementById('voiceInput');
          const textModeBtn = document.getElementById('textModeBtn');
          const voiceModeBtn = document.getElementById('voiceModeBtn');
          const messageInput = document.getElementById('messageInput');
          
          if (chatForm) chatForm.classList.remove('hidden');
          if (voiceInput) voiceInput.classList.add('hidden');
          if (textModeBtn) textModeBtn.classList.add('active');
          if (voiceModeBtn) voiceModeBtn.classList.remove('active');
          if (messageInput) messageInput.focus();
        }

        function switchToVoiceMode() {
          currentMode = 'voice';
          const chatForm = document.getElementById('chatForm');
          const voiceInput = document.getElementById('voiceInput');
          const textModeBtn = document.getElementById('textModeBtn');
          const voiceModeBtn = document.getElementById('voiceModeBtn');
          
          if (chatForm) chatForm.classList.add('hidden');
          if (voiceInput) voiceInput.classList.remove('hidden');
          if (textModeBtn) textModeBtn.classList.remove('active');
          if (voiceModeBtn) voiceModeBtn.classList.add('active');
          
          if (!isMuted) {
            speakText("Voice mode activated. Tap the mic to speak your query.");
          }
        }

        // Mute/Unmute Toggle
        function toggleMute() {
          isMuted = !isMuted;
          const muteBtn = document.getElementById('muteBtn');
          if (muteBtn) {
            muteBtn.innerHTML = isMuted ? '🔇' : '🔊';
            muteBtn.title = isMuted ? 'Unmute' : 'Mute';
          }
        }

        // Fallback browser TTS (English only)
        function fallbackBrowserTTS(text) {
          return new Promise((resolve) => {
            if (!('speechSynthesis' in window)) {
              console.error('Browser TTS not available');
              resolve();
              return;
            }

            speechSynthesis.cancel();
            
            setTimeout(() => {
              const utterance = new SpeechSynthesisUtterance(text);
              utterance.lang = 'en-US';
              utterance.rate = 2.0;
              
              utterance.onstart = () => {
                console.log('Fallback TTS started');
                isSpeaking = true;
              };
              
              utterance.onend = () => {
                console.log('Fallback TTS ended');
                isSpeaking = false;
                resolve();
              };
              
              utterance.onerror = (event) => {
                console.error('Fallback TTS error:', event);
                isSpeaking = false;
                resolve();
              };
              
              speechSynthesis.speak(utterance);
            }, 100);
          });
        }

        // Optimize Indian language text for faster TTS
        function optimizeIndianText(text) {
          if (!text) return text;
          
          let optimized = text
            .replace(/\\s+/g, ' ')
            .replace(/\\n/g, ' ')
            .trim()
            .replace(/।/g, '.')
            .replace(/\\.{2,}/g, '.')
            .replace(/,{2,}/g, ',')
            .replace(/\\*\\*(.*?)\\*\\*/g, '$1')
            .replace(/\\*(.*?)\\*/g, '$1')
            .replace(/<[^>]*>/g, '')
            .replace(/\\[.*?\\]/g, '')
            .replace(/\\(.*?\\)/g, '')
            .substring(0, 400);
          
          console.log('Optimized Indian text:', optimized);
          return optimized;
        }

        // Ultra-fast ElevenLabs TTS
        async function speakText(text, language = 'en') {
          if (isMuted) return Promise.resolve();
          
          const cleanText = removeEmojis(text);
          
          if (!cleanText || cleanText.length < 2) {
            return Promise.resolve();
          }

          // For now, use fallback for all languages
          console.log('Using browser TTS for:', language);
          return fallbackBrowserTTS(cleanText);
        }

        // Chat message handling
        function processUserMessage(message) {
          if (!message.trim()) return;
          
          showTyping();
          
          fetch('http://localhost:8000/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: message,
              current_menu: currentMenu,
              user_id: 'bvs_customer'
            })
          })
          .then(response => {
            if (!response.ok) {
              throw new Error('HTTP error! status: ' + response.status);
            }
            return response.json();
          })
          .then(data => {
            hideTyping();
            console.log('Backend response:', data);
            
            if (data.response) {
              currentMenu = data.current_menu || null;
              addMessage(data.response, false, data.menu_options, data.is_terminal);
              
              if (!isMuted) {
                const textToSpeak = data.tts_text || data.response;
                const languageToUse = data.detected_language || 'en';
                const optimizedText = optimizeIndianText(textToSpeak);
                
                speakText(optimizedText, languageToUse).then(() => {
                  console.log('TTS completed');
                }).catch(error => {
                  console.error('TTS failed:', error);
                });
              }
            } else {
              throw new Error('No response from backend');
            }
          })
          .catch(error => {
            hideTyping();
            console.error('Backend communication error:', error);
            
            const fallbackResponse = getFallbackResponse(message);
            addMessage(fallbackResponse);
            if (!isMuted) {
              speakText(fallbackResponse, 'en');
            }
          });
        }

        function getFallbackResponse(message) {
          const lowerMessage = message.toLowerCase();
          
          if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
            return "While our system is updating, please call " + CONTACT_PHONE + " for current vegetable prices and quotes.";
          } else if (lowerMessage.includes('delivery')) {
            return "We offer same-day delivery in Pune. Call " + CONTACT_PHONE + " to schedule your vegetable delivery.";
          } else if (lowerMessage.includes('order')) {
            return "To place an order, please call " + CONTACT_PHONE + " or visit our office at " + OFFICE_ADDRESS;
          } else if (lowerMessage.includes('location') || lowerMessage.includes('address')) {
            return "Our office is located at: " + OFFICE_ADDRESS + ". We're open daily from 6 AM to 10 PM.";
          } else {
            return "Thank you for your message. For immediate assistance with vegetable supplies, please call " + CONTACT_PHONE + ". We specialize in bulk supply to hotels and caterers.";
          }
        }

        function addMessage(message, isUser = false, menuOptions = null, isTerminal = false) {
          const chatMessages = document.getElementById('chatMessages');
          if (!chatMessages) return;
          
          const messageDiv = document.createElement('div');
          messageDiv.className = 'message-bubble flex items-start space-x-3';
          
          if (isUser) {
            messageDiv.className += ' justify-end';
            messageDiv.innerHTML = '<div class="bg-green-500 text-white rounded-2xl rounded-tr-sm p-4 max-w-xs"><p class="text-sm">' + message + '</p></div><div class="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0">👤</div>';
          } else {
            let messageContent = renderMarkdown(message);
            let menuHTML = '';
            
            if (menuOptions && menuOptions.length > 0) {
              if (isTerminal) {
                menuHTML = '<div class="menu-options">' + menuOptions.map(option => '<button class="menu-button terminal-response" data-action="' + option.action + '">' + option.text + '</button>').join('') + '</div>';
              } else {
                menuHTML = '<div class="quick-reply-grid">' + menuOptions.map(option => '<button class="menu-button" data-action="' + option.action + '">' + option.text + '</button>').join('') + '</div>';
              }
            }
            
            messageDiv.innerHTML = '<div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0">🥕</div><div class="bg-green-50 border border-green-200 rounded-2xl rounded-tl-sm p-4 max-w-[80%] message-content markdown">' + messageContent + menuHTML + '</div>';
            
            // Add event listeners to menu buttons
            setTimeout(() => {
              const menuButtons = messageDiv.querySelectorAll('.menu-button');
              menuButtons.forEach(button => {
                button.addEventListener('click', function() {
                  const action = this.getAttribute('data-action');
                  handleMenuAction(action, this.textContent);
                });
              });
            }, 100);
          }
          
          chatMessages.appendChild(messageDiv);
          chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        function handleMenuAction(action, buttonText) {
          console.log('Menu action:', action, 'Button text:', buttonText);
          addMessage(buttonText, true);
          processUserMessage(action);
        }

        function handleQuickReply(replyText) {
          addMessage(replyText, true);
          const quickReplies = document.getElementById('quickReplies');
          if (quickReplies) quickReplies.style.display = 'none';
          processUserMessage(replyText);
        }

        function showTyping() { 
          const typingIndicator = document.getElementById('typingIndicator');
          if (typingIndicator) typingIndicator.classList.remove('hidden');
          const chatMessages = document.getElementById('chatMessages');
          if (chatMessages) {
            setTimeout(() => {
              chatMessages.scrollTop = chatMessages.scrollHeight;
            }, 100);
          }
        }

        function hideTyping() { 
          const typingIndicator = document.getElementById('typingIndicator');
          if (typingIndicator) typingIndicator.classList.add('hidden');
        }

        function testBackendConnection() {
          fetch('http://localhost:8000/health')
            .then(response => {
              if (response.ok) {
                isConnected = true;
                console.log('Backend connected successfully');
              } else {
                throw new Error('Backend not responding properly');
              }
            })
            .catch(error => {
              console.error('Backend connection failed:', error);
            });
        }

        // Initialize when page loads
        document.addEventListener('DOMContentLoaded', function() {
          // Add event listeners to quick reply buttons
          const quickReplyButtons = document.querySelectorAll('.quick-reply');
          quickReplyButtons.forEach(button => {
            button.addEventListener('click', function() {
              const replyText = this.getAttribute('data-reply');
              handleQuickReply(replyText);
            });
          });
          
          initializeSpeechRecognition();
          initializeTTS();
          testBackendConnection();

          // Event listeners
          const micButtonInput = document.getElementById('micButtonInput');
          const voiceMicBtn = document.getElementById('voiceMicBtn');
          const textModeBtn = document.getElementById('textModeBtn');
          const voiceModeBtn = document.getElementById('voiceModeBtn');
          const muteBtn = document.getElementById('muteBtn');
          const chatForm = document.getElementById('chatForm');
          const messageInput = document.getElementById('messageInput');

          if (micButtonInput) micButtonInput.addEventListener('click', toggleSpeechRecognition);
          if (voiceMicBtn) voiceMicBtn.addEventListener('click', toggleSpeechRecognition);
          if (textModeBtn) textModeBtn.addEventListener('click', switchToTextMode);
          if (voiceModeBtn) voiceModeBtn.addEventListener('click', switchToVoiceMode);
          if (muteBtn) muteBtn.addEventListener('click', toggleMute);

          if (chatForm) {
            chatForm.addEventListener('submit', function(e) {
              e.preventDefault();
              if (messageInput) {
                const message = messageInput.value.trim();
                if (!message) return;
                
                addMessage(message, true);
                messageInput.value = '';
                processUserMessage(message);
              }
            });
          }

          if (messageInput) messageInput.focus();

          // Keyboard shortcut for microphone
          document.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.key === 'm') {
              e.preventDefault();
              toggleSpeechRecognition();
            }
          });
        });

        // Initial focus on open
        if (windowEl) {
          windowEl.addEventListener('transitionend', function() {
            if (!windowEl.classList.contains('translate-y-full') && !windowEl.classList.contains('hidden')) {
              const messageInput = document.getElementById('messageInput');
              if (messageInput) messageInput.focus();
            }
          });
        }
      })();
    `;
    document.body.appendChild(script);

    // Cleanup on unmount
    return () => {
      document.head.removeChild(tailwindScript);
      document.head.removeChild(markedScript);
      document.head.removeChild(style);
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="bg-white">
                  <header className="header-section">
                  <nav aria-label="Global" className="flex items-center justify-between p-6 lg:px-8">
                    <div className="flex lg:flex-1">
                      <a href="index.html" className="-m-1.5 p-1.5">
                        <span className="sr-only">Bhairavnath Vegetables Supplier (BVS)</span>
                        <img src="/logo1.png" alt="Fresh Foods Logo" className="h-24 w-auto" />
                      </a>
                    </div>
                    <div className="hidden lg:flex lg:gap-x-12">
                      <Link to="/" className="text-sm/6 font-semibold text-white hover:text-green-200 transition-colors">Home</Link>
                      <Link to="/vegetables" className="text-sm/6 font-semibold text-white hover:text-green-200 transition-colors">Vegetables</Link>
                      <Link to="/fruits" className="text-sm/6 font-semibold text-white hover:text-green-200 transition-colors">Fruits</Link>
                      <Link to="/more" className="text-sm/6 font-semibold text-white hover:text-green-200 transition-colors">More</Link>
                      <Link to="/features" className="text-sm/6 font-semibold text-white hover:text-green-200 transition-colors">Features</Link>
                      <Link to="/about" className="text-sm/6 font-semibold text-white border-b-2 border-white">About Us</Link>
                      
                    </div>
                    <div className="hidden lg:flex lg:flex-1 lg:justify-end">
                      <a href="/login" className="text-sm/6 font-semibold text-white">Log in <span aria-hidden="true">&rarr;</span></a>
                    </div>
                  </nav>
                </header>
                
                {/* Decorative line separator */}
                <div className="decorative-line"></div>
          
                {/* FIXED: Hero section with proper overlay containment */}
                {/* FIXED: Hero section with centered content */}
                {/* Professional Hero Section for Hotel Clients */}
              <div className="hero-section">
                <div className="hero-content mx-auto w-full">
                  <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center max-w-4xl mx-auto px-6">
                      <h1 className="text-5xl font-semibold tracking-tight text-balance text-white sm:text-7xl mb-6">
                        About Us
                      </h1>
                      <p className="text-2xl font-medium text-green-100 sm:text-3xl/8 mb-8">
                        Your Trusted Vegetable Supply Partner Since 2004
                      </p>
                      <p className="text-lg text-green-50 sm:text-xl/8">
                        Premium quality vegetables delivered daily to hotels, canteens, and caterers across Pune.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

      {/* Mission Statement */}
      <div className="text-center fade-in">
        <div className="relative overflow-hidden bg-gradient-to-br from-green-50 via-green-100 to-green-200 p-12 md:p-16  border-2 border-green-300 shadow-xl">
          {/* Decorative corner elements */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-green-300/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-green-500/20 rounded-full blur-3xl"></div>
          
          {/* Quote icon */}
          <div className="relative mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-600 to-green-800 rounded-2xl shadow-lg transform -rotate-3">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
              </svg>
            </div>
          </div>
          
          <div className="relative">
            <div className="inline-block px-4 py-1 mb-4 bg-green-700 rounded-full">
              <span className="text-xs font-bold text-green-50 tracking-widest">OUR MISSION</span>
            </div>
            
            <h3 className="text-3xl md:text-4xl font-bold mb-8 bg-gradient-to-r from-green-800 via-green-700 to-green-600 bg-clip-text text-transparent leading-tight">
              Fresh. On Time. Every Day.
            </h3>
            
            <div className="relative max-w-3xl mx-auto">
              {/* Left quote mark */}
              <span className="absolute -left-4 -top-2 text-6xl text-green-400/40 font-serif">"</span>
              
              <p className="text-xl md:text-2xl text-green-900 font-medium leading-relaxed italic px-8">
                To supply fresh vegetables, fruits, and lentils—on time, every day—supporting chefs with consistent quality from Pune's Market Yard.
              </p>
              
              {/* Right quote mark */}
              <span className="absolute -right-4 -bottom-6 text-6xl text-green-400/40 font-serif">"</span>
            </div>
          </div>
          
          {/* Bottom decorative line */}
          <div className="mt-10 flex justify-center items-center gap-2">
            <div className="h-0.5 w-12 bg-gradient-to-r from-transparent to-green-600"></div>
            <div className="w-2 h-2 rounded-full bg-green-700"></div>
            <div className="h-0.5 w-12 bg-gradient-to-l from-transparent to-green-600"></div>
          </div>
        </div>
      </div>

      <div className="bg-green-900 py-24 sm:py-32">
      <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
        <h2 className="text-center text-base/7 font-semibold text-green-300">Fresh & Reliable</h2>
        <p className="mx-auto mt-2 max-w-lg text-center text-4xl font-semibold tracking-tight text-balance text-white sm:text-5xl">Everything you need for fresh vegetable supply</p>
        <div className="mt-10 grid gap-4 sm:mt-16 lg:grid-cols-3 lg:grid-rows-2">
          
          {/* Fresh Vegetables - Top Left */}
          <div className="relative lg:row-span-2">
            <div className="absolute inset-px rounded-lg bg-green-800 lg:rounded-l-4xl"></div>
            <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(var(--radius-lg)+1px)] lg:rounded-l-[calc(2rem+1px)]">
              <div className="px-8 pt-8 pb-3 sm:px-10 sm:pt-10 sm:pb-0">
                <p className="mt-2 text-lg font-medium tracking-tight text-white max-lg:text-center">Fresh Vegetables</p>
                <p className="mt-2 max-w-lg text-sm/6 text-green-200 max-lg:text-center">Daily fresh vegetables sourced directly from farmers for hotels and restaurants.</p>
              </div>
              <div className="flex flex-1 min-h-0 p-4 pt-2">
                <div className="w-full h-full overflow-hidden rounded-t-[12cqw] border-x-[3cqw] border-t-[3cqw] border-green-700 bg-green-900 outline outline-white/20">
                  <img 
                    src="https://cdnintech.com/books/6492/1713437147-853389694/cover.jpg" 
                    alt="Fresh vegetables collection" 
                    className="w-full h-full object-cover object-top" 
                  />
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-lg shadow-sm outline outline-white/15 lg:rounded-l-4xl"></div>
          </div>

          {/* Performance - Top Right */}
          <div className="relative max-lg:row-start-1">
            <div className="absolute inset-px rounded-lg bg-green-700 max-lg:rounded-t-4xl"></div>
            <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(var(--radius-lg)+1px)] max-lg:rounded-t-[calc(2rem+1px)]">
              <div className="px-8 pt-8 pb-2 sm:px-10 sm:pt-10 sm:pb-2"> {/* Reduced bottom padding */}
                <p className="mt-2 text-lg font-medium tracking-tight text-white max-lg:text-center">Fast Delivery</p>
                <p className="mt-2 max-w-lg text-sm/6 text-green-100 max-lg:text-center">Morning delivery to ensure your kitchen gets fresh produce on time.</p>
              </div>
              <div className="flex-1 min-h-0 m-4 mt-0"> {/* No top margin */}
                <img 
                  src="/truck.jpg" 
                  alt="Fast vegetable delivery" 
                  className="w-full h-full object-cover rounded-lg" 
                />
              </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-lg shadow-sm outline outline-white/15 max-lg:rounded-t-4xl"></div>
          </div>

          {/* Quality Assurance - Middle Right */}
          <div className="relative max-lg:row-start-3 lg:col-start-2 lg:row-start-2">
            <div className="absolute inset-px rounded-lg bg-green-600"></div>
            <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(var(--radius-lg)+1px)]">
              <div className="px-8 pt-8 sm:px-10 sm:pt-10">
                <p className="mt-2 text-lg font-medium tracking-tight text-white max-lg:text-center">Quality Assurance</p>
                <p className="mt-2 max-w-lg text-sm/6 text-green-100 max-lg:text-center">Rigorous quality checks for consistent vegetable quality every day.</p>
              </div>
              <div className="flex flex-1 min-h-0 p-4 pt-2">
                <div className="w-full h-full flex items-center justify-center">
                  <img 
                    src="/qua.jpg" 
                    alt="Quality assurance process" 
                    className="w-full h-full object-cover rounded-lg" 
                  />
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-lg shadow-sm outline outline-white/15"></div>
          </div>

          {/* Powerful APIs - Bottom Right */}
          <div className="relative lg:row-span-2">
            <div className="absolute inset-px rounded-lg bg-green-800 max-lg:rounded-b-4xl lg:rounded-r-4xl"></div>
            <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(var(--radius-lg)+1px)] max-lg:rounded-b-[calc(2rem+1px)] lg:rounded-r-[calc(2rem+1px)]">
              <div className="px-8 pt-8 pb-3 sm:px-10 sm:pt-10 sm:pb-0">
                <p className="mt-2 text-lg font-medium tracking-tight text-white max-lg:text-center">Bulk Orders</p>
                <p className="mt-2 max-w-lg text-sm/6 text-green-200 max-lg:text-center">Specialized in bulk supply for hotels, caterers and large events.</p>
              </div>
              <div className="relative flex-1 min-h-0">
                <div className="absolute inset-0 overflow-hidden rounded-tl-xl bg-green-900/60 outline outline-white/10 flex flex-col">
                  {/* Tab bar - reduced height */}
                  <div className="flex-shrink-0 bg-green-900 outline outline-white/5">
                    <div className="flex text-sm/6 font-medium text-green-200">
                      <div className="border-r border-b border-r-white/10 border-b-white/20 bg-green-700 px-4 py-1 text-white">Tomatoes</div>
                      <div className="border-r border-green-600/10 px-4 py-1">Onions</div>
                      <div className="border-r border-green-600/10 px-4 py-1">Potatoes</div>
                    </div>
                  </div>
                  {/* Image container - takes remaining space */}
                  <div className="flex-1 min-h-0">
                    <img 
                      src="/tom.jpg" 
                      alt="Bulk vegetable orders" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-lg shadow-sm outline outline-white/15 max-lg:rounded-b-4xl lg:rounded-r-4xl"></div>
          </div>
        </div>
      </div>
    </div>

      

      {/* About Section */}
      <section id="about" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Our Story */}
          <div className="relative mb-16 fade-in">
            {/* Decorative green gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-900/5 via-green-600/10 to-green-300/5 rounded-3xl transform -rotate-1"></div>
            <div className="absolute inset-0 bg-gradient-to-tl from-green-800/5 via-green-500/10 to-green-200/5 rounded-3xl transform rotate-1"></div>
            
            <div className="relative text-center p-12 md:p-16">
              {/* Decorative leaf accents */}
              <div className="absolute top-0 left-0 text-6xl text-green-200/30">🌿</div>
              <div className="absolute top-0 right-0 text-6xl text-green-300/30">🌿</div>
              <div className="absolute bottom-0 left-1/4 text-5xl text-green-400/20">🍃</div>
              <div className="absolute bottom-0 right-1/4 text-5xl text-green-400/20">🍃</div>
              
              <div className="inline-block mb-6 px-6 py-2 bg-gradient-to-r from-green-700 to-green-500 rounded-full">
                <span className="text-sm font-semibold text-white tracking-wider">EST. 2004</span>
              </div>
              
              <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-green-900 via-green-700 to-green-600 bg-clip-text text-transparent">
                Our Story
              </h2>
              
              <div className="max-w-4xl mx-auto space-y-6">
                <p className="text-xl md:text-2xl font-medium text-green-900 leading-relaxed">
                  Founded at Gultekdi Market Yard, Pune, Bhairavnath Vegetables Supplier has delivered farm‑fresh produce to foodservice kitchens every morning since 2004.
                </p>
                
                <div className="h-1 w-24 mx-auto bg-gradient-to-r from-transparent via-green-500 to-transparent"></div>
                
                <p className="text-lg md:text-xl text-green-800 leading-relaxed">
                  From core vegetables to fruits, pulses, and banana leaves, we fulfill bulk and daily requirements with consistent quality and on‑time delivery.
                </p>
                
                <p className="text-lg md:text-xl text-green-700 leading-relaxed font-semibold">
                  Today, BVS is a trusted partner for hotels, canteens, caterers, and stores across Pune.
                </p>
              </div>
              
              {/* Decorative bottom accent */}
              <div className="mt-8 flex justify-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-700"></div>
                <div className="w-3 h-3 rounded-full bg-green-600"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-300"></div>
              </div>
            </div>
          </div>

          

          {/* Company Values Section */}
          <div className="mt-20 fade-in">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-1.5 mb-3 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full uppercase tracking-wide">
                Core Values
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                What Drives Us Forward
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                The principles that guide our business and relationships
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {/* Value Card 1 */}
              <div className="group bg-white p-7 rounded-xl border border-gray-200 hover:border-green-500 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-11 h-11 bg-green-100 rounded-lg flex items-center justify-center text-2xl group-hover:bg-green-500 transition-colors">
                    🌅
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Freshness at Dawn
                    </h3>
                    <p className="text-gray-600 text-[15px] leading-relaxed">
                      Produce sourced and dispatched early morning for foodservice kitchens.
                    </p>
                  </div>
                </div>
              </div>

              {/* Value Card 2 */}
              <div className="group bg-white p-7 rounded-xl border border-gray-200 hover:border-green-500 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-11 h-11 bg-green-100 rounded-lg flex items-center justify-center text-2xl group-hover:bg-green-500 transition-colors">
                    ✓
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Consistent Quality
                    </h3>
                    <p className="text-gray-600 text-[15px] leading-relaxed">
                      Standard grading and checks so chefs get the same quality every day.
                    </p>
                  </div>
                </div>
              </div>

              {/* Value Card 3 */}
              <div className="group bg-white p-7 rounded-xl border border-gray-200 hover:border-green-500 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-11 h-11 bg-green-100 rounded-lg flex items-center justify-center text-2xl group-hover:bg-green-500 transition-colors">
                    🚚
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      On-Time Logistics
                    </h3>
                    <p className="text-gray-600 text-[15px] leading-relaxed">
                      Reliable routes for hotels, canteens, caterers, and stores across Pune.
                    </p>
                  </div>
                </div>
              </div>

              {/* Value Card 4 */}
              <div className="group bg-white p-7 rounded-xl border border-gray-200 hover:border-green-500 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-11 h-11 bg-green-100 rounded-lg flex items-center justify-center text-2xl group-hover:bg-green-500 transition-colors">
                    🤝
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Partnership & Pricing
                    </h3>
                    <p className="text-gray-600 text-[15px] leading-relaxed">
                      Fair wholesale rates and clear communication for long-term relations.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Testimonials */}
          <div className="mt-20 fade-in">
            <div className="text-center mb-12">
              <div className="inline-block px-6 py-2 mb-4 bg-green-600 rounded-full">
                <span className="text-sm font-bold text-white tracking-wider">TESTIMONIALS</span>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-900 via-green-700 to-green-600 bg-clip-text text-transparent mb-3">
                What Our Clients Say
              </h3>
              <div className="flex justify-center gap-1 mt-4">
                <div className="w-2 h-2 rounded-full bg-green-300"></div>
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <div className="w-2 h-2 rounded-full bg-green-600"></div>
                <div className="w-2 h-2 rounded-full bg-green-700"></div>
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {/* Testimonial 1 */}
              <div className="relative bg-gradient-to-br from-white to-green-50 p-8 rounded-2xl shadow-lg border-2 border-green-200 hover:border-green-400 transition-all duration-300 hover:-translate-y-2">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center text-white text-2xl shadow-lg">
                  "
                </div>
                <div className="flex items-center mb-6 mt-2">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4 shadow-md">RK</div>
                  <div>
                    <h4 className="font-bold text-green-900 text-lg">Raj Kumar</h4>
                    <p className="text-sm text-green-700">Hotel Manager</p>
                  </div>
                </div>
                <p className="text-green-800 leading-relaxed mb-6 italic">"BVS has been our trusted supplier for a decade. Their quality and reliability are exceptional."</p>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                  ))}
                </div>
              </div>

              {/* Testimonial 2 */}
              <div className="relative bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-2xl shadow-lg border-2 border-green-300 hover:border-green-500 transition-all duration-300 hover:-translate-y-2">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-green-700 to-green-800 rounded-full flex items-center justify-center text-white text-2xl shadow-lg">
                  "
                </div>
                <div className="flex items-center mb-6 mt-2">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-700 to-green-800 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4 shadow-md">SP</div>
                  <div>
                    <h4 className="font-bold text-green-900 text-lg">Sneha Patil</h4>
                    <p className="text-sm text-green-700">Restaurant Owner</p>
                  </div>
                </div>
                <p className="text-green-800 leading-relaxed mb-6 italic">"BVS delivers fresh produce on time, every time, perfectly meeting our restaurant's needs."</p>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                  ))}
                </div>
              </div>

              {/* Testimonial 3 */}
              <div className="relative bg-gradient-to-br from-white to-green-50 p-8 rounded-2xl shadow-lg border-2 border-green-200 hover:border-green-400 transition-all duration-300 hover:-translate-y-2">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center text-white text-2xl shadow-lg">
                  "
                </div>
                <div className="flex items-center mb-6 mt-2">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4 shadow-md">AM</div>
                  <div>
                    <h4 className="font-bold text-green-900 text-lg">Amit Mehta</h4>
                    <p className="text-sm text-green-700">Catering Services</p>
                  </div>
                </div>
                <p className="text-green-800 leading-relaxed mb-6 italic">"BVS handled our 5000-guest event seamlessly with top-quality vegetables and professional service."</p>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </section>

      <section className="relative isolate overflow-hidden bg-[#f0f9f0] px-6 py-24 sm:py-32 lg:overflow-visible lg:px-0">  
        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 lg:mx-0 lg:max-w-none lg:grid-cols-2 lg:items-start lg:gap-y-10">
            
            <div className="-mt-12 -ml-12 p-12 lg:sticky lg:top-4 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:overflow-hidden">
                <img
                    src="/market.jpg"
                    alt="Bhairavnath Vegetable Suppliers sourcing fresh produce for hotels and caterers"
                    className="w-[48rem] max-w-none rounded-xl bg-[#dcf2dc] shadow-xl ring-1 ring-[#bce4bc] sm:w-[57rem] md:-ml-4 lg:-ml-0"
                    style={{ maskImage: 'radial-gradient(64rem 64rem at top, white, transparent)' }}
                />
            </div>


            <div className="lg:col-start-2 lg:row-start-1 lg:mx-auto lg:grid lg:w-full lg:max-w-7xl lg:grid-cols-1 lg:gap-x-8 lg:px-8">
                <div className="lg:pl-4">
                    <div className="lg:max-w-lg">
                        <p className="text-base/7 font-semibold text-[#227d22]">Trusted Since 2004</p>
                        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-pretty text-[#164216] sm:text-5xl">
                            The Gold Standard in Fresh Supply
                        </h1>
                        <p className="mt-6 text-xl/8 text-[#1d641d]">
                            We deliver top-quality vegetables and fruits, hand-picked from the market and sourced directly from our network of the best farmers.
                        </p>
                    </div>
                </div>
            </div>

            <div className="lg:col-start-2 lg:row-start-2 lg:mx-auto lg:grid lg:w-full lg:max-w-7xl lg:grid-cols-1 lg:gap-x-8 lg:px-8">
                <div className="lg:pl-4">
                    <div className="max-w-xl text-base/7 text-[#1d641d] lg:max-w-lg">
                        <p className="mb-8">
                            Your premier partner for fresh, reliable, and high-quality produce supply. We understand the needs of professional kitchens.
                        </p>

                        <ul role="list" className="mt-8 space-y-8 text-[#1d641d]">
                            <li className="flex gap-x-3">
                                <svg className="mt-1 size-5 flex-none text-[#227d22]" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M5.5 17a4.5 4.5 0 0 1-1.44-8.765 4.5 4.5 0 0 1 8.302-3.046 3.5 3.5 0 0 1 4.504 4.272A4 4 0 0 1 15 17H5.5Zm3.75-2.75a.75.75 0 0 0 1.5 0V9.66l1.95 2.1a.75.75 0 1 0 1.1-1.02l-3.25-3.5a.75.75 0 0 0-1.1 0l-3.25 3.5a.75.75 0 1 0 1.1 1.02l1.95-2.1v4.59Z" clipRule="evenodd" />
                                </svg>
                                <span>
                                    <strong className="font-semibold text-[#164216]">Direct from Source.</strong> Connected with the best farmers for the freshest pick.
                                </span>
                            </li>
                            <li className="flex gap-x-3">
                                <svg className="mt-1 size-5 flex-none text-[#227d22]" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>
                                    <strong className="font-semibold text-[#164216]">Top Quality Assured.</strong> Rigorously selected for superior color, size, and freshness.
                                </span>
                            </li>
                            <li className="flex gap-x-3">
                                <svg className="mt-1 size-5 flex-none text-[#227d22]" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                                </svg>
                                <span>
                                    <strong className="font-semibold text-[#164216]">Scale and Reliability.</strong> Perfectly equipped for hotels, canteens, caterers, and large-scale events.
                                </span>
                            </li>
                        </ul>

                        <p className="mt-8">
                            A legacy of serving numerous prestigious clients with unwavering quality and service since our inception.
                        </p>

                        <h2 className="mt-16 text-2xl font-bold tracking-tight text-[#164216]">
                            Bhairavnath Vegetable Suppliers : Your Trusted Partner.
                        </h2>
                        <p className="mt-6">
                            Get in touch to discuss your supply needs. Let's bring the best to your table.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </section>
      
      {/* FAQ Section */}
      
      <FAQSection />

      

      {/* Footer */}
      <footer className="footer-bg text-white relative">
        <div className="relative z-10 mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="flex flex-wrap justify-center gap-6 md:gap-8 mb-8">
            <Link to="/" className="text-sm/6 text-white/90 hover:text-white transition-colors">Home</Link>  {/* Fixed: to="/" (no .js) */}
            <Link to="/vegetables" className="text-sm/6 text-white/90 hover:text-white transition-colors">Vegetables</Link>  {/* Fixed: to="/vegetables" (no .js) */}
            <Link to="/fruits" className="text-sm/6 text-white/90 hover:text-white transition-colors">Fruits</Link>
            <Link to="/more" className="text-sm/6 text-white/90 hover:text-white transition-colors">More</Link>
            <Link to="/features" className="text-sm/6 text-white/90 hover:text-white transition-colors">Features</Link>
            <Link to="/about" className="text-sm/6 text-white/90 hover:text-white transition-colors">About Us</Link>
          </div>
          <div className="flex justify-center items-center pt-8 border-t border-white/20">
            <div className="text-sm text-white/90 text-center">
              &copy; 2004–Present Bhairavnath Vegetables Supplier. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

       {/* Chatbot message tooltip */}
      {!showChatbot && (
        <div className="chatbot-message">
          Hi! What would you like to know today?
        </div>
      )}

      {/* Chatbot Toggle Button */}
      <button 
        className="chatbot-toggle"
        onClick={toggleChatbot}
        aria-label="Open chatbot"
      >
        <img src="/chatboticon.png" alt="Chatbot" className="w-16 h-16" />
      </button>

      {/* Chatbot Window */}
      <div ref={chatbotRef} className={`chatbot-window ${showChatbot ? 'visible' : 'hidden'}`}>
        <button 
          className="chatbot-close"
          onClick={toggleChatbot}
          aria-label="Close chatbot"
        >
          ×
        </button>
        <ChatBot />
      </div>
    </div>
  );
};

export default About;