import React, { Component } from 'react';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import { Container } from '@material-ui/core';
import SendIcon from '@material-ui/icons/Send';
import { withRouter } from 'react-router-dom';
import Land from '../abis/LandRegistry.json';
import { withStyles } from '@material-ui/core/styles';

const styles = () => ({
  root: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%,-50%)',
    '& .MuiFormLabel-root': {
      color: '#fff',
    },
    '& .MuiInputBase-root': {
      color: '#fff',
    },
    '& .MuiInput-underline:before': {
      borderBottomColor: '#fff',
    },
    '& .MuiInput-underline:after': {
      borderBottomColor: '#fff',
    },
    '& .MuiInput-underline:hover': {
      borderBottomColor: '#fff',
    },
    '& .MuiButton-containedPrimary': {
      backgroundColor: '#328888',
      fontFamily: "'Roboto Condensed', sans-serif",
    },
  },
});

class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      address: '',
      authenticated: false,
      account: null,
      landList: null,
    };
  }

  componentDidMount = async () => {
    const web3 = window.web3;
    const accounts = await web3.eth.getAccounts();
    await window.localStorage.setItem('web3account', accounts[0]);
    this.setState({ account: accounts[0] });

    const networkId = await web3.eth.net.getId();
    const LandData = Land.networks[networkId];
    if (LandData) {
      const landList = new web3.eth.Contract(Land.abi, LandData.address);
      this.setState({ landList });
    } else {
      window.alert('Token contract not deployed to detected network.');
    }

    if (window.localStorage.getItem('authenticated') === 'true') {
      window.location = '/dashboard';
    }
  };

  handleChange = (name) => (event) => {
    this.setState({ [name]: event.target.value });
  };

  handleSubmit = async () => {
    let data = {
      address: this.state.address,
    };
    if (this.state.address) {
      try {
        const user = await this.state.landList.methods
          .getUser(data.address)
          .call();

        if (user && user.exist) {
          window.localStorage.setItem('authenticated', 'true');
          window.location = '/dashboard';
        } else {
          console.log('Login Failed');
          window.localStorage.setItem('authenticated', 'false');
          this.props.history.push('/login');
        }
      } catch (error) {
        console.log('Error:', error);
      }
    } else {
      alert('All fields are required');
    }
  };

  render() {
    const { classes } = this.props;
    return (
      <div className="profile-bg">
        <Container style={{ marginTop: '40px' }} className={classes.root}>
          <div className="login-text">User Login</div>
          <div className="input">
            <TextField
              id="standard-full-width"
              type="address"
              label="Ethereum Address"
              placeholder="Enter your Ethereum Address"
              fullWidth
              value={this.state.address}
              margin="normal"
              InputLabelProps={{
                shrink: true,
              }}
              onChange={this.handleChange('address')}
            />
          </div>

          <div>
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                endIcon={<SendIcon />}
                onClick={this.handleSubmit}
              >
                Login
              </Button>
            </div>
          </div>
          <div
            style={{ marginTop: '20px', textAlign: 'center', color: '#fff' }}
          >
            Don't have an account?{' '}
            <a href="/signup" style={{ color: '#328888' }}>
              Sign Up
            </a>
          </div>
        </Container>
      </div>
    );
  }
}

export default withStyles(styles)(Login);
