import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { List, ListItem, ListItemText, ListItemIcon, Typography, Divider, Avatar } from "@material-ui/core";
import "./userList.css";
import axios from "axios";

function UserList(props) {

  const [users, setUser] = useState(null);
  const [selectedButtonIndex, setSelectedButtonIndex] = useState(null);

  const axios_fetchUser = () => {
    axios
      .get("http://localhost:3000/user/list")
      .then(response => {
        console.log("** UserList: fetched User List **");
        setUser(response.data);
      })
      .catch(error => {
        console.log(`** UserList Error: ${error.message} **`);
      });
  };

  useEffect(() => {
    axios_fetchUser();
  }, [props.loginUser]);

  const handleClick = index => setSelectedButtonIndex(index);

  let userList;

  if (users && props.loginUser) {
    userList = users.map((user, index) => (
      <React.Fragment key={index}>
        <ListItem
          to={`/users/${user._id}`}
          component={Link} onClick={() => handleClick(index)}
          button
          style={{
            backgroundColor: selectedButtonIndex === index ? "#BFE7F7" : "",
            color: selectedButtonIndex === index ? "#ffff" : ""
          }}
        >
          {/* Selected style for button icons */}
          {
            selectedButtonIndex === index ?
              <ListItemIcon>
                <Avatar style={{ backgroundColor: "#1976d2", color: "#ffff" }}>
                  {user.first_name[0]}{user.last_name[0]}
                </Avatar>
              </ListItemIcon> :
              <ListItemIcon>
                <Avatar>
                  {user.first_name[0]}{user.last_name[0]}
                </Avatar>
              </ListItemIcon>
          }
          <ListItemText primary={
            <Typography variant="h6">{user.first_name + " " + user.last_name + (props.loginUser.id === user._id ? " (Me)" : "")}</Typography>
          } />
        </ListItem>
        <Divider />
      </React.Fragment>
    ));
  }

  return <List component="nav">{userList}</List>;
}

export default UserList;