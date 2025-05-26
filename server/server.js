const express = require("express");
const mongoose = require("mongoose");
const app = express();
const port = 4000;
const io = require('socket.io')(app);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// Thêm vào phần socket.io event handlers
io.on('connection', (socket) => {
    // ... existing code ...

    // Xử lý cuộc gọi
    socket.on('callUser', ({ userToCall, signalData, from, avatar }) => {
        const userSocket = userSockets[userToCall];
        if (userSocket) {
            io.to(userSocket).emit('callUser', {
                signal: signalData,
                from,
                avatar
            });
        }
    });

    // Xử lý khi người dùng chấp nhận cuộc gọi
    socket.on('acceptCall', ({ signal, to }) => {
        const userSocket = userSockets[to];
        if (userSocket) {
            io.to(userSocket).emit('callAccepted', { signal });
        }
    });

    // Xử lý khi kết thúc cuộc gọi
    socket.on('endCall', ({ to }) => {
        const userSocket = userSockets[to];
        if (userSocket) {
            io.to(userSocket).emit('callEnded');
        }
    });

    // ... existing code ...
});
