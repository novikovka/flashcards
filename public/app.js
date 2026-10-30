let decks = []; 
let currentDeckId = null; 

const decksScreen = document.getElementById('decks-screen');
const deckScreen = document.getElementById('deck-screen');
const studyScreen = document.getElementById('study-screen');
const decksGrid = document.getElementById('decks-grid');
const decksStats = document.getElementById('decks-stats');
const emptyState = document.getElementById('empty-state');
const btnCreateFirst = document.getElementById('btn-create-first');

const modalNewDeck = document.getElementById('modal-new-deck');
const btnShowNewDeck = document.getElementById('btn-show-new-deck');
const newDeckForm = document.getElementById('new-deck-form');
const deckNameInput = document.getElementById('deck-name-input');
const closeButtons = document.querySelectorAll('.close-modal');

const modalDelete = document.getElementById('modal-delete');
const deleteTitle = document.getElementById('delete-title');
const deleteDesc = document.getElementById('delete-desc');
const btnConfirmDelete = document.getElementById('btn-confirm-delete');
let deleteAction = null; // Функция, которая выполнится при подтверждении удаления

const btnBack = document.getElementById('btn-back');
const currentDeckName = document.getElementById('current-deck-name');
const cardsStats = document.getElementById('cards-stats');
const newCardForm = document.getElementById('new-card-form');
const cardEnInput = document.getElementById('card-en');
const cardRuInput = document.getElementById('card-ru');
const cardErrorMsg = document.getElementById('card-error-msg');
const cardsList = document.getElementById('cards-list');
const btnStartStudy = document.getElementById('btn-start-study');

// Тренировка
let studyCards = [], currentCardIndex = 0, isFlipped = false, studyDirection = 'EN-RU', isShuffled = false;
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

async function init() { await fetchDecks(); }

async function fetchDecks() {
    try {
        const response = await fetch('/api/decks');
        decks = await response.json();
        
        if (!studyScreen.classList.contains('hidden')) {
            startStudy(currentDeckId, true);
        } else if (currentDeckId) {
            renderDeckView(currentDeckId);
        } else {
            renderDecks();
        }
    } catch (error) { console.error(error); }
}

// Кастомное окно удаления
function showDeleteModal(title, desc, onConfirm) {
    deleteTitle.textContent = title;
    deleteDesc.textContent = desc;
    deleteAction = onConfirm;
    modalDelete.classList.remove('hidden');
}

btnConfirmDelete.addEventListener('click', () => {
    if (deleteAction) deleteAction();
    modalDelete.classList.add('hidden');
});

function renderDecks() {
    decksScreen.classList.remove('hidden');
    deckScreen.classList.add('hidden');
    studyScreen.classList.add('hidden');
    decksGrid.innerHTML = '';
    
    // Пустое состояние
    if (decks.length === 0) {
        emptyState.classList.remove('hidden');
        decksStats.classList.add('hidden');
    } else {
        emptyState.classList.add('hidden');
        decksStats.classList.remove('hidden');
        
        const totalCards = decks.reduce((sum, deck) => sum + deck.cards.length, 0);
        decksStats.textContent = `${decks.length} колод · ${totalCards} карточки`;

        decks.forEach(deck => {
            const card = document.createElement('div');
            card.className = 'deck-card';
            card.innerHTML = `
                <div class="deck-actions"><button class="icon-btn btn-delete" data-id="${deck.id}">🗑️</button></div>
                <h3 style="font-size: 20px; margin-bottom: 10px;">${deck.name}</h3>
                <p class="stats-badge" style="margin-bottom: 20px;">${deck.cards.length} карточек</p>
                <div><button class="btn-secondary btn-open-deck" data-id="${deck.id}">Открыть</button></div>
            `;
            decksGrid.appendChild(card);
        });

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                const deck = decks.find(d => d.id === id);
                showDeleteModal(
                    `Удалить колоду «${deck.name}»?`, 
                    `Вместе с колодой удалятся ${deck.cards.length} карточек. Отменить это действие нельзя.`, 
                    async () => {
                        await fetch(`/api/decks/${id}`, { method: 'DELETE' });
                        fetchDecks();
                    }
                );
            });
        });

        document.querySelectorAll('.btn-open-deck').forEach(btn => {
            btn.addEventListener('click', (e) => {
                currentDeckId = e.target.getAttribute('data-id');
                renderDeckView(currentDeckId);
            });
        });
    }
}

function renderDeckView(deckId) {
    const deck = decks.find(d => d.id === deckId);
    if (!deck) return;

    decksScreen.classList.add('hidden');
    deckScreen.classList.remove('hidden');
    studyScreen.classList.add('hidden');
    
    currentDeckName.textContent = deck.name;
    cardsStats.textContent = `${deck.cards.length} карточек`;
    btnStartStudy.classList.toggle('hidden', deck.cards.length === 0);

    cardsList.innerHTML = '';
    deck.cards.forEach(card => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: 700;">${card.en}</td>
            <td>${card.ru}</td>
            <td>
                <button class="btn-text btn-edit-card" data-id="${card.id}">✏ Изменить</button>
                <button class="btn-text btn-delete-card" data-id="${card.id}" style="color: var(--danger);">🗑 Удалить</button>
            </td>
        `;
        cardsList.appendChild(tr);
    });

    document.querySelectorAll('.btn-delete-card').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const cardId = e.target.getAttribute('data-id');
            showDeleteModal('Удалить слово?', 'Оно будет удалено навсегда.', async () => {
                await fetch(`/api/decks/${deckId}/cards/${cardId}`, { method: 'DELETE' });
                fetchDecks();
            });
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
                    method: 'PUT', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ en: newEn.trim(), ru: newRu.trim() })
                });
                fetchDecks();
            }
        });
    });
}

// Тренировка
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
    deckScreen.classList.add('hidden'); studyScreen.classList.remove('hidden');
    if (!keepState) {
        isShuffled = false; btnShuffle.classList.remove('active'); btnShuffle.textContent = '🔀 Перемешать';
        studyCards = [...deck.cards]; currentCardIndex = 0;
    }
    renderStudyCard();
}

function renderStudyCard() {
    if (studyCards.length === 0) return;
    isFlipped = false; studyCardContainer.classList.remove('flipped');
    const card = studyCards[currentCardIndex];
    studyCounter.textContent = `${currentCardIndex + 1} / ${studyCards.length}`;
    if (studyDirection === 'EN-RU') {
        cardLabelFront.textContent = 'English'; cardTextFront.textContent = card.en;
        cardLabelBack.textContent = 'Перевод'; cardTextBack.textContent = card.ru;
    } else {
        cardLabelFront.textContent = 'Russian'; cardTextFront.textContent = card.ru;
        cardLabelBack.textContent = 'Translation'; cardTextBack.textContent = card.en;
    }
}

function flipCard() { isFlipped = !isFlipped; studyCardContainer.classList.toggle('flipped'); }
function nextCard() { if (currentCardIndex < studyCards.length - 1) { currentCardIndex++; renderStudyCard(); } }
function prevCard() { if (currentCardIndex > 0) { currentCardIndex--; renderStudyCard(); } }

btnStartStudy.addEventListener('click', () => startStudy(currentDeckId));
btnEndStudy.addEventListener('click', () => renderDeckView(currentDeckId));
studyCardContainer.addEventListener('click', flipCard);
btnFlipCard.addEventListener('click', flipCard);
btnNextCard.addEventListener('click', nextCard);
btnPrevCard.addEventListener('click', prevCard);

btnSwitchDir.addEventListener('click', () => {
    studyDirection = studyDirection === 'EN-RU' ? 'RU-EN' : 'EN-RU';
    btnSwitchDir.textContent = studyDirection === 'EN-RU' ? 'EN → RU' : 'RU → EN';
    renderStudyCard();
});

btnShuffle.addEventListener('click', () => {
    isShuffled = !isShuffled;
    const deck = decks.find(d => d.id === currentDeckId);
    if (isShuffled) { btnShuffle.classList.add('active'); btnShuffle.textContent = '✓ Перемешано'; studyCards = shuffleArray(deck.cards); } 
    else { btnShuffle.classList.remove('active'); btnShuffle.textContent = '🔀 Перемешать'; studyCards = [...deck.cards]; }
    currentCardIndex = 0; renderStudyCard();
});

document.addEventListener('keydown', (e) => {
    if (!studyScreen.classList.contains('hidden')) {
        if (e.code === 'Space') { e.preventDefault(); flipCard(); } 
        else if (e.code === 'ArrowRight') { nextCard(); } 
        else if (e.code === 'ArrowLeft') { prevCard(); }
    }
});

// События интерфейса
const openNewDeck = () => { modalNewDeck.classList.remove('hidden'); deckNameInput.focus(); };
btnShowNewDeck.addEventListener('click', openNewDeck);
btnCreateFirst.addEventListener('click', openNewDeck);

closeButtons.forEach(btn => {
    btn.addEventListener('click', () => { 
        modalNewDeck.classList.add('hidden'); modalDelete.classList.add('hidden'); newDeckForm.reset(); 
    });
});

newDeckForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = deckNameInput.value.trim();
    if (!name) return;
    await fetch('/api/decks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
    newDeckForm.reset(); modalNewDeck.classList.add('hidden'); fetchDecks();
});

btnBack.addEventListener('click', () => { currentDeckId = null; renderDecks(); });

// Форма добавления карточки (Валидация)
newCardForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentDeckId) return;

    const en = cardEnInput.value.trim();
    const ru = cardRuInput.value.trim();
    
    // Очищаем предыдущие ошибки
    cardEnInput.classList.remove('input-error');
    cardRuInput.classList.remove('input-error');
    cardErrorMsg.classList.add('hidden');

    if (!en || !ru) {
        if (!en) cardEnInput.classList.add('input-error');
        if (!ru) cardRuInput.classList.add('input-error');
        cardErrorMsg.textContent = 'Введите текст в оба поля';
        cardErrorMsg.classList.remove('hidden');
        return;
    }

    await fetch(`/api/decks/${currentDeckId}/cards`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ en, ru })
    });
    
    newCardForm.reset(); 
    cardEnInput.focus(); 
    fetchDecks(); 
});

// Убираем подсветку ошибки при начале ввода
cardEnInput.addEventListener('input', () => { cardEnInput.classList.remove('input-error'); cardErrorMsg.classList.add('hidden'); });
cardRuInput.addEventListener('input', () => { cardRuInput.classList.remove('input-error'); cardErrorMsg.classList.add('hidden'); });

init();