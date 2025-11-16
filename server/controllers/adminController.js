import Application from '../models/Application.js';
import { clerkClient } from '@clerk/express';
import User from '../models/User.js';

// Get All Applications
export const getApplications = async (req, res) => {
    try {
        // Find all pending applications and populate the user details
        const applications = await Application.find({ status: 'pending' })
            .populate('userId', 'name email imageUrl');
            
        res.json({ success: true, applications });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Approve an Application
export const approveApplication = async (req, res) => {
    try {
        const { applicationId } = req.body;

        const application = await Application.findById(applicationId);
        if (!application) {
            return res.json({ success: false, message: 'Application not found' });
        }

        // 1. Update Clerk metadata
        await clerkClient.users.updateUserMetadata(application.userId, {
            publicMetadata: {
                role: 'educator',
            },
        });

        // 2. Update application status in our DB
        application.status = 'approved';
        await application.save();

        res.json({ success: true, message: 'User role updated to educator.' });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Reject an Application
export const rejectApplication = async (req, res) => {
    try {
        const { applicationId } = req.body;

        const application = await Application.findById(applicationId);
        if (!application) {
            return res.json({ success: false, message: 'Application not found' });
        }

        // Update application status
        application.status = 'rejected';
        await application.save();

        res.json({ success: true, message: 'Application rejected.' });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};