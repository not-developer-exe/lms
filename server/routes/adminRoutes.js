import express from 'express'
import { approveApplication, getApplications, rejectApplication } from '../controllers/adminController.js';
import { protectAdmin } from '../middlewares/authMiddleware.js';

const adminRouter = express.Router()

// All routes in this file are protected by the protectAdmin middleware
adminRouter.use(protectAdmin);

// Get all pending applications
adminRouter.get('/applications', getApplications);

// Approve an application
adminRouter.post('/approve', approveApplication);

// Reject an application
adminRouter.post('/reject', rejectApplication);

export default adminRouter;