import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import Loading from '../../components/student/Loading';
import { useParams, Link } from 'react-router-dom';

const QuizResults = () => {
    const { backendUrl, isEducator, getToken } = useContext(AppContext);
    const [results, setResults] = useState(null);
    const { quizId } = useParams();
    const [quizTitle, setQuizTitle] = useState("Quiz"); // State to hold title
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const token = await getToken();
                const { data } = await axios.get(`${backendUrl}/api/quiz/results/${quizId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (data.success) {
                    setResults(data.results);
                }
            } catch (error) {
                toast.error(error.response?.data?.message || "Failed to fetch results");
            }
        };

        if (isEducator) {
            fetchResults();
        }
    }, [isEducator, quizId]);

    // --- NEW DOWNLOAD FUNCTION ---
    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            const token = await getToken();
            const response = await axios.get(`${backendUrl}/api/quiz/export-results/${quizId}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob' // This is crucial for file downloads
            });

            // Extract filename from header
            const contentDisposition = response.headers['content-disposition'];
            let filename = "quiz-results.xlsx"; // Default
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                if (filenameMatch.length > 1) {
                    filename = filenameMatch[1];
                }
            }

            // Create a temporary link to trigger the download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            
            // Clean up
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
            
        } catch (error) {
            toast.error("Failed to download results");
        }
        setIsDownloading(false);
    };
    // --- END NEW FUNCTION ---

    return results ? (
        <div className="min-h-screen flex flex-col items-start md:p-8 md:pb-0 p-4 pt-8 pb-0">
            <div className='w-full'>
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <Link to="/educator/my-quizzes" className="text-blue-500 inline-block">&larr; Back to My Quizzes</Link>
                        <h2 className="pb-4 text-lg font-medium">Quiz Results</h2>
                    </div>
                    {/* --- NEW DOWNLOAD BUTTON --- */}
                    <button
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="bg-green-600 text-white py-2 px-4 rounded font-medium disabled:bg-green-400"
                    >
                        {isDownloading ? "Downloading..." : "Download XLS"}
                    </button>
                    {/* --- END NEW BUTTON --- */}
                </div>

                {results.length > 0 ? (
                    <div className="flex flex-col items-center max-w-4xl w-full overflow-hidden rounded-md bg-white border border-gray-500/20">
                        <table className="md:table-auto table-fixed w-full overflow-hidden">
                            <thead className="text-gray-900 border-b border-gray-500/20 text-sm text-left">
                                <tr>
                                    <th className="px-4 py-3 font-semibold truncate">Student</th>
                                    <th className="px-4 py-3 font-semibold truncate hidden sm:table-cell">Email</th>
                                    <th className="px-4 py-3 font-semibold truncate">Score</th>
                                    <th className="px-4 py-3 font-semibold truncate">Correct</th>
                                    <th className="px-4 py-3 font-semibold truncate">Wrong</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm text-gray-500">
                                {results.map((result) => (
                                    <tr key={result._id} className="border-b border-gray-500/20">
                                        <td className="md:px-4 px-2 py-3 flex items-center space-x-3">
                                            <img src={result.userId.imageUrl} alt="student" className="w-9 h-9 rounded-full" />
                                            <span className="truncate">{result.userId.name}</span>
                                        </td>
                                        <td className="px-4 py-3 truncate hidden sm:table-cell">{result.userId.email}</td>
                                        <td className="px-4 py-3 font-bold">{result.score.toFixed(2)} / {result.totalQuestions}</td>
                                        <td className="px-4 py-3 text-green-600">{result.correctAnswers}</td>
                                        <td className="px-4 py-3 text-red-600">{result.wrongAnswers}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p>No students have submitted this quiz yet.</p>
                )}
            </div>
        </div>
    ) : <Loading />;
};

export default QuizResults;