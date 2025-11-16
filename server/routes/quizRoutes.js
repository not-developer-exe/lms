import express from 'express';
import { 
    createQuiz, 
    getAllQuizzes, 
    getQuizForStudent, 
    submitQuiz,
    getAllManagedQuizzes, 
    getQuizResults         
} from '../controllers/quizController.js';
import { protectAdmin, protectEducator } from '../middlewares/authMiddleware.js';

const quizRouter = express.Router();

// Educator & Admin Routes
quizRouter.post('/create', protectEducator, createQuiz);
quizRouter.get('/all-managed', protectEducator, getAllManagedQuizzes); 
quizRouter.get('/results/:quizId', protectEducator, getQuizResults);  

// Student Routes
quizRouter.get('/all', getAllQuizzes);
quizRouter.get('/take/:quizId', getQuizForStudent);
quizRouter.post('/submit/:quizId', submitQuiz);

export default quizRouter;