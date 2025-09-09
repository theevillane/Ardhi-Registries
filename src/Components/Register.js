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
} from "@material-ui/core";
import SendIcon from "@material-ui/icons/Send";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useWeb3 } from "../App";
import { useAuth } from "../App";
import Land from "../abis/LandRegistry.json";

function Register() {
  const navigate = useNavigate();
  const { web3, account } = useWeb3();
  const { login } = useAuth();
  
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
    
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Register user in database
      const response = await axios.post("http://localhost:3001/api/signup", {
        ...formData,
        walletAddress: formData.address
      });

      if (response.data.success) {
        // Register user on blockchain
        if (web3) {
          const networkId = await web3.eth.net.getId();
          const LandData = Land.networks[networkId];
          
          if (LandData) {
            const landContract = new web3.eth.Contract(Land.abi, LandData.address);
            
            await landContract.methods
              .registerUser(
                formData.address,
                formData.name,
                formData.contact,
                formData.email,
                formData.postalCode,
                formData.city
              )
              .send({ from: account, gas: 1000000 })
              .on("receipt", (receipt) => {
                console.log("User registered on blockchain:", receipt);
                setSuccess("Registration successful! You can now login.");
                
                // Auto-login after successful registration
                login(response.data.user, response.data.token);
                navigate("/dashboard");
              })
              .on("error", (error) => {
                console.error("Blockchain registration error:", error);
                setError("Database registration successful, but blockchain registration failed. Please try again.");
              });
          } else {
            setError("Smart contract not deployed to detected network");
          }
        } else {
          setError("Web3 not available. Please install MetaMask.");
        }
      }
    } catch (error) {
      console.error("Registration error:", error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError("Registration failed. Please try again later.");
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
            Register Here
          </Typography>
          
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

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Name"
                  placeholder="Enter Your Name"
                  value={formData.name}
                  onChange={handleChange("name")}
                  required
                />
              </Grid>
              
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
                  label="Contact Number"
                  placeholder="Enter Your Contact Number"
                  value={formData.contact}
                  onChange={handleChange("contact")}
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Ethereum Address"
                  placeholder="Enter Your Ethereum Address"
                  value={formData.address}
                  onChange={handleChange("address")}
                  required
                  helperText={account ? "Connected wallet address" : "Please connect your wallet"}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="City"
                  placeholder="Enter Your City"
                  value={formData.city}
                  onChange={handleChange("city")}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Postal Code"
                  placeholder="Enter Your Postal Code"
                  value={formData.postalCode}
                  onChange={handleChange("postalCode")}
                  required
                />
              </Grid>
            </Grid>

            <Box display="flex" justifyContent="center" marginTop="30px">
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                endIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                disabled={loading || !account}
              >
                {loading ? "Registering..." : "Sign Up"}
              </Button>
            </Box>
          </form>

          <Box textAlign="center" marginTop="20px">
            <Typography variant="body2">
              Already have an account?{" "}
              <Button 
                color="primary" 
                onClick={() => navigate("/login")}
                style={{ textTransform: "none" }}
              >
                Login here
              </Button>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </div>
  );
}

export default Register;
