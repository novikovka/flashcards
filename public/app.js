// --- СОСТОЯНИЕ ПРИЛОЖЕНИЯ ---
let decks = []; 
let currentDeckId = null; // ID колоды, которую мы сейчас просматриваем

// --- ЭЛЕМЕНТЫ DOM ---
const decksScreen = document.getElementById('decks-screen');
const deckScreen = document.getElementById('deck-screen');
const decksGrid = document.getElementById('decks-grid');
const decksStats = document.getElementById('decks-stats');
const modalNewDeck = document.getElementById('modal-new-deck');
const btnShowNewDeck = document.getElementById('btn-show-new-deck');
const newDeckForm = document.getElementById('new-deck-form');
const deckNameInput = document.getElementById('deck-name-input');
const closeButtons = document.querySelectorAll('.close-modal');

// Элементы экрана внутри колоды
const btnBack = document.getElementById('btn-back');
const currentDeckName = document.getElementById('current-deck-name');
const cardsStats = document.getElementById('cards-stats');
const newCardForm = document.getElementById('new-card-form');
const cardEnInput = document.getElementById('card-en');
const cardRuInput = document.getElementById('card-ru');
const cardsList = document.getElementById('cards-list');

// --- ФУНКЦИИ ---
async function init() {
    await fetchDecks();
}

// Загрузка данных с сервера
async function fetchDecks() {
    try {
        const response = await fetch('/api/decks');
        decks = await response.json();
        
        // Если открыта колода — перерисовываем её, иначе — рисуем список
        if (currentDeckId) {
            renderDeckView(currentDeckId);
        } else {
            renderDecks();
        }
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        decksStats.textContent = 'Ошибка загрузки данных';
    }
}

// Отрисовка списка колод (Главный экран)
function renderDecks() {
    decksScreen.classList.remove('hidden');
    deckScreen.classList.add('hidden');
    decksGrid.innerHTML = '';
    
    const totalCards = decks.reduce((sum, deck) => sum + deck.cards.length, 0);
    decksStats.textContent = `${decks.length} колод · ${totalCards} карточки`;

    decks.forEach(deck => {
        const card = document.createElement('div');
        card.className = 'deck-card';
        card.innerHTML = `
            <div class="deck-actions">
                <button class="icon-btn btn-delete" data-id="${deck.id}" title="Удалить">🗑️</button>
            </div>
            <h3 style="font-size: 20px; margin-bottom: 10px;">${deck.name}</h3>
            <p class="stats-badge" style="margin-bottom: 20px;">${deck.cards.length} карточек</p>
            <div>
                <button class="btn-secondary btn-open-deck" data-id="${deck.id}">Открыть</button>
            </div>
        `;
        decksGrid.appendChild(card);
    });

    // Удаление колоды
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            if (confirm('Точно удалить эту колоду? Вместе с ней удалятся все карточки.')) {
                await fetch(`/api/decks/${id}`, { method: 'DELETE' });
                fetchDecks();
            }
        });
    });

    // Открытие колоды (переход на второй экран)
    document.querySelectorAll('.btn-open-deck').forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentDeckId = e.target.getAttribute('data-id');
            renderDeckView(currentDeckId);
        });
    });
}

// Отрисовка внутренности колоды (Второй экран)
function renderDeckView(deckId) {
    const deck = decks.find(d => d.id === deckId);
    if (!deck) return;

    decksScreen.classList.add('hidden');
    deckScreen.classList.remove('hidden');
    
    currentDeckName.textContent = deck.name;
    cardsStats.textContent = `${deck.cards.length} карточек`;
    
    cardsList.innerHTML = '';
    
    // Рисуем строки таблицы
    deck.cards.forEach(card => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: 700; color: var(--text-main); font-size: 18px;">${card.en}</td>
            <td>${card.ru}</td>
            <td>
                <button class="btn-text btn-edit-card" data-id="${card.id}" style="margin:0 10px 0 0;">✏ Изменить</button>
                <button class="btn-text btn-delete-card" data-id="${card.id}" style="color: var(--danger); margin:0;">🗑 Удалить</button>
            </td>
        `;
        cardsList.appendChild(tr);
    });

    // Удаление карточки
    document.querySelectorAll('.btn-delete-card').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const cardId = e.target.getAttribute('data-id');
            if (confirm('Удалить это слово?')) {
                await fetch(`/api/decks/${deckId}/cards/${cardId}`, { method: 'DELETE' });
                fetchDecks(); // Перезапрашиваем с сервера и перерисовываем
            }
        });
    });

    // Изменение карточки (самый простой подход - prompt)
    document.querySelectorAll('.btn-edit-card').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const cardId = e.target.getAttribute('data-id');
            const card = deck.cards.find(c => c.id === cardId);
            
            const newEn = prompt('Английский текст:', card.en);
            if (newEn === null) return; // Нажали "Отмена"
            const newRu = prompt('Перевод:', card.ru);
            if (newRu === null) return; // Нажали "Отмена"

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

// --- ОБРАБОТЧИКИ СОБЫТИЙ ОСНОВНОГО ИНТЕРФЕЙСА ---

// Модальное окно: открытие
btnShowNewDeck.addEventListener('click', () => {
    modalNewDeck.classList.remove('hidden');
    deckNameInput.focus();
});

// Модальное окно: закрытие
closeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        modalNewDeck.classList.add('hidden');
        newDeckForm.reset();
    });
});

// Создание новой колоды
newDeckForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = deckNameInput.value.trim();
    if (!name) return;

    await fetch('/api/decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
    });
    newDeckForm.reset();
    modalNewDeck.classList.add('hidden');
    fetchDecks();
});

// Кнопка "Назад" (возврат к списку колод)
btnBack.addEventListener('click', () => {
    currentDeckId = null;
    renderDecks();
});

// Добавление карточки в колоду
newCardForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentDeckId) return;

    const en = cardEnInput.value.trim();
    const ru = cardRuInput.value.trim();
    if (!en || !ru) return;

    await fetch(`/api/decks/${currentDeckId}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ en, ru })
    });
    
    // Очищаем форму и возвращаем фокус в первое поле для удобного ввода
    newCardForm.reset();
    cardEnInput.focus();
    fetchDecks(); 
});

init();