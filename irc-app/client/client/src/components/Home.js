import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = ({ socket }) => {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");

    const handleLogin = (e) => {
        e.preventDefault();
        localStorage.setItem('username', username);
        socket.emit('joined', { username, socketID: socket.id });
        navigate('/Menu');
    };

    return (
        <form className="loginForm bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4" onSubmit={handleLogin}>
            <h1 className="loginTitle text-2xl font-bold mb-4">Sign in to access ChatRooms</h1>
            <label htmlFor="username" className="block text-gray-700 text-sm font-bold mb-2">Username</label>
            <input
                type="text"
                minLength={3}
                name="username"
                id="username"
                className="usernameInput shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />
            <button className="log bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-4">Connect & Chat</button>
        </form>
    );
};

export default Home;