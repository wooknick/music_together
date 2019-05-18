var app = require("express")();
var reload = require("reload");
var http = require("http").createServer(app);
var io = require("socket.io")(http);
var path = __dirname + "/";

var users = {};
var user_no = 1;

http.listen(3000, () => {
    console.log("listening on *:3000\n");
});

registerUser = (socket, nickname) => {
    users[socket.id] = nickname;
    // console.log(socket.socket_id);
    socket.nickname = nickname;
    user_no++;
    io.emit("user_list", users);
    // console.log("do it");
    // console.log(users);
};

app.get("/", function(req, res) {
    res.sendFile(path + "index.html");
    // console.log(`\n▸▸ ${req.headers.host}`);
});

io.on("connection", socket => {
    console.log(`Player-${user_no} is connected`);
    registerUser(socket, "Player-" + user_no);

    socket.on("change_color_request", data => {
        io.emit("change_color_response", data);
    });

    socket.on("disconnect", _ => {
        io.emit("logout", [socket.id, users[socket.id]]);
        console.log(users[socket.id] + " is disconnected");
        delete users[socket.id];
    });
});

reload(app);
