import React, { Component } from "react";
import Typewriter from "react-typewriter-effect";
import Grid from "@material-ui/core/Grid";
import Button from "@material-ui/core/Button";
import { withRouter } from "react-router-dom"; // Add this import

class Home extends Component {
  constructor(props) {
    super(props);
    // Add console log to check if history is available
    console.log("History available:", !!this.props.history);
  }

  // Add explicit handler methods with error catching
  handleRegisterClick = (e) => {
    e.preventDefault(); // Prevent any default behavior
    console.log("Register button clicked");
    try {
      this.props.history.push("/signup");
    } catch (error) {
      console.error("Navigation error:", error);
      // Fallback navigation method
      window.location.href = "/signup";
    }
  };

  handleLoginClick = (e) => {
    e.preventDefault(); // Prevent any default behavior
    console.log("Login button clicked");
    try {
      this.props.history.push("/login");
    } catch (error) {
      console.error("Navigation error:", error);
      // Fallback navigation method
      window.location.href = "/login";
    }
  };

  render() {
    return (
      <div className="bg">
        <div className="home-text">
          ARDHI REGISTRIES
          <br /> Application
          <div className="typewriter">
            <Typewriter
              cursorColor="#fff"
              multiText={[
                "Trustable, Transparent and Digitized Platform",
                "Open for all! Register Now.",
              ]}
            />
          </div>
          <hr
            style={{
              border: "8px solid #fff",
              width: "150px",
              marginLeft: "0px",
            }}
          />
        </div>
        <div className="home-button">
          <button
            style={{
              marginRight: "15px",
              position: "relative",
              zIndex: 10,
              cursor: "pointer",
            }}
            onClick={this.handleRegisterClick}
          >
            Register
          </button>{" "}
          <button
            style={{
              position: "relative",
              zIndex: 10,
              cursor: "pointer",
            }}
            onClick={this.handleLoginClick}
          >
            Login
          </button>
        </div>
      </div>
    );
  }
}

// Export with Router HOC
export default withRouter(Home);
