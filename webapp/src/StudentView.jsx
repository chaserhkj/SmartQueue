import React from "react";
import { Box, Button, Container } from "@material-ui/core";
import { Add, Remove } from "@material-ui/icons";

import StudentList from "./StudentList";
import TAList from "./TAList";
import UserInfo from "./UserInfo";

const DEFAULT_USER = { uid: -1, name: "No Name Provided" };

const StudentView = props => {
  const {user, users, ta_s} = props;

  const handleJoinQueue = () => {
    const msg = { type: "action", action: "add", value: user };
    props.wsSend(JSON.stringify(msg));
  };
  const handleLeaveQueue = () => {
    const msg = { type: "action", action: "remove", value: user };
    props.wsSend(JSON.stringify(msg));
  };

  return (
    <Container maxWidth="sm">
      <title>ECE 468/573 Office Hours Queue</title>
      <h1>ECE 468/573 Office Hours Queue</h1>
      <Box p={1}>
        <p>Please set the same name as your Zoom display name</p>
        <p>Please wait until the Instructor/TA calls you through notification.
          Each notification will have an one-minute wait time for you to join the meeting.</p>
        <p>If you missed the notification, you will be skipped but your place in queue will be preserved, please wait for the next slot and you will be called again.</p>
        <p>If you need some quick communications with the Instructor/TA, please use the chat room below, be aware that these communications would be public to everyone.</p>
      </Box>
      <h3>Your Display Name:</h3>
      {user && (
        <UserInfo
          user={user}
          defaultUser={DEFAULT_USER}
          updateFunction={props.userUpdateFunction}
        />
      )}
      <h3>Currently available TAs:</h3>
      <TAList ta_s={ta_s} />
      <h3>Queue</h3>
      <StudentList users={users} />
      <Box display="flex" flexDirection="row" justifyContent="center">
        <Box p={1}>
          <Button
            onClick={handleJoinQueue}
            color="primary"
            variant="contained"
            startIcon={<Add />}
          >
            Join Queue
          </Button>
        </Box>
        <Box p={1}>
          <Button
            onClick={handleLeaveQueue}
            color="secondary"
            variant="contained"
            startIcon={<Remove />}
          >
            Leave Queue
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default StudentView;
