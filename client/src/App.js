import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load students on mount
  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/students`);
      setStudents(response.data);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  return (
    <div className="App">
      <header className="header">
        <h1>🎓 AI Teacher Helper</h1>
        <p>Your AI-powered teaching assistant</p>
      </header>

      <nav className="tabs">
        <button
          className={activeTab === 'home' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('home')}
        >
          Home
        </button>
        <button
          className={activeTab === 'grading' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('grading')}
        >
          Paper Review
        </button>
        <button
          className={activeTab === 'students' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('students')}
        >
          Students
        </button>
      </nav>

      <main className="content">
        {activeTab === 'home' && <HomeTab loading={loading} setLoading={setLoading} />}
        {activeTab === 'grading' && (
          <GradingTab
            students={students}
            loading={loading}
            setLoading={setLoading}
            onGradeSubmitted={loadStudents}
          />
        )}
        {activeTab === 'students' && (
          <StudentsTab students={students} onUpdate={loadStudents} />
        )}
      </main>
    </div>
  );
}

// ==================== HOME TAB ====================
function HomeTab({ loading, setLoading }) {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessage = message;
    setMessage('');
    setChatHistory([...chatHistory, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/chat/general`, {
        message: userMessage
      });

      setChatHistory(prev => [
        ...prev,
        { role: 'assistant', content: response.data.response }
      ]);
    } catch (error) {
      setChatHistory(prev => [
        ...prev,
        { role: 'error', content: 'Error: ' + (error.response?.data?.error || error.message) }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tab-content">
      <h2>General Questions & Assistance</h2>
      <p className="tab-description">
        Ask me anything about lesson planning, student management, or general teaching questions.
      </p>

      <div className="chat-container">
        {chatHistory.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <strong>{msg.role === 'user' ? 'You' : msg.role === 'error' ? 'Error' : 'AI Assistant'}:</strong>
            <p>{msg.content}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="input-form">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask me anything..."
          rows="4"
          disabled={loading}
        />
        <button type="submit" disabled={loading || !message.trim()}>
          {loading ? 'Processing...' : 'Send Message'}
        </button>
      </form>
    </div>
  );
}

// ==================== GRADING TAB ====================
function GradingTab({ students, loading, setLoading, onGradeSubmitted }) {
  const [selectedStudent, setSelectedStudent] = useState('');
  const [paperText, setPaperText] = useState('');
  const [gradingResult, setGradingResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !paperText.trim()) return;

    setLoading(true);
    setGradingResult(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/grade/paper`, {
        studentId: parseInt(selectedStudent),
        paperText
      });

      setGradingResult(response.data);
      onGradeSubmitted(); // Refresh student list to show updated grade
      setPaperText(''); // Clear the paper text
    } catch (error) {
      setGradingResult({
        error: error.response?.data?.error || error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tab-content">
      <h2>Paper Review & Grading</h2>
      <p className="tab-description">
        Select a student and paste their paper text below for AI-powered grading and feedback.
      </p>

      <form onSubmit={handleSubmit} className="grading-form">
        <div className="form-group">
          <label>Select Student:</label>
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            disabled={loading}
            required
          >
            <option value="">-- Choose a student --</option>
            {students.map(student => (
              <option key={student.id} value={student.id}>
                {student.name} ({student.class})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Paper Text:</label>
          <textarea
            value={paperText}
            onChange={(e) => setPaperText(e.target.value)}
            placeholder="Paste the student's paper text here..."
            rows="10"
            disabled={loading}
            required
          />
        </div>

        <button type="submit" disabled={loading || !selectedStudent || !paperText.trim()}>
          {loading ? 'Grading...' : 'Grade Paper'}
        </button>
      </form>

      {gradingResult && (
        <div className={`grading-result ${gradingResult.error ? 'error' : 'success'}`}>
          {gradingResult.error ? (
            <p className="error-message">Error: {gradingResult.error}</p>
          ) : (
            <>
              <h3>Grading Result for {gradingResult.studentName}</h3>
              <div className="grade-badge">Grade: {gradingResult.grade}</div>
              <div className="feedback">
                <pre>{gradingResult.response}</pre>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ==================== STUDENTS TAB ====================
function StudentsTab({ students, onUpdate }) {
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    class: '',
    overallGrade: 'N/A'
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingStudent) {
        await axios.put(`${API_BASE_URL}/students/${editingStudent.id}`, formData);
      } else {
        await axios.post(`${API_BASE_URL}/students`, formData);
      }

      setFormData({ name: '', age: '', class: '', overallGrade: 'N/A' });
      setShowForm(false);
      setEditingStudent(null);
      onUpdate();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      age: student.age,
      class: student.class,
      overallGrade: student.overallGrade
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;

    try {
      await axios.delete(`${API_BASE_URL}/students/${id}`);
      onUpdate();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || error.message));
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingStudent(null);
    setFormData({ name: '', age: '', class: '', overallGrade: 'N/A' });
  };

  return (
    <div className="tab-content">
      <div className="students-header">
        <h2>Student Management</h2>
        <button
          className="add-button"
          onClick={() => setShowForm(!showForm)}
          disabled={showForm}
        >
          + Add Student
        </button>
      </div>

      {showForm && (
        <div className="student-form">
          <h3>{editingStudent ? 'Edit Student' : 'Add New Student'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <input
                type="text"
                name="name"
                placeholder="Name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
              <input
                type="number"
                name="age"
                placeholder="Age"
                value={formData.age}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-row">
              <input
                type="text"
                name="class"
                placeholder="Class (e.g., CS101, Math 201)"
                value={formData.class}
                onChange={handleInputChange}
                required
              />
              <input
                type="text"
                name="overallGrade"
                placeholder="Overall Grade (optional)"
                value={formData.overallGrade}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-actions">
              <button type="submit">{editingStudent ? 'Update' : 'Add'} Student</button>
              <button type="button" onClick={cancelForm} className="cancel-button">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="students-table-container">
        {students.length === 0 ? (
          <p className="empty-state">No students yet. Add your first student above!</p>
        ) : (
          <table className="students-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Age</th>
                <th>Class</th>
                <th>Overall Grade</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => (
                <tr key={student.id}>
                  <td>{student.name}</td>
                  <td>{student.age}</td>
                  <td>{student.class}</td>
                  <td>
                    <span className={`grade-display ${student.overallGrade}`}>
                      {student.overallGrade}
                    </span>
                  </td>
                  <td className="actions">
                    <button onClick={() => handleEdit(student)} className="edit-btn">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(student.id)} className="delete-btn">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default App;
