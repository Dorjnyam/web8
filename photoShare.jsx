import React, { useState } from "react";
import ReactDOM from 'react-dom';
import { HashRouter, Route, Switch, Redirect } from 'react-router-dom';
import { Grid, Paper } from '@material-ui/core';
import './styles/main.css';

import TopBar from './components/topBar/TopBar';
import UserDetail from './components/userDetail/userDetail';
import UserList from './components/userList/userList';
import UserPhotos from './components/userPhotos/userPhotos';
import LoginRegister from './components/loginRegister/loginRegister';

function PhotoShare() {
  const [photoIsUploaded, setPhotoIsUploaded] = useState(false);
  const [userName, setUserName] = useState(null);
  const [loginUser, setLoginUser] = useState();

  const handleUserNameChange = name => {
    console.log("Setting Viewing User to: ", name);
    setUserName(name);
  };

  const handleLoginUserChange = user => {
    console.log("Setting login user to: ", user);
    setLoginUser(user);
  };

  const handlePhotoUpload = () => {
    setPhotoIsUploaded(true);
    setPhotoIsUploaded(false);
  };

  return (
    <HashRouter>
      <div>
        <Grid container spacing={1}>
          {/* TopBar View */}
          <Grid item xs={12}>
            <TopBar
              onLoginUserChange={handleLoginUserChange}
              onPhotoUpload={handlePhotoUpload}
              userName={userName}
              loginUser={loginUser}
            />
          </Grid>
          <div className="cs142-main-topbar-buffer" />
          {/* Sidebar View */}
          <Grid item sm={3} >
            <Paper className="side-bar" elevation={3} style={{ backgroundColor: "BFE7F7", margin: '3%', border: "1px solid black" }}>
              <UserList loginUser={loginUser} />
            </Paper>
          </Grid>
          {/* Main View */}
          <Grid item sm={9} >
            <Paper className="cs142-main-grid-item" elevation={3} style={{ backgroundColor: "#BFE7F7", height: '100%', marginTop: '1%', marginRight: '2%', border: "1px solid black" }}>
              {/* ALl unauthorized visit would go to login page */}
              <Switch>
                {/* User detail View */}
                <Route path="/users/:userId">
                  {props => (
                    <UserDetail
                      {...props}
                      onUserNameChange={handleUserNameChange}
                      onLoginUserChange={handleLoginUserChange}
                      loginUser={loginUser}
                    />
                  )}
                </Route>
                {/* User photo View */}
                <Route path="/photos/:userId">
                  {props => (
                    <UserPhotos
                      {...props}
                      onUserNameChange={handleUserNameChange}
                      onLoginUserChange={handleLoginUserChange}
                      loginUser={loginUser}
                      photoIsUploaded={photoIsUploaded}
                    />
                  )}
                </Route>
                {/* Login/Register View */}
                <Route path="/login-register">
                  <LoginRegister
                    onLoginUserChange={handleLoginUserChange}
                    loginUser={loginUser}
                  />
                </Route>
                {/* Defaulted View for all the other addresses */}
                <Route>
                  <Redirect to={`/login-register`} />
                </Route>
              </Switch>
            </Paper>
          </Grid>

        </Grid>
      </div>
    </HashRouter>
  );
}

ReactDOM.render(<PhotoShare />, document.getElementById('photoshareapp'));