const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// --- MIDDLEWARE ---
app.use(cors());
app.use(bodyParser.json());

// --- 1. DATABASE CONNECTION ---
// Note: Consider using process.env.MONGO_URI for security
const mongoURI = "mongodb+srv://MedAI:Griff2009.@medai.qjvleue.mongodb.net/kivaywaDB?retryWrites=true&w=majority";

mongoose.connect(mongoURI)
    .then(() => console.log("✅ Kivaywa DB Connected Successfully"))
    .catch(err => console.error("❌ Connection error:", err));

// --- 2. SCHEMAS & MODELS ---

// Candidate Schema
const Candidate = mongoose.model('Candidate', new mongoose.Schema({
    name: String,
    post: String
}));

// Post Schema (Positions)
const Post = mongoose.model('Post', new mongoose.Schema({
    name: { type: String, unique: true, required: true }
}));

// Class Schema
const ClassModel = mongoose.model('Class', new mongoose.Schema({
    className: { type: String, unique: true, required: true }
}));

// Vote Schema
const Vote = mongoose.model('Vote', new mongoose.Schema({
    resultKey: { type: String, unique: true, required: true },
    votes: { type: Number, default: 0 }
}));

// --- 3. CORE ROUTES ---

/** * CANDIDATES ROUTES 
 */
app.get('/api/candidates', async (req, res) => {
    try { res.json(await Candidate.find()); } 
    catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/candidates', async (req, res) => {
    try { res.json(await new Candidate(req.body).save()); } 
    catch (e) { res.status(400).json({ error: e.message }); }
});

app.delete('/api/candidates/:id', async (req, res) => {
    try { 
        const deleted = await Candidate.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: "Candidate not found" });
        res.json({ message: "Candidate deleted", deleted });
    }
    catch (e) { res.status(500).json({ error: e.message }); }
});

/** * POSTS (POSITIONS) ROUTES 
 */
app.get('/api/posts', async (req, res) => {
    try { res.json(await Post.find().sort({ name: 1 })); } 
    catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/posts', async (req, res) => {
    try { res.json(await new Post(req.body).save()); } 
    catch (e) { res.status(400).json({ message: "Position already exists" }); }
});

app.delete('/api/posts/:id', async (req, res) => {
    try { 
        const deleted = await Post.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: "Position not found" });
        res.json({ message: "Position deleted", deleted });
    }
    catch (e) { res.status(500).json({ error: e.message }); }
});

/** * CLASSES ROUTES 
 */
app.get('/api/classes', async (req, res) => {
    try { res.json(await ClassModel.find().sort({ className: 1 })); } 
    catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/classes', async (req, res) => {
    try { res.json(await new ClassModel(req.body).save()); } 
    catch (e) { res.status(400).json({ message: "Class already exists" }); }
});

// FIXED: Added missing DELETE route for Classes
app.delete('/api/classes/:id', async (req, res) => {
    try { 
        const deleted = await ClassModel.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: "Class not found" });
        res.json({ message: "Class removed from registry", deleted });
    } catch (e) { 
        res.status(500).json({ error: e.message }); 
    }
});

/** * TALLY RESULTS ROUTES 
 */
app.get('/api/results', async (req, res) => {
    try { res.json(await Vote.find()); } 
    catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/results', async (req, res) => {
    const { resultKey, votes } = req.body;
    try {
        const updatedVote = await Vote.findOneAndUpdate(
            { resultKey }, 
            { votes: parseInt(votes) || 0 }, 
            { upsert: true, new: true }
        );
        res.json(updatedVote);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- 4. SERVER START ---
app.listen(PORT, () => {
    console.log(`🚀 Kivaywa Server running on port ${PORT}`);
});
