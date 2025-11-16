import express from 'express'
import { 
    addUserRating, 
    getUserCourseProgress, 
    getUserData, 
    // purchaseCourse, // Removed
    enrollInCourse, // Added
    updateUserCourseProgress, 
    userEnrolledCourses 
} from '../controllers/userController.js';


const userRouter = express.Router()

// Get user Data
userRouter.get('/data', getUserData)
userRouter.post('/enroll', enrollInCourse) 
userRouter.get('/enrolled-courses', userEnrolledCourses)
userRouter.post('/update-course-progress', updateUserCourseProgress)
userRouter.post('/get-course-progress', getUserCourseProgress)
userRouter.post('/add-rating', addUserRating)

export default userRouter;