import React from 'react';
import ChatBot from '../components/ChatBot';

const ChatPage = () => {
    return (
        <div className="chat-page">
            <h2>ИИ-ассистент - задайте свой вопрос о прогнозах</h2>
            <ChatBot />
        </div>
    );
};

export default ChatPage;