import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Paper,
  InputAdornment,
  CircularProgress,
} from '@mui/material'
import { Person, Lock } from '@mui/icons-material'
import type { AxiosErrorResponse } from '../api'
import { login, getCurrentCustomer } from '../api'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'

export default function Login() {
  const navigate = useNavigate()
  const { setCustomer } = useAuth()
  const { showToast } = useToast()
  const [userName, setUserName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const data = await login({ userName, password })
      const token = data?.token
      if (!token) throw new Error('No token returned')
      // store token in localStorage
      localStorage.setItem('jwt', token)
      // Fetch customer info
      const customer = await getCurrentCustomer()
      setCustomer(customer)
      showToast('Logged in successfully', 'success')
      navigate('/appointments')
    } catch (err) {
      const message = err && typeof err === 'object' && 'response' in err
        ? (err as AxiosErrorResponse).response?.data?.message || (err as AxiosErrorResponse).message
        : err instanceof Error
        ? err.message
        : 'Login error'
      setError(message || 'Login error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Paper
      elevation={8}
      sx={{
        p: 4,
        borderRadius: 3,
        maxWidth: 450,
        width: '100%',
        background: 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)',
      }}
    >
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" color="primary">
          Login
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Enter your credentials to continue
        </Typography>
      </Box>

      <Box component="form" onSubmit={submit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {error && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          fullWidth
          label="Username"
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
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            },
          }}
        />

        <TextField
          fullWidth
          label="Password"
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
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            },
          }}
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={loading || !userName || !password}
          sx={{
            mt: 2,
            py: 1.5,
            borderRadius: 2,
            fontSize: '1.1rem',
            fontWeight: 'bold',
            textTransform: 'none',
            background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
            '&:hover': {
              background: 'linear-gradient(45deg, #1565c0 30%, #1e88e5 90%)',
            },
          }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
        </Button>
      </Box>
    </Paper>
  )
}
