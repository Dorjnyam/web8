import React, { useState } from "react";
import { Button, Dialog, DialogContent, DialogContentText, TextField, DialogActions, Chip } from "@material-ui/core";
import "./commentDialog.css";
import axios from "axios";
import { MentionsInput, Mention } from 'react-mentions'

function CommentDialog(props) {
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState("");

  const handleClickOpen = () => setOpen(true);
  const handleClickClose = () => setOpen(false);
  const handleCommentChange = (event, newValue, newPlainTextValue, mentions) => {
    setComment(newPlainTextValue);  // Adjusted to work with react-mentions
  };

  const handleCommentSubmit = () => {
    const commentText = comment;
    setComment("");
    setOpen(false);

    axios
      .post(`/commentsOfPhoto/${props.photo_id}`, { comment: commentText })
      .then(() => props.onCommentSumbit())
      .catch(err => console.log("Comment Sent Failure: ", err));
  };

  const renderUserSuggestion = (suggestion, search, highlightedDisplay, index, focused) => (
    <div className={`${focused ? 'focused' : ''}`}>
      {highlightedDisplay}
    </div>
  );

  return (
    <div className="comment-dialog">
      <Chip label="Reply" onClick={handleClickOpen} style={{ backgroundColor: "#abd1c6", border: "1px solid black" }} />
      {/* onClose: when mouse click outside of the dialog box, then close the dialog */}
      <Dialog open={open} onClose={handleClickClose} >
        <DialogContent>
          <DialogContentText>Add a comment...</DialogContentText>
          <MentionsInput 
            value={comment} 
            onChange={handleCommentChange} 
            style={{ minWidth: '100%' }} // Styles need to be adjusted based on your CSS
          >
            <Mention
              trigger="@"
              data={props.users} // Ensure this prop is structured correctly
              renderSuggestion={renderUserSuggestion}
            />
            <Mention
              trigger="#"
              data={props.tags} // You need to provide tag data similar to user data
              renderSuggestion={renderUserSuggestion}
            />
          </MentionsInput>
          {/* <TextField value={comment} onChange={handleCommentChange} autoFocus multiline margin="dense" fullWidth /> */}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClickClose}>Cancel</Button>
          <Button onClick={handleCommentSubmit} style={{ backgroundColor: "#f9bc60", border: "1px solid black" }}>Submit</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default CommentDialog;