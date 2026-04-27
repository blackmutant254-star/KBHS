const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
// Use the port provided by Render, or default to 3000 for local testing
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// --- 1. DATABASE CONNECTION ---
const mongoURI = "mongodb+srv://MedAI:Griff2009.@medai.qjvleue.mongodb.net/kivaywaDB?retryWrites=true&w=majority";

mongoose.connect(mongoURI)
    .then(() => console.log("✅ Kivaywa DB Connected Successfully"))
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

// UPDATED: Vote Schema to use resultKey
// This matches the frontend logic: `${post}_${candidateName}_${className}`
const voteSchema = new mongoose.Schema({
    resultKey: { type: String, unique: true, required: true },
    votes: { type: Number, default: 0 }
});
const Vote = mongoose.model('Vote', voteSchema);

// --- 3. CORE ROUTES ---

// CANDIDATES
app.get('/api/candidates', async (req, res) => {
    try { res.json(await Candidate.find()); } 
    catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/candidates', async (req, res) => {
    try { res.json(await new Candidate(req.body).save()); } 
    catch (e) { res.status(400).json({ error: e.message }); }
});

// CLASSES
app.get('/api/classes', async (req, res) => {
    try { res.json(await ClassModel.find().sort({ className: 1 })); } 
    catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/classes', async (req, res) => {
    try { res.json(await new ClassModel(req.body).save()); } 
    catch (e) { res.status(400).json({ message: "Class already exists" }); }
});

// --- 4. UPDATED TALLY ROUTES (To match Frontend) ---

// GET ALL RESULTS: Matches frontend fetch(`${API_BASE}/results`)
app.get('/api/results', async (req, res) => {
    try {
        const allVotes = await Vote.find();
        res.json(allVotes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE/POST RESULT: Matches frontend saveVote() function
app.post('/api/results', async (req, res) => {
    const { resultKey, votes } = req.body;
    try {
        const updatedVote = await Vote.findOneAndUpdate(
            { resultKey }, 
            { votes: parseInt(votes) || 0 }, 
            { upsert: true, new: true } // Creates it if it doesn't exist
        );
        res.json(updatedVote);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 5. SERVER START ---
app.listen(PORT, () => {
    console.log(`🚀 Kivaywa Server running on port ${PORT}`);
});
