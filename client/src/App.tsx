import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, createTheme, CssBaseline, Box, Container, Typography, Grid } from '@mui/material'
import { Pets } from '@mui/icons-material'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './components/Toast'
import ProtectedRoute from './components/ProtectedRoute'
import AppHeader from './components/AppHeader'
import Login from './pages/Login'
import Register from './pages/Register'
import AppointmentsList from './pages/AppointmentsList'

const theme = createTheme({
  direction: 'rtl',
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#2e7d32',
    },
  },
  typography: {
    fontFamily: ['Segoe UI', 'Arial', 'Helvetica', 'sans-serif'].join(','),
  },
})

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Pets sx={{ fontSize: 60, color: 'white', mb: 2 }} />
          <Typography
            variant="h2"
            component="h1"
            sx={{
              color: 'white',
              fontWeight: 'bold',
              mb: 1,
              textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
            }}
          >
            מספרת הכלבים
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: 'rgba(255,255,255,0.9)',
              textShadow: '1px 1px 2px rgba(0,0,0,0.2)',
            }}
          >
            ניהול תורים מקצועי לכלבים
          </Typography>
        </Box>
        <Grid container spacing={4} justifyContent="center">
          {children}
        </Grid>
      </Container>
    </Box>
  )
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route
                path="/login"
                element={
                  <AuthLayout>
                    <Grid item xs={12} sm={6} md={5}>
                      <Login />
                    </Grid>
                    <Grid item xs={12} sm={6} md={5}>
                      <Register />
                    </Grid>
                  </AuthLayout>
                }
              />
              <Route
                path="/register"
                element={
                  <AuthLayout>
                    <Grid item xs={12} sm={6} md={5}>
                      <Login />
                    </Grid>
                    <Grid item xs={12} sm={6} md={5}>
                      <Register />
                    </Grid>
                  </AuthLayout>
                }
              />
              <Route
                path="/appointments"
                element={
                  <ProtectedRoute>
                    <Box
                      sx={{
                        minHeight: '100vh',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      }}
                    >
                      <Container maxWidth="xl" sx={{ py: 3 }}>
                        <AppHeader />
                        <AppointmentsList />
                      </Container>
                    </Box>
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<Navigate to="/appointments" replace />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}
