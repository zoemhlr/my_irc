import React, {useEffect, useState } from "react";

function Channel ({ socket, username, channel }) {
    const [message, setMessage] = useState("");
    const [messageList, setMessageList] = useState("");

    const send = async () => {
        if(message !== "") {
            const messageData = {
                channel: channel,
                author: username,
                message: message,
                time : new Date(Date.now()).getHours() + ":" + new Date(Date.now()).getMinutes(),
            };
            socket.emit("send_message", messageData);
        }
    }
    useEffect(() => {
        socket.on("get_message", (data) => {
            setMessageList
        });
    }, [socket]);

    return (
        <div className="chat_window">
            <div className="chat_header">
                <p>Live Chat</p>
            </div>
            <div className="chat_body">
                {messageList.map((message_content) => {
                    return <h1>{messageContent.message}</h1>
                })}
            </div>
            <div className="chat_footer">
                <input
                    type="text"
                    placeholder="Message"
                    onChange={(e) => {
                        setMessage(e.target.value);
                    }}
                />
                <button onClick={send}>Send</button>
            </div>
        </div>
    );
};

export default Channel;