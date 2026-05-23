import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import './ChatBot.css';

const ChatBot = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [conversationId, setConversationId] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const response = await api.get('/chat/conversations');
                setConversations(response.data);
            } catch (error) {
                console.error('Ошибка загрузки диалогов:', error);
            }
        };
        fetchConversations();
    }, []);

    const loadConversation = async (id) => {
        try {
            const response = await api.get(`/chat/conversations/${id}`);
            setMessages(response.data.messages);
            setConversationId(id);
        } catch (error) {
            console.error('Ошибка загрузки диалога:', error);
        }
    };

    const sendMessage = async () => {
        if (!input.trim()) return;

        setLoading(true);
        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);

        try {
            const response = await api.post('/chat', {
                conversation_id: conversationId,
                message: input
            });

            setConversationId(response.data.conversation_id);
            setMessages(prev => [...prev, { role: 'assistant', content: response.data.reply }]);

            const convResponse = await api.get('/chat/conversations');
            setConversations(convResponse.data);

        } catch (error) {
            console.error('Ошибка отправки сообщения:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Извините, произошла ошибка' }]);
        } finally {
            setLoading(false);
            setInput('');
        }
    };

    const newConversation = () => {
        setMessages([]);
        setConversationId(null);
    };

    return (
        <div className="chat-container">
            <div className="chat-sidebar">
                <button onClick={newConversation} className="new-chat-btn">+ Новый диалог</button>
                <div className="conversations-list">
                    {conversations.map(conv => (
                        <div
                            key={conv.id}
                            className={`conversation-item ${conv.id === conversationId ? 'active' : ''}`}
                            onClick={() => loadConversation(conv.id)}
                        >
                            {conv.title}
                        </div>
                    ))}
                </div>
            </div>

            <div className="chat-main">
                <div className="messages-area">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`message ${msg.role}`}>
                            <div className="message-avatar">
                                {msg.role === 'user' ? '👤' : '🤖'}
                            </div>
                            <div className="message-content">{msg.content}</div>
                        </div>
                    ))}
                    {loading && <div className="loading-indicator">🤖 Печатает...</div>}
                    <div ref={messagesEndRef} />
                </div>

                <div className="input-area">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Задайте вопрос о прогнозах..."
                    />
                    <button onClick={sendMessage} disabled={loading}>Отправить</button>
                </div>
            </div>
        </div>
    );
};

export default ChatBot;