import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Loading from '../../components/student/Loading';
import Footer from '../../components/student/Footer';
import { toast } from 'react-toastify';

const QuizList = () => {
    const { backendUrl } = useContext(AppContext);
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchQuizzes = async () => {
            try {
                const { data } = await axios.get(`${backendUrl}/api/quiz/all`);
                if (data.success) {
                    setQuizzes(data.quizzes);
                } else {
                    toast.error(data.message);
                }
            } catch (error) {
                toast.error(error.response?.data?.message || "Failed to fetch quizzes");
            }
            setLoading(false);
        };
        fetchQuizzes();
    }, [backendUrl]);

    if (loading) {
        return <Loading />;
    }

    return (
        <>
            <div className="min-h-screen md:px-36 px-8 pt-10">
                <h1 className="text-2xl font-semibold mb-6">Available Quizzes</h1>
                {quizzes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {quizzes.map(quiz => (
                            <div key={quiz._id} className="border border-gray-500/30 rounded-lg shadow-sm p-5 flex flex-col justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-800">{quiz.title}</h2>
                                    <p className="text-gray-500 mb-2">Subject: {quiz.subject}</p>
                                    <p className="text-sm text-gray-500">Created by: {quiz.createdBy.name}</p>
                                </div>
                                <Link
                                    to={`/quiz/attempt/${quiz._id}`}
                                    className="mt-4 w-full text-center bg-blue-600 text-white py-2 rounded font-medium"
                                >
                                    Start Quiz
                                </Link>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>No quizzes are available at this time.</p>
                )}
            </div>
            <Footer />
        </>
    );
};

export default QuizList;