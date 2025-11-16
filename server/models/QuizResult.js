import mongoose from "mongoose";

const quizResultSchema = new mongoose.Schema({
    quizId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',
        required: true
    },
    userId: {
        type: String,
        ref: 'User',
        required: true
    },
    score: {
        type: Number,
        required: true
    },
    totalQuestions: {
        type: Number,
        required: true
    },
    correctAnswers: {
        type: Number,
        required: true
    },
    wrongAnswers: {
        type: Number,
        required: true
    },
}, { timestamps: true });

const QuizResult = mongoose.model("QuizResult", quizResultSchema);

export default QuizResult;