import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import Loading from '../../components/student/Loading';
import { toast } from 'react-toastify';

const QuizAttempt = () => {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const { backendUrl, getToken } = useContext(AppContext);

    const [quiz, setQuiz] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [score, setScore] = useState(null);
    
    // --- NEW STATE FOR STAGE 2 ---
    const [quizStarted, setQuizStarted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Use a ref to track submission status in event listeners
    const isSubmittingRef = useRef(false);
    // --- END NEW STATE ---


    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const token = await getToken();
                const { data } = await axios.get(`${backendUrl}/api/quiz/take/${quizId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (data.success) {
                    setQuiz(data.quiz);
                    setQuestions(data.quiz.questions);
                } else {
                    toast.error(data.message);
                }
            } catch (error) {
                if (error.response?.status === 403) {
                    toast.error(error.response.data.message);
                    navigate('/quizzes'); 
                } else {
                    toast.error(error.response?.data?.message || "Failed to fetch quiz");
                }
            }
            setLoading(false);
        };
        fetchQuiz();
    }, [quizId, backendUrl, getToken, navigate]);

    const handleAnswerSelect = (questionId, optionIndex) => {
        setAnswers(prevAnswers => ({
            ...prevAnswers,
            [questionId]: optionIndex
        }));
    };

    // --- UPDATED handleSubmit ---
    const handleSubmit = async () => {
        // Prevent double submits
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;
        setIsSubmitting(true);

        const finalAnswers = Object.keys(answers).map(questionId => ({
            questionId: questionId,
            selectedOption: answers[questionId]
        }));
        
        try {
            const token = await getToken();
            const { data } = await axios.post(
                `${backendUrl}/api/quiz/submit/${quizId}`,
                { answers: finalAnswers },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (data.success) {
                toast.success(data.message);
                setScore(data.result);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            if (error.response?.status === 403) {
                toast.error(error.response.data.message);
                navigate('/quizzes'); 
            } else {
                toast.error(error.response?.data?.message || "Failed to submit quiz");
            }
        }
    };

    // --- NEW FUNCTIONS FOR STAGE 2 ---
    const handleStartQuiz = () => {
        // Request fullscreen
        document.documentElement.requestFullscreen().catch((e) => {
            console.warn("Fullscreen request failed:", e);
            toast.warn("Please enable fullscreen for the best experience.");
        });
        setQuizStarted(true);
    };

    const handleAutoSubmit = async () => {
        if (isSubmittingRef.current) return;
    
        toast.warn("Quiz auto-submitted due to tab change or exiting fullscreen.", {
            autoClose: 5000
        });
    
        // Exit fullscreen if still in it
        if (document.fullscreenElement) {
            await document.exitFullscreen();
        }
    
        // Call the original submit function
        handleSubmit();
    };

    // --- NEW useEffect FOR STAGE 2 ---
    // This effect adds the anti-cheating event listeners
    useEffect(() => {
        // Only run if the quiz has started and hasn't been scored yet
        if (quizStarted && !score) {
            const handleVisibilityChange = () => {
                if (document.visibilityState === 'hidden') {
                    handleAutoSubmit();
                }
            };
    
            const handleFullscreenChange = () => {
                if (!document.fullscreenElement) {
                    handleAutoSubmit();
                }
            };
    
            document.addEventListener('visibilitychange', handleVisibilityChange);
            document.addEventListener('fullscreenchange', handleFullscreenChange);
    
            // Cleanup function
            return () => {
                document.removeEventListener('visibilitychange', handleVisibilityChange);
                document.removeEventListener('fullscreenchange', handleFullscreenChange);
            };
        }
    }, [quizStarted, score]); // Dependencies


    if (loading) {
        return <Loading />;
    }

    // After submission, show the score
    if (score) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-lg shadow-lg text-center">
                    <h1 className="text-2xl font-bold mb-4">Quiz Completed!</h1>
                    <h2 className="text-4xl font-bold text-blue-600 mb-2">{score.score.toFixed(2)}</h2>
                    <p className="text-gray-600 mb-4">You scored {score.score.toFixed(2)} out of {score.totalQuestions}.</p>
                    <div className="flex justify-around">
                        <p>Total: <span className="font-bold">{score.totalQuestions}</span></p>
                        <p>Correct: <span className="font-bold text-green-600">{score.correctAnswers}</span></p>
                        <p>Wrong: <span className="font-bold text-red-600">{score.wrongAnswers}</span></p>
                    </div>
                    <button
                        onClick={() => navigate('/quizzes')}
                        className="mt-6 bg-blue-600 text-white py-2 px-6 rounded font-medium"
                    >
                        Back to Quizzes
                    </button>
                </div>
            </div>
        );
    }
    
    // --- NEW: Show "Start Quiz" button first ---
    if (!quizStarted) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
                <div className="bg-white p-8 rounded-lg shadow-lg">
                    <h1 className="text-2xl font-bold mb-2">{quiz?.title}</h1>
                    <p className="text-gray-600 mb-6">Subject: {quiz?.subject}</p>
                    <h2 className="text-lg font-semibold text-red-600 mb-4">Quiz Rules:</h2>
                    <ul className="list-disc list-inside text-left text-gray-700 mb-6">
                        <li>This quiz will open in fullscreen mode.</li>
                        <li>Exiting fullscreen will auto-submit your quiz.</li>
                        <li>Switching tabs will auto-submit your quiz.</li>
                    </ul>
                    <button
                        onClick={handleStartQuiz}
                        className="w-full bg-blue-600 text-white py-3 px-6 rounded font-medium text-lg"
                    >
                        Start Quiz
                    </button>
                </div>
            </div>
        );
    }
    
    // Display the current question
    const currentQuestion = questions[currentQuestionIndex];

    return (
        <div className="min-h-screen flex flex-col md:flex-row p-4 md:p-8">
            {/* Question Palette */}
            <div className="w-full md:w-1/4 p-4 border-b md:border-r border-gray-300 mb-4 md:mb-0">
                <h2 className="font-semibold mb-4">Questions</h2>
                <div className="flex flex-wrap gap-2">
                    {questions.map((q, index) => {
                        const isAnswered = answers[q._id] !== undefined;
                        const isCurrent = index === currentQuestionIndex;
                        let btnClass = 'w-10 h-10 rounded border border-gray-400';
                        if (isCurrent) {
                            btnClass += ' bg-blue-600 text-white';
                        } else if (isAnswered) {
                            btnClass += ' bg-green-200';
                        }
                        return (
                            <button
                                key={q._id}
                                onClick={() => setCurrentQuestionIndex(index)}
                                className={btnClass}
                            >
                                {index + 1}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Question Display */}
            <div className="w-full md:w-3/4 p-4 md:pl-8">
                {currentQuestion && (
                    <div>
                        <h1 className="text-xl font-semibold mb-2">{quiz.title}</h1>
                        <p className="text-gray-600 mb-4">Question {currentQuestionIndex + 1} of {questions.length}</p>
                        <h2 className="text-lg font-medium mb-4">{currentQuestion.questionText}</h2>
                        
                        <div className="flex flex-col gap-3">
                            {currentQuestion.options.map((option, index) => (
                                <label
                                    key={index}
                                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer ${
                                        answers[currentQuestion._id] === index ? 'bg-blue-100 border-blue-500' : 'border-gray-300'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name={`question-${currentQuestion._id}`}
                                        checked={answers[currentQuestion._id] === index}
                                        onChange={() => handleAnswerSelect(currentQuestion._id, index)}
                                        className="scale-125"
                                    />
                                    {option}
                                </label>
                            ))}
                        </div>
                        
                        <div className="flex justify-between mt-8">
                            <button
                                onClick={() => setCurrentQuestionIndex(i => i - 1)}
                                disabled={currentQuestionIndex === 0}
                                className="bg-gray-300 text-gray-800 py-2 px-6 rounded font-medium disabled:opacity-50"
                            >
                                Previous
                            </button>
                            {currentQuestionIndex === questions.length - 1 ? (
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="bg-green-600 text-white py-2 px-6 rounded font-medium disabled:bg-green-400"
                                >
                                    {isSubmitting ? "Submitting..." : "Submit Quiz"}
                                </button>
                            ) : (
                                <button
                                    onClick={() => setCurrentQuestionIndex(i => i + 1)}
                                    disabled={currentQuestionIndex === questions.length - 1}
                                    className="bg-blue-600 text-white py-2 px-6 rounded font-medium disabled:opacity-50"
                                >
                                    Next
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuizAttempt;