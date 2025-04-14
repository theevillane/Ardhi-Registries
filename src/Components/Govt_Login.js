// Govt_Login.js (Updated with Hooks, Material-UI v4, Snackbar, and best practices)

import React, { useEffect, useState } from "react";
import {
  TextField,
  Grid,
  Button,
  Container,
  Snackbar,
  makeStyles,
} from "@material-ui/core";
import SendIcon from "@material-ui/icons/Send";
import MuiAlert from "@material-ui/lab/Alert";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Web3 from "web3";
import Land from "../abis/LandRegistry.json";

const useStyles = makeStyles(() => ({
  root: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%,-50%)",
    color: "#fff",
    "& .MuiFormLabel-root": {
      color: "#fff",
    },
    "& .MuiInputBase-root": {
      color: "#fff",
    },
    "& .MuiInput-underline:before": {
      borderBottomColor: "#fff",
    },
    "& .MuiInput-underline:after": {
      borderBottomColor: "#fff",
    },
    "& .MuiInput-underline:hover": {
      borderBottomColor: "#fff",
    },
    "& .MuiButton-containedPrimary": {
      backgroundColor: "#328888",
      fontFamily: "'Roboto Condensed', sans-serif",
    },
  },
}));

function Alert(props) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

const Govt_Login = () => {
  const classes = useStyles();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [account, setAccount] = useState("");
  const [landList, setLandList] = useState(null);

  useEffect(() => {
    const initWeb3 = async () => {
      if (window.localStorage.getItem("authenticated") === "true") {
        navigate("/dashboard_govt");
        return;
      }

      if (window.ethereum) {
        const web3 = new Web3(window.ethereum);
        try {
          await window.ethereum.request({ method: "eth_requestAccounts" });
          const acc = await window.localStorage.getItem("web3account");
          setAccount(acc);

          const networkId = await web3.eth.net.getId();
          const LandData = Land.networks[networkId];

          if (LandData) {
            const landInstance = new web3.eth.Contract(
              Land.abi,
              LandData.address
            );
            setLandList(landInstance);
          } else {
            setSnackbar({
              open: true,
              message: "Token contract not found on this network",
              severity: "error",
            });
          }
        } catch (error) {
          setSnackbar({
            open: true,
            message: "Web3 initialization failed",
            severity: "error",
          });
          console.error(error);
        }
      } else {
        setSnackbar({
          open: true,
          message: "Please install MetaMask",
          severity: "warning",
        });
      }
    };

    initWeb3();
  }, [navigate]);

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) {
      setSnackbar({
        open: true,
        message: "All fields are required",
        severity: "warning",
      });
      return;
    }

    const data = { username, password };
    const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

    try {
      const response = await axios.post(`${API_URL}/login`, data);

      if (response.status === 200) {
        setSnackbar({
          open: true,
          message: "Login Successful",
          severity: "success",
        });
        window.localStorage.setItem("authenticated", true);
        window.localStorage.setItem("token", response.data);

        setUsername("");
        setPassword("");

        setTimeout(() => navigate("/dashboard_govt"), 1000);
      } else {
        throw new Error("Invalid credentials");
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message:
          error.response?.data?.message || error.message || "Login failed",
        severity: "error",
      });
    }
  };

  return (
    <div className="profile-bg">
      <Container style={{ marginTop: "40px" }} className={classes.root}>
        <div className="login-text">Government Portal</div>
        <div className="input">
          <TextField
            label="Username"
            fullWidth
            value={username}
            margin="normal"
            placeholder="Enter Your Username"
            InputLabelProps={{ shrink: true }}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            value={password}
            margin="normal"
            placeholder="Enter Your Password"
            InputLabelProps={{ shrink: true }}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <Button
            variant="contained"
            color="primary"
            endIcon={<SendIcon />}
            onClick={handleSubmit}
          >
            Login
          </Button>
        </div>
      </Container>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </div>
  );
};

export default Govt_Login;
