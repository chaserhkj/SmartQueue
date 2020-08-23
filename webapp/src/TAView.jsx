import React, { useEffect, useState } from "react";
import { Container, TextField } from "@material-ui/core";
import Cookies from "js-cookie";

import StudentList from "./StudentList";
import UserInfo from "./UserInfo";
import FieldEditor from "./FieldEditor";

const DEFAULT_USER = { uid: -1, name: "No Name Provided" };

const TAView = props => {
  const [meetingLink, setMeetingLink] = useState(null);

  const notifyFunction = user => {
    const notifContent = {
      title: props.user.name + " is ready to help you",
      body: "Click here to open the videochat",
      link: meetingLink
    };
    const msg = {
      type: "action",
      action: "sendnotif",
      value: user,
      notifContent: notifContent
    };
    props.ws.send(JSON.stringify(msg));
  };

  const removeUser = user => {
    const msg = { type: "action", action: "remove", value: user };
    props.ws.send(JSON.stringify(msg));
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

  return (
    <Container maxWidth="sm">
      <h1>ECE 468/573 TA</h1>
      <h3>TA Display Name:</h3>
      {props.user && (
        <UserInfo
          user={props.user}
          defaultUser={DEFAULT_USER}
          updateFunction={props.userUpdateFunction}
        />
      )}
      <h3>Meeting Link:</h3>
      <FieldEditor
        value={meetingLink}
        label="Meeting link"
        onSave={setMeetingLink}
      />
      {/* <TextField
        value={meetingLink || ""}
        onChange={handleTextboxUpdate}
        label="Meeting link"
        variant="outlined"
        size="small"
      /> */}
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
