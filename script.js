// 1. База данных вопросов ЖРТ (Кыргыз тили)
const testQuestions = [
    {
        id: 1,
        type: "analogy",
        question: "Аналогиялар: КҮН : ЖАРЫК",
        options: [
            "А) Түн : Караңгы",
            "Б) Суу : Суусаш",
            "В) От : Жылуулук",
            "Г) Дарак : Жалбырак"
        ],
        correctAnswer: 2 // Индекс правильного ответа (В), так как От дает Жылуулук, как Күн дает Жарык
    },
    {
        id: 2,
        type: "grammar",
        question: "Төмөнкү сүйлөмдөгү бош орунга кайсы байламта туура келет?\n\"Аба ырайы суук болду, ... биз саякатка барууну чечтик.\"",
        options: [
            "А) анткени",
            "Б) анткени менен",
            "В) ошондуктан",
            "Г) себеби"
        ],
        correctAnswer: 1 // Б (анткени менен)
    },
    {
        id: 3,
        type: "reading",
        // Здесь указываешь путь к отсканированному тексту (картинке)
        image: "./media/images/text_sample.png", 
        question: "БУЛ ЖЕРДЕ КАРТИНКА БОЛУШ КЕРЕК ........       Текстти кунт коюп окугула. Автор бул текст аркылуу кандай башкы идеяны билдиргиси келген?",
        options: [
            "А) Экологияны коргоо ар бир адамдын милдети",
            "Б) Өлкөнүн экономикалык өнүгүүсү",
            "В) Тарыхый эстеликтерди сактоо",
            "Г) Китеп окуунун пайдасы"
        ],
        correctAnswer: 0 // А
    }
];

// 2. Состояние приложения (Переменные, которые меняются в процессе)
let currentQuestionIndex = 0;
let score = 0;
let userAnswers = []; // Здесь будем хранить выбранные индексы ответов

// Номер телефона учителя (в международном формате, без плюса)
const TEACHER_PHONE = "996502601999"; // Замени на реальный номер учителя

// 3. Получение HTML элементов (DOM)
const currentNumEl = document.getElementById("current-num");
const totalNumEl = document.getElementById("total-num");
const imageContainerEl = document.getElementById("test-image-container");
const questionEl = document.getElementById("test-question");
const optionsContainerEl = document.getElementById("test-options");
const resultContainerEl = document.getElementById("test-result");
const resultScoreEl = document.getElementById("result-score");
const nextBtn = document.getElementById("next-btn");
const whatsappBtn = document.getElementById("whatsapp-btn");

// 4. Функция запуска теста
function initTest() {
    currentQuestionIndex = 0;
    score = 0;
    userAnswers = new Array(testQuestions.length).fill(null);
    
    if (totalNumEl) totalNumEl.textContent = testQuestions.length;
    
    showQuestion();
}

// 5. Функция отображения текущего вопроса
function showQuestion() {
    // Сбрасываем видимость элементов
    nextBtn.classList.add("hidden");
    imageContainerEl.classList.add("hidden");
    imageContainerEl.innerHTML = "";
    optionsContainerEl.innerHTML = "";
    
    // Обновляем номер вопроса на странице
    if (currentNumEl) currentNumEl.textContent = currentQuestionIndex + 1;
    
    // Получаем данные текущего вопроса
    const currentQuestion = testQuestions[currentQuestionIndex];
    
    // Отображаем текст вопроса
    questionEl.textContent = currentQuestion.question;
    
    // Если у вопроса есть картинка (скан текста), показываем её
    if (currentQuestion.image) {
        imageContainerEl.classList.remove("hidden");
        const img = document.createElement("img");
        img.src = currentQuestion.image;
        img.alt = "ЖРТ Текст";
        img.classList.add("test-card__img-question");
        imageContainerEl.appendChild(img);
    }
    
    // Отрисовываем варианты ответов
    currentQuestion.options.forEach((optionText, index) => {
        const button = document.createElement("button");
        button.textContent = optionText;
        button.classList.add("test-card__option-btn");
        
        // Если ученик уже выбирал этот ответ ранее (например, вернулся назад)
        if (userAnswers[currentQuestionIndex] === index) {
            button.classList.add("selected");
            nextBtn.classList.remove("hidden");
        }
        
        // Обработчик клика по варианту ответа
        button.addEventListener("click", () => selectOption(index));
        
        optionsContainerEl.appendChild(button);
    });
}

// 6. Логика выбора ответа
function selectOption(selectedIndex) {
    // Сохраняем выбор пользователя
    userAnswers[currentQuestionIndex] = selectedIndex;
    
    // Снимаем выделение со всех кнопок и выделяем только текущую
    const buttons = optionsContainerEl.querySelectorAll(".test-card__option-btn");
    buttons.forEach((btn, index) => {
        if (index === selectedIndex) {
            btn.classList.add("selected");
        } else {
            btn.classList.remove("selected");
        }
    });
    
    // Показываем кнопку "Кийинки" только после выбора ответа
    nextBtn.classList.remove("hidden");
    
    // Если это последний вопрос, меняем текст кнопки
    if (currentQuestionIndex === testQuestions.length - 1) {
        nextBtn.textContent = "Жыйынтыкты көрүү";
    } else {
        nextBtn.textContent = "Кийинки суроо";
    }
}

// 7. Обработка клика на кнопку "Кийинки"
nextBtn.addEventListener("click", () => {
    if (currentQuestionIndex < testQuestions.length - 1) {
        currentQuestionIndex++;
        showQuestion();
    } else {
        finishTest();
    }
});

// 8. Завершение теста и подсчет баллов
function finishTest() {
    // Скрываем блоки вопроса и вариантов ответов
    questionEl.classList.add("hidden");
    optionsContainerEl.classList.add("hidden");
    imageContainerEl.classList.add("hidden");
    nextBtn.classList.add("hidden");
    
    // Считаем правильные ответы
    score = 0;
    testQuestions.forEach((question, index) => {
        if (userAnswers[index] === question.correctAnswer) {
            score++;
        }
    });
    
    // Показываем блок результатов
    resultContainerEl.classList.remove("hidden");
    resultScoreEl.textContent = `Сиздин жыйынтык: ${score} / ${testQuestions.length}`;
}

// 9. Отправка результатов учителю в WhatsApp
whatsappBtn.addEventListener("click", function() {
    // Формируем красивый текст сообщения
    var message = "Саламатсызбы! Мен ЖРТ кыргыз тили боюнча онлайн сынак тапшырдым.\n\n" +
                  "📊 Жыйынтык: " + score + " / " + testQuestions.length + "\n" +
                  "📝 Менин жоопторум:\n";
    
    testQuestions.forEach(function(q, index) {
        var userChoice = userAnswers[index] !== null ? q.options[userAnswers[index]].substring(0, 4) : "Жооп жок";
        var isCorrect = userAnswers[index] === q.correctAnswer ? "✅" : "❌";
        message += "Суроо №" + (index + 1) + ": " + userChoice + " " + isCorrect + "\n";
    });
    
    // Самая надежная сборка ссылки через обычные плюсы без кавычек нового типа
    var whatsappUrl = "https://api.whatsapp.com/send?phone=" + TEACHER_PHONE + "&text=" + encodeURIComponent(message);
    
    // Открываем WhatsApp в новой вкладке
    window.open(whatsappUrl, "_blank");
});






// Запуск теста при загрузке страницы
document.addEventListener("DOMContentLoaded", initTest);
