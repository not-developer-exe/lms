import Quiz from '../models/Quiz.js';
import Question from '../models/Question.js';
import QuizResult from '../models/QuizResult.js';

// Helper function to shuffle an array (Fisher-Yates shuffle)
function shuffleArray(array) {
    let currentIndex = array.length,  randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex != 0) {

        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }

    return array;
}

// Educator: Create a new quiz
export const createQuiz = async (req, res) => {
    try {
        // --- UPDATED: Added new fields ---
        const { title, subject, questions, availableFrom, availableTo } = req.body;
        const educatorId = req.auth.userId;

        if (!title || !subject || !questions || !Array.isArray(questions) || questions.length === 0 || !availableFrom || !availableTo) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }
        // --- END UPDATE ---

        // 1. Create the Quiz
        const newQuiz = await Quiz.create({
            title,
            subject,
            createdBy: educatorId,
            availableFrom, // Added
            availableTo,   // Added
            questions: [] 
        });

        // 2. Create all Question documents
        const questionDocs = await Promise.all(questions.map(q => {
            return Question.create({
                quizId: newQuiz._id,
                questionText: q.questionText,
                options: q.options,
                correctAnswer: q.correctAnswerIndex
            });
        }));

        // 3. Update the Quiz with the new Question IDs
        newQuiz.questions = questionDocs.map(q => q._id);
        await newQuiz.save();

        res.json({ success: true, message: "Quiz created successfully!", quiz: newQuiz });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Student: Get list of all available quizzes
export const getAllQuizzes = async (req, res) => {
    try {
        const now = new Date();
        const quizzes = await Quiz.find({
            // --- UPDATED: Only find active quizzes ---
            availableFrom: { $lte: now },
            availableTo: { $gte: now }
        })
            .populate('createdBy', 'name')
            .select('-questions -availableFrom -availableTo'); // Don't send questions or dates

        res.json({ success: true, quizzes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- NEW FUNCTION ---
// Educator: Get all quizzes they created
export const getAllManagedQuizzes = async (req, res) => {
    try {
        const educatorId = req.auth.userId;
        const quizzes = await Quiz.find({ createdBy: educatorId })
            .select('-questions') // No need to send all questions here
            .sort({ createdAt: -1 });

        res.json({ success: true, quizzes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// --- END NEW FUNCTION ---


// Student: Get a specific quiz for attempting (Randomized, no answers)
export const getQuizForStudent = async (req, res) => {
    try {
        const { quizId } = req.params;
        const userId = req.auth.userId;

        // --- NEW: Check for re-attempt ---
        const existingResult = await QuizResult.findOne({ quizId, userId });
        if (existingResult) {
            return res.status(403).json({ success: false, message: "You have already attempted this quiz." });
        }
        // --- END CHECK ---

        const now = new Date();
        const quiz = await Quiz.findById(quizId)
            .populate({
                path: 'questions',
                select: '-correctAnswer' // IMPORTANT: Exclude the correct answer
            });

        if (!quiz) {
            return res.status(404).json({ success: false, message: "Quiz not found" });
        }

        // --- NEW: Check availability window ---
        if (quiz.availableFrom > now) {
            return res.status(403).json({ success: false, message: "This quiz is not yet available." });
        }
        if (quiz.availableTo < now) {
            return res.status(403).json({ success: false, message: "This quiz is no longer available." });
        }
        // --- END CHECK ---

        // Randomize the question order
        quiz.questions = shuffleArray(quiz.questions);

        res.json({ success: true, quiz });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Student: Submit a quiz and get graded
export const submitQuiz = async (req, res) => {
    try {
        const { quizId } = req.params;
        const userId = req.auth.userId;
        const { answers } = req.body; // { answers: [ { questionId: "...", selectedOption: 0 }, ... ] }

        if (!answers || !Array.isArray(answers)) {
            return res.status(400).json({ success: false, message: "Invalid submission format" });
        }
        
        // --- NEW: Check for re-attempt before submitting ---
         const existingResult = await QuizResult.findOne({ quizId, userId });
         if (existingResult) {
             return res.status(403).json({ success: false, message: "You have already submitted this quiz." });
         }
         // --- END CHECK ---

        // 1. Get the quiz and the *correct answers* from the DB
        const quiz = await Quiz.findById(quizId).populate('questions');
        if (!quiz) {
            return res.status(404).json({ success: false, message: "Quiz not found" });
        }
        
        // --- NEW: Double-check availability window on submit ---
        const now = new Date();
        if (quiz.availableTo < now) {
            return res.status(403).json({ success: false, message: "The time for this quiz has expired." });
        }
        // --- END CHECK ---

        // Create a quick-lookup map for correct answers
        const answerMap = new Map();
        quiz.questions.forEach(q => {
            answerMap.set(q._id.toString(), q.correctAnswer);
        });

        // 2. Grade the submission
        let score = 0;
        let correctAnswers = 0;
        let wrongAnswers = 0;

        for (const answer of answers) {
            const correctAnswerIndex = answerMap.get(answer.questionId);
            
            if (correctAnswerIndex === undefined) {
                continue; 
            }

            if (answer.selectedOption === correctAnswerIndex) {
                score += 1;
                correctAnswers += 1;
            } else {
                score -= 0.25;
                wrongAnswers += 1;
            }
        }
        
        // Ensure score is not negative
        if (score < 0) {
            score = 0;
        }

        // 3. Save the result
        const newResult = await QuizResult.create({
            quizId,
            userId,
            score,
            totalQuestions: quiz.questions.length,
            correctAnswers,
            wrongAnswers
        });

        res.json({ success: true, message: "Quiz submitted!", result: newResult });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getQuizResults = async (req, res) => {
    try {
        const { quizId } = req.params;

        const results = await QuizResult.find({ quizId })
            .populate('userId', 'name email imageUrl')
            .sort({ score: -1 }); // Show highest score first

        res.json({ success: true, results });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
