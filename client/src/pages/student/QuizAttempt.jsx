import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import Loading from '../../components/student/Loading';
import { toast } from 'react-toastify';
import { assets } from '../../assets/assets';
import * as faceapi from 'face-api.js';

const QuizAttempt = () => {
    const { quizId } = useParams();
    const navigate = useNavigate();
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
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [attemptedCount, setAttemptedCount] = useState(0);
    const [leftCount, setLeftCount] = useState(0);

    // Stage 3 State
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [proctoringStarted, setProctoringStarted] = useState(false);
    const [warnings, setWarnings] = useState(0);
    const [maxWarnings, setMaxWarnings] = useState(0);
    const [proctoringMessage, setProctoringMessage] = useState("Please wait, loading AI models...");
    const videoRef = useRef(); 
    const proctorIntervalRef = useRef(); 
    const [mediaStream, setMediaStream] = useState(null); 

    // Load Face-API models
    useEffect(() => {
        const loadModels = async () => {
            const MODEL_URL = '/models'; 
            try {
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
                ]);
                setModelsLoaded(true);
                setProctoringMessage("AI models loaded. Ready to start.");
            } catch (error) {
                console.error("Failed to load models", error);
                toast.error("Failed to load AI proctoring. Please refresh.");
                setProctoringMessage("Error loading AI models. Please refresh.");
            }
        };
        loadModels();
    }, []);

    // Fetch quiz data
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

        clearInterval(proctorIntervalRef.current);
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
        }

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

    const handleStartQuiz = async () => {
        if (!modelsLoaded) {
            toast.error("AI models are still loading, please wait.");
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });
            setMediaStream(stream);
            setProctoringMessage("Permissions granted. Starting quiz...");
            
            const randomMax = Math.floor(Math.random() * 3) + 3; // 3, 4, or 5
            setMaxWarnings(randomMax);

            await document.documentElement.requestFullscreen().catch((e) => {
                console.warn("Fullscreen request failed:", e);
                toast.warn("Please enable fullscreen for the best experience.");
            });
            
            setQuizStarted(true);

        } catch (err) {
            console.error("Permission error:", err);
            toast.error("Webcam and Mic are required for this quiz.");
            setProctoringMessage("Webcam/Mic access denied. Please allow and refresh.");
        }
    };
    
    const handleAutoSubmit = () => {
        if (isSubmittingRef.current) return;
    
        toast.warn("Quiz auto-submitted due to proctoring violation or tab change.", {
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
                    setProctoringMessage("Tab switch detected!");
                    handleAutoSubmit();
                }
            };
    
            const handleFullscreenChange = () => {
                if (!document.fullscreenElement) {
                    setProctoringMessage("Exited fullscreen!");
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
    
    useEffect(() => {
        if (quizStarted && videoRef.current && mediaStream) {
            videoRef.current.srcObject = mediaStream;
        }
    }, [quizStarted, mediaStream]);

    // Proctoring Interval useEffect
    useEffect(() => {
        if (proctoringStarted && !isSubmittingRef.current && mediaStream) {
            const audioContext = new AudioContext();
            const analyser = audioContext.createAnalyser();
            const microphone = audioContext.createMediaStreamSource(mediaStream);
            microphone.connect(analyser);
            analyser.fftSize = 512;
            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            proctorIntervalRef.current = setInterval(async () => {
                if (isSubmittingRef.current || !videoRef.current) return;
                
                // 1. Face Detection
                const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions();
                
                let newWarning = false;
                let msg = "Proctoring active...";
                
                if (detections.length === 0) {
                    msg = "No face detected!";
                    newWarning = true;
                } else if (detections.length > 1) {
                    msg = "Multiple faces detected!";
                    newWarning = true;
                }

                // 2. Sound Detection
                analyser.getByteFrequencyData(dataArray);
                let sum = dataArray.reduce((a, b) => a + b, 0);
                let average = sum / dataArray.length;
                
                // --- TWEAK 1: Raised audio threshold ---
                if (average > 35) { // Was 20, raised to 35
                    msg = "Noise/Talking detected!";
                    newWarning = true;
                }
                // --- END TWEAK 1 ---

                setProctoringMessage(msg);

                // --- TWEAK 2: Cleaned up warning logic ---
                if (newWarning) {
                    // This logic ensures we only toast once per warning increment
                    setWarnings(currentWarnings => {
                        const newWarningCount = currentWarnings + 1;
                        
                        toast.warn(`Warning ${newWarningCount} of ${maxWarnings}!`, { autoClose: 1500 });
                    
                        if (newWarningCount >= maxWarnings) {
                            handleAutoSubmit();
                        }
                        
                        return newWarningCount;
                    });
                }
                // --- END TWEAK 2 ---

            }, 2000); // Check every 2 seconds

            return () => {
                clearInterval(proctorIntervalRef.current);
                audioContext.close();
            };
        }
    }, [proctoringStarted, maxWarnings, mediaStream]);


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
                    <video ref={videoRef} autoPlay muted width="320" height="240" className="hidden"></video>
                
                    <h1 className="text-2xl font-bold mb-2">{quiz?.title}</h1>
                    <p className="text-gray-600 mb-6">Subject: {quiz?.subject}</p>
                    <h2 className="text-lg font-semibold text-red-600 mb-4">Quiz Rules (AI PROCTORED):</h2>
                    <ul className="list-disc list-inside text-left text-gray-700 mb-6">
                        <li>Webcam and Microphone access are required.</li>
                        <li>Keep your face visible and centered.</li>
                        <li>Avoid talking or excessive background noise.</li>
                        <li>Do not switch tabs or exit fullscreen.</li>
                        <li>Violating rules will add warnings. Too many warnings will auto-submit.</li>
                    </ul>
                    <button
                        onClick={handleStartQuiz}
                        disabled={!modelsLoaded}
                        className="w-full bg-blue-600 text-white py-3 px-6 rounded font-medium text-lg disabled:bg-gray-400"
                    >
                        {modelsLoaded ? "Grant Permissions & Start Quiz" : "Loading AI Models..."}
                    </button>
                    <p className="text-sm text-gray-500 mt-4">{proctoringMessage}</p>
                </div>
            </div>
        );
    }
    
    const currentQuestion = questions[currentQuestionIndex];

    return (
        <div className="min-h-screen flex flex-col md:flex-row p-4 md:p-8">
            
            {/* Tiled Watermark */}
            {userData && (
                <div className="fixed inset-0 flex flex-wrap justify-center items-center gap-x-12 gap-y-20 overflow-hidden pointer-events-none z-10">
                    {Array.from({ length: 100 }).map((_, i) => (
                        <span 
                            key={i} 
                            className="text-lg font-semibold text-gray-900 opacity-5" 
                            style={{ transform: 'rotate(-30deg)' }}
                        >
                            {userData.email}
                        </span>
                    ))}
                </div>
            )}
            
            {/* Proctoring status bar */}
            <div className="fixed top-0 left-0 w-full bg-gray-800 text-white p-2 text-center z-50">
                Warnings: {warnings} / {maxWarnings} | {proctoringMessage}
            </div>
        
            {/* Visible video element */}
            <video 
                ref={videoRef} 
                onPlay={() => setProctoringStarted(true)} 
                autoPlay 
                muted 
                width="160" 
                height="120" 
                className="fixed bottom-2 left-2 z-50 border-2 border-white rounded-md"
            ></video>

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

            {/* Question Palette (with padding-top for status bar) */}
            <div className="w-full md:w-1/4 p-4 border-b md:border-r border-gray-300 mb-4 md:mb-0 relative z-20 bg-white bg-opacity-50 pt-16 md:pt-4">
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

            {/* Question Display (with padding-top for status bar) */}
            <div className="w-full md:w-3/4 p-4 md:pl-8 relative z-20 bg-white bg-opacity-50 pt-16 md:pt-4">
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