var app = require("express")();
var http = require("http").createServer(app);
var io = require("socket.io")(http);
var path = __dirname + "/";

const INIT_COLOR = "#f3df9d";
var players = {};
var slot = [null, null, null, null];
var state = [
    { color: INIT_COLOR },
    { color: INIT_COLOR },
    { color: INIT_COLOR },
    { color: INIT_COLOR }
];
var player_no = 1;

http.listen(3000, () => {
    console.log("listening on *:3000\n");
});

assign_slot = player => {
    for (i = 0; i < 4; i++) {
        if (slot[i] === null) {
            slot[i] = player;
            break;
        }
    }
    return i;
};

free_slot = player => {
    for (i = 0; i < 4; i++) {
        if (slot[i] === player) {
            slot[i] = null;
            break;
        }
    }
};

free_state = slot => {
    state[slot]["color"] = INIT_COLOR;
};

updateState = data => {
    // data = [playerInfo, colorInfo]
    state[data[0]["slot"]]["color"] = data[1];
};

registerPlayer = (socket, player) => {
    players[socket.id] = { name: player, slot: assign_slot(player) };
    socket.player = player;
    io.emit("player_list", players);
    io.emit("apply_state", state);
    player_no++;
};

app.get("/", function(req, res) {
    res.sendFile(path + "index.html");
    // console.log(`\n▸▸ ${req.headers.host}`);
});
app.get("/loop", function(req, res) {
    res.sendFile(path + "loop_mode.html");
    // console.log(`\n▸▸ ${req.headers.host}`);
});

io.on("connection", socket => {
    console.log(`Player-${player_no} is connected`);
    // socket.on("name_register", name => {
    //     console.log(name);
    //     // registerPlayer(socket, name);
    // });
    registerPlayer(socket, "Player-" + player_no);

    socket.on("change_color_request", data => {
        updateState(data);
        io.emit("change_color_response", [data[0]["name"], data[1]]);
    });

    socket.on("input_note", note => {
        console.log(note);
        var color = state[note[1]]["color"];
        io.binary(false).emit("play_note", note[0]);
        io.binary(false).emit("highlight_note", [note[0], color]);
    });

    socket.on("disconnect", _ => {
        free_slot(players[socket.id]["name"]);
        free_state(players[socket.id]["slot"]);
        io.emit("logout", [socket.id, players[socket.id]]);
        console.log(players[socket.id]["name"] + " is disconnected");
        delete players[socket.id];
    });
});
