"use strict";

/* =====================================================================
   about.js — всплывающее окно для карточек секции «Эмне үчүн бизди тандашат?»

   Как работает:
   • Нажали кнопку .about__card-info → затемняется фон и появляется окно
   • Закрыть можно: крестиком ×, кликом по тёмному фону или клавишей Esc
   • Само окно (и крестик) создаётся здесь, в JS: в index.html ничего добавлять не нужно
   • Какое окно открыть — определяется по id кнопки (info-exp, info-books, info-gold)

   КАК ЗАМЕНИТЬ ФОТО: ниже в INFO_DATA поменяй путь src на настоящий,
   например "./media/images/certificate-1.jpg". Можно добавлять сколько угодно фото.
   ===================================================================== */


// Временная картинка, пока нет настоящих фото
const PLACEHOLDER_IMG = "./media/images/course-online.svg";

const INFO_DATA = {
    // Кнопка id="info-exp" — «10 жылдык тажрыйба»
    "info-exp": {
        title: "10 жылдык тажрыйба",
        text: "Көп жылдык иш тажрыйбанын тастыктамасы жана документтери.",
        images: [
            {
                src: PLACEHOLDER_IMG,
                alt: "Иш тажрыйбасынын тастыктамасы",
                caption: "Иш тажрыйбасынын тастыктамасы"
            }
        ]
    },

    // Кнопка id="info-books" — «3 китептин автору»
    "info-books": {
        title: "3 китептин автору",
        text: "ЖРТге даярдануу үчүн жазылган автордук китептер.",
        images: [
            {
                src: PLACEHOLDER_IMG,
                alt: "1-китеп",
                caption: "1-китеп"
            },
            {
                src: PLACEHOLDER_IMG,
                alt: "2-китеп",
                caption: "2-китеп"
            },
            {
                src: PLACEHOLDER_IMG,
                alt: "3-китеп",
                caption: "3-китеп"
            }
        ]
    },

    // Кнопка id="info-gold" — «Алтын сертификаттар»
    "info-gold": {
        title: "Алтын сертификаттар",
        text: "Окуучуларыбыздын жогорку баллы үчүн алган алтын сертификаттары.",
        images: [
            {
                src: "./media/images/gold/Kerimjanov Atai.jpeg",
                alt: "Атайдын алтын сертификаты",
                caption: "Атай Керимжанов"
            },
            {
                src: "./media/images/gold/Urazbaeva Amina.jpeg",
                alt: "Аминанын алтын сертификаты",
                caption: "Амина Уразбаева"
            },
            {
                src: "./media/images/gold/Jailoobekova Myrzayim shifu.jpeg",
                alt: "Мырзайымдын алтын сертификаты",
                caption: "Мырзайым Жайлообекова"
            }
        ]
    }
};



/* ---------------------------------------------------------------------
   Создаём окно (один раз) и добавляем в конец <body>
   --------------------------------------------------------------------- */
const overlay = document.createElement("div");
overlay.className = "info";                       // тёмный фон на весь экран
overlay.setAttribute("aria-hidden", "true");

const windowEl = document.createElement("div");
windowEl.className = "info-inner";                // само окно
windowEl.setAttribute("role", "dialog");
windowEl.setAttribute("aria-modal", "true");
windowEl.setAttribute("aria-labelledby", "info-title");

const closeBtn = document.createElement("button");
closeBtn.type = "button";
closeBtn.className = "info__close";
closeBtn.setAttribute("aria-label", "Жабуу");
closeBtn.textContent = "×";

const titleEl = document.createElement("h3");
titleEl.className = "info__title";
titleEl.id = "info-title";

const textEl = document.createElement("p");
textEl.className = "info__text";

const galleryEl = document.createElement("div");
galleryEl.className = "info__gallery";

windowEl.append(closeBtn, titleEl, textEl, galleryEl);
overlay.appendChild(windowEl);
document.body.appendChild(overlay);


/* ---------------------------------------------------------------------
   Открыть / закрыть
   --------------------------------------------------------------------- */
let lastTrigger = null;   // кнопка, с которой открыли — вернём ей фокус при закрытии

function isOpen() {
    return overlay.classList.contains("info--open");
}

// open = true → показать, false → скрыть (toggle с принудительным значением)
function setOpen(open) {
    overlay.classList.toggle("info--open", open);
    overlay.setAttribute("aria-hidden", String(!open));
    document.body.classList.toggle("no-scroll", open);

    // чтобы страница не «прыгала» при пропадании полосы прокрутки
    if (open) {
        const scrollbar = window.innerWidth - document.documentElement.clientWidth;
        document.body.style.paddingRight = scrollbar > 0 ? scrollbar + "px" : "";
    } else {
        document.body.style.paddingRight = "";
    }
}

function fillWindow(data) {
    titleEl.textContent = data.title;
    textEl.textContent = data.text;

    galleryEl.innerHTML = "";
    data.images.forEach((image) => {
        const figure = document.createElement("figure");
        figure.className = "info__item";

        const img = document.createElement("img");
        img.className = "info__img";
        img.src = image.src;
        img.alt = image.alt || "";
        figure.appendChild(img);

        if (image.caption) {
            const caption = document.createElement("figcaption");
            caption.className = "info__caption";
            caption.textContent = image.caption;
            figure.appendChild(caption);
        }

        galleryEl.appendChild(figure);
    });
}

function openInfo(key, trigger) {
    const data = INFO_DATA[key];
    if (!data) return;                 // для этой кнопки нет данных — ничего не делаем

    lastTrigger = trigger;
    fillWindow(data);
    windowEl.scrollTop = 0;
    setOpen(true);
    closeBtn.focus();
}

function closeInfo() {
    if (!isOpen()) return;
    setOpen(false);
    if (lastTrigger) lastTrigger.focus();
}


/* ---------------------------------------------------------------------
   События
   --------------------------------------------------------------------- */
// кнопки «Кененирээк маалымат»
document.querySelectorAll(".about__card-info").forEach((button) => {
    button.setAttribute("aria-haspopup", "dialog");
    button.addEventListener("click", () => openInfo(button.id, button));
});

// крестик
closeBtn.addEventListener("click", closeInfo);

// клик по тёмному фону (но не по самому окну)
overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeInfo();
});

// клавиатура: Esc закрывает; Tab не выпускает фокус за окно
document.addEventListener("keydown", (event) => {
    if (!isOpen()) return;

    if (event.key === "Escape") {
        closeInfo();
    } else if (event.key === "Tab") {
        event.preventDefault();        // в окне одна кнопка — фокус остаётся на крестике
        closeBtn.focus();
    }
});