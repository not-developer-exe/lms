import Quiz from '../models/Quiz.js';
import Question from '../models/Question.js';
import QuizResult from '../models/QuizResult.js';
import exceljs from 'exceljs'; // <-- THIS IS THE MISSING IMPORT

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
        const { title, subject, questions, availableFrom, availableTo } = req.body;
        const educatorId = req.auth.userId;

        if (!title || !subject || !questions || !Array.isArray(questions) || questions.length === 0 || !availableFrom || !availableTo) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        // 1. Create the Quiz
        const newQuiz = await Quiz.create({
            title,
            subject,
            createdBy: educatorId,
            availableFrom,
            availableTo,
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
            availableFrom: { $lte: now },
            availableTo: { $gte: now }
        })
            .populate('createdBy', 'name')
            .select('-questions -availableFrom -availableTo');

        res.json({ success: true, quizzes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Educator: Get all quizzes they created
export const getAllManagedQuizzes = async (req, res) => {
    try {
        const educatorId = req.auth.userId;
        const quizzes = await Quiz.find({ createdBy: educatorId })
            .select('-questions')
            .sort({ createdAt: -1 });

        res.json({ success: true, quizzes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


// Student: Get a specific quiz for attempting (Randomized, no answers)
export const getQuizForStudent = async (req, res) => {
    try {
        const { quizId } = req.params;
        const userId = req.auth.userId;

        const existingResult = await QuizResult.findOne({ quizId, userId });
        if (existingResult) {
            return res.status(403).json({ success: false, message: "You have already attempted this quiz." });
        }

        const now = new Date();
        const quiz = await Quiz.findById(quizId)
            .populate({
                path: 'questions',
                select: '-correctAnswer'
            });

        if (!quiz) {
            return res.status(404).json({ success: false, message: "Quiz not found" });
        }

        if (quiz.availableFrom > now) {
            return res.status(403).json({ success: false, message: "This quiz is not yet available." });
        }
        if (quiz.availableTo < now) {
            return res.status(403).json({ success: false, message: "This quiz is no longer available." });
        }

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
        const { answers } = req.body; 

        if (!answers || !Array.isArray(answers)) {
            return res.status(400).json({ success: false, message: "Invalid submission format" });
        }
        
         const existingResult = await QuizResult.findOne({ quizId, userId });
         if (existingResult) {
             return res.status(403).json({ success: false, message: "You have already submitted this quiz." });
         }

        const quiz = await Quiz.findById(quizId).populate('questions');
        if (!quiz) {
            return res.status(404).json({ success: false, message: "Quiz not found" });
        }
        
        const now = new Date();
        if (quiz.availableTo < now) {
            return res.status(403).json({ success: false, message: "The time for this quiz has expired." });
        }

        const answerMap = new Map();
        quiz.questions.forEach(q => {
            answerMap.set(q._id.toString(), q.correctAnswer);
        });

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
        
        if (score < 0) {
            score = 0;
        }

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

// Educator: Get results for a specific quiz
export const getQuizResults = async (req, res) => {
    try {
        const { quizId } = req.params;

        const results = await QuizResult.find({ quizId })
            .populate('userId', 'name email imageUrl')
            .sort({ score: -1 });

        res.json({ success: true, results });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Educator: Delete a quiz
export const deleteQuiz = async (req, res) => {
    try {
        const { quizId } = req.params;
        const educatorId = req.auth.userId;

        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(4F4).json({ success: false, message: "Quiz not found" });
        }

        if (quiz.createdBy.toString() !== educatorId) {
            return res.status(403).json({ success: false, message: "You are not authorized to delete this quiz" });
        }

        await QuizResult.deleteMany({ quizId: quizId });
        await Question.deleteMany({ quizId: quizId });
        await Quiz.findByIdAndDelete(quizId);

        res.json({ success: true, message: "Quiz and all associated data deleted successfully." });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Educator: Export Quiz Results to XLS
export const exportQuizResults = async (req, res) => {
    try {
        const { quizId } = req.params;

        // 1. Fetch the quiz title
        const quiz = await Quiz.findById(quizId).select('title');
        if (!quiz) {
            return res.status(404).json({ success: false, message: "Quiz not found" });
        }
        
        // 2. Fetch results
        const results = await QuizResult.find({ quizId })
            .populate('userId', 'name email');

        // 3. Create Workbook and Worksheet
        const workbook = new exceljs.Workbook();
        const worksheet = workbook.addWorksheet(`${quiz.title} - Results`);

        // 4. Define columns (with styling)
        worksheet.columns = [
            { header: 'Student Name', key: 'name', width: 30 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Score', key: 'score', width: 10 },
            { header: 'Correct', key: 'correct', width: 10 },
            { header: 'Wrong', key: 'wrong', width: 10 },
            { header: 'Total', key: 'total', width: 10 }
        ];
        
        // Make header row bold
        worksheet.getRow(1).font = { bold: true };

        // 5. Add data rows
        results.forEach(result => {
            worksheet.addRow({
                name: result.userId.name,
                email: result.userId.email,
                score: result.score.toFixed(2),
                correct: result.correctAnswers,
                wrong: result.wrongAnswers,
                total: result.totalQuestions
            });
        });

        // 6. Set response headers
        const fileName = `${quiz.title.replace(/ /g, '_')}-Results.xlsx`;
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=${fileName}`
        );

        // 7. Write to response
        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};