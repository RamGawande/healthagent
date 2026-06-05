import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { GuestProvider } from './context/GuestContext'
import { ThemeProvider } from './context/ThemeContext'
import LandingPage from './components/LandingPage/LandingPage'
import Login from './components/Auth/Login'
import Signup from './components/Auth/Signup'
import ChatLayout from './components/Chat/ChatLayout'
import AdminDashboard from './components/Admin/AdminDashboard'
import Layout from './components/Layout/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import GuestChat from './components/Chat/GuestChat'
import ToastProvider from './components/UI/Toast'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <GuestProvider>
          <ToastProvider />
          <Routes>
            {/* Landing Page - Default */}
            <Route path="/" element={<LandingPage />} />

            {/* Guest chat - No authentication required */}
            <Route
              path="/try"
              element={
                <Layout showHeader={false}>
                  <GuestChat />
                </Layout>
              }
            />

            {/* Auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected routes with layout */}
            <Route
              path="/chat/*"
              element={
                <ProtectedRoute>
                  <Layout showHeader={false}>
                    <ChatLayout />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <Layout showHeader={false}>
                    <AdminDashboard />
                  </Layout>
                </AdminRoute>
              }
            />

            {/* Catch-all route - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </GuestProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
