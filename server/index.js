const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const Database = require('better-sqlite3');
const axios = require('axios');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize SQLite Database
const db = new Database(path.join(__dirname, 'database.sqlite'));

// Create students table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    class TEXT NOT NULL,
    overallGrade TEXT DEFAULT 'N/A',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// OpenAI API Configuration
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

// System prompts for different use cases
const SYSTEM_PROMPTS = {
    general: `You are a helpful AI assistant for a professor. You help with general questions about teaching, 
  lesson planning, student inquiries, and academic matters. Be professional, concise, and helpful.`,

    grading: `You are an expert academic grader and teaching assistant. Your role is to:
  1. Carefully review the submitted paper/assignment text
  2. Provide constructive, detailed feedback on content, structure, argumentation, and writing quality
  3. Assign a letter grade (A+, A, A-, B+, B, B-, C+, C, C-, D, F) based on academic standards
  4. Be fair but thorough in your assessment
  5. Highlight both strengths and areas for improvement
  
  Format your response as:
  GRADE: [Letter Grade]
  
  FEEDBACK:
  [Detailed feedback here]`
};

// Helper function to call OpenAI API
async function callOpenAI(messages, systemPromptType = 'general') {
    try {
        const response = await axios.post(
            OPENAI_API_URL,
            {
                model: OPENAI_MODEL,
                messages: [
                    { role: 'system', content: SYSTEM_PROMPTS[systemPromptType] },
                    ...messages
                ],
                temperature: 0.7,
                max_tokens: 2000
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('OpenAI API Error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.error?.message || 'Failed to get AI response');
    }
}

// ==================== API ROUTES ====================

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// General Q&A endpoint (Home tab)
app.post('/api/chat/general', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const response = await callOpenAI([
            { role: 'user', content: message }
        ], 'general');

        res.json({ response });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Paper grading endpoint (Paper Review tab)
app.post('/api/grade/paper', async (req, res) => {
    try {
        const { studentId, paperText } = req.body;

        if (!studentId || !paperText) {
            return res.status(400).json({ error: 'Student ID and paper text are required' });
        }

        // Get student info
        const student = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        // Get AI grading
        const response = await callOpenAI([
            { role: 'user', content: `Please grade the following paper:\n\n${paperText}` }
        ], 'grading');

        // Extract grade from response
        const gradeMatch = response.match(/GRADE:\s*([A-F][+-]?)/i);
        const letterGrade = gradeMatch ? gradeMatch[1] : 'N/A';

        // Update student's overall grade in database
        db.prepare('UPDATE students SET overallGrade = ? WHERE id = ?').run(letterGrade, studentId);

        res.json({
            response,
            grade: letterGrade,
            studentName: student.name
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all students
app.get('/api/students', (req, res) => {
    try {
        const students = db.prepare('SELECT * FROM students ORDER BY name').all();
        res.json(students);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single student
app.get('/api/students/:id', (req, res) => {
    try {
        const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        res.json(student);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add new student
app.post('/api/students', (req, res) => {
    try {
        const { name, age, class: studentClass, overallGrade } = req.body;

        if (!name || !age || !studentClass) {
            return res.status(400).json({ error: 'Name, age, and class are required' });
        }

        const result = db.prepare(
            'INSERT INTO students (name, age, class, overallGrade) VALUES (?, ?, ?, ?)'
        ).run(name, age, studentClass, overallGrade || 'N/A');

        const newStudent = db.prepare('SELECT * FROM students WHERE id = ?').get(result.lastInsertRowid);
        res.status(201).json(newStudent);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update student
app.put('/api/students/:id', (req, res) => {
    try {
        const { name, age, class: studentClass, overallGrade } = req.body;

        const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        db.prepare(
            'UPDATE students SET name = ?, age = ?, class = ?, overallGrade = ? WHERE id = ?'
        ).run(
            name || student.name,
            age || student.age,
            studentClass || student.class,
            overallGrade || student.overallGrade,
            req.params.id
        );

        const updatedStudent = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
        res.json(updatedStudent);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete student
app.delete('/api/students/:id', (req, res) => {
    try {
        const result = db.prepare('DELETE FROM students WHERE id = ?').run(req.params.id);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }

        res.json({ message: 'Student deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`OpenAI Model: ${OPENAI_MODEL}`);
});
