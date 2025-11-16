import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-toastify';
import Loading from '../../components/student/Loading';

const AdminPanel = () => {
    const { backendUrl, getToken, isAdmin } = useContext(AppContext);
    const [applications, setApplications] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchApplications = async () => {
        try {
            const token = await getToken();
            const { data } = await axios.get(backendUrl + '/api/admin/applications', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data.success) {
                setApplications(data.applications);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to fetch applications");
        }
        setLoading(false);
    };

    useEffect(() => {
        if (isAdmin) {
            fetchApplications();
        }
    }, [isAdmin]);

    const handleApplication = async (applicationId, action) => {
        const endpoint = action === 'approve' ? '/api/admin/approve' : '/api/admin/reject';
        try {
            const token = await getToken();
            const { data } = await axios.post(backendUrl + endpoint, { applicationId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (data.success) {
                toast.success(data.message);
                // Refresh the list
                fetchApplications();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || `Failed to ${action} application`);
        }
    };

    if (loading) {
        return <Loading />;
    }

    return (
        <div className="min-h-screen flex flex-col items-start md:p-8 md:pb-0 p-4 pt-8 pb-0">
            <h1 className="text-2xl font-semibold mb-4">Educator Applications</h1>
            {applications && applications.length > 0 ? (
                <div className="flex flex-col items-center max-w-4xl w-full overflow-hidden rounded-md bg-white border border-gray-500/20 ">
                    <table className="table-fixed md:table-auto w-full overflow-hidden pb-4">
                        <thead className="text-gray-900 border-b border-gray-500/20 text-sm text-left">
                            <tr>
                                <th className="px-4 py-3 font-semibold">Applicant</th>
                                <th className="px-4 py-3 font-semibold hidden sm:table-cell">Email</th>
                                <th className="px-4 py-3 font-semibold hidden sm:table-cell">Applied On</th>
                                <th className="px-4 py-3 font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-gray-500">
                            {applications.map((app) => (
                                <tr key={app._id} className="border-b border-gray-500/20">
                                    <td className="md:px-4 px-2 py-3 flex items-center space-x-3">
                                        <img
                                            src={app.userId.imageUrl}
                                            alt="profile"
                                            className="w-9 h-9 rounded-full"
                                        />
                                        <span className="truncate">{app.userId.name}</span>
                                    </td>
                                    <td className="px-4 py-3 truncate hidden sm:table-cell">{app.userId.email}</td>
                                    <td className="px-4 py-3 hidden sm:table-cell">{new Date(app.createdAt).toLocaleDateString()}</td>
                                    <td className="px-4 py-3">
                                        <button 
                                            onClick={() => handleApplication(app._id, 'approve')}
                                            className="bg-green-500 text-white px-3 py-1 rounded mr-2 text-xs">
                                            Approve
                                        </button>
                                        <button 
                                            onClick={() => handleApplication(app._id, 'reject')}
                                            className="bg-red-500 text-white px-3 py-1 rounded text-xs">
                                            Reject
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p>No pending applications.</p>
            )}
        </div>
    );
};

export default AdminPanel;