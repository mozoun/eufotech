// Eufo Tech Interactive Chatbot (shared across all pages)
(function() {
    const chatbot = document.getElementById('customChatbot');
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const chatSend = document.getElementById('chatSend');
    const closeChatbot = document.getElementById('closeChatbot');
    const chatbotToggle = document.getElementById('chatbotToggle');
    if (!chatbot || !chatMessages) return;

    // ---- Extra styles (quick-reply buttons + typing indicator) ----
    const style = document.createElement('style');
    style.textContent = `
        .chat-options { display: flex; flex-wrap: wrap; gap: 8px; margin: 4px 0 10px; }
        .chat-option-btn {
            background: rgba(212, 175, 55, 0.12);
            border: 1px solid #d4af37;
            color: #d4af37;
            border-radius: 18px;
            padding: 8px 14px;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s;
            font-family: inherit;
        }
        .chat-option-btn:hover { background: #d4af37; color: #09090f; }
        .chat-typing {
            display: inline-flex; gap: 4px; padding: 10px 14px;
            background: rgba(255,255,255,0.08); border-radius: 12px;
            align-self: flex-start; margin-bottom: 8px;
        }
        .chat-typing span {
            width: 7px; height: 7px; border-radius: 50%; background: #d4af37;
            animation: chatTypingBlink 1.2s infinite ease-in-out;
        }
        .chat-typing span:nth-child(2) { animation-delay: 0.2s; }
        .chat-typing span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes chatTypingBlink {
            0%, 60%, 100% { opacity: 0.25; transform: translateY(0); }
            30% { opacity: 1; transform: translateY(-3px); }
        }
    `;
    document.head.appendChild(style);

    // ---- State ----
    let step = 'menu'; // menu | needs | job | email | day | time | done
    const userData = { needs: '', job: '', service: '', email: '', day: '', time: '' };

    // ---- Helpers ----
    function playNotificationSound() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.frequency.value = 1000; osc.type = 'sine';
            gain.gain.setValueAtTime(0.5, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
            osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.5);
        } catch (e) {}
    }

    function scrollDown() { chatMessages.scrollTop = chatMessages.scrollHeight; }

    function addUserMessage(text) {
        const div = document.createElement('div');
        div.className = 'chat-message user';
        div.textContent = text;
        chatMessages.appendChild(div);
        scrollDown();
    }

    function removeOptions() {
        chatMessages.querySelectorAll('.chat-options').forEach(el => el.remove());
    }

    // Bot message with typing indicator first
    function addBotMessage(text, options, delay) {
        const typing = document.createElement('div');
        typing.className = 'chat-typing';
        typing.innerHTML = '<span></span><span></span><span></span>';
        chatMessages.appendChild(typing);
        scrollDown();

        setTimeout(() => {
            typing.remove();
            const div = document.createElement('div');
            div.className = 'chat-message bot';
            div.textContent = text;
            chatMessages.appendChild(div);
            if (options && options.length) {
                const wrap = document.createElement('div');
                wrap.className = 'chat-options';
                options.forEach(opt => {
                    const btn = document.createElement('button');
                    btn.className = 'chat-option-btn';
                    btn.textContent = opt.label;
                    btn.addEventListener('click', () => {
                        removeOptions();
                        addUserMessage(opt.label);
                        opt.action();
                    });
                    wrap.appendChild(btn);
                });
                chatMessages.appendChild(wrap);
            }
            scrollDown();
        }, delay || 700);
    }

    // ---- Menus ----
    function mainMenuOptions() {
        return [
            { label: '🌐 Web Development', action: () => startLead('Web Development') },
            { label: '🤖 AI Chatbots', action: () => startLead('AI Chatbots') },
            { label: '🔧 Network Solutions', action: () => startLead('Network Solutions') },
            { label: '📅 Book a Call', action: () => startLead('Book a Call') },
            { label: '💰 Pricing / Get a Quote', action: () => startLead('Pricing / Quote request') },
            { label: '❓ FAQ', action: showFaq },
            { label: '👤 Talk to a Human', action: talkToHuman }
        ];
    }

    function showMenu(text) {
        step = 'menu';
        addBotMessage(text || 'What would you like help with today?', mainMenuOptions());
    }

    // ---- FAQ ----
    const faqs = [
        { q: '⏱️ How long does a website take?', a: 'A typical website takes 2–4 weeks depending on size and features. Larger projects with custom functionality can take 6–8 weeks. We always give you a clear timeline before we start.' },
        { q: '💵 How much does a project cost?', a: 'Every project is different, so pricing depends on your needs. Share your email with us and we will send you a free, no-obligation quote within 24 hours.' },
        { q: '🤖 What can an AI chatbot do for my business?', a: 'An AI chatbot can answer customer questions 24/7, collect leads while you sleep, book appointments, and reduce support workload — just like this one is doing right now!' },
        { q: '🛠️ Do you offer support after launch?', a: 'Yes! We offer ongoing maintenance and support packages so your website or chatbot stays fast, secure, and up to date.' }
    ];

    function showFaq() {
        step = 'menu';
        const opts = faqs.map(f => ({
            label: f.q,
            action: () => {
                addBotMessage(f.a);
                setTimeout(() => addBotMessage('Anything else I can help you with?', faqOptions()), 1600);
            }
        }));
        opts.push({ label: '⬅️ Back to menu', action: () => showMenu() });
        addBotMessage('Great! Here are some common questions — pick one:', opts);
    }

    function faqOptions() {
        return [
            { label: '❓ More questions', action: showFaq },
            { label: '📅 Book a Call', action: () => startLead('Book a Call') },
            { label: '👤 Talk to a Human', action: talkToHuman },
            { label: '⬅️ Back to menu', action: () => showMenu() }
        ];
    }

    // ---- Lead flow ----
    function startLead(service) {
        userData.service = service;
        step = 'needs';
        addBotMessage('Great choice! Tell me a little about what you need — a few words is fine.');
    }

    function talkToHuman() {
        userData.service = 'Talk to a Human';
        userData.needs = 'Requested to speak with a person';
        userData.job = '-';
        step = 'email';
        addBotMessage("No problem! I'll have someone from our team contact you personally. What's your email address?");
    }

    function askDay() {
        step = 'day';
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        addBotMessage('Which day works best for us to contact you?', days.map(d => ({
            label: d,
            action: () => { userData.day = d; askTime(); }
        })));
    }

    function askTime() {
        step = 'time';
        const slots = ['12:00 – 2:00 PM', '2:00 – 4:00 PM', '4:00 – 6:00 PM'];
        addBotMessage('And what time in the afternoon suits you?', slots.map(s => ({
            label: s,
            action: () => { userData.time = s; finishLead(); }
        })));
    }

    function finishLead() {
        step = 'done';
        const emails = JSON.parse(sessionStorage.getItem('eufotech_chatbot_emails') || '[]');
        emails.push(userData.email.toLowerCase());
        sessionStorage.setItem('eufotech_chatbot_emails', JSON.stringify(emails));
        sessionStorage.setItem('eufotech_chatbot_submitted', 'true');
        sendEmail();
        addBotMessage(`✅ Perfect! We'll contact you on ${userData.day} between ${userData.time}. Thank you for reaching out to Eufo Tech!`);
        setTimeout(() => addBotMessage('Is there anything else I can help you with while you\'re here?', faqOptions()), 1800);
    }

    function sendEmail() {
        const form = document.createElement('form');
        form.action = 'https://formsubmit.co/' + 'admin@eufotech.ca';
        form.method = 'POST';
        form.style.display = 'none';
        const fields = {
            '_subject': 'New Contact from Eufo Tech Chatbot',
            '_template': 'box',
            '_captcha': 'false',
            'What_they_need': userData.needs,
            'Job_Position': userData.job,
            'Service_interested': userData.service,
            'Email': userData.email,
            'Preferred_day': userData.day,
            'Preferred_time': userData.time
        };
        for (const key in fields) {
            const input = document.createElement('input');
            input.type = 'hidden'; input.name = key; input.value = fields[key];
            form.appendChild(input);
        }
        document.body.appendChild(form);
        try {
            const iframe = document.createElement('iframe');
            iframe.name = 'chatbot_submit_frame';
            iframe.style.display = 'none';
            document.body.appendChild(iframe);
            form.target = 'chatbot_submit_frame';
        } catch (e) {}
        form.submit();
        console.log('Chatbot submission:', userData);
    }

    // ---- Small talk ----
    function smallTalk(input) {
        const t = input.toLowerCase().trim();
        if (/how('?s| is| was)? (your|ur) day/.test(t) || /how are (you|u)/.test(t)) {
            addBotMessage("It's great, thank you for asking! 😊 I hope your day is going well too. How can I help you?", step === 'menu' ? mainMenuOptions() : null);
            return true;
        }
        if (/^(hi|hii+|hello|hey|heya|good (morning|afternoon|evening)|salam|salut)[!. ]*$/.test(t)) {
            addBotMessage('Hi! 👋 Welcome to Eufo Tech. How can I help you today?', step === 'menu' ? mainMenuOptions() : null);
            return true;
        }
        if (/^(thanks|thank you|thx|ty)[!. ]*$/.test(t)) {
            addBotMessage("You're very welcome! 😊 Anything else I can help with?", step === 'menu' ? mainMenuOptions() : null);
            return true;
        }
        if (/^(bye|goodbye|see you|good night)[!. ]*$/.test(t)) {
            addBotMessage('Goodbye! 👋 Thanks for visiting Eufo Tech — come back any time!');
            return true;
        }
        return false;
    }

    // Keyword routing when the user types freely at the menu
    function routeFreeText(input) {
        const t = input.toLowerCase();
        if (/(price|pricing|cost|quote|how much)/.test(t)) return startLead('Pricing / Quote request');
        if (/(web|website|site|landing)/.test(t)) return startLead('Web Development');
        if (/(chatbot|chat bot|ai|bot|automation)/.test(t)) return startLead('AI Chatbots');
        if (/(network|wifi|server|infrastructure|it support)/.test(t)) return startLead('Network Solutions');
        if (/(human|person|agent|someone|real people)/.test(t)) return talkToHuman();
        if (/(book|call|meeting|appointment|schedule)/.test(t)) return startLead('Book a Call');
        if (/(faq|question)/.test(t)) return showFaq();
        // Fallback: treat as a description of their needs
        userData.needs = input;
        userData.service = 'General inquiry';
        step = 'job';
        addBotMessage("Thanks for sharing! And what is your job or position?");
    }

    // ---- Input handling ----
    function handleUserInput(raw) {
        const input = raw.trim();
        if (!input) return;
        addUserMessage(input);
        chatInput.value = '';
        removeOptions();

        setTimeout(() => {
            if (smallTalk(input)) return;

            switch (step) {
                case 'menu':
                    routeFreeText(input);
                    break;
                case 'needs':
                    userData.needs = input;
                    step = 'job';
                    addBotMessage('Thanks! And what is your job or position?');
                    break;
                case 'job':
                    userData.job = input;
                    step = 'email';
                    addBotMessage("Perfect! What's your email address so we can get back to you?");
                    break;
                case 'email': {
                    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input)) {
                        addBotMessage("Hmm, that doesn't look like a valid email address. Could you double-check it? (example: name@company.com)");
                        return;
                    }
                    const submitted = JSON.parse(sessionStorage.getItem('eufotech_chatbot_emails') || '[]');
                    if (submitted.includes(input.toLowerCase())) {
                        addBotMessage('This email has already been submitted in this session. Please use a different email address.');
                        return;
                    }
                    userData.email = input;
                    askDay();
                    break;
                }
                case 'day':
                    userData.day = input;
                    askTime();
                    break;
                case 'time':
                    userData.time = input;
                    finishLead();
                    break;
                case 'done':
                    showMenu('I can help with that — what would you like to do?');
                    break;
            }
        }, 400);
    }

    // ---- Wiring ----
    chatbot.classList.add('hidden');
    setTimeout(() => {
        chatbotToggle.style.display = 'flex';
        playNotificationSound();
    }, 1000);

    chatSend.addEventListener('click', () => handleUserInput(chatInput.value));
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleUserInput(chatInput.value);
    });

    closeChatbot.addEventListener('click', () => {
        chatbot.classList.add('hidden');
        chatbotToggle.style.display = 'flex';
    });

    chatbotToggle.addEventListener('click', () => {
        chatbot.classList.remove('hidden');
        chatbotToggle.style.display = 'none';
        if (chatMessages.children.length === 0) {
            setTimeout(() => {
                addBotMessage("Hello! 👋 Welcome to Eufo Tech — we're happy to have you here. How can I help you today?", mainMenuOptions(), 500);
            }, 300);
        }
    });
})();
