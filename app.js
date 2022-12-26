const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const io = require("socket.io")(server, { cors: { origin: "*" } });
const port = process.env.PORT || 5000;
const db = require("./config/db");
const morgan = require("morgan");

app.use(morgan("dev"));

const frontendUrl = "http://localhost:3000";
const corsOptions = {
    origin: frontendUrl,
    optionsSuccessStatus: 200
};

const cors = require("cors");
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.use('/api', require('./routes/api.routes'));

const User = require('./models/userSchema');
const Table = require('./models/tableSchema');

io.on('connection', (socket) => {
    try {
        socket.on('joinRoom', (roomCode) => {
            const connectedSockets = io.sockets.adapter.rooms.get(roomCode);
            if (connectedSockets && connectedSockets.size === 2) {
                return socket.emit('error', "Room is full");
            }
            socket.join(roomCode);
            console.log(`User Joined at ${roomCode}`);
            if (connectedSockets && connectedSockets.size === 1) {
                return socket.broadcast.to(roomCode).emit('startGame', 'X');
            } else {
                return socket.emit('startGame', 'O');
            }
        });
        socket.on('play', ({ id, roomCode, ch }) => {
            console.log(`play ${ch} at ${id} to ${roomCode}`);
            socket.broadcast.to(roomCode).emit('updateGame', id, ch);
            Table.findOne({ roomId: roomCode }, (err, table) => {
                if (!table) {
                    return;
                }
                table.board[id] = ch;
                table.turn = ch === 'X' ? 'O' : 'X';
                table.message = ch === 'X' ? `${table.player2}'s turn` : `${table.player1}'s turn`
                table.save();
            });
        });

        socket.on('onWin', ({ roomCode, winner }) => {
            console.log(`Winner is ${winner} at ${roomCode}`);
            Table.findOneAndUpdate({ roomId: roomCode }, { $set: { winner: winner, message: `${winner} won the game` } }, (err) => {
                if (err) {
                    console.log(err);
                }
            });
        });

        socket.on('onDraw', (roomCode) => {
            console.log(`Draw at ${roomCode}`);
            Table.findOneAndUpdate({ roomId: roomCode }, { $set: { draw: true, message: `Draw` } }, (err) => {
                if (err) {
                    console.log(err);
                }
            });
        });

        socket.on('disconnect', () => {
            console.log('user disconnected');
        });
    } catch (err) {
        console.log(err);
    }
});

server.listen(port, () => {
    console.log(`Server started on port ${port}`);
});