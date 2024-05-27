import React, { useState, useEffect } from "react";
import { Link, Redirect } from "react-router-dom";
import {
  List,
  Divider,
  Typography,
  Grid,
  Avatar,
  Card,
  CardHeader,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  IconButton,
} from "@material-ui/core";
import DeleteOutlineIcon from '@material-ui/icons/DeleteOutline';
import { ThumbUp, ThumbUpOutlined } from "@material-ui/icons";
import "./userPhotos.css";
import axios from "axios";
import CommentDialog from "../commentDialog/commentDialog";

function UserPhotos(props) {
  const [user, setUser] = useState(null);
  const [photos, setPhotos] = useState(null);

  const axios_fetch_user = userID => {

    axios.get(`/user/${userID}`)
      .then(response => {
        setUser(response.data);
        props.onUserNameChange(response.data.first_name + " " + response.data.last_name);
        props.onLoginUserChange({
          first_name: response.data.logged_user_first_name,
          last_name: response.data.logged_user_last_name,
          id: response.data.logged_user_id
        });
      })
      .catch(err => console.log("/user/ Error: ", err));
  };

  const axios_fetch_photos = userID => {

    axios.get(`/photosOfUser/${userID}`)
      .then(response => {
        console.log("Printing photos of user: ", response.data);
        setPhotos(response.data);
      })
      .catch(err => console.log("/photosOfUser/ Error: ", err));
  };

  useEffect(() => {
    axios_fetch_user(props.match.params.userId);
  }, [props.match.params.userId]);

  useEffect(() => {
    axios_fetch_photos(props.match.params.userId);
  }, [props.photoIsUploaded]);

  const handleCommentSumbit = () => {
    axios_fetch_user(props.match.params.userId);
    axios_fetch_photos(props.match.params.userId);
    console.log("Submit was pressed, re-rendering photos and comments");
  };

  const axios_post_handle = (url, info, errMsg) => {
    axios.post(url, info)
      .then(() => axios_fetch_photos(props.match.params.userId))
      .catch(err => console.log(errMsg, err));
  };

  const handlePhotoLike = photo_id => {
    axios_post_handle(`/like/${photo_id}`, { action: props.loginUser.id }, "Like Update Failure: ");
  };

  const handlePhotoDelete = photo_id => {
    axios_post_handle(`/deletePhoto/${photo_id}`, {}, "Photo Delete Failure: ");
  };

  const handleCommentDetele = (comment_id, photo_id) => {
    axios_post_handle(`/deleteComment/${comment_id}`, { photo_id: photo_id }, "Comment Delete Failure: ");
  };

  const convertDate = isoDate => {
    const date = new Date(isoDate);
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  };

  const likedByLoginUser = photo => {
    for (let i = 0; i < photo.likes.length; i++) {
      if (photo.likes[i]._id === props.loginUser.id) return true;
    }
    return false;
  };

  const likesNameList = photo => {
    const nameList = photo.likes.map(like => {
      let name = like.first_name + " " + like.last_name;
      return name;
    });
    return nameList;
  };

  if (props.loginUser || !user || !photos) {

    return (user && (
      <Grid container justifyContent="flex-start" spacing={3}>
        {/* If user has photos posted: Loop through all the photos, if user has posted photos */}
        {photos && photos.map(photo => (
          /* Each photo's layout */
          <Grid item xs={4} key={photo._id}>
            <Card style={{ border: "1px solid black" }}>
              {/* Each photo's author avatar, name, post date, and delete button */}
              <CardHeader
                avatar={(
                  <Avatar style={{ backgroundColor: "#FF7F50", border: "1px solid black" }}>
                    {user.first_name[0]}
                  </Avatar>
                )}
                title={(
                  <Link to={`/users/${user._id}`}>
                    <Typography>{`${user.first_name} ${user.last_name}`}</Typography>
                  </Link>
                )}
                subheader={photo.date_time}
                action={props.loginUser.id === user._id && (
                  <IconButton title="Remove the photo" onClick={() => handlePhotoDelete(photo._id)}>
                    <DeleteOutlineIcon />
                  </IconButton>
                )}
              />
              {/* Each photo's filename */}
              <CardMedia
                component="img"
                image={`./images/${photo.file_name}`}
                alt="Anthor Post"
              />
              {/* Like by users Info */}
              <Typography variant="button" style={{ marginLeft: "6px", textTransform: "none" }}>
                {photo.likes.length > 0 ?
                  `Liked by ${likesNameList(photo).map(name => name).join(", ")}` : ``}
              </Typography>
              {/* Like button */}
              <CardActions style={{ paddingBottom: "0" }}>
                <Button onClick={() => handlePhotoLike(photo._id)} style={{ margin: "0 auto" }}>
                  {likedByLoginUser(photo) ? <ThumbUp color="secondary" /> : <ThumbUpOutlined color="action" />}
                  <Typography variant="button" style={{ marginLeft: "5px" }} >
                    {photo.likes.length}
                  </Typography>
                </Button>
              </CardActions>
              {/* Comments' layout */}
              <CardContent style={{ paddingTop: "0" }}>
                {/* Loop through all comments under the photo */}
                {photo.comments && (
                  <Typography variant="subtitle1">
                    Comments:
                    <Divider />
                  </Typography>
                )}
                {photo.comments.map(c => (
                  <List key={c._id}>
                    <Typography variant="subtitle2">
                      <Link to={`/users/${c.user._id}`}>
                        {`${c.user.first_name} ${c.user.last_name}`}
                      </Link>
                    </Typography>
                    <Typography
                      variant="caption"
                      color="textSecondary"
                      gutterBottom
                    >
                      {convertDate(c.date_time)}
                      {/* Button for removing each comment */}
                      {props.loginUser.id === c.user._id && (
                        <IconButton title="Delete the comment" onClick={() => handleCommentDetele(c._id, photo._id)}>
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Typography>
                    <Typography variant="body1">
                      {`"${c.comment}"`}
                    </Typography>
                  </List>
                ))}
                {/* Comment dialog box */}
                <CommentDialog
                  onCommentSumbit={handleCommentSumbit}
                  photo_id={photo._id}
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
        {/* If user has NO photos posted: Display a prompt if user has NOT yet posted any photos */}
        {!photos && (
          <Grid item xs={12}>
            {console.log("Login User: ", props.loginUser)}
            {console.log("Photos: ", photos)}
            {console.log("Viewing User: ", user)}
            {/* minHeight: "80vh": vertically center the text */}
            <Grid container justifyContent="center" alignItems="center" style={{ minHeight: "80vh" }}>
              <Typography>
                This user has not posted any photos yet.
              </Typography>
            </Grid>
          </Grid>
        )}
      </Grid>
    )
    );
  }

  return <Redirect to={`/login-register`} />;
}

export default UserPhotos;