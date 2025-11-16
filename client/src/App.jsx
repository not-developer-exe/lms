import React, { useContext } from 'react'
import { Routes, Route, useLocation, useMatch } from 'react-router-dom'
import Navbar from './components/student/Navbar'
import Home from './pages/student/Home'
import CourseDetails from './pages/student/CourseDetails'
import CoursesList from './pages/student/CoursesList'
import Dashboard from './pages/educator/Dashboard'
import AddCourse from './pages/educator/AddCourse'
import MyCourses from './pages/educator/MyCourses'
import StudentsEnrolled from './pages/educator/StudentsEnrolled'
import Educator from './pages/educator/Educator'
import 'quill/dist/quill.snow.css'
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify'
import Player from './pages/student/Player'
import MyEnrollments from './pages/student/MyEnrollments'
import Loading from './components/student/Loading'
import AdminPanel from './pages/educator/AdminPanel'
import AddQuiz from './pages/educator/AddQuiz'
import QuizList from './pages/student/QuizList'
import QuizAttempt from './pages/student/QuizAttempt'

const App = () => {

  const isEducatorRoute = useMatch('/educator/*');

  return (
    <div className="text-default min-h-screen bg-white">
      <ToastContainer />
      {/* Render Student Navbar only if not on educator routes */}
      {!isEducatorRoute && <Navbar />}
      <Routes>
        {/* Student Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/course/:id" element={<CourseDetails />} />
        <Route path="/course-list" element={<CoursesList />} />
        <Route path="/course-list/:input" element={<CoursesList />} />
        <Route path="/my-enrollments" element={<MyEnrollments />} />
        <Route path="/player/:courseId" element={<Player />} />
        <Route path="/loading/:path" element={<Loading />} />
        <Route path="/quizzes" element={<QuizList />} /> {/* New Route */}
        <Route path="/quiz/attempt/:quizId" element={<QuizAttempt />} /> {/* New Route */}

        {/* Educator/Admin Routes */}
        <Route path='/educator' element={<Educator />}>
          <Route path='/educator' element={<Dashboard />} />
          <Route path='add-course' element={<AddCourse />} />
          <Route path='add-quiz' element={<AddQuiz />} /> {/* New Route */}
          <Route path='my-courses' element={<MyCourses />} />
          <Route path='student-enrolled' element={<StudentsEnrolled />} />
          <Route path='admin-panel' element={<AdminPanel />} />
        </Route>
      </Routes>
    </div>
  )
}

export default App