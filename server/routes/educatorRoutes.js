import express from 'express'
import { addCourse, educatorDashboardData, getEducatorCourses, getEnrolledStudentsData, applyForEducator } from '../controllers/educatorController.js';
import upload from '../configs/multer.js';
import { protectEducator } from '../middlewares/authMiddleware.js';


const educatorRouter = express.Router()

// Apply for Educator Role 
educatorRouter.post('/apply', applyForEducator)

// Add Courses (Protected)
educatorRouter.post('/add-course', upload.single('image'), protectEducator, addCourse)

// Get Educator Courses (Protected)
educatorRouter.get('/courses', protectEducator, getEducatorCourses)

// Get Educator Dashboard Data (Protected)
educatorRouter.get('/dashboard', protectEducator, educatorDashboardData)

// Get Educator Students Data (Protected)
educatorRouter.get('/enrolled-students', protectEducator, getEnrolledStudentsData)


export default educatorRouter;