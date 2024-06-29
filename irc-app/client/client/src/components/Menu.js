import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

const socket = io('http://localhost:8888');

const Menu = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [showChat, setShowChat] = useState(false);
    const [channel, setChannel] = useState('General');
    const [channels, setChannels] = useState([{ name: 'General', creator: 'admin' }]);
    const [users, setUsers] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [messages, setMessages] = useState({});
    const [newChannelName, setNewChannelName] = useState('');
    const [newUsername, setNewUsername] = useState('');
    const [renameChannelName, setRenameChannelName] = useState('');

    useEffect(() => {
        const storedUsername = localStorage.getItem('username');
        if (storedUsername) {
            setUsername(storedUsername);
            setNewUsername(storedUsername);
            socket.emit('set_username', storedUsername);
        } else {
            navigate('/');
        }

        joinChannel("General");

        socket.on('initial_data', ({ users, channels, messages }) => {
            setUsers(users);
            setChannels(channels);
            setMessages(messages);
        });

        socket.on('users_update', (updatedUsers) => {
            setUsers(updatedUsers);
        });

        socket.on('channels_update', (updatedChannels) => {
            setChannels(updatedChannels);
        });

        socket.on('new_message', (message) => {
            setMessages(prevMessages => ({
                ...prevMessages,
                [message.channel]: [...(prevMessages[message.channel] || []), message]
            }));
        });

        return () => {
            socket.off('initial_data');
            socket.off('users_update');
            socket.off('channels_update');
            socket.off('new_message');
        };
    }, [navigate]);

    const isCreator = () => {
        const currentChannel = channels.find(chan => chan.name === channel);
        return currentChannel && currentChannel.creator === username;
    };

    const joinChannel = (selectedChannel) => {
        socket.emit('join_channel', selectedChannel);
        setChannel(selectedChannel);
        setShowChat(true);
    };

    const createChannel = () => {
        if (newChannelName.trim() !== '') {
            socket.emit('create_channel', newChannelName);
            setNewChannelName('');
        }
    };

    const renameChannel = () => {
        if (renameChannelName.trim() !== '') {
            socket.emit('rename_channel', { oldName: channel, newName: renameChannelName });
            setRenameChannelName('');
        }
    };

    const deleteChannel = () => {
        socket.emit('delete_channel', channel);
        setChannel("General");
    };

    const leaveChannel = () => {
        setShowChat(false);
        socket.emit('leave_channel', channel);
    };

    const handleDisconnect = () => {
        localStorage.removeItem('username');
        setUsername('');
        navigate('/');
    };

    const updateUsername = (newUsername) => {
        if (newUsername.trim() !== '') {
            const oldUsername = username;
            localStorage.setItem('username', newUsername);
            setUsername(newUsername);
            socket.emit('update_username', { oldUsername, newUsername });
        }
    };

    const handleNicknameCommand = () => {
        const newNickname = prompt("Enter your new username:");
        if (newNickname) {
            updateUsername(newNickname);
        }
    };

    const handleCreateCommand = () => {
        const newChannel = prompt("Enter new channel name:");
        if (newChannel) {
            createChannel(newChannel);
        }
    }

    const handleDeleteCommand = () => {
        const deleteChan = prompt("Which channel would you like to delete ?");
        if (deleteChan) {
            deleteChannel(deleteChan);
        }
    }

    const handleJoinCommand = () => {
        const joinChan = prompt("Which channel would you like to join ?");
        if (joinChan) {
            joinChannel(joinChan);
        }
    }

    // const handleLeaveCommand = () => {
    //     leaveChannel(currentChannel);
    // }

    // const handleUsersList = () => 

    const sendMessage = (e) => {
        e.preventDefault();
        if (messageInput.trim() !== '') {
            const [command, ...args] = messageInput.split(' ');
            switch (command) {
                case '/nick':
                    handleNicknameCommand(args.join(' '));
                    break;
                case '/create':
                    handleCreateCommand(args.join(' '));
                    break;
                case '/delete':
                    handleDeleteCommand();
                    break;
                case '/join':
                    handleJoinCommand(args.join(' '));
                    break;
                // case '/leave':
                //     handleLeaveCommand();
                //     break;
                // case '/users':
                //     handleUsersList();
                //     break;
                default:
                    const messageData = {
                        username: username,
                        channel: channel,
                        message: messageInput
                    };
                    socket.emit('send_message', messageData);
                    break;
            }
            setMessageInput('');
        }
    };

    return (
        <div className="flex flex-col md:flex-row h-screen">
            <div className="w-full md:w-1/4 p-4 bg-gray-200">
                <div className='usernameEdit mb-4'>
                    <label htmlFor="newUsername" className="block mb-2">Edit Username:</label>
                    <input
                        id="newUsername"
                        type='text'
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        className="w-full p-2 mb-2 border rounded"
                    />
                    <button onClick={() => updateUsername(newUsername)} className="w-full bg-blue-500 text-white p-2 rounded">Update Username</button>
                </div>

                <div className='select_channel mb-4'>
                    <label htmlFor="channel" className="block mb-2">Select Channel</label>
                    <select id="channel" value={channel} onChange={(e) => joinChannel(e.target.value)} className="w-full p-2 border rounded mb-2">
                        {channels.map((chan, index) => (
                            <option key={index} value={chan.name}>{chan.name}</option>
                        ))}
                    </select>
                    <button onClick={() => joinChannel(channel)} className="w-full bg-green-500 text-white p-2 rounded">Join Channel</button>
                </div>

                <div className='channelCreate mb-4'>
                    <input
                        type='text'
                        value={newChannelName}
                        onChange={(e) => setNewChannelName(e.target.value)}
                        placeholder="Enter new channel name"
                        className="w-full p-2 border rounded"
                    />
                    <button onClick={createChannel} className="w-full bg-purple-500 text-white p-2 rounded-md">Create Channel</button>
                </div>

                {isCreator() && (
                    <>
                        <div className='rename_channel mb-4'>
                            <label htmlFor="renameChannel" className="block mb-2">Rename Channel:</label>
                            <input
                                id="renameChannel"
                                type='text'
                                value={renameChannelName}
                                onChange={(e) => setRenameChannelName(e.target.value)}
                                className="w-full p-2 mb-2 border rounded"
                            />
                            <button onClick={renameChannel} className="w-full bg-yellow-500 text-white p-2 rounded">Rename Channel</button>
                        </div>

                        <div className='delete_channel mb-4'>
                            <button onClick={deleteChannel} className="w-full bg-red-500 text-white p-2 rounded">Delete Channel</button>
                        </div>
                    </>
                )}

                <div>
                    <h3 className='chatHeader mb-2'>Connected Users</h3>
                    <ul className="divide-y divide-gray-300">
                        {users.map((user) => (
                            <li key={user.socketID} className="py-2">
                                <span className="block">{user.username}</span>
                                <span className="text-sm text-gray-600 block">Channel: {user.channel}</span>
                            </li>
                        ))}
                    </ul>

                <button onClick={leaveChannel} className="w-full mt-4 bg-blue-500 text-white p-2 rounded">Leave Channel</button>
                <button onClick={handleDisconnect} className="w-full mt-2 bg-gray-500 text-white p-2 rounded">Disconnect</button>
                </div>
            </div>

            <div className="w-full md:w-3/4 p-4 bg-white flex flex-col">
                <div className="flex-1 overflow-y-auto">
                    {showChat ? (
                        <div className="chat">
                            <h1 className="text-xl font-bold mb-4">Chat for {channel}</h1>
                            <div className="messages">
                                {messages[channel]?.map((message, index) => (
                                    <div
                                        key={index}
                                        className={`message mb-2 p-2 rounded ${message.system ? 'bg-yellow-100 text-yellow-900' : 'bg-gray-100 text-gray-800'}`}
                                    >
                                        <p><strong>{message.username}: </strong>{message.message}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <h1 className="text-gray-500">Join a channel to start chatting</h1>
                    )}
                </div>
                <form onSubmit={sendMessage} className="p-2 bg-gray-300">
                    <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Type your message..."
                        className="w-full p-2 border rounded"
                    />
                    <button type="submit" className="mt-2 bg-blue-500 text-white p-2 rounded">Send</button>
                </form>
            </div>
        </div>
    );
};

export default Menu;
