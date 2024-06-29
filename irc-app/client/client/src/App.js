import socketIO from 'socket.io-client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import './index.css';
import Menu from './components/Menu';

const socket = socketIO.connect('http://localhost:8888');
function App() {
  return (
    <BrowserRouter>
      <div>
        <Routes>
          <Route path="/" element={<Home socket={socket} />}></Route>
          <Route path="/Menu" element={<Menu socket={socket} />}></Route>
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;
