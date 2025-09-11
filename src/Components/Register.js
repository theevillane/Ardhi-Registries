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
  Card,
  CardContent,
  Divider,
} from "@material-ui/core";
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  AccountBalanceWallet as WalletIcon,
  LocationOn as LocationIcon,
  Send as SendIcon,
} from "@material-ui/icons";
import { useNavigate } from "react-router-dom";
import { useWeb3 } from "../contexts/Web3Context";
import { useAuth } from "../contexts/AuthContext";

function Register() {
  const navigate = useNavigate();
  const { account, isConnected, connectWallet, isConnecting, error: web3Error } = useWeb3();
  const { register } = useAuth();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contact: "",
    address: "",
    postalCode: "",
    city: "",
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (account) {
      setFormData(prev => ({ ...prev, address: account }));
    }
  }, [account]);

  const handleChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    setError("");
  };

  const validateEmail = (email) => {
    const reg = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
    return reg.test(email);
  };

  const validateForm = () => {
    const { name, email, contact, address, postalCode, city } = formData;
    
    if (!name || !email || !contact || !address || !postalCode || !city) {
      setError("All fields are required");
      return false;
    }
    
    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return false;
    }
    
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      setError("Please enter a valid Ethereum wallet address");
      return false;
    }
    
    if (!/^[\+]?[1-9][\d]{0,15}$/.test(contact)) {
      setError("Please enter a valid contact number");
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!validateForm()) return;
    
    if (!isConnected) {
      setError("Please connect your wallet first");
      return;
    }
    
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await register({
        ...formData,
        walletAddress: formData.address
      });

      if (result.success) {
        setSuccess("Registration successful! Redirecting to dashboard...");
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError("Registration failed. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-bg">
      <Container maxWidth="md" style={{ marginTop: "40px", padding: "20px" }}>
        <Card elevation={3} style={{ backgroundColor: "rgba(255, 255, 255, 0.95)" }}>
          <CardContent style={{ padding: "40px" }}>
            <Box textAlign="center" marginBottom="30px">
              <Typography variant="h4" component="h1" gutterBottom style={{ fontWeight: 600 }}>
                Create Your Account
              </Typography>
              <Typography variant="body1" color="textSecondary">
                Join the decentralized land registry system
              </Typography>
            </Box>
            
            {error && (
              <Alert severity="error" style={{ marginBottom: "20px" }}>
                {error}
              </Alert>
            )}
            
            {success && (
              <Alert severity="success" style={{ marginBottom: "20px" }}>
                {success}
              </Alert>
            )}

            {web3Error && (
              <Alert severity="warning" style={{ marginBottom: "20px" }}>
                {web3Error}
              </Alert>
            )}

            {!isConnected && (
              <Box textAlign="center" marginBottom="20px">
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={connectWallet}
                  disabled={isConnecting}
                  startIcon={isConnecting ? <CircularProgress size={20} /> : <WalletIcon />}
                  size="large"
                >
                  {isConnecting ? "Connecting..." : "Connect Wallet"}
                </Button>
                <Typography variant="body2" color="textSecondary" style={{ marginTop: "10px" }}>
                  Please connect your MetaMask wallet to continue
                </Typography>
              </Box>
            )}

            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange("name")}
                    required
                    InputProps={{
                      startAdornment: <PersonIcon style={{ marginRight: "10px", color: "#666" }} />
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
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
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Contact Number"
                    placeholder="Enter your contact number"
                    value={formData.contact}
                    onChange={handleChange("contact")}
                    required
                    InputProps={{
                      startAdornment: <PhoneIcon style={{ marginRight: "10px", color: "#666" }} />
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Ethereum Wallet Address"
                    placeholder="Your wallet address will appear here"
                    value={formData.address}
                    onChange={handleChange("address")}
                    required
                    disabled={isConnected}
                    helperText={isConnected ? "Connected wallet address" : "Connect your wallet to auto-fill"}
                    InputProps={{
                      startAdornment: <WalletIcon style={{ marginRight: "10px", color: "#666" }} />
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="City"
                    placeholder="Enter your city"
                    value={formData.city}
                    onChange={handleChange("city")}
                    required
                    InputProps={{
                      startAdornment: <LocationIcon style={{ marginRight: "10px", color: "#666" }} />
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Postal Code"
                    placeholder="Enter your postal code"
                    value={formData.postalCode}
                    onChange={handleChange("postalCode")}
                    required
                  />
                </Grid>
              </Grid>

              <Divider style={{ margin: "30px 0" }} />

              <Box display="flex" justifyContent="center" marginTop="20px">
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  endIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                  disabled={loading || !isConnected}
                  style={{ minWidth: "200px" }}
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </Button>
              </Box>
            </form>

            <Box textAlign="center" marginTop="30px">
              <Typography variant="body2" color="textSecondary">
                Already have an account?{" "}
                <Button 
                  color="primary" 
                  onClick={() => navigate("/login")}
                  style={{ textTransform: "none", fontWeight: 600 }}
                >
                  Sign In
                </Button>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </div>
  );
}

export default Register;
