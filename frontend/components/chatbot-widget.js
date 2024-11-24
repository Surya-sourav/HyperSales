import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, MessageSquare, X } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';

const ChatbotWidget = ({ apiKey, position = 'bottom-right' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || loading) return;

    const userMessage = message;
    setMessage('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/external-chat/' + apiKey, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className={`fixed bottom-4 ${
          position === 'bottom-right' ? 'right-4' : 'left-4'
        } z-50`}
      >
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-4"
            >
              <Card className="w-[400px] overflow-hidden">
                <div className="flex h-[600px] flex-col">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b p-4">
                    <div className="flex items-center gap-2">
                      <Bot className="h-5 w-5" />
                      <h2 className="font-semibold">Chat Assistant</h2>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsOpen(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Chat container */}
                  <div className="flex flex-1">
                    {/* Avatar side */}
                    <div className="w-1/3 border-r bg-muted/50 p-4">
                      <div className="flex h-full items-center justify-center">
                        <Avatar className="h-24 w-24">
                          <AvatarImage src="/placeholder.svg" />
                          <AvatarFallback>AI</AvatarFallback>
                        </Avatar>
                      </div>
                    </div>

                    {/* Chat messages */}
                    <div className="flex w-2/3 flex-col">
                      <div className="flex-1 space-y-4 overflow-y-auto p-4">
                        {messages.map((msg, index) => (
                          <div
                            key={index}
                            className={`flex ${
                              msg.role === 'user' ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div
                              className={`rounded-lg px-3 py-2 ${
                                msg.role === 'user'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              {msg.content}
                            </div>
                          </div>
                        ))}
                        {loading && (
                          <div className="flex justify-start">
                            <div className="rounded-lg bg-muted px-3 py-2">
                              Typing...
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Input form */}
                      <form
                        onSubmit={handleSubmit}
                        className="border-t p-4"
                      >
                        <div className="flex gap-2">
                          <Input
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type a message..."
                            disabled={loading}
                          />
                          <Button type="submit" disabled={loading}>
                            Send
                          </Button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg"
          onClick={() => setIsOpen(true)}
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      </div>
    </>
  );
};

export default ChatbotWidget;
