import React, { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Container,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Paper,
  Grid,
  FormControlLabel,
  Checkbox,
} from "@material-ui/core";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import axios from "axios";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

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
      const response = await axios.post("http://localhost:3001/api/login", formData);

      if (response.data.success) {
        login(response.data.user, response.data.token);
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError("Login failed. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-bg">
      <Container maxWidth="sm" style={{ marginTop: "40px", padding: "20px" }}>
        <Paper elevation={3} style={{ padding: "40px", backgroundColor: "rgba(255, 255, 255, 0.95)" }}>
          <Typography variant="h4" component="h1" align="center" gutterBottom>
            Login
          </Typography>
          
          {error && (
            <Alert severity="error" style={{ marginBottom: "20px" }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email Address"
                  placeholder="Enter Your Email Address"
                  type="email"
                  value={formData.email}
                  onChange={handleChange("email")}
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Password"
                  placeholder="Enter Your Password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange("password")}
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Remember me"
                />
              </Grid>
            </Grid>

            <Box display="flex" justifyContent="center" marginTop="30px">
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                disabled={loading}
                style={{ minWidth: "120px" }}
              >
                {loading ? <CircularProgress size={20} /> : "Login"}
              </Button>
            </Box>
          </form>

          <Box textAlign="center" marginTop="20px">
            <Typography variant="body2">
              Don't have an account?{" "}
              <Button 
                color="primary" 
                onClick={() => navigate("/signup")}
                style={{ textTransform: "none" }}
              >
                Sign up here
              </Button>
            </Typography>
          </Box>

          <Box textAlign="center" marginTop="10px">
            <Button 
              color="secondary" 
              onClick={() => navigate("/govt_login")}
              style={{ textTransform: "none" }}
            >
              Government Login
            </Button>
          </Box>
        </Paper>
      </Container>
    </div>
  );
}

export default Login;