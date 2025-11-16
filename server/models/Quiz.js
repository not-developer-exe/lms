import mongoose from "mongoose";

const quizSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true 
    },
    subject: { 
        type: String, 
        required: true 
    },
    createdBy: {
        type: String,
        ref: 'User',
        required: true
    },
    questions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question'
    }]
}, { timestamps: true });

const Quiz = mongoose.model("Quiz", quizSchema);

export default Quiz;