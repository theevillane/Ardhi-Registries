import React, { useState } from "react";
import {
  TextField,
  Button,
  Container,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Link,
} from "@material-ui/core";
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Login as LoginIcon,
} from "@material-ui/icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    setError("");
  };

  const validateForm = () => {
    const { email, password } = formData;
    
    if (!email || !password) {
      setError("Email and password are required");
      return false;
    }
    
    const emailRegex = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError("");

    try {
      const result = await login(formData.email, formData.password);

      if (result.success) {
        // Redirect based on user role
        if (result.user.role === 'government') {
          navigate("/dashboard_govt");
        } else {
          navigate("/dashboard");
        }
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Login failed. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-bg">
      <Container maxWidth="sm" style={{ marginTop: "40px", padding: "20px" }}>
        <Card elevation={3} style={{ backgroundColor: "rgba(255, 255, 255, 0.95)" }}>
          <CardContent style={{ padding: "40px" }}>
            <Box textAlign="center" marginBottom="30px">
              <Typography variant="h4" component="h1" gutterBottom style={{ fontWeight: 600 }}>
                Welcome Back
              </Typography>
              <Typography variant="body1" color="textSecondary">
                Sign in to your account
              </Typography>
            </Box>
            
            {error && (
              <Alert severity="error" style={{ marginBottom: "20px" }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Box marginBottom="20px">
                <TextField
                  fullWidth
                  label="Email Address"
                  placeholder="Enter your email address"
                  type="email"
                  value={formData.email}
                  onChange={handleChange("email")}
                  required
                  InputProps={{
                    startAdornment: <EmailIcon style={{ marginRight: "10px", color: "#666" }} />
                  }}
                />
              </Box>
              
              <Box marginBottom="20px">
                <TextField
                  fullWidth
                  label="Password"
                  placeholder="Enter your password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange("password")}
                  required
                  InputProps={{
                    startAdornment: <LockIcon style={{ marginRight: "10px", color: "#666" }} />
                  }}
                />
              </Box>

              <Divider style={{ margin: "20px 0" }} />

              <Box display="flex" justifyContent="center" marginTop="20px">
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  endIcon={loading ? <CircularProgress size={20} /> : <LoginIcon />}
                  disabled={loading}
                  style={{ minWidth: "200px" }}
                >
                  {loading ? "Signing In..." : "Sign In"}
                </Button>
              </Box>
            </form>

            <Box textAlign="center" marginTop="30px">
              <Typography variant="body2" color="textSecondary">
                Don't have an account?{" "}
                <Link 
                  component="button"
                  variant="body2"
                  onClick={() => navigate("/signup")}
                  style={{ textTransform: "none", fontWeight: 600 }}
                >
                  Create Account
                </Link>
              </Typography>
            </Box>

            <Box textAlign="center" marginTop="20px">
              <Typography variant="body2" color="textSecondary">
                Government Official?{" "}
                <Link 
                  component="button"
                  variant="body2"
                  onClick={() => navigate("/govt_login")}
                  style={{ textTransform: "none", fontWeight: 600 }}
                >
                  Government Login
                </Link>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </div>
  );
}

export default Login;