const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// --- 1. DATABASE CONNECTION ---
const mongoURI = "mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.mongodb.net/kivaywaDB?retryWrites=true&w=majority";

mongoose.connect(mongoURI)
    .then(() => console.log("✅ Kivaywa DB Connected"))
    .catch(err => console.error("❌ Connection error:", err));

// --- 2. SCHEMAS ---

// Candidate Schema
const Candidate = mongoose.model('Candidate', new mongoose.Schema({
    name: String,
    post: String
}));

// Class Schema
const ClassModel = mongoose.model('Class', new mongoose.Schema({
    className: { type: String, unique: true }
}));

// NEW: Vote Schema (Stores votes per candidate per class)
const voteSchema = new mongoose.Schema({
    post: String,
    candidateName: String,
    className: String,
    votes: { type: Number, default: 0 }
});
// Create a unique index so we don't get duplicate rows for the same entry
voteSchema.index({ post: 1, candidateName: 1, className: 1 }, { unique: true });
const Vote = mongoose.model('Vote', voteSchema);

// --- 3. ROUTES ---

// CANDIDATES
app.get('/api/candidates', async (req, res) => res.json(await Candidate.find()));
app.post('/api/candidates', async (req, res) => res.json(await new Candidate(req.body).save()));
app.delete('/api/candidates/:id', async (req, res) => res.json(await Candidate.findByIdAndDelete(req.params.id)));

// CLASSES
app.get('/api/classes', async (req, res) => res.json(await ClassModel.find().sort({ className: 1 })));
app.post('/api/classes', async (req, res) => {
    try { res.json(await new ClassModel(req.body).save()); } 
    catch (e) { res.status(400).json({ message: "Class exists" }); }
});
app.delete('/api/classes/:id', async (req, res) => res.json(await ClassModel.findByIdAndDelete(req.params.id)));

// --- 4. TALLY / VOTE ROUTES ---

// Get all votes for a specific post
app.get('/api/votes/:post', async (req, res) => {
    const votes = await Vote.find({ post: req.params.post });
    res.json(votes);
});

// Save or Update a vote
app.post('/api/votes/update', async (req, res) => {
    const { post, candidateName, className, votes } = req.body;
    try {
        const updatedVote = await Vote.findOneAndUpdate(
            { post, candidateName, className }, // Find this specific cell
            { votes },                          // Update the value
            { upsert: true, new: true }         // Create it if it doesn't exist
        );
        res.json(updatedVote);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`));
