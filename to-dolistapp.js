const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const DATA_FILE = path.join(__dirname, 'data', 'data.json');
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));


function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}
ensureDataFile();

function readNotes() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (e) {
    console.error('Read error', e);
    return [];
  }
}
function writeNotes(notes) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(notes, null, 2));
  } catch (e) {
    console.error('Write error', e);
  }
}



app.get('/api/notes', (req, res) => {
  res.json(readNotes());
});


app.post('/api/notes', (req, res) => {
  const { title, body, completed } = req.body;
  if (!title || typeof title !== 'string') return res.status(400).json({ error: 'Title required' });
  const notes = readNotes();
  const note = { id: uuidv4(), title: title.trim(), body: (body||'').trim(), completed: !!completed, createdAt: Date.now() };
  notes.unshift(note);
  writeNotes(notes);
  res.status(201).json(note);
});


app.delete('/api/notes/:id', (req, res) => {
  const id = req.params.id;
  let notes = readNotes();
  const before = notes.length;
  notes = notes.filter(n => n.id !== id);
  if (notes.length === before) return res.status(404).json({ error: 'Not found' });
  writeNotes(notes);
  res.json({ success: true });
});


app.post('/api/notes/:id/toggle', (req, res) => {
  const id = req.params.id;
  const notes = readNotes();
  const idx = notes.findIndex(n => n.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  notes[idx].completed = !notes[idx].completed;
  writeNotes(notes);
  res.json(notes[idx]);
});


app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
