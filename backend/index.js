const WebSocket = require("ws");

const wss = new WebSocket.Server({ host: "127.0.0.1", port: 8888 });

const mockNotification = JSON.stringify({
  type: "notification",
  title: "Test"
});

let queue = [
];

let ta_s = new Object();

const WEBSOCKET_PING_TIME = 40000;
// const WEBSOCKET_PING_TIME = 5000;

const genRandID = () => {
  // Rand number
  return Math.floor(Math.random() * 1000000);
};

let sentPings = [];

let pingMsg = { type: "ping", timestamp: new Date() };
const pingClient = client => {
  pingMsg.id = client.id;
  console.log(`   Ping sent: ${pingMsg.id}`);
  client.send(JSON.stringify(pingMsg));
};

const clientKeepAlive = client => {
  setTimeout(() => {
    if (client.readyState === WebSocket.CLOSED) {
      return;
    }
    pingClient(client);
    clientKeepAlive(client);
  }, WEBSOCKET_PING_TIME);
};

wss.on("connection", ws => {
  ws.id = genRandID();
  console.log(`Opened Connection - ${ws.id} (${wss.clients.size} total connections)`);
  const sendQueue = client => {
    let queueCopy = [];
    queue.forEach(item => {
      queueCopy.push({ uid: item.uid, name: item.name });
    });
    client.send(JSON.stringify({ type: "queue", value: queueCopy }));
  };

  const sendTAs = client => {
    let taList = [];
    Object.values(ta_s).forEach( val => {
      taList.push({ uid: val.uid, name: val.name});
    });
    client.send(JSON.stringify({ type: "talist", value: taList}));
  }

  const notifyUser = (user, notifContent) => {
    const uid = user.uid;
    let notificationMsg = { type: "notification", notifContent: notifContent };
    notificationMsg = JSON.stringify(notificationMsg);
    queue.forEach(item => {
      if (item.uid == uid) {
        item.ws.send(notificationMsg);
        return;
      }
    });
  };

  const notifyAll = (notifContent) => {
    let announcementMsg = { type: "announcement", notifContent: notifContent };
    announcementMsg = JSON.stringify(announcementMsg)
    wss.clients.forEach(client => {
      if (client.id != ws.id) {
        client.send(announcementMsg);
      }
    })
  }

  ws.on("close", event => {
    Object.keys(ta_s).forEach(key => {
      if (ws.id == key) {
        delete ta_s[key];
      }
    });
    wss.clients.forEach(sendTAs);
    console.log(`Closed Connection - ${ws.id} (${wss.clients.size} total connections)`);
  });

  ws.on("message", msg => {
    msg = JSON.parse(msg);
    if (msg.type == "action") {
      if (msg.action == "add") {
        const user = msg.value;
        if (!queue.some(u => u.uid == user.uid)) {
          console.log(`+ ${user.name}(${user.uid})`);
          user.ws = ws;
          queue.push(user);
          wss.clients.forEach(sendQueue);
        } else {
          // already in queue, send notification or some shit
        }
      } else if (msg.action == "remove") {
        const user = msg.value;
        if (queue.some(u => u.uid == user.uid)) {
          console.log(`- ${user.name}(${user.uid})`);
          // Remove from queue
          for (let i = 0; i < queue.length; i++) {
            if (queue[i].uid == user.uid) {
              // queue[i].ws.send(mockNotification);
              queue.splice(i, 1);
            }
          }
          wss.clients.forEach(sendQueue);
        }
      } else if (msg.action == "sendnotif") {
        const user = msg.value;
        const { notifContent } = msg;
        console.log(`* ${user.name}(${user.uid})`);
        notifyUser(user, notifContent);
      } else if (msg.action == "sendannouncement") {
        const sender = msg.value;
        const { notifContent } = msg;
        console.log(`* Announcement from ${sender.name}(${sender.id}): ${notifContent.body}`);
        notifyAll(notifContent);
      } else if (msg.action == "addta") {
        const user = msg.value;
        ta_s[ws.id] = user;
        wss.clients.forEach(sendTAs);
      }
    } else if (msg.type == "pingres") {
      console.log(`   Ping res:  ${msg.id}`);
    } else if (msg.type === "request") {
      if (msg.value === "queue") {
        sendQueue(ws);
      }
    } else if (msg.type === "updateid") {
      // debug variable/console output
      let wasfound = false;
      // Check if user is in queue
      for (let i = 0; i < queue.length; i++) {
        if (queue[i].uid === msg.uid) {
          // Found user, update websocket
          wasfound = true;
          queue[i].ws = ws;
        }
      }
      console.log(`└ Updateid ${msg.uid} (found: ${wasfound})`);
    }
  });
  // Send queue
  sendQueue(ws);
  clientKeepAlive(ws);
});
