import React, { useEffect, useRef, useState, useCallback } from 'react';
import { marked } from 'marked';

function ChatBot() {
    // State variables
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [currentMode, setCurrentMode] = useState('text');
    const [currentMenu, setCurrentMenu] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    // Refs
    const recognitionRef = useRef(null);
    const chatMessagesRef = useRef(null);
    const messageInputRef = useRef(null);
    const chatFormRef = useRef(null);
    const typingIndicatorRef = useRef(null);
    const micButtonInputRef = useRef(null);
    const visualizerRef = useRef(null);
    const voiceInputRef = useRef(null);
    const voiceMicBtnRef = useRef(null);
    const voiceStatusRef = useRef(null);
    const textModeBtnRef = useRef(null);
    const voiceModeBtnRef = useRef(null);
    const muteBtnRef = useRef(null);

    // Business Information
    const OFFICE_ADDRESS = "Gultekdi, Market Yard, Pune - 411037";
    const CONTACT_PHONE = "9881325644";
    const CONTACT_EMAIL = "surajgaikwad9812@gmail.com";
    const BOT_NAME = "BVS Assistant";
    // ElevenLabs Configuration (Add your API key!)
    // Update your ElevenLabs configuration at the top
    const ELEVENLABS_API_KEY = 'sk_ec2a7a1256c2dd230f2e088168134cfee99239d02724eda9';
    const ELEVENLABS_VOICE_ID = '4lxiwACZjh4nni3fNTjx'; // Aami - young female Indian voice, clear, engaging, warm, friendly, and natural // Use a voice that supports multilingual

    // You can get more voice IDs from ElevenLabs that support Indian languages  // Your selected Indian female voice

    // DOM Elements
    let chatMessages;
    let messageInput;
    let chatForm;
    let typingIndicator;
    let micButtonInput;
    let visualizer;
    let voiceInput;
    let voiceMicBtn;
    let voiceStatus;
    let textModeBtn;
    let voiceModeBtn;
    let muteBtn;

    // Function to remove emojis for clean TTS
    const removeEmojis = useCallback((text) => {
        if (!text) return '';
        const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2702}-\u{27B0}\u{24C2}-\u{1F251}]/gu;
        return text.replace(emojiRegex, '').replace(/\s+/g, ' ').trim();
    }, []);

    // Markdown rendering function
    const renderMarkdown = useCallback((text) => {
        return marked.parse(text);
    }, []);

    // Language detection
    const detectLanguage = useCallback((text) => {
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
        if (marathiCount > 0 || hindiCount > 0) return 'hi';
        
        return 'en';
    }, []);

    // Quick Reply Handling
    const handleQuickReply = useCallback((replyText) => {
        addMessage(replyText, true);
        const quickReplies = document.getElementById('quickReplies');
        if (quickReplies) {
            quickReplies.style.display = 'none';
        }
        processUserMessage(replyText);
    }, []);

    // Add message to chat
    const addMessage = useCallback((message, isUser = false, menuOptions = null, isTerminal = false) => {
        if (!chatMessagesRef.current) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message-bubble flex items-start space-x-3';
        
        if (isUser) {
            messageDiv.className += ' justify-end';
            messageDiv.innerHTML = `
                <div class="bg-green-700 text-white rounded-2xl rounded-tr-sm p-4 max-w-xs">
                    <p class="text-sm">${message}</p>
                </div>
                <div class="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0">👤</div>
            `;
        } else {
            let messageContent = renderMarkdown(message);
            let menuHTML = '';
            
            if (menuOptions && menuOptions.length > 0) {
                if (isTerminal) {
                    menuHTML = `
                        <div class="menu-options">
                            ${menuOptions.map(option => `
                                <button class="menu-button terminal-response" data-action="${option.action}">
                                    ${option.text}
                                </button>
                            `).join('')}
                        </div>
                    `;
                } else {
                    menuHTML = `
                        <div class="quick-reply-grid">
                            ${menuOptions.map(option => `
                                <button class="menu-button" data-action="${option.action}">
                                    ${option.text}
                                </button>
                            `).join('')}
                        </div>
                    `;
                }
            }
            
            messageDiv.innerHTML = `
                <div class="w-8 h-8 flex items-center justify-center flex-shrink-0"><img src="/chatboticon.png" alt="BVS" class="w-8 h-8" /></div>
                <div class="bg-green-100 border border-green-400 rounded-2xl rounded-tl-sm p-4 max-w-[80%] message-content markdown">
                    ${messageContent}
                    ${menuHTML}
                </div>
            `;
            
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
        
        chatMessagesRef.current.appendChild(messageDiv);
        chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }, [renderMarkdown]);

    const handleMenuAction = useCallback((action, buttonText) => {
        console.log('Menu action:', action, 'Button text:', buttonText);
        addMessage(buttonText, true);
        processUserMessage(action);
    }, [addMessage]);

    const showTyping = useCallback(() => { 
        if (typingIndicatorRef.current) {
            typingIndicatorRef.current.classList.remove('hidden'); 
        }
        setTimeout(() => {
            if (chatMessagesRef.current) {
                chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
            }
        }, 100);
    }, []);

    const hideTyping = useCallback(() => { 
        if (typingIndicatorRef.current) {
            typingIndicatorRef.current.classList.add('hidden'); 
        }
    }, []);

    // Process user message
    const processUserMessage = useCallback((message) => {
        if (!message.trim()) return;
        
        showTyping();
        
        // Use deployed API URL (change to 'https://api-aso3bjldka-uc.a.run.app' for local testing)
        const API_URL = 'https://api-aso3bjldka-uc.a.run.app';
        
        fetch(`${API_URL}/chat`, {
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
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            hideTyping();
            console.log('Backend response:', data);
            
            if (data.response) {
                setCurrentMenu(data.current_menu || null);
                addMessage(data.response, false, data.menu_options, data.is_terminal);
                
                if (!isMuted) {
                    const textToSpeak = data.tts_text || data.response;
                    const languageToUse = data.detected_language || 'en';
                    speakText(textToSpeak, languageToUse).catch(error => {
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
        });
    }, [showTyping, hideTyping, currentMenu, isMuted, addMessage]);

    const getFallbackResponse = useCallback((message) => {
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
            return "While our system is updating, please call " + CONTACT_PHONE + " for current vegetable prices and quotes.";
        } else if (lowerMessage.includes('delivery')) {
            return "We offer regular delivery in Pune. Call " + CONTACT_PHONE + " to schedule your vegetable delivery.";
        } else if (lowerMessage.includes('order')) {
            return "To place an order, please call " + CONTACT_PHONE + " or visit our office at " + OFFICE_ADDRESS;
        } else if (lowerMessage.includes('location') || lowerMessage.includes('address')) {
            return "Our office is located at: " + OFFICE_ADDRESS + ". We're open daily from 6 AM to 10 PM.";
        } else {
            return "Thank you for your message. For immediate assistance with vegetable supplies, please call " + CONTACT_PHONE + ". We specialize in bulk supply to hotels and caterers.";
        }
    }, [CONTACT_PHONE, OFFICE_ADDRESS]);

    // Mode Toggle Functions
    const switchToTextMode = useCallback(() => {
        setCurrentMode('text');
        if (chatFormRef.current) chatFormRef.current.classList.remove('hidden');
        if (voiceInputRef.current) voiceInputRef.current.classList.add('hidden');
        if (textModeBtnRef.current) textModeBtnRef.current.classList.add('active');
        if (voiceModeBtnRef.current) voiceModeBtnRef.current.classList.remove('active');
        if (messageInputRef.current) messageInputRef.current.focus();
    }, []);

    const switchToVoiceMode = useCallback(() => {
        setCurrentMode('voice');
        if (chatFormRef.current) chatFormRef.current.classList.add('hidden');
        if (voiceInputRef.current) voiceInputRef.current.classList.remove('hidden');
        if (textModeBtnRef.current) textModeBtnRef.current.classList.remove('active');
        if (voiceModeBtnRef.current) voiceModeBtnRef.current.classList.add('active');
    }, []);

    // Speech functions
    const updateSpeechUI = useCallback((status) => {
        if (visualizerRef.current) visualizerRef.current.classList.add('hidden');
        if (micButtonInputRef.current) micButtonInputRef.current.classList.remove('listening', 'connecting');
        if (voiceMicBtnRef.current) voiceMicBtnRef.current.classList.remove('listening', 'connecting');

        switch(status) {
            case 'listening':
                if (micButtonInputRef.current) micButtonInputRef.current.classList.add('listening');
                if (voiceMicBtnRef.current) voiceMicBtnRef.current.classList.add('listening');
                if (visualizerRef.current) visualizerRef.current.classList.remove('hidden');
                if (micButtonInputRef.current) micButtonInputRef.current.innerHTML = '🔴';
                if (voiceMicBtnRef.current) voiceMicBtnRef.current.innerHTML = '🔴';
                break;
            case 'speaking':
                if (micButtonInputRef.current) micButtonInputRef.current.classList.add('listening');
                if (voiceMicBtnRef.current) voiceMicBtnRef.current.classList.add('listening');
                if (visualizerRef.current) visualizerRef.current.classList.remove('hidden');
                if (micButtonInputRef.current) micButtonInputRef.current.innerHTML = '🔊';
                if (voiceMicBtnRef.current) voiceMicBtnRef.current.innerHTML = '🔊';
                break;
            case 'connecting':
                if (micButtonInputRef.current) micButtonInputRef.current.classList.add('connecting');
                if (voiceMicBtnRef.current) voiceMicBtnRef.current.classList.add('connecting');
                if (micButtonInputRef.current) micButtonInputRef.current.innerHTML = '🎤';
                if (voiceMicBtnRef.current) voiceMicBtnRef.current.innerHTML = '🎤';
                break;
            default:
                if (micButtonInputRef.current) micButtonInputRef.current.innerHTML = '🎤';
                if (voiceMicBtnRef.current) voiceMicBtnRef.current.innerHTML = '🎤';
        }
    }, []);

    const toggleMute = useCallback(() => {
        setIsMuted(prev => !prev);
    }, []);

    // Simple TTS function
    const speakText = useCallback((text, language = 'en') => {
        if (isMuted) return Promise.resolve();
        console.log('Would speak:', text.substring(0, 50));
        return Promise.resolve(); // Placeholder
    }, [isMuted]);

    // Speech recognition functions
    const toggleSpeechRecognition = useCallback(() => {
        const recognition = recognitionRef.current;
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
                setIsListening(false);
                updateSpeechUI('ended');
            } catch (error) {
                console.error('Error stopping speech recognition:', error);
            }
        }
    }, [isListening, updateSpeechUI]);

    // Initialize speech recognition
    const initializeSpeechRecognition = useCallback(() => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('Speech recognition not supported in this browser');
            return;
        }

        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognitionRef.current = recognition;
            
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = 'en-IN';
            recognition.maxAlternatives = 3;

            recognition.onstart = function() {
                console.log('Speech recognition started');
                setIsListening(true);
                updateSpeechUI('listening');
                if (voiceStatusRef.current) {
                    voiceStatusRef.current.textContent = 'Listening...';
                    voiceStatusRef.current.classList.remove('hidden');
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
                    console.log('Final transcript:', finalTranscript);
                    
                    const cleanTranscript = finalTranscript.trim();
                    addMessage(cleanTranscript, true);
                    processUserMessage(cleanTranscript);
                    toggleSpeechRecognition();
                }
            };

            recognition.onerror = function(event) {
                console.error('Speech recognition error:', event.error);
                
                if (event.error === 'not-allowed') {
                    // showError('Microphone access denied. Please allow microphone permissions.');
                }
                
                setIsListening(false);
                updateSpeechUI('ended');
                if (voiceStatusRef.current) {
                    voiceStatusRef.current.classList.add('hidden');
                }
            };

            recognition.onend = function() {
                console.log('Speech recognition ended');
                setIsListening(false);
                updateSpeechUI('ended');
                if (voiceStatusRef.current) {
                    voiceStatusRef.current.classList.add('hidden');
                }
            };

            console.log('Speech recognition initialized successfully');
            
        } catch (error) {
            console.error('Error initializing speech recognition:', error);
        }
    }, [updateSpeechUI, addMessage, processUserMessage, toggleSpeechRecognition]);

    // Form submission handler
    const handleFormSubmit = useCallback((e) => {
        e.preventDefault();
        
        if (e.detail > 1) return;
        
        const message = messageInputRef.current?.value.trim();
        if (!message) return;
        
        addMessage(message, true);
        messageInputRef.current.value = '';
        processUserMessage(message);
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            setTimeout(() => {
                submitBtn.disabled = false;
            }, 1000);
        }
    }, [addMessage, processUserMessage]);

    // Initialize when component mounts
    useEffect(() => {
        // Assign refs to DOM elements
        chatMessagesRef.current = document.getElementById('chatMessages');
        messageInputRef.current = document.getElementById('messageInput');
        chatFormRef.current = document.getElementById('chatForm');
        typingIndicatorRef.current = document.getElementById('typingIndicator');
        micButtonInputRef.current = document.getElementById('micButtonInput');
        visualizerRef.current = document.getElementById('visualizer');
        voiceInputRef.current = document.getElementById('voiceInput');
        voiceMicBtnRef.current = document.getElementById('voiceMicBtn');
        voiceStatusRef.current = document.getElementById('voiceStatus');
        textModeBtnRef.current = document.getElementById('textModeBtn');
        voiceModeBtnRef.current = document.getElementById('voiceModeBtn');
        muteBtnRef.current = document.getElementById('muteBtn');

        // Add event listeners to quick reply buttons
        const quickReplyButtons = document.querySelectorAll('.quick-reply');
        quickReplyButtons.forEach(button => {
            button.addEventListener('click', function() {
                const replyText = this.getAttribute('data-reply');
                handleQuickReply(replyText);
            });
        });

        // Initialize speech recognition
        initializeSpeechRecognition();

        // Event listeners
        const micButtonInput = micButtonInputRef.current;
        const voiceMicBtn = voiceMicBtnRef.current;
        const textModeBtn = textModeBtnRef.current;
        const voiceModeBtn = voiceModeBtnRef.current;
        const muteBtn = muteBtnRef.current;
        const chatForm = chatFormRef.current;

        if (micButtonInput) {
            micButtonInput.addEventListener('click', toggleSpeechRecognition);
        }
        if (voiceMicBtn) {
            voiceMicBtn.addEventListener('click', toggleSpeechRecognition);
        }
        if (textModeBtn) {
            textModeBtn.addEventListener('click', switchToTextMode);
        }
        if (voiceModeBtn) {
            voiceModeBtn.addEventListener('click', switchToVoiceMode);
        }
        if (muteBtn) {
            muteBtn.addEventListener('click', toggleMute);
        }
        if (chatForm) {
            chatForm.addEventListener('submit', handleFormSubmit);
        }

        // Focus on input field
        if (messageInputRef.current) {
            messageInputRef.current.focus();
        }

        // Cleanup function
        return () => {
            if (micButtonInput) {
                micButtonInput.removeEventListener('click', toggleSpeechRecognition);
            }
            if (voiceMicBtn) {
                voiceMicBtn.removeEventListener('click', toggleSpeechRecognition);
            }
            if (textModeBtn) {
                textModeBtn.removeEventListener('click', switchToTextMode);
            }
            if (voiceModeBtn) {
                voiceModeBtn.removeEventListener('click', switchToVoiceMode);
            }
            if (muteBtn) {
                muteBtn.removeEventListener('click', toggleMute);
            }
            if (chatForm) {
                chatForm.removeEventListener('submit', handleFormSubmit);
            }
        };
    }, [handleQuickReply, initializeSpeechRecognition, toggleSpeechRecognition, switchToTextMode, switchToVoiceMode, toggleMute, handleFormSubmit]);

    // Update mute button UI
    useEffect(() => {
        if (muteBtnRef.current) {
            muteBtnRef.current.innerHTML = isMuted ? '🔇' : '🔊';
            muteBtnRef.current.title = isMuted ? 'Unmute' : 'Mute';
        }
    }, [isMuted]);


    return (
        <>
        <style>{`
            html, body { 
            height: 100%; 
            margin: 0; 
            padding: 0;
            // overflow: hidden;
            }
            body { 
            box-sizing: border-box; 
            }
            .chat-container { 
            backdrop-filter: blur(10px); 
            background: rgba(255,255,255,0.95);
            background-image: url("https://imgs.search.brave.com/4iyDv0YJSJdYkSgsAkbQFVPJS4ND1bIHk5YizP15aV4/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pbWcu/ZnJlZXBpay5jb20v/ZnJlZS1waG90by9s/YXJnZS1zZXQtaXNv/bGF0ZWQtdmVnZXRh/Ymxlcy13aGl0ZS1i/YWNrZ3JvdW5kXzQ4/NTcwOS00NC5qcGc_/c2VtdD1haXNfaHli/cmlkJnc9NzQwJnE9/ODA");
            background-size: cover;
            background-position: center;
            background-attachment: fixed;
            display: flex;
            flex-direction: column;
            height: 100%;
            }

            .chat-messages-container {
            flex: 1;
            overflow-y: auto;
            padding: 1rem;
            background-color: rgba(255, 255, 255, 0.85);
            min-height: 0; /* Important for flex children */
            }

            .message-bubble { 
            animation: slideIn 0.3s ease-out; 
            margin-bottom: 0.75rem;
            }

            @keyframes slideIn { from { opacity:0; transform: translateY(10px);} to { opacity:1; transform: translateY(0);} }
            .typing-indicator { animation: pulse 1.5s infinite; }
            @keyframes pulse { 0%,100%{opacity:.5;} 50%{opacity:1;} }
            // .background-image {
            // background-image: url("https://imgs.search.brave.com/FQA_QlJeV84G25h-d6yWlDYb1PwrMv2C1UjbzzxnHtQ/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9jZG4u/cGl4YWJheS5jb20v/cGhvdG8vMjAyMi8w/My8wNS8xNi81NS9o/ZWFsdGh5LTcwNDk3/ODFfNjQwLmpwZw");
            // filter: blur(8px);
            // }
            
            
            .speech-interface {
            transition: all 0.3s ease;
            }

            .visualizer {
            display: flex;
            align-items: center;
            gap: 3px;
            margin-left: 12px;
            }

            .bar {
            width: 3px;
            height: 15px;
            background: linear-gradient(to top, #10b981, #059669);
            border-radius: 2px;
            animation: equalizer 1.5s ease infinite;
            }

            .bar:nth-child(2) { animation-delay: 0.1s; }
            .bar:nth-child(3) { animation-delay: 0.2s; }
            .bar:nth-child(4) { animation-delay: 0.3s; }
            .bar:nth-child(5) { animation-delay: 0.4s; }
            @keyframes equalizer {
            0%, 100% { height: 8px; }
            50% { height: 20px; }
            }
            .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-right: 8px;
            }
            .status-listening { background: #10b981; animation: pulse 2s infinite; }
            .status-speaking { background: #f59e0b; animation: pulse 2s infinite; }
            .status-ended { background: #ef4444; }
            .connection-badge {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 600;
            }
            .connected { background: #d1fae5; color: #065f46; }
            .disconnected { background: #fee2e2; color: #991b1b; }
            
            .mic-button {
            transition: all 0.3s ease;
            }
            .mic-button.listening {
            background-color: #ef4444 !important;
            transform: scale(1.05);
            }
            .mic-button.connecting {
            background-color: #f59e0b !important;
            }

            /*--------------------------------------*/
            /* Input form tweaks */
            #chatForm {
            min-height: 52px; /* Ensure consistent height */
            align-items: center;
            }

            #chatForm input {
            min-width: 0; /* Allow flex shrink if needed */
            }

            /* Mic button visibility fixes */
            .mic-button,
            .voice-mic {
            min-width: 44px; /* Prevent squishing */
            z-index: 10; /* Ensure above other elements */
            }

            .mic-button span,
            .voice-mic span {
            line-height: 1; /* Better emoji centering */
            }

            /* Reduce chance of overflow in narrow window */
            @media (max-width: 400px) { /* Target chatbot width */
            #chatForm {
                flex-wrap: wrap; /* Allow wrap if extreme narrowness */
                gap: 0.5rem;
            }
            
            #chatForm button {
                flex: 0 0 auto; /* Buttons don't grow/shrink */
            }
            }
            /*--------------------------------------*/

            /* Quick Reply Buttons */
            .quick-reply {
            transition: all 0.2s ease;
            border: 1px solid #d1d5db;
            }
            .quick-reply:hover {
            background-color: #f3f4f6;
            transform: translateY(-1px);
            }
            .quick-reply:active {
            transform: scale(0.98);
            }

            .message-content iframe {
            max-width: 100%;
            border-radius: 8px;
            margin-top: 8px;
            }
            /* Markdown Table Styles */
            .markdown table {
            width: 100%;
            border-collapse: collapse;
            margin: 1em 0;
            font-size: 0.875rem;
            }
            .markdown th, .markdown td {
            border: 1px solid #d1d5db;
            padding: 0.5rem;
            text-align: left;
            }
            .markdown th {
            background-color: #f3f4f6;
            font-weight: 600;
            }
            .markdown tr:nth-child(even) {
            background-color: #f9fafb;
            }
            .markdown strong {
            font-weight: 700;
            }
            /* Custom scrollbar for chat messages */
            .chat-messages-container::-webkit-scrollbar {
            width: 6px;
            }
            .chat-messages-container::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
            }
            .chat-messages-container::-webkit-scrollbar-thumb {
            background: #c1c1c1;
            border-radius: 10px;
            }
            .chat-messages-container::-webkit-scrollbar-thumb:hover {
            background: #a8a8a8;
            }
            /* Voice Mode Mic */
            .voice-mic {
            transition: all 0.3s ease;
            font-size: 2rem;
            }
            .voice-mic.listening {
            background-color: #ef4444 !important;
            transform: scale(1.1);
            }

            /* Mode Toggle */
            .mode-toggle button.active {
            background-color: #10b981;
            color: white;
            }

            /* Mute Button */
            .mute-btn {
            font-size: 1.2rem;
            transition: all 0.2s ease;
            }
            .mute-btn:hover {
            transform: scale(1.1);
            }

            .menu-options {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-top: 12px;
            }

            .menu-button {
            background: white;
            border: 1px solid #d1d5db;
            border-radius: 12px;
            padding: 12px 16px;
            text-align: left;
            cursor: pointer;
            transition: all 0.2s ease;
            font-size: 14px;
            color: #374151;
            }

            .menu-button:hover {
            background: #f3f4f6;
            border-color: #9ca3af;
            transform: translateY(-1px);
            }

            .menu-button:active {
            transform: scale(0.98);
            }

            .menu-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            }

            .terminal-response {
            background: #f0f9ff;
            border: 1px solid #bae6fd;
            }

            .quick-reply-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            margin-top: 12px;
            }

            @media (max-width: 640px) {
            .quick-reply-grid {
                grid-template-columns: 1fr;
            }
            }

            .message-bubble > div {
            max-width: 80%;
            }
        `}</style>
        <div className="h-full relative overflow-hidden">
            <div className="absolute inset-0 background-image bg-cover bg-center" />
            <div className="chat-container w-full h-full rounded-2xl shadow-2xl border border-green-200 flex flex-col relative">
                {/* Header with Speech Controls */}
                <div className="bg-gradient-to-r from-green-700 to-green-800 text-white p-4 rounded-t-2xl flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 flex items-center justify-center">
                        <img src="/chatboticon.png" alt="BVS" className="w-10 h-10" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold">BVS Assistant</h1>
                        <p className="text-green-100 text-xs">
                        Bhairavnath Vegetable Supplier
                        </p>
                    </div>
                    </div>
                    {/* Speech Controls */}
                    
                </div>
                {/* Connection Status */}
                <div className="mt-2 flex justify-between items-center">
                    
                </div>
                </div>
                {/* Chat Messages */}
                <div id="chatMessages" className="chat-messages-container">
                {/* Initial Welcome Message with Quick Replies */}
                <div
                    className="message-bubble flex items-start space-x-3"
                    id="welcomeMessage"
                >
                    <div className="w-8 h-8 flex items-center justify-center">
                    <img src="/chatboticon.png" alt="BVS" className="w-8 h-8" />
                    </div>
                    <div className="bg-green-100 border border-green-400 rounded-2xl rounded-tl-sm p-4 max-w-xs">
                    <p className="text-gray-800 text-sm mb-3">
                        Hello! Welcome to BVS—fresh veggies for hotels and caterers.
                        What can I help you with today?
                    </p>
                    {/* Quick Reply Buttons */}
                    <div className="space-y-2" id="quickReplies">
                        <button
                        className="quick-reply w-full text-left bg-white px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                        data-reply="Get Price List"
                        >
                        Get Price List
                        </button>
                        <button
                        className="quick-reply w-full text-left bg-white px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                        data-reply="Place an Order"
                        >
                        Place an Order
                        </button>
                        <button
                        className="quick-reply w-full text-left bg-white px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                        data-reply="Delivery Info"
                        >
                        Delivery Info
                        </button>
                        <button
                        className="quick-reply w-full text-left bg-white px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                        data-reply="Contact Us"
                        >
                        Contact Us
                        </button>
                        <button
                        className="quick-reply w-full text-left bg-white px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                        data-reply="Our Location"
                        >
                        Our Location
                        </button>
                        <button
                        className="quick-reply w-full text-left bg-white px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                        data-reply="Something Else"
                        >
                        Something Else
                        </button>
                    </div>
                    </div>
                </div>
                </div>
                {/* Typing Indicator */}
                <div
                id="typingIndicator"
                className="hidden absolute bottom-16 left-0 right-0"
                >
                <div className="p-4">
                    <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                        <img src="/chatboticon.png" alt="BVS" className="w-8 h-8" />
                    </div>
                    <div className="bg-green-100 border border-green-400 rounded-2xl rounded-tl-sm p-4">
                        <div className="typing-indicator flex space-x-1">
                        <div className="w-2 h-2 bg-green-600 rounded-full" />
                        <div className="w-2 h-2 bg-green-600 rounded-full" />
                        <div className="w-2 h-2 bg-green-600 rounded-full" />
                        </div>
                    </div>
                    </div>
                </div>
                </div>
                {/* Input Area */}
                <div className="p-4 bg-white bg-opacity-95 rounded-b-2xl border-t border-green-100 flex-shrink-0">
                
                {/* Text Input Form (Default) */}
                <form id="chatForm" className="flex space-x-2" data-mode="text"> {/* Reduced space-x-3 to 2 */}
                <input
                    type="text"
                    id="messageInput"
                    placeholder="Ask about vegetables, pricing, delivery, or orders..."
                    className="flex-1 px-3 py-3 border border-green-400 rounded-full focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent" 
                    autoComplete="off"
                />
                <button
                    type="submit"
                    className="bg-green-700 hover:bg-green-800 text-white px-4 py-3 rounded-full font-medium transition-colors duration-200 flex items-center space-x-2 flex-shrink-0" 
                >
                    <span>Send</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                </button>
                </form>

                {/* Voice Input (Hidden by default) */}
                <div id="voiceInput" className="hidden flex justify-center pt-4" data-mode="voice">
                <button
                    type="button"
                    id="voiceMicBtn"
                    className="voice-mic bg-green-700 hover:bg-green-800 text-white p-6 rounded-full w-20 h-20 flex items-center justify-center text-3xl font-medium transition-all duration-200 shadow-lg flex-shrink-0" 
                    title="Tap to speak"
                >
                    <span aria-hidden="true">🎤</span>
                    {/* Same SVG fallback */}
                    <svg className="w-8 h-8 hidden" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                    </svg>
                </button>
                <div id="voiceStatus" className="ml-4 text-sm text-gray-600 self-center hidden">
                    Listening...
                </div>
                </div>
                </div>
            </div>
            </div>

        </>

    );
}

export default ChatBot;