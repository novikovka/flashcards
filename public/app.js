let decks = []; 
let currentDeckId = null; 

// --- СОСТОЯНИЕ ТРЕНИРОВКИ ---
let studyCards = [];
let currentCardIndex = 0;
let isFlipped = false;
let studyDirection = 'EN-RU'; // может быть 'RU-EN'
let isShuffled = false;

// --- ЭЛЕМЕНТЫ DOM ---
const decksScreen = document.getElementById('decks-screen');
const deckScreen = document.getElementById('deck-screen');
const studyScreen = document.getElementById('study-screen');
const decksGrid = document.getElementById('decks-grid');
const decksStats = document.getElementById('decks-stats');
const modalNewDeck = document.getElementById('modal-new-deck');
const btnShowNewDeck = document.getElementById('btn-show-new-deck');
const newDeckForm = document.getElementById('new-deck-form');
const deckNameInput = document.getElementById('deck-name-input');
const closeButtons = document.querySelectorAll('.close-modal');

const btnBack = document.getElementById('btn-back');
const currentDeckName = document.getElementById('current-deck-name');
const cardsStats = document.getElementById('cards-stats');
const newCardForm = document.getElementById('new-card-form');
const cardEnInput = document.getElementById('card-en');
const cardRuInput = document.getElementById('card-ru');
const cardsList = document.getElementById('cards-list');
const btnStartStudy = document.getElementById('btn-start-study');

// Элементы тренировки
const btnEndStudy = document.getElementById('btn-end-study');
const studyCounter = document.getElementById('study-counter');
const studyCardContainer = document.getElementById('study-card');
const cardTextFront = document.getElementById('card-text-front');
const cardTextBack = document.getElementById('card-text-back');
const cardLabelFront = document.getElementById('card-label-front');
const cardLabelBack = document.getElementById('card-label-back');
const btnPrevCard = document.getElementById('btn-prev-card');
const btnNextCard = document.getElementById('btn-next-card');
const btnFlipCard = document.getElementById('btn-flip-card');
const btnSwitchDir = document.getElementById('btn-switch-dir');
const btnShuffle = document.getElementById('btn-shuffle');

// --- ФУНКЦИИ ИНИЦИАЛИЗАЦИИ И СЕТИ ---
async function init() { await fetchDecks(); }

async function fetchDecks() {
    try {
        const response = await fetch('/api/decks');
        decks = await response.json();
        
        if (studyScreen && !studyScreen.classList.contains('hidden')) {
            // Если мы в режиме учебы, обновляем массив (вдруг на другом устройстве изменили)
            startStudy(currentDeckId, true);
        } else if (currentDeckId) {
            renderDeckView(currentDeckId);
        } else {
            renderDecks();
        }
    } catch (error) {
        console.error('Ошибка:', error);
        decksStats.textContent = 'Ошибка загрузки';
    }
}

function renderDecks() {
    decksScreen.classList.remove('hidden');
    deckScreen.classList.add('hidden');
    studyScreen.classList.add('hidden');
    decksGrid.innerHTML = '';
    
    const totalCards = decks.reduce((sum, deck) => sum + deck.cards.length, 0);
    decksStats.textContent = `${decks.length} колод · ${totalCards} карточки`;

    decks.forEach(deck => {
        const card = document.createElement('div');
        card.className = 'deck-card';
        card.innerHTML = `
            <div class="deck-actions"><button class="icon-btn btn-delete" data-id="${deck.id}" title="Удалить">🗑️</button></div>
            <h3 style="font-size: 20px; margin-bottom: 10px;">${deck.name}</h3>
            <p class="stats-badge" style="margin-bottom: 20px;">${deck.cards.length} карточек</p>
            <div><button class="btn-secondary btn-open-deck" data-id="${deck.id}">Открыть</button></div>
        `;
        decksGrid.appendChild(card);
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            if (confirm('Удалить эту колоду?')) {
                await fetch(`/api/decks/${id}`, { method: 'DELETE' });
                fetchDecks();
            }
        });
    });

    document.querySelectorAll('.btn-open-deck').forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentDeckId = e.target.getAttribute('data-id');
            renderDeckView(currentDeckId);
        });
    });
}

function renderDeckView(deckId) {
    const deck = decks.find(d => d.id === deckId);
    if (!deck) return;

    decksScreen.classList.add('hidden');
    deckScreen.classList.remove('hidden');
    studyScreen.classList.add('hidden');
    
    currentDeckName.textContent = deck.name;
    cardsStats.textContent = `${deck.cards.length} карточек`;
    
    // Показываем кнопку старта тренировки только если есть слова
    if (deck.cards.length > 0) {
        btnStartStudy.classList.remove('hidden');
    } else {
        btnStartStudy.classList.add('hidden');
    }

    cardsList.innerHTML = '';
    deck.cards.forEach(card => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: 700;">${card.en}</td>
            <td>${card.ru}</td>
            <td>
                <button class="btn-text btn-edit-card" data-id="${card.id}" style="margin:0 10px 0 0;">✏ Изменить</button>
                <button class="btn-text btn-delete-card" data-id="${card.id}" style="color: var(--danger); margin:0;">🗑 Удалить</button>
            </td>
        `;
        cardsList.appendChild(tr);
    });

    document.querySelectorAll('.btn-delete-card').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const cardId = e.target.getAttribute('data-id');
            if (confirm('Удалить это слово?')) {
                await fetch(`/api/decks/${deckId}/cards/${cardId}`, { method: 'DELETE' });
                fetchDecks();
            }
        });
    });

    document.querySelectorAll('.btn-edit-card').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const cardId = e.target.getAttribute('data-id');
            const card = deck.cards.find(c => c.id === cardId);
            const newEn = prompt('Английский:', card.en);
            if (newEn === null) return;
            const newRu = prompt('Перевод:', card.ru);
            if (newRu === null) return;

            if (newEn.trim() && newRu.trim()) {
                await fetch(`/api/decks/${deckId}/cards/${cardId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ en: newEn.trim(), ru: newRu.trim() })
                });
                fetchDecks();
            }
        });
    });
}

// --- ЛОГИКА ТРЕНИРОВКИ ---

// Функция перемешивания массива
function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function startStudy(deckId, keepState = false) {
    const deck = decks.find(d => d.id === deckId);
    if (!deck || deck.cards.length === 0) return;

    deckScreen.classList.add('hidden');
    studyScreen.classList.remove('hidden');

    // Если не просили сохранить стейт (при перезагрузке), сбрасываем всё
    if (!keepState) {
        isShuffled = false;
        btnShuffle.classList.remove('active');
        studyCards = [...deck.cards];
        currentCardIndex = 0;
    }
    renderStudyCard();
}

function renderStudyCard() {
    if (studyCards.length === 0) return;
    
    isFlipped = false;
    studyCardContainer.classList.remove('flipped');
    
    const card = studyCards[currentCardIndex];
    studyCounter.textContent = `${currentCardIndex + 1} / ${studyCards.length}`;

    if (studyDirection === 'EN-RU') {
        cardLabelFront.textContent = 'English';
        cardTextFront.textContent = card.en;
        cardLabelBack.textContent = 'Перевод';
        cardTextBack.textContent = card.ru;
    } else {
        cardLabelFront.textContent = 'Russian';
        cardTextFront.textContent = card.ru;
        cardLabelBack.textContent = 'Translation';
        cardTextBack.textContent = card.en;
    }
}

function flipCard() {
    isFlipped = !isFlipped;
    studyCardContainer.classList.toggle('flipped');
}

function nextCard() {
    if (currentCardIndex < studyCards.length - 1) {
        currentCardIndex++;
        renderStudyCard();
    }
}

function prevCard() {
    if (currentCardIndex > 0) {
        currentCardIndex--;
        renderStudyCard();
    }
}

// Обработчики кнопок тренировки
btnStartStudy.addEventListener('click', () => startStudy(currentDeckId));
btnEndStudy.addEventListener('click', () => renderDeckView(currentDeckId));

studyCardContainer.addEventListener('click', flipCard);
btnFlipCard.addEventListener('click', flipCard);
btnNextCard.addEventListener('click', nextCard);
btnPrevCard.addEventListener('click', prevCard);

// Смена направления
btnSwitchDir.addEventListener('click', () => {
    studyDirection = studyDirection === 'EN-RU' ? 'RU-EN' : 'EN-RU';
    btnSwitchDir.textContent = studyDirection === 'EN-RU' ? 'EN → RU' : 'RU → EN';
    renderStudyCard();
});

// Перемешивание
btnShuffle.addEventListener('click', () => {
    isShuffled = !isShuffled;
    const deck = decks.find(d => d.id === currentDeckId);
    if (isShuffled) {
        btnShuffle.classList.add('active');
        btnShuffle.textContent = '✓ Перемешано';
        studyCards = shuffleArray(deck.cards);
    } else {
        btnShuffle.classList.remove('active');
        btnShuffle.textContent = '🔀 Перемешать';
        studyCards = [...deck.cards];
    }
    currentCardIndex = 0;
    renderStudyCard();
});

// Управление с клавиатуры
document.addEventListener('keydown', (e) => {
    // Работаем только если открыт экран тренировки
    if (!studyScreen.classList.contains('hidden')) {
        if (e.code === 'Space') {
            e.preventDefault(); // чтобы страница не скроллилась от пробела
            flipCard();
        } else if (e.code === 'ArrowRight') {
            nextCard();
        } else if (e.code === 'ArrowLeft') {
            prevCard();
        }
    }
});

// --- БАЗОВЫЕ СОБЫТИЯ (оставили как были) ---
btnShowNewDeck.addEventListener('click', () => { modalNewDeck.classList.remove('hidden'); deckNameInput.focus(); });
closeButtons.forEach(btn => { btn.addEventListener('click', () => { modalNewDeck.classList.add('hidden'); newDeckForm.reset(); }); });
newDeckForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = deckNameInput.value.trim();
    if (!name) return;
    await fetch('/api/decks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
    newDeckForm.reset(); modalNewDeck.classList.add('hidden'); fetchDecks();
});
btnBack.addEventListener('click', () => { currentDeckId = null; renderDecks(); });
newCardForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentDeckId) return;
    const en = cardEnInput.value.trim(); const ru = cardRuInput.value.trim();
    if (!en || !ru) return;
    await fetch(`/api/decks/${currentDeckId}/cards`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ en, ru }) });
    newCardForm.reset(); cardEnInput.focus(); fetchDecks(); 
});

init();