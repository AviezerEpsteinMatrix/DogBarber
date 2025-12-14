import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material'
import { Logout, Pets } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from './Toast'
import { dictionary } from '../dictionary'

export default function AppHeader() {
  const navigate = useNavigate()
  const { customer, logout } = useAuth()
  const { showToast } = useToast()

  const handleLogout = () => {
    logout()
    showToast(dictionary.loggedOutSuccessfully, 'info')
    navigate('/login')
  }

  return (
    <AppBar position="static" sx={{ mb: 3, borderRadius: 2 }}>
      <Toolbar>
        <Pets sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {dictionary.dogBarber}
        </Typography>
        {customer && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2">
              {dictionary.hello}, {customer.firstName} ({customer.userName})
            </Typography>
            <Button color="inherit" startIcon={<Logout />} onClick={handleLogout}>
              {dictionary.logout}
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  )
}

