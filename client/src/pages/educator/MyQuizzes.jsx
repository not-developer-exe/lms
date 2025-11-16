import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import Loading from '../../components/student/Loading';
import { useNavigate } from 'react-router-dom';

const MyQuizzes = () => {
    const { backendUrl, isEducator, getToken } = useContext(AppContext);
    const [quizzes, setQuizzes] = useState(null);
    const navigate = useNavigate();

    const fetchManagedQuizzes = async () => {
        try {
            const token = await getToken();
            const { data } = await axios.get(backendUrl + '/api/quiz/all-managed', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data.success) {
                setQuizzes(data.quizzes);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to fetch quizzes");
        }
    };

    useEffect(() => {
        if (isEducator) {
            fetchManagedQuizzes();
        }
    }, [isEducator]);

    // --- NEW FUNCTION ---
    const handleDelete = async (quizId, quizTitle) => {
        // Confirm before deleting
        if (!window.confirm(`Are you sure you want to delete the quiz "${quizTitle}"? This will also delete all student results.`)) {
            return;
        }

        try {
            const token = await getToken();
            const { data } = await axios.delete(`${backendUrl}/api/quiz/${quizId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success) {
                toast.success(data.message);
                // Refresh the list of quizzes
                fetchManagedQuizzes();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete quiz");
        }
    };
    // --- END NEW FUNCTION ---

    const formatDateTime = (isoString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(isoString).toLocaleString('en-US', options);
    };

    return quizzes ? (
        <div className="min-h-screen flex flex-col items-start md:p-8 md:pb-0 p-4 pt-8 pb-0">
            <div className='w-full'>
                <h2 className="pb-4 text-lg font-medium">My Quizzes</h2>
                <div className="flex flex-col items-center max-w-4xl w-full overflow-hidden rounded-md bg-white border border-gray-500/20">
                    <table className="md:table-auto table-fixed w-full overflow-hidden">
                        <thead className="text-gray-900 border-b border-gray-500/20 text-sm text-left">
                            <tr>
                                <th className="px-4 py-3 font-semibold truncate">Title</th>
                                <th className="px-4 py-3 font-semibold truncate hidden sm:table-cell">Subject</th>
                                <th className="px-4 py-3 font-semibold truncate hidden md:table-cell">Available From</th>
                                <th className="px-4 py-3 font-semibold truncate hidden md:table-cell">Available To</th>
                                <th className="px-4 py-3 font-semibold truncate">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-gray-500">
                            {quizzes.map((quiz) => (
                                <tr key={quiz._id} className="border-b border-gray-500/20">
                                    <td className="px-4 py-3 truncate">{quiz.title}</td>
                                    <td className="px-4 py-3 truncate hidden sm:table-cell">{quiz.subject}</td>
                                    <td className="px-4 py-3 truncate hidden md:table-cell">{formatDateTime(quiz.availableFrom)}</td>
                                    <td className="px-4 py-3 truncate hidden md:table-cell">{formatDateTime(quiz.availableTo)}</td>
                                    <td className="px-4 py-3">
                                        <button 
                                            onClick={() => navigate(`/educator/quiz-results/${quiz._id}`)}
                                            className="bg-blue-500 text-white text-xs px-3 py-1 rounded mr-2"
                                        >
                                            Results
                                        </button>
                                        {/* --- NEW BUTTON --- */}
                                        <button
                                            onClick={() => handleDelete(quiz._id, quiz.title)}
                                            className="bg-red-500 text-white text-xs px-3 py-1 rounded"
                                        >
                                            Delete
                                        </button>
                                        {/* --- END NEW BUTTON --- */}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    ) : <Loading />;
};

export default MyQuizzes;