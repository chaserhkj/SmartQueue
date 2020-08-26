import React, { useEffect, useState } from "react";
import { HashRouter as Router, Route, Switch } from "react-router-dom";
import ScriptTag from "react-script-tag";
import { Button, Box, Container} from "@material-ui/core";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import TAView from "./TAView";
import StudentView from "./StudentView";

const WS_URL="wss://cap.ecn.purdue.edu/ECE468Queue";
//const WS_URL="ws://127.0.0.1:8888"; // Debugging
let ws = new WebSocket(WS_URL);
const WS_RETRY_TIME = 5000;

toast.configure({ draggable: false, autoClose: 8000 });

const DEFAULT_USER = { uid: -1, name: "No Name Provided" };

function App() {
  const [user, setUser] = useState();
  const [users, setUsers] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [ta_s, setTAs] = useState([]);

  const genRandID = () => {
    return Math.floor(Math.random() * 1000);
  };

  const wsReconnect = () => {
    setTimeout(() => {
      console.log("WS - attempt reconnect");
      if (ws.readyState === WebSocket.CLOSED) {
        ws = new WebSocket(WS_URL);
        if (ws.readyState !== WebSocket.OPEN) {
          console.log("WS - failed reconnect");
          wsReconnect();
        } else {
          console.log("WS - successfully connected");
        }
      } else if (ws.readyState === WebSocket.OPEN) {
        console.log("WS - successfully connected, attaching handlers");
        attachWSHandlers(ws);
        // Set manually here because handlers weren't connected in time to catch open
        setWsConnected(true);
        ws.send(JSON.stringify({ type: "request", value: "queue" }));
        ws.send(JSON.stringify({ type: "request", value: "talist" }));
      }
    }, WS_RETRY_TIME);
  };

  const wsSend = msg => {
    ws.send(msg);
  };

  const attachWSHandlers = client => {
    client.addEventListener("open", function(event) {
      console.log("WS Open");
      setWsConnected(true);
    });
    client.addEventListener("close", function(event) {
      console.log("WS Close");
      setWsConnected(false);
      wsReconnect();
    });
    client.addEventListener("message", function(event) {
      const msg = JSON.parse(event.data);
      // console.log("\\/ WS MSG \\/");
      console.log(event);
      // console.log("/\\ WS MSG /\\");
      if (msg.type === "queue") {
        if (!Array.isArray(msg.value)) {
          console.log("WS ERROR: queue not array");
          setUsers([]);
        } else {
          const newUsers = msg.value;
          setUsers(newUsers);
        }
      } else if (msg.type === "talist"){
        if (!Array.isArray(msg.value)) {
          console.log("WS ERROR: talist not array");
          setTAs([]);
        } else {
          const newTAs = msg.value;
          setTAs(newTAs);
        }
      } else if (msg.type === "notification") {
        // Check to make sure msg is correct
        let notifContent = msg.notifContent;
        if (!notifContent) {
          console.log("Missing notifcontent");
          return;
        }
        if (notifEnabled) {
          let n = new Notification(notifContent.title, {
            body: notifContent.body || ""
          });
          n.onClick = () => {
            window.focus();
          };
        }
        let openLink = () => {
          console.log("Notif click, goto: " + notifContent.link);
          window.open(notifContent.link, "_blank");
        };
        toast.info( ({closeToast}) => 
          <Box>
            <Box p={1}>{notifContent.title}</Box>
            <Box p={1}><Button onClick={()=>{openLink();closeToast();}} color="primary" variant="contained">Open Meeting Link</Button></Box>
          </Box>
        , {autoClose: 60000, closeOnClick:false, closeButton:false, draggable: false, pauseOnFocusLoss:false, pauseOnHover:false});
      } else if (msg.type === "announcement") {
        let notifContent = msg.notifContent;
        if (!notifContent) {
          console.log("Missing notifcontent");
          return;
        }
        if (notifEnabled) {
          let n = new Notification(notifContent.title, {
            body: notifContent.body || ""
          });
          n.onClick = () => {
            window.focus();
          };
        }
        toast.info( ({closeToast}) => 
          <Box>
            <Box p={1}><b>{notifContent.title}</b></Box>
            <Box p={1}>{notifContent.body}</Box>
          </Box>
        , {autoClose: false});

      } else if (msg.type === "ping") {
        let pingMsgResp = JSON.stringify({
          type: "pingres",
          timestamp: new Date(),
          id: msg.id
        });
        ws.send(pingMsgResp);
      }
    });
  };

  // Update websocket record in backend
  useEffect(() => {
    // Make sure user is set and websocket is connected
    if (user && wsConnected) {
      ws.send(
        JSON.stringify({
          type: "updateid",
          uid: user.uid
        })
      );
    }
  }, [user, wsConnected]);

  useEffect(() => {
    document.title = "ECE 468/573 Office Hours Queue";
    if (!Cookies.get("ece_468_queue_user")) {
      Cookies.set(
        "ece_468_queue_user",
        { uid: genRandID(), name: DEFAULT_USER.name },
        { expires: 7 }
      );
    }
    setUser(JSON.parse(Cookies.get("ece_468_queue_user")));
    attachWSHandlers(ws);
    if ('Notification' in window) {
      Promise.resolve(Notification.requestPermission()).then(function(result) {
        console.log("Notif request perm: " + result);
        if (result !== "granted") {
          toast.error("Please allow notifications and refresh the page!");
        } else {
          setNotifEnabled(true);
        }
      });
    }
  }, []);

  /* TODO Notifications:
        - If device doesnt support notifications (prop: notSupported)
        - If user declines notifications (prop: onPermissionDenied, askAgain=true to request again)
        - props.options (body, tag, icon)
  */

  const updateUser = newUser => {
    console.log("NEW USER: ", newUser);
    Cookies.set("ece_468_queue_user", newUser, { expires: 7 });
    setUser(newUser);
  };

  return (
    <div>
      <Router>
        <Switch>
          <Route path="/ta">
            <TAView user={user} users={users} userUpdateFunction={updateUser} ws={ws} />
          </Route>
          <Route path="/">
            <StudentView
              user={user}
              users={users}
              ta_s={ta_s}
              userUpdateFunction={updateUser}
              wsSend={wsSend}
            />
          </Route>
        </Switch>
      </Router>
      <Container maxWidth="sm">
        <h3>Public Chat Room for Quick Communications: </h3>
        <p>Powered by <a href="https://tlk.io/">tlk.io</a></p>
        <Box p={1}>
        <div id="tlkio" data-channel="purdue-ece-468" data-theme="theme--day" style={{ width: "100%" , height:800 }}></div>
        <ScriptTag async src="https://tlk.io/embed.js" type="text/javascript"></ScriptTag>
        </Box>
      </Container>
    </div>
  );
}

export default App;
