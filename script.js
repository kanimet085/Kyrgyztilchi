"use strict";

/* =====================================================================
   script.js — логика теста ЖРТ (кыргыз тили)
   Данные (вопросы, ответы, минуты) лежат в questions.js

   Правила:
   • Разделы идут строго по порядку: Аналогиялар → Окуу жана түшүнүү → Грамматика
   • У каждого раздела свой таймер; он запускается кнопкой, а не сам
   • Внутри раздела можно свободно ходить по вопросам
   • Время вышло (или раздел завершён) → раздел закрыт, назад нельзя
   • Состояние хранится в localStorage: обновление страницы не сбрасывает время
   ===================================================================== */

/* ---------- Настройки ---------- */
const TEACHER_PHONE = "996502601999";       // международный формат, без плюса
const STORAGE_KEY = "kyrgyztilchi_test_v1";
const ALLOW_EARLY_FINISH = true;            // можно ли завершить раздел раньше времени
const WARNING_SECONDS = 5 * 60;             // жёлтый таймер
const DANGER_SECONDS = 60;                  // красный таймер


/* ---------- Элементы страницы ---------- */
const $ = (id) => document.getElementById(id);

const el = {
    progress: document.querySelector(".test-progress"),
    currentNum: $("current-num"),
    totalNum: $("total-num"),

    start: $("test-start"),
    startInfo: $("test-start-info"),
    startBtn: $("start-btn"),

    body: $("test-body"),
    bar: $("test-bar"),
    sectionName: $("section-name"),
    timer: $("test-timer"),
    image: $("test-image-container"),
    passage: $("test-passage"),
    question: $("test-question"),
    options: $("test-options"),
    prev: $("prev-btn"),
    next: $("next-btn"),
    nav: $("test-nav"),
    finishSection: $("finish-section-btn"),

    brk: $("test-break"),
    breakTitle: $("break-title"),
    breakText: $("break-text"),
    breakNext: $("break-next"),
    breakBtn: $("break-btn"),

    result: $("test-result"),
    resultScore: $("result-score"),
    resultDetails: $("result-details"),
    whatsapp: $("whatsapp-btn"),
    restart: $("restart-btn")
};


/* ---------- Состояние ---------- */
/*
   phase: "intro" | "section" | "break" | "result"
   section / question — индексы текущего раздела и вопроса
   deadline — время окончания текущего раздела (мс, Date.now())
   answers[раздел][вопрос] — выбранный индекс ответа или null
*/
let state = null;
let timerId = null;

// «Отпечаток» теста: если поменяешь вопросы/ответы/время, старое сохранение сбросится
function signature() {
    return TEST_SECTIONS
        .map((s) => `${s.id}:${s.minutes}:${s.questions.map((q) => q.correctAnswer).join("")}`)
        .join("|");
}

function newState() {
    return {
        sig: signature(),
        phase: "intro",
        section: 0,
        question: 0,
        deadline: null,
        breakReason: null,
        answers: TEST_SECTIONS.map((s) => new Array(s.questions.length).fill(null))
    };
}

function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* приватный режим */ }
}

function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const saved = JSON.parse(raw);
        return saved && saved.sig === signature() ? saved : null;
    } catch (e) {
        return null;
    }
}

function clearState() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ничего */ }
}


/* ---------- Мелкие помощники ---------- */
function show(node, visible) {
    node.classList.toggle("hidden", !visible);
}

function formatTime(totalSeconds) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function currentSection() { return TEST_SECTIONS[state.section]; }
function isLastSection() { return state.section >= TEST_SECTIONS.length - 1; }


/* ---------- Ход теста ---------- */
function startTest() {
    state = newState();
    startSection(0);
}

function startSection(index) {
    state.section = index;
    state.question = 0;
    state.deadline = Date.now() + TEST_SECTIONS[index].minutes * 60 * 1000;
    state.phase = "section";
    state.breakReason = null;
    saveState();
    render();
    startTimer();
    scrollToTop();
}

// reason: "time" — время вышло, "manual" — ученик сам завершил
function endSection(reason) {
    stopTimer();
    if (isLastSection()) {
        state.phase = "result";
    } else {
        state.phase = "break";
        state.breakReason = reason;
    }
    saveState();
    render();
    scrollToTop();
}

function goToQuestion(index, withScroll = true) {
    const total = currentSection().questions.length;
    if (index < 0 || index >= total) return;
    state.question = index;
    saveState();
    renderSection();
    if (withScroll) el.bar.scrollIntoView({ block: "start", behavior: "smooth" });
}

function selectOption(optionIndex) {
    state.answers[state.section][state.question] = optionIndex;
    saveState();
    renderOptions();
    renderNav();
}

function onFinishSection() {
    const unanswered = state.answers[state.section].filter((a) => a === null).length;
    let message = unanswered > 0 ? `Жооп берилбеген суроолор: ${unanswered}.\n` : "";
    message += "Бөлүмдү аяктасаңыз, ага кайра кайтууга болбойт. Улантасызбы?";
    if (window.confirm(message)) endSection("manual");
}


/* ---------- Таймер ---------- */
function startTimer() {
    stopTimer();
    tick();
    if (state.phase === "section") timerId = setInterval(tick, 250);
}

function stopTimer() {
    if (timerId !== null) {
        clearInterval(timerId);
        timerId = null;
    }
}

function tick() {
    if (!state || state.phase !== "section") {
        stopTimer();
        return;
    }
    const msLeft = state.deadline - Date.now();
    if (msLeft <= 0) {
        endSection("time");
        return;
    }
    renderTimer(Math.ceil(msLeft / 1000));
}

function renderTimer(secondsLeft) {
    el.timer.textContent = formatTime(secondsLeft);
    el.timer.classList.toggle("test-bar__timer--warning", secondsLeft <= WARNING_SECONDS && secondsLeft > DANGER_SECONDS);
    el.timer.classList.toggle("test-bar__timer--danger", secondsLeft <= DANGER_SECONDS);
}


/* ---------- Отрисовка ---------- */
function render() {
    const phase = state.phase;

    show(el.start, phase === "intro");
    show(el.body, phase === "section");
    show(el.brk, phase === "break");
    show(el.result, phase === "result");
    show(el.progress, phase === "section");

    if (phase === "intro") renderIntro();
    if (phase === "section") renderSection();
    if (phase === "break") renderBreak();
    if (phase === "result") renderResult();
}

function renderIntro() {
    el.startInfo.innerHTML = "";
    TEST_SECTIONS.forEach((section, i) => {
        const li = document.createElement("li");
        const name = document.createElement("span");
        const info = document.createElement("span");
        name.textContent = `${i + 1}. ${section.title}`;
        info.textContent = `${section.questions.length} суроо · ${section.minutes} мүнөт`;
        li.append(name, info);
        el.startInfo.appendChild(li);
    });
}

function renderSection() {
    const section = currentSection();
    const question = section.questions[state.question];
    const total = section.questions.length;

    el.currentNum.textContent = state.question + 1;
    el.totalNum.textContent = total;
    el.sectionName.textContent = `${state.section + 1}-бөлүм: ${section.title}`;

    // фото вопроса
    el.image.innerHTML = "";
    if (question.image) {
        const img = document.createElement("img");
        img.src = question.image;
        img.alt = `Суроо ${state.question + 1}`;
        img.classList.add("test-card__img-question");
        el.image.appendChild(img);
    }
    show(el.image, Boolean(question.image));

    // текст для чтения и текст вопроса
    el.passage.textContent = question.passage || "";
    show(el.passage, Boolean(question.passage));

    el.question.textContent = question.question || "";
    show(el.question, Boolean(question.question));

    renderOptions();
    renderNav();

    el.prev.disabled = state.question === 0;
    el.next.disabled = state.question === total - 1;

    el.finishSection.textContent = isLastSection() ? "Тестти аяктоо" : "Бөлүмдү аяктоо";
    show(el.finishSection, ALLOW_EARLY_FINISH);

    renderTimer(Math.max(0, Math.ceil((state.deadline - Date.now()) / 1000)));
}

function renderOptions() {
    const question = currentSection().questions[state.question];
    const chosen = state.answers[state.section][state.question];
    const hasTextOptions = Array.isArray(question.options);
    const labels = hasTextOptions ? question.options : LETTERS;

    el.options.innerHTML = "";
    labels.forEach((label, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.classList.add("test-card__option-btn");
        button.textContent = hasTextOptions ? `${LETTERS[index]}) ${label}` : label;
        if (chosen === index) button.classList.add("selected");
        button.addEventListener("click", () => selectOption(index));
        el.options.appendChild(button);
    });
}

// Сетка номеров вопросов: можно перейти к любому вопросу текущего раздела
function renderNav() {
    const answers = state.answers[state.section];
    el.nav.innerHTML = "";
    answers.forEach((answer, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.classList.add("test-nav__btn");
        if (answer !== null) button.classList.add("test-nav__btn--answered");
        if (index === state.question) button.classList.add("test-nav__btn--current");
        button.textContent = index + 1;
        button.setAttribute("aria-label", `Суроо ${index + 1}`);
        button.addEventListener("click", () => goToQuestion(index));
        el.nav.appendChild(button);
    });
}

function renderBreak() {
    const done = currentSection();
    const next = TEST_SECTIONS[state.section + 1];

    el.breakTitle.textContent = state.breakReason === "time" ? "Убакыт бүттү" : "Бөлүм аяктады";
    el.breakText.textContent = `«${done.title}» бөлүмү жабылды. Ага кайра кайтууга болбойт.`;
    el.breakNext.textContent =
        `Кийинки бөлүм: «${next.title}» — ${next.questions.length} суроо, ${next.minutes} мүнөт. ` +
        "Төмөнкү баскычты басканда убакыт башталат.";
    el.breakBtn.textContent = `«${next.title}» бөлүмүн баштоо`;
}


/* ---------- Результаты ---------- */
function computeScores() {
    return TEST_SECTIONS.map((section, si) => {
        let correct = 0;
        const missed = [];
        section.questions.forEach((question, qi) => {
            if (state.answers[si][qi] === question.correctAnswer) correct++;
            else missed.push(qi + 1);
        });
        return { title: section.title, total: section.questions.length, correct, missed };
    });
}

function renderResult() {
    const scores = computeScores();
    const totalCorrect = scores.reduce((sum, s) => sum + s.correct, 0);
    const totalAll = scores.reduce((sum, s) => sum + s.total, 0);

    el.resultScore.textContent = `Сиздин жыйынтык: ${totalCorrect} / ${totalAll}`;

    el.resultDetails.innerHTML = "";
    scores.forEach((s) => {
        const row = document.createElement("div");
        row.classList.add("test-result__row");
        const name = document.createElement("span");
        const value = document.createElement("span");
        name.textContent = s.title;
        value.textContent = `${s.correct} / ${s.total}`;
        row.append(name, value);
        el.resultDetails.appendChild(row);
    });
}

function sendToWhatsApp() {
    const scores = computeScores();
    const totalCorrect = scores.reduce((sum, s) => sum + s.correct, 0);
    const totalAll = scores.reduce((sum, s) => sum + s.total, 0);

    let message = "Саламатсызбы! Мен ЖРТ кыргыз тили боюнча онлайн сынак тапшырдым.\n\n";
    message += `📊 Жалпы жыйынтык: ${totalCorrect} / ${totalAll}\n\n`;

    scores.forEach((s) => {
        message += `🔹 ${s.title}: ${s.correct} / ${s.total}\n`;
    });

    message += "\n❌ Ката кеткен же жооп берилбеген суроолор:\n";
    scores.forEach((s) => {
        message += `${s.title}: ${s.missed.length ? s.missed.join(", ") : "жок"}\n`;
    });

    const url = `https://api.whatsapp.com/send?phone=${TEACHER_PHONE}&text=${encodeURIComponent(message)}`;
    const win = window.open(url, "_blank");
    if (!win) window.location.href = url;   // если браузер заблокировал новую вкладку
}

function restartTest() {
    clearState();
    state = newState();
    render();
    scrollToTop();
}


/* ---------- Прочее ---------- */
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
}


/* ---------- События ---------- */
el.startBtn.addEventListener("click", startTest);
el.prev.addEventListener("click", () => goToQuestion(state.question - 1));
el.next.addEventListener("click", () => goToQuestion(state.question + 1));
el.finishSection.addEventListener("click", onFinishSection);
el.breakBtn.addEventListener("click", () => startSection(state.section + 1));
el.whatsapp.addEventListener("click", sendToWhatsApp);
el.restart.addEventListener("click", () => {
    if (window.confirm("Тестти кайрадан баштайсызбы? Мурунку жыйынтык өчүрүлөт.")) restartTest();
});

// вернулись во вкладку — сразу проверяем, не вышло ли время
document.addEventListener("visibilitychange", () => {
    if (!document.hidden) tick();
});

// защита от случайного закрытия во время раздела
window.addEventListener("beforeunload", (event) => {
    if (state && state.phase === "section") {
        event.preventDefault();
        event.returnValue = "";
    }
});


/* ---------- Запуск ---------- */
document.addEventListener("DOMContentLoaded", () => {
    state = loadState() || newState();
    render();
    if (state.phase === "section") startTimer();   // продолжаем с того же места
});