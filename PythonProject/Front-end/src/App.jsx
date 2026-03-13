import { useState, useContext } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Questionnaire from './pages/Questionnaire'
import Home from './pages/Home'
import Results from './pages/Results'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LanguageProvider } from './LanguageContext'
import Login from './pages/Login'
import FitTracker from './pages/FitTracker'
import FoodTracker from './pages/FoodTracker'
import SleepTracker from './pages/SleepTracker'
import Wellbeing from './pages/Wellbeing'
import Register from './pages/Register'
import Welcome from './pages/Welcome'
import { AuthProvider, AuthContext } from './AuthContext'
import ProfilePage from './pages/ProfilePage'
import SiteExperienceSurvey from './pages/SiteExperienceSurvey'

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useContext(AuthContext)
  if (!isAuthenticated) return <Navigate to="/" replace />
  return children
}

function RequireQuestionnaire({ children }) {
  const { user } = useContext(AuthContext)
  if (!user) return <Navigate to="/" replace />
  const hasScore = typeof user.totalScore === 'number' && user.totalScore > 0
  if (!user.questionnaireCompleted && !hasScore) return <Navigate to="/welcome" replace />
  return children
}

function BlockQuestionnaireIfDone({ children }) {
  const { user } = useContext(AuthContext)
  if (!user) return <Navigate to="/" replace />
  const hasScore = typeof user.totalScore === 'number' && user.totalScore > 0
  if (user.questionnaireCompleted || hasScore) return <Navigate to="/home" replace />
  return children
}

function RedirectIfLoggedIn({ children }) {
  const { user } = useContext(AuthContext)
  if (user) {
    const hasScore = typeof user.totalScore === 'number' && user.totalScore > 0
    if (hasScore || user.questionnaireCompleted) return <Navigate to="/home" replace />
  }
  return children
}

function App() {
  const [count, setCount] = useState(0)

  const mainPages = [
    { name: 'Home', href: '/home' },
    { name: 'Dieta', href: '/foodtracker' },
    { name: 'AttivitÃ  fisica', href: '/fittracker' },
    { name: 'Sonno', href: '/sleeptracker' },
    { name: 'Benessere', href: '/wellbeing' },
    { name: 'Valuta sito', href: '/site-survey' },
  ]

  const secondaryPages = [
    { name: 'Impostazioni', href: '/settings' },
    { name: 'FAQ', href: '/faq' },
  ]

  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <Navbar mainPages={mainPages} secondaryPages={secondaryPages} />

          <main style={{ paddingTop: 80 }}>
            <Routes>
              <Route path="/" element={<RedirectIfLoggedIn><Login /></RedirectIfLoggedIn>} />
              <Route path="/home" element={<ProtectedRoute><RequireQuestionnaire><Home /></RequireQuestionnaire></ProtectedRoute>} />
              <Route path="/register" element={<Register />} />
              <Route path="/welcome" element={<ProtectedRoute><Welcome /></ProtectedRoute>} />
              <Route path="/questionnaire" element={<ProtectedRoute><BlockQuestionnaireIfDone><Questionnaire /></BlockQuestionnaireIfDone></ProtectedRoute>} />
              <Route path="/results" element={<ProtectedRoute><RequireQuestionnaire><Results /></RequireQuestionnaire></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/fittracker" element={<ProtectedRoute> <FitTracker /></ProtectedRoute>} />
              <Route path="/foodtracker" element={<ProtectedRoute><FoodTracker /></ProtectedRoute>} />
              <Route path="/sleeptracker" element={<ProtectedRoute><SleepTracker /></ProtectedRoute>} />
              <Route path="/wellbeing" element={<ProtectedRoute><Wellbeing/></ProtectedRoute>} />
              <Route path="/site-survey" element={<SiteExperienceSurvey />} />
            </Routes>
          </main>
          <Footer />
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App