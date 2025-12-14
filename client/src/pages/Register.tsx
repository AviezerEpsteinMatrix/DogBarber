import { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Paper,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import { Person, Lock, Email, Badge } from "@mui/icons-material";
import type { AxiosErrorResponse } from "../api";
import { register } from "../api";
import { useToast } from "../components/Toast";

export default function Register() {
  const { showToast } = useToast();
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await register({ userName, email, password, firstName });
      setSuccess("ההרשמה הצליחה! כעת תוכל להתחבר.");
      showToast("ההרשמה הצליחה!", "success");
      // Reset form
      setUserName("");
      setEmail("");
      setPassword("");
      setFirstName("");
    } catch (err) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as AxiosErrorResponse).response?.data?.message ||
            (err as AxiosErrorResponse).message
          : err instanceof Error
          ? err.message
          : "ההרשמה נכשלה";
      const errorMessage = message || "ההרשמה נכשלה";
      setError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper
      elevation={8}
      sx={{
        p: 4,
        borderRadius: 3,
        maxWidth: 450,
        width: "100%",
        background: "linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)",
      }}
    >
      <Box sx={{ mb: 3, textAlign: "center" }}>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          fontWeight="bold"
          color="primary"
        >
          הרשמה
        </Typography>
        <Typography variant="body2" color="text.secondary">
          צור חשבון חדש כדי להתחיל
        </Typography>
      </Box>

      <Box
        component="form"
        onSubmit={submit}
        sx={{ display: "flex", flexDirection: "column", gap: 2 }}
      >
        {error && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ borderRadius: 2 }}>
            {success}
          </Alert>
        )}

        <TextField
          fullWidth
          label="שם משתמש"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          required
          disabled={loading}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Person color="action" />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
            },
          }}
        />

        <TextField
          fullWidth
          label="שם פרטי"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
          disabled={loading}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Badge color="action" />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
            },
          }}
        />

        <TextField
          fullWidth
          label="אימייל"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Email color="action" />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
            },
          }}
        />

        <TextField
          fullWidth
          label="סיסמה"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Lock color="action" />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
            },
          }}
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={loading || !userName || !email || !password || !firstName}
          sx={{
            mt: 2,
            py: 1.5,
            borderRadius: 2,
            fontSize: "1.1rem",
            fontWeight: "bold",
            textTransform: "none",
            background: "linear-gradient(45deg, #2e7d32 30%, #4caf50 90%)",
            "&:hover": {
              background: "linear-gradient(45deg, #1b5e20 30%, #388e3c 90%)",
            },
          }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : "הירשם"}
        </Button>
      </Box>
    </Paper>
  );
}
