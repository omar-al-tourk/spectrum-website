/* =====================================================================
   Spectrum — Copper Noir Motion Engine (v2 — FINAL)
   Chatbot logic preserved. Typing indicator, scroll reveal (no nesting),
   scrollspy, tilt/glow engine (rAF), ripple, progress fallback.
   No dependencies. No external services. No eval/innerHTML.
   ===================================================================== */
(function () {
    'use strict';

    if (window.__spectrumLoaded) { return; }
    window.__spectrumLoaded = true;

    var docEl = document.documentElement;
    docEl.classList.add('js'); // احتياط إن لم تُضف سكربتة <head>

    /* ---------------------------- Capability flags ------------------- */
    try {
        if (window.CSS && CSS.supports && CSS.supports('animation-timeline: scroll()')) {
            docEl.classList.add('sp-has-sda');
        }
    } catch (e) { /* noop */ }
    if (typeof CSS !== 'undefined' && typeof CSS.registerProperty === 'function') {
        docEl.classList.add('sp-has-prop');
    }

    var REDUCE = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    var FINE = window.matchMedia ? window.matchMedia('(hover: hover) and (pointer: fine)') : null;

    function reduced() {
        return !!(REDUCE && REDUCE.matches) || docEl.classList.contains('reduce-motion');
    }
    function fineHover() { return !!(FINE && FINE.matches); }

    function safe(fn) {
        try { fn(); } catch (err) {
            if (window.console && console.error) { console.error('Spectrum motion init:', err); }
        }
    }

    /* ------------- Verified destinations (must match page links) ----- */
    var FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSd6L0Btgj6Rh7jPitsEJ1iTJYNIvyrq9jT4SRJPgyMKLpugyA/viewform';
    var IG_URL = 'https://www.instagram.com/spc.bau/';

    var T = {
        ar: {
            senderAssistant: 'مساعد Spectrum',
            senderUser: 'أنت',
            typing: 'المساعد يكتب…',
            empty: 'اكتب سؤالك أول، وبعدها اضغط زر الإرسال.',
            fallback: [
                'معليش، ما لقيت إجابة موثوقة على سؤالك. جرّب أحد الأسئلة المقترحة، أو تصفّح قسم الأسئلة الشائعة في الصفحة، أو تابع الفريق عبر حسابهم الرسمي على ',
                { href: IG_URL, label: 'إنستغرام' },
                '.'
            ]
        },
        en: {
            senderAssistant: 'Spectrum Assistant',
            senderUser: 'You',
            typing: 'Assistant is typing…',
            empty: 'Type your question first, then press send.',
            fallback: [
                "Sorry, I couldn't find a verified answer to your question. Try one of the suggested questions, browse the FAQ section on this page, or follow the team through their official ",
                { href: IG_URL, label: 'Instagram' },
                ' account.'
            ]
        }
    };

    /* ---------------- FAQ knowledge base (verified content only) ----- */
    var KB = [
        {
            id: 'greeting',
            ar: {
                q: ['أهلًا', 'مرحبا', 'السلام عليكم', 'هاي'],
                k: ['اهلا', 'مرحبا', 'هلا', 'سلام', 'هاي', 'صباح الخير', 'مسا الخير'],
                a: [
                    'أهلًا وسهلًا! 👋 أنا مساعد Spectrum. بقدر أساعدك تعرف أكثر عن الفريق، وشروط الانضمام، والتسجيل، وأهدافنا، وكيف تتابع أخبارنا.'
                ]
            },
            en: {
                q: ['Hello', 'Hi', 'Hey'],
                k: ['hello', 'hi', 'hey', 'good morning', 'good evening'],
                a: [
                    "Hello! 👋 I'm the Spectrum assistant. I can help you learn about the team, membership, eligibility, registration, our goals, and where to follow our updates."
                ]
            }
        },
        {
            id: 'about',
            ar: {
                q: ['شو هو فريق Spectrum؟', 'مين إحنا؟', 'احكي لي عن الفريق'],
                k: ['مين احنا', 'عن الفريق', 'تعريف', 'شو هو', 'فريق'],
                a: [
                    'إحنا Spectrum، فريق طلابي في جامعة البلقاء التطبيقية. بنؤمن إن كل طالب عنده مواهب وأفكار بتستحق إنها تظهر، وإن اختلافاتنا هي مصدر قوتنا وتميّزنا.',
                    { href: '#about', label: 'اقرأ أكثر عنّا' }
                ]
            },
            en: {
                q: ['What is Spectrum?', 'Who are you?', 'Tell me about the team'],
                k: ['what is', 'who are', 'about', 'tell me', 'team'],
                a: [
                    'We are Spectrum, a student team at Al-Balqa Applied University. We believe every student has talents and ideas worth sharing, and that our differences are our strength.',
                    { href: '#about', label: 'Read the "Who We Are" section' }
                ]
            }
        },
        {
            id: 'join',
            ar: {
                q: ['كيف بقدر أنضم للفريق؟', 'كيف أسجّل؟', 'شو طريقة التسجيل؟'],
                k: ['انضم', 'انضمام', 'تسجيل', 'سجل', 'نموذج', 'تقدم'],
                a: [
                    'إذا حاب تنضم إلنا، عبّي نموذج التسجيل الرسمي من الرابط التالي: ',
                    { href: FORM_URL, label: 'نموذج التسجيل (Google Forms)' },
                    '. حاليًا، العضوية متاحة لطلاب كلية السلط في جامعة البلقاء التطبيقية فقط، والانضمام مجاني بالكامل.'
                ]
            },
            en: {
                q: ['How can I join the team?', 'How do I register?'],
                k: ['join', 'register', 'registration', 'sign up', 'apply', 'form'],
                a: [
                    'If you would like to join us, fill out the official registration form here: ',
                    { href: FORM_URL, label: 'Registration form (Google Forms)' },
                    '. Membership is currently available only to students of Al-Salt College at Al-Balqa Applied University, and joining is completely free.'
                ]
            }
        },
        {
            id: 'eligible',
            ar: {
                q: ['مين بقدر ينضم للفريق؟', 'هل التسجيل متاح لكل الطلاب؟', 'شو شروط العضوية؟'],
                k: ['شروط', 'كلية السلط', 'متاح لمن', 'من يحق', 'مين بقدر', 'الطلاب'],
                a: [
                    'حاليًا، الانضمام متاح لطلاب كلية السلط في جامعة البلقاء التطبيقية فقط. وبنعلن عن فتح باب العضوية وأي تحديثات من خلال قنوات Spectrum الرسمية.',
                    { href: FORM_URL, label: 'نموذج التسجيل' }
                ]
            },
            en: {
                q: ['Who can join?', 'Is registration open to all students?', 'What are the membership criteria?'],
                k: ['who can', 'eligible', 'eligibility', 'criteria', 'requirements', 'salt college', 'open to'],
                a: [
                    "Membership is currently available only to students of Al-Salt College at Al-Balqa Applied University. Membership openings and updates are announced through the team's official channels.",
                    { href: FORM_URL, label: 'Registration form' }
                ]
            }
        },
        {
            id: 'free',
            ar: {
                q: ['هل العضوية مجانية؟', 'كم رسوم الانضمام؟'],
                k: ['مجاني', 'رسوم', 'سعر', 'فلوس', 'تكلفة', 'ببلاش'],
                a: [
                    'أكيد! 🎉 الانضمام إلى Spectrum مجاني بالكامل، وما في أي رسوم للعضوية.'
                ]
            },
            en: {
                q: ['Is membership free?', 'Are there any fees?'],
                k: ['free', 'fee', 'fees', 'cost', 'price', 'charge', 'pay'],
                a: [
                    'Yes! 🎉 Joining Spectrum is completely free, and there are no membership fees.'
                ]
            }
        },
        {
            id: 'experience',
            ar: {
                q: ['هل لازم تكون عندي خبرة سابقة عشان أنضم؟', 'بقدر أنضم إذا كنت مبتدئ؟'],
                k: ['خبرة', 'مبتدئ'],
                a: [
                    'مش شرط تكون عندك خبرة سابقة. الأهم إنك تكون مستعد تتعلّم، وتطوّر مهاراتك، وتشتغل مع الفريق. سواء عندك خبرة أو لسه بتبدأ، راجع شروط العضوية المعلنة للتأكد من أي متطلبات خاصة بالتقديم.'
                ]
            },
            en: {
                q: ['Do I need previous experience to join?', 'Can I join as a beginner?'],
                k: ['experience', 'beginner', 'skills'],
                a: [
                    'You do not necessarily need previous experience. What matters most is being ready to learn, develop your skills, and work with the team. Whether you have experience or are just starting out, check the announced membership criteria for any specific requirements.'
                ]
            }
        },
        {
            id: 'after',
            ar: {
                q: ['شو بصير بعد ما أقدّم نموذج التسجيل؟', 'شو الخطوات بعد التسجيل؟'],
                k: ['بعد التسجيل', 'بعد ما', 'مقابلة', 'خطوات', 'بعدين'],
                a: [
                    'بعد ما تبعث نموذج التسجيل، رح تمر بمقابلة ضمن إجراءات اختيار الأعضاء. تأكد إن معلوماتك صحيحة، وتابع قنوات Spectrum الرسمية عشان تعرف آخر المستجدات.'
                ]
            },
            en: {
                q: ['What happens after I submit the registration form?', 'What happens after registering?'],
                k: ['after', 'interview', 'next', 'steps', 'submit'],
                a: [
                    "After you submit the registration form, you will go through an interview as part of the member selection process. Make sure your information is correct, and follow the team's official channels for updates."
                ]
            }
        },
        {
            id: 'results',
            ar: {
                q: ['متى رح تطلع نتائج القبول؟', 'متى رح يعلنوا عن المقبولين؟'],
                k: ['نتائج', 'قبول', 'متى'],
                a: [
                    'موعد إعلان النتائج بعتمد على الإعلانات الرسمية من إدارة Spectrum. عشان ما يفوتك الإعلان، تابع حسابنا الرسمي على ',
                    { href: IG_URL, label: 'إنستغرام' },
                    '.'
                ]
            },
            en: {
                q: ['When will acceptance results be announced?', 'When will accepted applicants be announced?'],
                k: ['results', 'accepted', 'when', 'announced', 'decision'],
                a: [
                    "The announcement date depends on official information released by Spectrum's management. Follow our official Instagram account so you don't miss the announcement: ",
                    { href: IG_URL, label: 'Instagram' },
                    '.'
                ]
            }
        },
        {
            id: 'teams',
            ar: {
                q: ['كيف أختار الفريق الداخلي المناسب إلي؟', 'كيف بعرف أي فريق بناسبني؟'],
                k: ['فرق', 'فريق داخلي', 'اختار', 'اختيار'],
                a: [
                    'اختار المجال اللي بناسب اهتماماتك والمهارات اللي حاب تطوّرها. وقبل ما تعبّي نموذج التسجيل، تعرّف على الفرق الداخلية المتاحة وشوف أيّها أقرب لاهتماماتك.'
                ]
            },
            en: {
                q: ['How do I choose the right internal team for me?', 'How do I know which team suits me?'],
                k: ['internal', 'choose', 'departments', 'which team'],
                a: [
                    'Choose the area that matches your interests and the skills you want to develop. Before filling in the registration form, review the available internal teams and see which one suits you best.'
                ]
            }
        },
        {
            id: 'instagram',
            ar: {
                q: ['وين بقدر أتابع أخبار Spectrum؟', 'شو حسابكم على إنستغرام؟'],
                k: ['انستغرام', 'حساب', 'تابع', 'اخبار', 'سوشال', 'تواصل'],
                a: [
                    'بتقدر تتابع أخبار الفريق وإعلاناته وآخر تحديثاته من خلال حسابنا الرسمي على ',
                    { href: IG_URL, label: 'إنستغرام' },
                    '.'
                ]
            },
            en: {
                q: ['Where can I follow Spectrum?', "What's your Instagram?"],
                k: ['instagram', 'follow', 'social', 'news', 'updates', 'account'],
                a: [
                    "You can follow the team's news, announcements, and updates through our official ",
                    { href: IG_URL, label: 'Instagram' },
                    ' account.'
                ]
            }
        },
        {
            id: 'contact',
            ar: {
                q: ['كيف بقدر أتواصل مع إدارة الفريق؟', 'كيف أتواصل مع Spectrum؟'],
                k: ['اتصل', 'ايميل', 'رقم', 'ادارة', 'تواصل'],
                a: [
                    'إذا بدك تتواصل مع إدارة الفريق، بتقدر توصل إلنا من خلال قنوات التواصل الرسمية الموجودة على الموقع وحسابنا على ',
                    { href: IG_URL, label: 'إنستغرام' },
                    '.'
                ]
            },
            en: {
                q: ["How can I contact the team's management?", 'How can I contact Spectrum?'],
                k: ['contact', 'reach', 'email', 'phone', 'management'],
                a: [
                    "You can contact the team's management through the official channels listed on the website and our ",
                    { href: IG_URL, label: 'Instagram' },
                    ' account.'
                ]
            }
        },
       
{
    id: 'goals',
    ar: {
        q: ['شو أهداف فريق Spectrum؟', 'شو رؤية الفريق؟'],
        k: ['اهداف', 'هدف', 'رؤية', 'طموح'],
        a: [
            'عنا ستة أهداف أساسية بنشتغل عليها: بناء مجتمع طلابي كبير، والوصول لكليات الجامعة المختلفة، والمشاركة في الفعاليات الجامعية، وتنظيم مبادراتنا الخاصة، وتطوير مهارات الأعضاء، وبناء شراكات مع جهات جامعية.',
            { href: '#goals', label: 'تعرّف على أهدافنا' }
        ]
    },
    en: {
        q: ["What are the team's goals?", "What is the team's vision?"],
        k: ['goals', 'goal', 'vision', 'mission', 'objectives'],
        a: [
            "We have six main goals: building a large student community, reaching different university faculties, participating in university events, launching our own initiatives, developing members' skills, and building university partnerships.",
            { href: '#goals', label: 'See the full goals' }
        ]
    }
}

    ];

    var SUGGESTED = {
        ar: ['about', 'join', 'free', 'eligible', 'after', 'instagram'],
        en: ['about', 'join', 'free', 'eligible', 'after', 'instagram']
    };

    /* --------------- Normalization (matching only — never displayed) -- */
    function normalize(s) {
        return String(s).toLowerCase()
            .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
            .replace(/[أإآٱ]/g, 'ا')
            .replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
            .replace(/ة/g, 'ه').replace(/ى/g, 'ي')
            .replace(/[^\p{L}\p{N}\s]/gu, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function currentLang() {
        return (document.documentElement.lang || 'en').toLowerCase().indexOf('ar') === 0 ? 'ar' : 'en';
    }
    function findEntry(id) {
        for (var i = 0; i < KB.length; i++) { if (KB[i].id === id) { return KB[i]; } }
        return null;
    }
    function findAnswer(text, lang) {
        var q = normalize(text);
        if (!q) { return null; }
        var best = null, bestScore = 0;
        KB.forEach(function (entry) {
            var d = entry[lang];
            if (!d) { return; }
            var score = 0;
            (d.k || []).forEach(function (kw) {
                var nk = normalize(kw);
                if (nk && q.indexOf(nk) !== -1) { score += nk.indexOf(' ') !== -1 ? 3 : 2; }
            });
            (d.q || []).forEach(function (variant) {
                var nv = normalize(variant);
                if (!nv) { return; }
                if (q === nv) { score += 6; }
                else if (q.indexOf(nv) !== -1 || nv.indexOf(q) !== -1) { score += 3; }
            });
            if (score > bestScore) { bestScore = score; best = entry; }
        });
        return bestScore >= 2 ? best : null;
    }

    /* ================================ Chatbot ========================= */
    function initChat() {
        var lang = currentLang();
        var strings = T[lang];
        var form = document.getElementById('chat-form');
        var input = document.getElementById('chat-input');
        var log = document.getElementById('chat-messages');
        var status = document.getElementById('chat-status');
        var chipBox = document.getElementById('suggested-questions');
        if (!form || !input || !log || !status || !chipBox) { return; }
        if (form.dataset.spectrumChat) { return; } // منع تكرار المستمعين
        form.dataset.spectrumChat = '1';

        function scrollLog() {
            requestAnimationFrame(function () {
                try {
                    log.scrollTo({ top: log.scrollHeight, behavior: reduced() ? 'auto' : 'smooth' });
                } catch (e) {
                    log.scrollTop = log.scrollHeight;
                }
            });
        }
        function buildLink(seg) {
            var a = document.createElement('a');
            a.href = seg.href; // ثوابت فقط — لا مدخلات مستخدم
            a.textContent = seg.label || seg.href;
            if (/^https?:/i.test(seg.href)) { a.target = '_blank'; a.rel = 'noopener'; }
            return a;
        }
        function assistantIcon() {
            var src = log.querySelector('.assistant-message .message-icon');
            return src ? src.cloneNode(true) : null;
        }
        function assistantMessage(segments) {
            var art = document.createElement('article');
            art.className = 'chat-message assistant-message';
            var icon = assistantIcon();
            if (icon) { art.appendChild(icon); }
            var content = document.createElement('div');
            content.className = 'message-content';
            var sender = document.createElement('p');
            sender.className = 'message-sender';
            sender.textContent = strings.senderAssistant;
            var body = document.createElement('p');
            body.className = 'message-text';
            segments.forEach(function (seg) {
                if (typeof seg === 'string') { body.appendChild(document.createTextNode(seg)); }
                else if (seg && seg.href) { body.appendChild(buildLink(seg)); }
            });
            content.appendChild(sender);
            content.appendChild(body);
            art.appendChild(content);
            return art;
        }
        function userMessage(text) {
            var art = document.createElement('article');
            art.className = 'chat-message user-message';
            var content = document.createElement('div');
            content.className = 'message-content';
            var sender = document.createElement('p');
            sender.className = 'message-sender';
            sender.textContent = strings.senderUser;
            var body = document.createElement('p');
            body.className = 'message-text';
            body.textContent = text; // آمن: textContent فقط
            content.appendChild(sender);
            content.appendChild(body);
            art.appendChild(content);
            return art;
        }
        function typingMessage() {
            var art = document.createElement('article');
            art.className = 'chat-message assistant-message sp-typing';
            var icon = assistantIcon();
            if (icon) { art.appendChild(icon); }
            var content = document.createElement('div');
            content.className = 'message-content';
            var dots = document.createElement('span');
            dots.className = 'sp-typing-dots';
            dots.setAttribute('aria-hidden', 'true');
            for (var i = 0; i < 3; i++) { dots.appendChild(document.createElement('span')); }
            var sr = document.createElement('span');
            sr.className = 'sp-sr-only';
            sr.textContent = strings.typing;
            content.appendChild(dots);
            content.appendChild(sr);
            art.appendChild(content);
            return art;
        }
        function setStatus(msg) { status.textContent = msg; input.setAttribute('aria-invalid', 'true'); }
        function clearStatus() { status.textContent = ''; input.removeAttribute('aria-invalid'); }
        function removeTyping() {
            var t = log.querySelector('.sp-typing');
            if (t) { t.remove(); }
        }

        function submit() {
            var text = input.value.trim();
            if (!text) { setStatus(strings.empty); input.focus(); return; }
            clearStatus();
            log.appendChild(userMessage(text));
            input.value = '';
            var entry = findAnswer(text, lang);

            // الرد محلي وفوري؛ التأخير القصير عرض تقديمي مطلوب صراحة
            // ويُلغى كليًا مع تفضيل تقليل الحركة.
            if (reduced()) {
                log.appendChild(assistantMessage(entry ? entry[lang].a : strings.fallback));
                scrollLog();
                return;
            }
            removeTyping();
            log.appendChild(typingMessage());
            scrollLog();
            setTimeout(function () {
                removeTyping();
                log.appendChild(assistantMessage(entry ? entry[lang].a : strings.fallback));
                scrollLog();
            }, 600);
        }

        form.addEventListener('submit', function (e) { e.preventDefault(); submit(); });
        input.addEventListener('input', clearStatus);
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && e.isComposing) { e.preventDefault(); } // حماية IME
        });

        SUGGESTED[lang].forEach(function (id) {
            var entry = findEntry(id);
            var d = entry && entry[lang];
            if (!d || !d.q || !d.q.length) { return; }
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = d.q[0];
            btn.addEventListener('click', function () { input.value = d.q[0]; submit(); });
            chipBox.appendChild(btn);
        });
    }

    /* ===================== Scroll Reveal (IO, once-only, no nesting) == */
    function initReveals() {
        if (reduced() || !('IntersectionObserver' in window)) { return; }
        // خطة بلا تداخل أب/ابن: أقسام بسيطة تُكشف كاملة، والأقسام المجمّعة
        // يُكشف أبناؤها فقط بستاغر — لا حركة مضاعفة.
        var plan = [
            { sel: '#about, #vision, #join', anim: 'up' },
            { sel: '#goals ol > li', anim: 'up', group: true },
            { sel: '.component-grid > *', anim: 'up', group: true },
            { sel: '#assistant > *', anim: 'up', group: true },
            { sel: '#faq details', anim: 'up', group: true },
            { sel: 'footer > section, footer > nav, footer > p', anim: 'up', group: true }
        ];
        var els = [];
        plan.forEach(function (p) {
            var nodes = document.querySelectorAll(p.sel);
            Array.prototype.forEach.call(nodes, function (el, i) {
                if (el.hasAttribute('data-reveal')) { els.push(el); return; }
                el.setAttribute('data-reveal', p.anim);
                if (p.group) { el.style.setProperty('--sp-stagger', String(Math.min(i, 8))); }
                els.push(el);
            });
        });
        if (!els.length) { return; }
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (en.isIntersecting) {
                    en.target.classList.add('is-revealed');
                    io.unobserve(en.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
        els.forEach(function (el) { io.observe(el); });
    }

    /* ===================== Scrollspy (Active Link Indicator) ========== */
    function initSpy() {
        var links = Array.prototype.slice.call(document.querySelectorAll('nav a[href^="#"]'))
            .filter(function (a) {
                return a.hash && document.getElementById(a.hash.slice(1)) !== null;
            });
        if (!links.length || !('IntersectionObserver' in window)) { return; }
        var map = {};
        var sections = [];
        links.forEach(function (a) {
            var id = a.hash.slice(1);
            (map[id] = map[id] || []).push(a);
            if (sections.indexOf(document.getElementById(id)) === -1) {
                sections.push(document.getElementById(id));
            }
        });
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (en.isIntersecting) {
                    links.forEach(function (l) { l.classList.remove('sp-active'); });
                    (map[en.target.id] || []).forEach(function (l) { l.classList.add('sp-active'); });
                }
            });
        }, { rootMargin: '-40% 0px -55% 0px' });
        sections.forEach(function (s) { io.observe(s); });
    }

    /* ============== Scroll FX: header shadow + progress fallback ====== */
    function initScrollFX() {
        var bar = document.querySelector('.sp-progress');
        var ticking = false;
        function update() {
            var y = window.scrollY || window.pageYOffset || 0;
            docEl.classList.toggle('sp-scrolled', y > 10);
            if (bar && !docEl.classList.contains('sp-has-sda')) {
                var h = docEl.scrollHeight - window.innerHeight;
                var p = h > 0 ? Math.min(1, y / h) : 0;
                bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
            }
            ticking = false;
        }
        window.addEventListener('scroll', function () {
            if (ticking) { return; }
            ticking = true;
            requestAnimationFrame(update);
        }, { passive: true });
        update();
    }

    /* ===================== Ripple (delegated, respects reduce) ======== */
    function initRipple() {
        if (reduced()) { return; }
        document.addEventListener('pointerdown', function (e) {
            if (reduced()) { return; } // حماية إذا فُعّل الوضع بعد التحميل
            var btn = e.target.closest('.spectrum-fold-card__toggle, #chat-send, .suggested-questions button');
            if (!btn) { return; }
            var r = btn.getBoundingClientRect();
            var d = Math.max(r.width, r.height) * 1.1;
            var s = document.createElement('span');
            s.className = 'sp-ripple';
            s.style.width = s.style.height = d + 'px';
            s.style.left = (e.clientX - r.left - d / 2) + 'px';
            s.style.top = (e.clientY - r.top - d / 2) + 'px';
            btn.appendChild(s);
            s.addEventListener('animationend', function () { s.remove(); });
        });
    }

    /* ================ Tilt + pointer-light engine (rAF, mouse only) ====
       يملك transform العنصر المستهدف بالكامل أثناء التفاعل، ويمسحه عند
       الاستقرار ليتسلم CSS من جديد. لا يكتب على __inner إطلاقًا. */
    function initTilt() {
        if (!fineHover() || reduced()) { return; }
        var targets = document.querySelectorAll('[data-tilt]');
        if (!targets.length) { return; }

        Array.prototype.forEach.call(targets, function (el) {
            if (el.dataset.spTilt) { return; }
            el.dataset.spTilt = '1';
            var MAX = parseFloat(el.dataset.tiltMax || '5') || 5;
            var isLift = el.classList.contains('spectrum-border-card');
            var tx = 0, ty = 0, cx = 0, cy = 0, lift = 0, cl = 0;
            var raf = 0, active = false;

            function frame() {
                cx += (tx - cx) * 0.14;
                cy += (ty - cy) * 0.14;
                cl += (lift - cl) * 0.14;
                var settled = Math.abs(cx) < 0.02 && Math.abs(cy) < 0.02 &&
                    Math.abs(cl) < 0.02 && !active;
                if (settled) {
                    el.style.transform = '';
                    raf = 0;
                    return;
                }
                el.style.transform = 'translate3d(0,' + cl.toFixed(2) + 'px,0) rotateX(' +
                    cy.toFixed(2) + 'deg) rotateY(' + cx.toFixed(2) + 'deg)';
                raf = requestAnimationFrame(frame);
            }
            function kick() { if (!raf) { raf = requestAnimationFrame(frame); } }

            el.addEventListener('pointerenter', function (e) {
                if (e.pointerType !== 'mouse') { return; }
                // لا تسرق الـ transform أثناء دخول Scroll Reveal
                if (el.hasAttribute('data-reveal') && !el.classList.contains('is-revealed')) { return; }
                active = true;
                lift = isLift ? 5 : 0;
                kick();
            });
            el.addEventListener('pointermove', function (e) {
                if (e.pointerType !== 'mouse') { return; }
                var r = el.getBoundingClientRect();
                var px = (e.clientX - r.left) / r.width;
                var py = (e.clientY - r.top) / r.height;
                ty = (px - 0.5) * -2 * MAX;
                tx = (py - 0.5) * 2 * MAX;
                el.style.setProperty('--sp-mx', (px * 100).toFixed(1) + '%');
                el.style.setProperty('--sp-my', (py * 100).toFixed(1) + '%');
                kick();
            });
            el.addEventListener('pointerleave', function () {
                active = false;
                tx = 0; ty = 0; lift = 0;
                kick();
            });
        });

        docEl.classList.add('sp-tilt'); // يوقف قاعدة Hover Lift في CSS لتفادي التنازع
    }

    /* ===================== Component A logic (محفوظ) ================== */
    function initFoldCard(card) {
        if (!card || card.dataset.spectrumFold) { return; }
        card.dataset.spectrumFold = '1';
        var back = card.querySelector('.spectrum-fold-card__face--back');
        var toggles = card.querySelectorAll('[data-fold-toggle]');
        var frontToggle = card.querySelector('.spectrum-fold-card__face--front [data-fold-toggle]');
        var open = false;

        function setState(state) {
            open = state;
            card.classList.toggle('is-open', open);
            Array.prototype.forEach.call(toggles, function (b) {
                b.setAttribute('aria-expanded', String(open));
            });
            if (back) {
                if ('inert' in back) { back.inert = !open; }
                back.setAttribute('aria-hidden', String(!open));
                Array.prototype.forEach.call(back.querySelectorAll('a, button'), function (el) {
                    el.tabIndex = open ? 0 : -1;
                });
                if (!open && back.contains(document.activeElement) && frontToggle) {
                    frontToggle.focus();
                }
            }
        }
        card.addEventListener('click', function (e) {
            if (e.target.closest('[data-fold-toggle]')) { setState(!open); return; }
            if (!open && e.target.closest('.spectrum-fold-card__face--front')) { setState(true); }
        });
        setState(false);
    }

    /* ===================== Component C logic (محفوظ) ================== */
    function initMotionToggle(input) {
        if (!input || input.dataset.spectrumToggle) { return; }
        input.dataset.spectrumToggle = '1';
        input.checked = docEl.classList.contains('reduce-motion') || !!(REDUCE && REDUCE.matches);
        input.addEventListener('change', function () {
            docEl.classList.toggle('reduce-motion', input.checked);
        });
    }

    /* ================================ Boot ============================ */
    safe(initChat);
    safe(initReveals);
    safe(initSpy);
    safe(initScrollFX);
    safe(initRipple);
    safe(function () {
        initTilt();
        Array.prototype.forEach.call(document.querySelectorAll('[data-fold]'), initFoldCard);
        var toggle = document.getElementById('motion-toggle');
        if (toggle) { initMotionToggle(toggle); }
    });
})();


/* ==========================================
   SPECTRUM MOTION OBSERVER
   ========================================== */

document.documentElement.classList.add("motion-enabled");

const motionSelectors = [
    "#hero h1",
    "#hero p",
    "#hero a",
    "main h2",
    "main h3",
    "main section p",
    "main section li",
    "main section img",
    "main section svg",
    ".spectrum-fold-card",
    ".spectrum-border-card",
    ".spectrum-toggle",
    "#faq details",
    "#assistant button",
    "footer"
];

const motionElements = [
    ...new Set(
        document.querySelectorAll(motionSelectors.join(","))
    )
];

const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
).matches;

motionElements.forEach((element, index) => {
    element.classList.add("motion-item");

    // Gentle stagger, capped to keep the page responsive
    element.style.setProperty(
        "--motion-delay",
        `${Math.min(index % 5, 4) * 80}ms`
    );

    // Give images their own reveal effect
    if (element.matches("img")) {
        element.classList.add("motion-zoom");
    }

    // Mark suitable SVGs for entrance effects
    if (element.matches("svg")) {
        element.classList.add("motion-zoom");
    }

    // Alternate the direction of selected content
    if (element.matches("main section p")) {
        if (index % 3 === 0) {
            element.classList.add("motion-left");
        }
    }
});

if (reducedMotion || !("IntersectionObserver" in window)) {
    motionElements.forEach((element) => {
        element.classList.add("is-visible");
    });
} else {
    const motionObserver = new IntersectionObserver(
        (entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    observer.unobserve(entry.target);
                }
            });
        },
        {
            threshold: 0.12,
            rootMargin: "0px 0px -35px 0px"
        }
    );

    motionElements.forEach((element) => {
        motionObserver.observe(element);
    });
}

/* =========================================
   SPECTRUM MAGIC NAVIGATION JS
   ========================================= */

(() => {
    const nav = document.querySelector("header nav ul");

    if (!nav || nav.dataset.magicReady === "true") return;
    nav.dataset.magicReady = "true";

    const links = [...nav.querySelectorAll("a[href]")];
    if (!links.length) return;

    const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    // Create the moving highlight
    const indicator = document.createElement("span");
    indicator.className = "magic-indicator";
    indicator.setAttribute("aria-hidden", "true");
    nav.prepend(indicator);

    let activeLink =
        links.find(link => link.getAttribute("aria-current") === "page") ||
        links.find(link => {
            const href = link.getAttribute("href");
            return href && href.startsWith("#") &&
                href === window.location.hash;
        }) ||
        links[0];

    function moveIndicator(link, immediate = false) {
        if (!link || !nav.contains(link)) return;

        const navRect = nav.getBoundingClientRect();
        const linkRect = link.getBoundingClientRect();

        if (!navRect.width || !linkRect.width) return;

        if (immediate || reduceMotion) {
            indicator.style.transition = "none";
        } else {
            indicator.style.removeProperty("transition");
        }

        indicator.style.left = `${linkRect.left - navRect.left + nav.scrollLeft}px`;
        indicator.style.top = `${linkRect.top - navRect.top + nav.scrollTop}px`;
        indicator.style.width = `${linkRect.width}px`;
        indicator.style.height = `${linkRect.height}px`;

        indicator.classList.add("is-ready");

        if (immediate || reduceMotion) {
            requestAnimationFrame(() => {
                indicator.style.removeProperty("transition");
            });
        }
    }

    function setActive(link) {
        if (!link) return;

        activeLink = link;

        links.forEach(item => {
            const selected = item === link;
            item.classList.toggle("is-magic-active", selected);

            if (selected) {
                item.setAttribute("aria-current", "location");
            } else if (item.getAttribute("aria-current") === "location") {
                item.removeAttribute("aria-current");
            }
        });

        moveIndicator(link);
    }

    links.forEach(link => {
        link.addEventListener("pointerenter", () => {
            if (matchMedia("(hover: hover)").matches) {
                moveIndicator(link);
            }
        });

        link.addEventListener("focus", () => moveIndicator(link));

        link.addEventListener("click", event => {
            setActive(link);

            if (reduceMotion || event.button !== 0 || event.metaKey ||
                event.ctrlKey || event.shiftKey || event.altKey) return;

            const rect = link.getBoundingClientRect();
            const ripple = document.createElement("span");

            ripple.className = "magic-ripple";
            ripple.setAttribute("aria-hidden", "true");
            ripple.style.left = `${event.clientX - rect.left}px`;
            ripple.style.top = `${event.clientY - rect.top}px`;

            link.appendChild(ripple);
            ripple.addEventListener("animationend", () => ripple.remove(), {
                once: true
            });
        });
    });

    nav.addEventListener("pointerleave", () => {
        moveIndicator(activeLink);
    });

    window.addEventListener("resize", () => {
        moveIndicator(activeLink, true);
    });

    window.addEventListener("load", () => {
        moveIndicator(activeLink, true);
    });

    // Update active navigation item while scrolling sections
    const sectionLinks = links
        .map(link => {
            const href = link.getAttribute("href");
            if (!href || !href.startsWith("#")) return null;

            const section = document.getElementById(href.slice(1));
            return section ? { link, section } : null;
        })
        .filter(Boolean);

    if ("IntersectionObserver" in window && sectionLinks.length) {
        const sectionObserver = new IntersectionObserver(entries => {
            const visible = entries
                .filter(entry => entry.isIntersecting)
                .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

            if (!visible) return;

            const match = sectionLinks.find(
                item => item.section === visible.target
            );

            if (match) setActive(match.link);
        }, {
            threshold: [0.15, 0.35, 0.6],
            rootMargin: "-15% 0px -45% 0px"
        });

        sectionLinks.forEach(item => sectionObserver.observe(item.section));
    }

    setActive(activeLink);
    requestAnimationFrame(() => moveIndicator(activeLink, true));
})();
