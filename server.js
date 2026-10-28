const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

const DATA_FILE = path.join(__dirname, 'data', 'data.json');

app.use(express.static('public'));
app.use(express.json());

function readData() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return { decks: [] };
    }
}

function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// --- API МАРШРУТЫ ДЛЯ КОЛОД ---
app.get('/api/decks', (req, res) => {
    const data = readData();
    res.json(data.decks);
});

app.post('/api/decks', (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Название колоды обязательно' });
    
    const data = readData();
    const newDeck = { id: 'd' + Date.now(), name: name, cards: [] };
    data.decks.push(newDeck);
    writeData(data);
    res.status(201).json(newDeck);
});

app.put('/api/decks/:id', (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    const data = readData();
    const deck = data.decks.find(d => d.id === id);
    if (!deck) return res.status(404).json({ error: 'Колода не найдена' });
    
    deck.name = name;
    writeData(data);
    res.json(deck);
});

app.delete('/api/decks/:id', (req, res) => {
    const { id } = req.params;
    const data = readData();
    data.decks = data.decks.filter(d => d.id !== id);
    writeData(data);
    res.json({ success: true });
});

// --- API МАРШРУТЫ ДЛЯ КАРТОЧЕК ---

// 1. Добавить карточку в колоду
app.post('/api/decks/:deckId/cards', (req, res) => {
    const { deckId } = req.params;
    const { en, ru } = req.body;
    
    if (!en || !ru) return res.status(400).json({ error: 'Нужно заполнить оба поля' });

    const data = readData();
    const deck = data.decks.find(d => d.id === deckId);
    if (!deck) return res.status(404).json({ error: 'Колода не найдена' });

    const newCard = { id: 'c' + Date.now(), en, ru };
    deck.cards.push(newCard);
    writeData(data);
    res.status(201).json(newCard);
});

// 2. Изменить карточку
app.put('/api/decks/:deckId/cards/:cardId', (req, res) => {
    const { deckId, cardId } = req.params;
    const { en, ru } = req.body;

    const data = readData();
    const deck = data.decks.find(d => d.id === deckId);
    if (!deck) return res.status(404).json({ error: 'Колода не найдена' });

    const card = deck.cards.find(c => c.id === cardId);
    if (!card) return res.status(404).json({ error: 'Карточка не найдена' });

    if (en) card.en = en;
    if (ru) card.ru = ru;
    
    writeData(data);
    res.json(card);
});

// 3. Удалить карточку
app.delete('/api/decks/:deckId/cards/:cardId', (req, res) => {
    const { deckId, cardId } = req.params;

    const data = readData();
    const deck = data.decks.find(d => d.id === deckId);
    if (!deck) return res.status(404).json({ error: 'Колода не найдена' });

    deck.cards = deck.cards.filter(c => c.id !== cardId);
    writeData(data);
    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`Сервер запущен. Откройте в браузере: http://localhost:${PORT}`);
});