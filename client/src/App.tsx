import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  Container,
  Typography,
} from "@mui/material";
import { Pets } from "@mui/icons-material";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./components/Toast";
import ProtectedRoute from "./components/ProtectedRoute";
import AppHeader from "./components/AppHeader";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AppointmentsList from "./pages/AppointmentsList";
import { heIL } from "@mui/x-date-pickers/locales";

import { CacheProvider } from "@emotion/react";
import { rtlCache } from "./rtlCache";

const theme = createTheme(
  {
    palette: {
      primary: { main: "#1976d2" },
      secondary: { main: "#2e7d32" },
    },
    typography: {
      fontFamily: ["Segoe UI", "Arial", "Helvetica", "sans-serif"].join(","),
    },
    direction: "rtl",
  },
  heIL
);

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Pets sx={{ fontSize: 60, color: "white", mb: 2 }} />
          <Typography
            variant="h2"
            component="h1"
            sx={{
              color: "white",
              fontWeight: "bold",
              mb: 1,
              textShadow: "2px 2px 4px rgba(0,0,0,0.2)",
            }}
          >
            מספרת כלבים
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: "rgba(255,255,255,0.9)",
              textShadow: "1px 1px 2px rgba(0,0,0,0.2)",
            }}
          >
            ניהול תורים מקצועי למספרת כלבים
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: 4,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {children}
        </Box>
      </Container>
    </Box>
  );
}

export default function App() {
  // Ensure the document is RTL as well
  React.useEffect(() => {
    document.documentElement.dir = "rtl";
    document.documentElement.lang = "he";
  }, []);

  return (
    <CacheProvider value={rtlCache}>
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
                      <Box
                        sx={{
                          minWidth: { xs: "100%", sm: "400px", md: "450px" },
                        }}
                      >
                        <Login />
                      </Box>
                      <Box
                        sx={{
                          minWidth: { xs: "100%", sm: "400px", md: "450px" },
                        }}
                      >
                        <Register />
                      </Box>
                    </AuthLayout>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <AuthLayout>
                      <Box
                        sx={{
                          minWidth: { xs: "100%", sm: "400px", md: "450px" },
                        }}
                      >
                        <Login />
                      </Box>
                      <Box
                        sx={{
                          minWidth: { xs: "100%", sm: "400px", md: "450px" },
                        }}
                      >
                        <Register />
                      </Box>
                    </AuthLayout>
                  }
                />
                <Route
                  path="/appointments"
                  element={
                    <ProtectedRoute>
                      <Box
                        sx={{
                          minHeight: "100vh",
                          background:
                            "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
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
                <Route
                  path="/"
                  element={<Navigate to="/appointments" replace />}
                />
              </Routes>
            </ToastProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </CacheProvider>
  );
}
