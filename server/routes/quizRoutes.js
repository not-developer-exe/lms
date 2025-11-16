import express from 'express';
import { createQuiz, getAllQuizzes, getQuizForStudent, submitQuiz } from '../controllers/quizController.js';
import { protectAdmin, protectEducator } from '../middlewares/authMiddleware.js';

const quizRouter = express.Router();

// Educator & Admin Routes
quizRouter.post('/create', protectEducator, createQuiz); // protectEducator also allows admin

// Student Routes
quizRouter.get('/all', getAllQuizzes);
quizRouter.get('/take/:quizId', getQuizForStudent);
quizRouter.post('/submit/:quizId', submitQuiz);

export default quizRouter;