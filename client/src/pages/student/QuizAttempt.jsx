import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import Loading from '../../components/student/Loading';
import { toast } from 'react-toastify';
import { assets } from '../../assets/assets'; // Import assets for cross_icon

const QuizAttempt = () => {
    const { quizId } = useParams();
    const navigate = useNavigate();
    // Get userData for the watermark
    const { backendUrl, getToken, userData } = useContext(AppContext);

    const [quiz, setQuiz] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [score, setScore] = useState(null);
    
    // Stage 2 State
    const [quizStarted, setQuizStarted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isSubmittingRef = useRef(false);

    // Confirmation Modal State
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [attemptedCount, setAttemptedCount] = useState(0);
    const [leftCount, setLeftCount] = useState(0);

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

    const handleSubmit = async () => {
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;
        setIsSubmitting(true);
        setShowConfirmModal(false); 

        if (document.fullscreenElement) {
            await document.exitFullscreen();
        }

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

    const handleStartQuiz = () => {
        document.documentElement.requestFullscreen().catch((e) => {
            console.warn("Fullscreen request failed:", e);
            toast.warn("Please enable fullscreen for the best experience.");
        });
        setQuizStarted(true);
    };

    const handleAutoSubmit = () => {
        if (isSubmittingRef.current) return;
    
        toast.warn("Quiz auto-submitted due to tab change or exiting fullscreen.", {
            autoClose: 5000
        });
    
        handleSubmit();
    };
    
    const openConfirmationModal = () => {
        const attempted = Object.keys(answers).length;
        const total = questions.length;
        setAttemptedCount(attempted);
        setLeftCount(total - attempted);
        setShowConfirmModal(true);
    };

    useEffect(() => {
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
    
            return () => {
                document.removeEventListener('visibilitychange', handleVisibilityChange);
                document.removeEventListener('fullscreenchange', handleFullscreenChange);
            };
        }
    }, [quizStarted, score]);


    if (loading) {
        return <Loading />;
    }

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
    
    const currentQuestion = questions[currentQuestionIndex];

    return (
        <div className="min-h-screen flex flex-col md:flex-row p-4 md:p-8">
            
            {/* --- NEW TILED WATERMARK --- */}
            {userData && (
                <div className="fixed inset-0 flex flex-wrap justify-center items-center gap-x-12 gap-y-20 overflow-hidden pointer-events-none z-10">
                    {/* Create a large array to tile the watermark */}
                    {Array.from({ length: 100 }).map((_, i) => (
                        <span 
                            key={i} 
                            className="text-xl font-semibold text-gray-900 opacity-5" 
                            style={{ transform: 'rotate(-30deg)' }}
                        >
                            {userData.email}
                        </span>
                    ))}
                </div>
            )}
            {/* --- END WATERMARK --- */}


            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Confirm Submission</h2>
                            <img 
                                src={assets.cross_icon} 
                                alt="Close" 
                                className="w-4 h-4 cursor-pointer" 
                                onClick={() => setShowConfirmModal(false)}
                            />
                        </div>
                        <p className="mb-2">Are you sure you want to submit?</p>
                        <p>Questions Attempted: <span className="font-bold">{attemptedCount}</span></p>
                        <p className="mb-6">Questions Left: <span className="font-bold">{leftCount}</span></p>
                        <div className="flex justify-end gap-4">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="bg-gray-300 text-gray-800 py-2 px-4 rounded font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="bg-green-600 text-white py-2 px-4 rounded font-medium"
                            >
                                Confirm Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* Question Palette */}
            <div className="w-full md:w-1/4 p-4 border-b md:border-r border-gray-300 mb-4 md:mb-0 relative z-20 bg-white bg-opacity-50">
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
            <div className="w-full md:w-3/4 p-4 md:pl-8 relative z-20 bg-white bg-opacity-50">
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
                                    onClick={openConfirmationModal}
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