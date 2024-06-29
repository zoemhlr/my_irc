const express = require('express');
const http = require('http');
const { channel } = require('process');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

const port = process.env.PORT || 8888;

let users = [];
let channels = [{ name: 'General', creator: 'admin' }];
let messages = {};
const isInactive = 2 * 24 * 60 * 60 * 1000;

io.on('connection', (socket) => {
    socket.emit('initial_data', { users, channels, messages });

    socket.on('set_username', (username) => {
        const userIndex = users.findIndex(u => u.socketID === socket.id);
        if (userIndex !== -1) {
            users[userIndex].username = username;
        } else {
            users.push({ socketID: socket.id, username, channel: 'General' });
        }
        io.emit('users_update', users);
        io.emit('new_message', { channel: 'General', message: `${username} joined the channel` });
    });

    socket.on('join_channel', (selectedChannel) => {
        const userIndex = users.findIndex(u => u.socketID === socket.id);
        const user = users[userIndex];
        if (user) {
            user.channel = selectedChannel;
            socket.join(selectedChannel);
            io.emit('users_update', users);
            io.emit('new_message', { channel: selectedChannel, message: `${user.username || 'Unknown'} joined the channel ${selectedChannel}` });
        }
    });

    socket.on('create_channel', (newChannelName) => {
        const username = getUsernameBySocketID(socket.id);
        channels.push({ name: newChannelName, creator: username });
        io.emit('channels_update', channels);
        io.emit('new_message', { channel: 'General', message: `New channel ${newChannelName} created by ${username}` });
    });

    socket.on('rename_channel', ({ oldName, newName }) => {
        const username = getUsernameBySocketID(socket.id);
        const channel = channels.find(chan => chan.name === oldName);

        if (channel && channel.creator === username) {
            channel.name = newName;
            io.emit('channels_update', channels);
            io.emit('new_message', { channel: newName, message: `${username} renamed the channel to ${newName}` });
        }
    });

    socket.on('delete_channel', (channelName) => {
        const username = getUsernameBySocketID(socket.id);
        const channelIndex = channels.findIndex(chan => chan.name === channelName);

        if (channelIndex > -1 && channels[channelIndex].creator === username) {
            channels.splice(channelIndex, 1);
            io.emit('channels_update', channels);
            io.emit('new_message', { channel: 'General', message: `${username} deleted the channel ${channelName}` });
        }
    });

    socket.on('update_username', ({ oldUsername, newUsername }) => {
        const userIndex = users.findIndex(u => u.socketID === socket.id);
        if (userIndex !== -1) {
            const user = users[userIndex];
            user.username = newUsername;
            io.emit('users_update', users);
            const currentChannel = user.channel || 'General';
            io.emit('new_message', { channel: currentChannel, message: `${oldUsername} changed username to ${newUsername}` });
        }
    });

    socket.on('send_message', (messageData) => {
        if (!messages[messageData.channel]) {
            messages[messageData.channel] = [];
        }
        messages[messageData.channel].push(messageData);
        io.to(messageData.channel).emit('new_message', messageData);
    });

    socket.on('disconnect', () => {
        const userIndex = users.findIndex((user) => user.socketID === socket.id);
        if (userIndex !== -1) {
            const user = users[userIndex];
            io.emit('new_message', { channel: user.channel, message: `${user.username} left the channel` });
            users.splice(userIndex, 1);
            io.emit('users_update', users);
        }
    });

    function getUsernameBySocketID(socketID) {
        const user = users.find(u => u.socketID === socketID);
        return user ? user.username : 'Unknown';
    }
});

const lastActive = (channelName) => {
    const channel = channels.find(chan => chan.name === channelName);
    if (channel) {
        channel.lastActive = Date.now();
    }
};

setInterval(() => {
    const time = Date.now();
    const inactiveChannels = channels.filter(channel => (time - channel.lastActive) > isInactive && channel.name !== 'General');
    inactiveChannels.forEach(channel => {
        const channelIndex = channels.findIndex(chan => chan.name === channel.name);
        if (channelIndex > -1) {
            channels.splice(channelIndex, 1);
            delete messages[channel.name];
            io.emit('channels_update', channels);
            io.emit('new_message', { channel: 'General', message: `Channel ${channel.name} was deleted due to inactivity.` });
        }
    });
}, 60 * 60 * 1000);

server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
