import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Snackbar,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@material-ui/core";
import "./TopBar.css";
import axios from "axios";
import { CloudUpload, ExitToApp, CloseRounded } from "@material-ui/icons";
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';

function TopBar(props) {
  const [uploadInput, setUploadInput] = useState(null);
  const [logoutPrompt, setlogoutPrompt] = useState(null);

  const [alertPromptOpen, setAlertPromptOpen] = useState(false);
  const handleAlertOpen = () => setAlertPromptOpen(true);
  const handleAlertClose = () => setAlertPromptOpen(false);

  const axios_logoutUser = () => {
    axios
      .post("/admin/logout")
      .then(response => {
        if (response.status === 200) {
          console.log("** TopBar: log out OK **");
          props.onLoginUserChange(null);
        }
      })
      .catch(err => console.log("Error: logout error in posting", err.message));
  };

  const axios_sendPhoto = domForm => {
    axios
      .post("photos/new", domForm)
      .then(response => {
        if (response.status === 200) {
          props.onPhotoUpload();
          console.log("** TopBar: photo successfully uploaded **");
        }
      })
      .catch(err => console.log("Error: photo uploaded error ", err));
  };

  useEffect(() => {
  });

  const handleImageUpload = event => {
    event.preventDefault();
    let reader = new FileReader();
    let file = event.target.files[0];
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setUploadInput(file);
    };
  };

  const handlePhotoSubmit = event => {
    event.preventDefault();
    const imageToSend = uploadInput;
    setUploadInput(null);

    if (imageToSend.size > 0) {

      const domForm = new FormData();
      domForm.append("uploadedphoto", imageToSend);
      axios_sendPhoto(domForm);
    }
  };

  const handleLogoutPromptClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setlogoutPrompt(false);
  };

  const handleLogoutPromptClick = () => {
    axios_logoutUser();
    setlogoutPrompt(true);
  };

  const handleDeleteClick = () => {
    setAlertPromptOpen(false);
    axios
      .post(`/deleteUser/${props.loginUser.id}`)
      .then(response => {
        if (response.status === 200) {
          console.log("** TopBar: Delete Account OK **");
          handleLogoutPromptClick();
        }
      })
      .catch(err => console.log("Delete account error: ", err.message));
  };

  return (
    <AppBar
      className="cs142-topbar-appBar"
      position="fixed"
    >
      <Toolbar>
        {/* App name and Version */}
        <Typography variant="h5" style={{ flexGrow: 1 }}>
          IG2
        </Typography>
        {/* Display greeting to Login User*/}
        <Typography variant="h5" style={{ flexGrow: 1 }}>
          {console.log("Login user in TopBar: ", props)}
          {props.loginUser
            ? `Hello ${props.loginUser.first_name}!`
            : "Please Login"}
        </Typography>
        {/* Display 'photos of' or 'Info of' of the viewing user's name */}
        {props.loginUser && (
          <Typography variant="h5">
            {window.location.href.includes("/photos/") && "Photos of "}
            {window.location.href.includes("/users/") && "Info of "}
            {props.userName}
          </Typography>
        )}
        {/* Photo upload Button */}
        {props.loginUser && (
          <form onSubmit={handlePhotoSubmit} style={{ flexGrow: 1 }}>
            <Button
              component="label"
              title="Add a photo"
              style={{ color: "#f9bc60" }}
            >
              Add photo
              <input
                hidden
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </Button>
            {/* Show upload button only when image is selected */}
            {uploadInput && (
              <IconButton type="submit">
                <CloudUpload style={{ color: "#fec7d7" }} fontSize="large" />
              </IconButton>
            )}
          </form>
        )}
        <React.Fragment>
          <IconButton title="Log out your account" onClick={handleLogoutPromptClick} variant="contained" >
            <ExitToApp style={{ color: "#e16162" }} fontSize="large" />
          </IconButton>
          <Snackbar
            open={logoutPrompt}
            onClose={handleLogoutPromptClose}
            autoHideDuration={5000}
            message="You are currently logged out."
            action={(
              <IconButton color="secondary" onClick={handleLogoutPromptClose}>
                <CloseRounded />
              </IconButton>
            )}
          />
        </React.Fragment>
        {props.loginUser && (
          <React.Fragment>
            <IconButton title="Delete your account forever" onClick={handleAlertOpen} variant="contained" >
              <DeleteForeverIcon style={{ color: "red" }} fontSize="large" />
            </IconButton>
            <Dialog
              open={alertPromptOpen}
              onClose={handleAlertClose}
              aria-labelledby="alert-dialog-title"
              aria-describedby="alert-dialog-description"
            >
              <DialogTitle id="alert-dialog-title">
                {"Deleting an Account"}
              </DialogTitle>
              <DialogContent>
                <DialogContentText id="alert-dialog-description">
                  {`Delete ${props.loginUser.first_name} ${props.loginUser.last_name}'s account?`}
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleAlertClose} autoFocus color="primary" variant="contained">Cancel</Button>
                <Button onClick={handleDeleteClick} color="secondary">Delete</Button>
              </DialogActions>
            </Dialog>
          </React.Fragment>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default TopBar;