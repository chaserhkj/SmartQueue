import React, { useEffect, useState } from "react";
import { Box, Container, TextField, Button, Switch } from "@material-ui/core";
import Cookies from "js-cookie";
import { toast } from "react-toastify";

import StudentList from "./StudentList";
import UserInfo from "./UserInfo";
import FieldEditor from "./FieldEditor";

const DEFAULT_USER = { uid: -1, name: "No Name Provided" };

const TAView = props => {
  const [meetingLink, setMeetingLink] = useState(null);
  const [announcement, setAnnouncement] = useState("");
  const [available, setAvailable] = useState(false);

  const notifyFunction = user => {
    const notifContent = {
      title: props.user.name + " is ready to help you",
      body: "Please go back to the queue page to find the meeting link, link would be available for one minute.",
      link: meetingLink
    };
    const msg = {
      type: "action",
      action: "sendnotif",
      value: user,
      notifContent: notifContent
    };
    props.ws.send(JSON.stringify(msg));
    toast.info("Waiting for student " + user.name, {autoClose: 60000, closeOnClick: false, draggable: false, pauseOnFocusLoss:false, pauseOnHover:false})
  };

  const removeUser = user => {
    const msg = { type: "action", action: "remove", value: user };
    props.ws.send(JSON.stringify(msg));
  };

  const updateTaName = user => {
    props.userUpdateFunction(user);
    if (available) {
      const msg = {
        type: "action",
        action: "addta",
        value: user
      }
      props.ws.send(JSON.stringify(msg));
    }
  };

  const toggleAvailable = () => {
    if (!available) {
      const msg = {
        type: "action",
        action: "addta",
        value: props.user
      }
      props.ws.send(JSON.stringify(msg));
    } else {
      const msg = {
        type: "action",
        action: "removeta",
        value: props.user
      }
      props.ws.send(JSON.stringify(msg));
    }
    setAvailable((prev) => !prev);
  };

  useEffect(() => {
    if (!Cookies.get("ece_468_queue_ta")) {
      console.log("no c");
      Cookies.set("ece_468_queue_ta", { meetingLink: null });
    } else {
      const ta = JSON.parse(Cookies.get("ece_468_queue_ta"));
      setMeetingLink(ta.meetingLink);
    }
  }, []);

  useEffect(() => {
    Cookies.set("ece_468_queue_ta", { meetingLink: meetingLink }, { expires: 7 });
  }, [meetingLink]);

  const sendAnnouncement = () => {
    const notifContent = {
      title: props.user.name + " send an announcement",
      body: announcement
    };
    const msg = {
      type: "action",
      action: "sendannouncement",
      value: props.user,
      notifContent: notifContent
    };
    props.ws.send(JSON.stringify(msg))
    toast.success("Announcement sent");
  };

  const handleAnnouncement = (e) => {
    setAnnouncement(e.target.value)
  }

  return (
    <Container maxWidth="sm">
      <h1>ECE 468/573 TA</h1>
      <Box>
        <p>Please join the chatroom below for any quick communications from the students.</p>
        <p>When calling a student using the bell icon, an countdown popup would be displayed for one minute.
          Please wait for the student to join until the popup times out, then call the next student in queue.</p>
        <p>Be sure to remove the student name from the queue after their session is done.</p>
      </Box>
      <h3>TA Display Name:</h3>
      {props.user && (
        <UserInfo
          user={props.user}
          defaultUser={DEFAULT_USER}
          updateFunction={updateTaName}
        />
      )}
      <Box> <Switch checked={available} onChange={toggleAvailable} /> Display myself as available to students </Box>
      <h3>Meeting Link (Please use full link):</h3>
      <FieldEditor
        value={meetingLink}
        label="Meeting link"
        onSave={setMeetingLink}
      />
      <h3>Send announcement to all:</h3>
      <Box>
      <Box>
      <TextField
        onChange={handleAnnouncement}
        value={announcement}
        label="Announcement"
        variant="outlined"
        multiline
        fullWidth
      />
      </Box>
      <Box p={1} display="flex" alignItems="center" justifyContent="center"><Button color="primary" variant="contained" onClick={sendAnnouncement} >Send Announcement</Button></Box>
      </Box>
      <h3>Queue</h3>
      <StudentList
        users={props.users}
        admin={true}
        notifyFunction={notifyFunction}
        removeUserFunction={removeUser}
      />
    </Container>
  );
};

export default TAView;
