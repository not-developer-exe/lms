import React, { useState, useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-toastify';
import uniqid from 'uniqid';
import axios from 'axios';
import { assets } from '../../assets/assets';

const AddQuiz = () => {
    const { backendUrl, getToken } = useContext(AppContext);
    
    const [title, setTitle] = useState('');
    const [subject, setSubject] = useState('');
    // --- NEW STATE ---
    const [availableFrom, setAvailableFrom] = useState('');
    const [availableTo, setAvailableTo] = useState('');
    // --- END NEW STATE ---
    const [questions, setQuestions] = useState([
        { id: uniqid(), questionText: '', options: ['', '', '', ''], correctAnswerIndex: 0 }
    ]);

    const handleQuestionChange = (id, newText) => {
        setQuestions(prevQuestions =>
            prevQuestions.map(q =>
                q.id === id ? { ...q, questionText: newText } : q
            )
        );
    };

    const handleOptionChange = (id, optionIndex, newText) => {
        setQuestions(prevQuestions =>
            prevQuestions.map(q =>
                q.id === id
                    ? { ...q, options: q.options.map((opt, i) => (i === optionIndex ? newText : opt)) }
                    : q
            )
        );
    };

    const handleCorrectAnswerChange = (id, optionIndex) => {
        setQuestions(prevQuestions =>
            prevQuestions.map(q =>
                q.id === id ? { ...q, correctAnswerIndex: optionIndex } : q
            )
        );
    };

    const addQuestion = () => {
        setQuestions(prevQuestions => [
            ...prevQuestions,
            { id: uniqid(), questionText: '', options: ['', '', '', ''], correctAnswerIndex: 0 }
        ]);
    };

    const removeQuestion = (id) => {
        if (questions.length <= 1) {
            toast.error("A quiz must have at least one question.");
            return;
        }
        setQuestions(prevQuestions => prevQuestions.filter(q => q.id !== id));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = await getToken();
            const { data } = await axios.post(
                `${backendUrl}/api/quiz/create`,
                { title, subject, questions, availableFrom, availableTo }, // Send new date fields
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (data.success) {
                toast.success(data.message);
                // Reset form
                setTitle('');
                setSubject('');
                setAvailableFrom(''); // Reset date
                setAvailableTo('');   // Reset date
                setQuestions([{ id: uniqid(), questionText: '', options: ['', '', '', ''], correctAnswerIndex: 0 }]);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to create quiz");
        }
    };

    return (
        <div className="h-screen overflow-scroll flex flex-col items-start md:p-8 md:pb-0 p-4 pt-8 pb-0">
            <h1 className="text-2xl font-semibold mb-4">Create a New Quiz</h1>
            <form onSubmit={handleSubmit} className="w-full max-w-2xl text-gray-500">
                {/* Quiz Details */}
                <div className="flex flex-col gap-4 bg-white p-4 border rounded-lg shadow-sm">
                    <div className="flex flex-col gap-1">
                        <p>Quiz Title</p>
                        <input
                            type="text"
                            placeholder="e.g., Final Exam"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500"
                            required
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <p>Subject</p>
                        <input
                            type="text"
                            placeholder="e.g., Computer Networks"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500"
                            required
                        />
                    </div>
                    {/* --- NEW DATE FIELDS --- */}
                    <div className="flex gap-4">
                        <div className="flex flex-col gap-1 w-1/2">
                            <p>Available From</p>
                            <input
                                type="datetime-local"
                                value={availableFrom}
                                onChange={(e) => setAvailableFrom(e.target.value)}
                                className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500"
                                required
                            />
                        </div>
                        <div className="flex flex-col gap-1 w-1/2">
                            <p>Available To</p>
                            <input
                                type="datetime-local"
                                value={availableTo}
                                onChange={(e) => setAvailableTo(e.target.value)}
                                className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500"
                                required
                            />
                        </div>
                    </div>
                     {/* --- END NEW DATE FIELDS --- */}
                </div>

                {/* Questions */}
                <h2 className="text-xl font-semibold my-4">Questions</h2>
                {questions.map((q, index) => (
                    <div key={q.id} className="bg-white p-4 border rounded-lg shadow-sm mb-4 relative">
                        <button
                            type="button"
                            onClick={() => removeQuestion(q.id)}
                            className="absolute top-2 right-2 p-1"
                        >
                            <img src={assets.cross_icon} alt="Remove" className="w-4 h-4" />
                        </button>
                        
                        <div className="flex flex-col gap-1 mb-2">
                            <p>Question {index + 1}</p>
                            <textarea
                                placeholder="What is a..."
                                value={q.questionText}
                                onChange={(e) => handleQuestionChange(q.id, e.target.value)}
                                className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500 min-h-[80px]"
                                required
                            />
                        </div>
                        
                        <p>Options (Select the correct answer)</p>
                        {q.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center gap-2 my-1">
                                <input
                                    type="radio"
                                    name={`correct-answer-${q.id}`}
                                    checked={q.correctAnswerIndex === optionIndex}
                                    onChange={() => handleCorrectAnswerChange(q.id, optionIndex)}
                                    className="scale-125"
                                />
                                <input
                                    type="text"
                                    placeholder={`Option ${optionIndex + 1}`}
                                    value={option}
                                    onChange={(e) => handleOptionChange(q.id, optionIndex, e.target.value)}
                                    className="w-full outline-none py-2 px-3 rounded border border-gray-400"
                                    required
                                />
                            </div>
                        ))}
                    </div>
                ))}

                <div className="flex justify-between items-center my-4">
                    <button
                        type="button"
                        onClick={addQuestion}
                        className="bg-blue-100 text-blue-700 py-2 px-4 rounded-lg"
                    >
                        + Add Question
                    </button>
                    <button
                        type="submit"
                        className="bg-black text-white py-2.5 px-8 rounded"
                    >
                        Save Quiz
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddQuiz;