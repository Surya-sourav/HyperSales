import React, { useEffect, useState } from 'react';
import { auth } from '../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/router';
import axios from 'axios';

const ChatbotItem = ({ bot, onSelect }) => {
  const [showApiKey, setShowApiKey] = useState(false);

  const handleCopy = () => {
    if (bot.api_key) {
      navigator.clipboard.writeText(bot.api_key)
        .then(() => alert('API key copied to clipboard!'))
        .catch(err => console.error('Failed to copy:', err));
    }
  };

  return (
    <div className="border rounded p-4 mb-4">
      <h3 className="font-bold">{bot.chatbot_name}</h3>
      <a href={bot.website_url} className="text-blue-600 hover:underline text-sm" target="_blank" rel="noopener noreferrer">
        {bot.website_url}
      </a>
      <div className="mt-2">
        <p className="font-bold mb-1">API Key:</p>
        <div className="flex gap-2">
          <input
            type={showApiKey ? "text" : "password"}
            value={bot.api_key || ''}
            readOnly
            className="flex-1 border rounded px-2 py-1"
          />
          <button
            onClick={() => setShowApiKey(!showApiKey)}
            className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"
          >
            {showApiKey ? 'Hide' : 'Show'}
          </button>
          <button
            onClick={handleCopy}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
          >
            Copy
          </button>
        </div>
      </div>
      <button
        onClick={() => onSelect(bot._id)}
        className="mt-3 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded w-full"
      >
        Select for Testing
      </button>
    </div>
  );
};


const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [scrapedData, setScrapedData] = useState('');
  const [chatbotName, setChatbotName] = useState('');
  const [chatbots, setChatbots] = useState([]);
  const [selectedChatbotId, setSelectedChatbotId] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchChatbots(currentUser.uid);
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const fetchChatbots = async (userId) => {
    try {
      const response = await axios.get(`http://localhost:8000/get-chatbots/${userId}`);
      setChatbots(response.data);
    } catch (error) {
      console.error('Error fetching chatbots:', error);
      alert('Error fetching chatbots. Please try again.');
    }
  };

  const handleScrape = async () => {
    if (!websiteUrl) {
      alert('Please enter a valid website URL');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8002/scrape', {
        user_id: user.uid,
        website_url: websiteUrl,
        company_name: user.displayName || 'Unknown Company'
      });
      setScrapedData(response.data);
      alert('Website scraped successfully!');
    } catch (error) {
      console.error('Error scraping website:', error);
      alert('Error scraping website. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChatbot = async () => {
    if (!chatbotName || !websiteUrl || !scrapedData) {
      alert('Please enter all required fields to create a chatbot');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/create-chatbot', {
        user_id: user.uid,
        chatbot_name: chatbotName,
        website_url: websiteUrl,
        scraped_data: scrapedData
      });
      if (response.status === 200) {
        alert(`Chatbot "${chatbotName}" created successfully!`);
        fetchChatbots(user.uid);
        setChatbotName('');
        setWebsiteUrl('');
        setScrapedData('');
      }
    } catch (error) {
      console.error('Error creating chatbot:', error);
      alert('Error creating chatbot. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChatbotTest = async (e) => {
    e.preventDefault();
    if (!selectedChatbotId || !chatMessage) {
      alert('Please select a chatbot and enter a message to test');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8003/try-chatbot', {
        chatbot_id: selectedChatbotId,
        message: chatMessage
      });
      if (response.status === 200) {
        const newMessage = { role: 'user', content: chatMessage };
        const botResponse = { role: 'assistant', content: response.data.response };
        setConversationHistory(prevHistory => [...prevHistory, newMessage, botResponse]);
        setChatMessage('');
      }
    } catch (error) {
      console.error('Error testing chatbot:', error);
      alert('Error testing chatbot. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      alert('Error signing out. Please try again.');
    }
  };

  if (!user) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Chatbot Dashboard</h1>
          <div className="flex items-center">
            <span className="mr-4">{user.email}</span>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
            >
              Logout
            </button>
          </div>
        </header>

        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-xl font-bold mb-4">Scrape Website</h2>
            <div className="flex space-x-2">
              <input
                className="flex-grow p-2 border rounded"
                placeholder="https://example.com"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                disabled={loading}
              />
              <button
                onClick={handleScrape}
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
              >
                {loading ? 'Scraping...' : 'Scrape'}
              </button>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-4">Create Chatbot</h2>
            <div className="space-y-2">
              <input
                className="w-full p-2 border rounded"
                placeholder="Chatbot Name"
                value={chatbotName}
                onChange={(e) => setChatbotName(e.target.value)}
                disabled={loading}
              />
              <button
                onClick={handleCreateChatbot}
                disabled={loading || !websiteUrl || !scrapedData}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
              >
                {loading ? 'Creating...' : 'Create Chatbot'}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Your Chatbots</h2>
          {chatbots.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {chatbots.map((bot) => (
                <ChatbotItem key={bot._id} bot={bot} onSelect={setSelectedChatbotId} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">No chatbots created yet. Start by scraping a website and creating your first chatbot!</p>
          )}
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Test Chatbot</h2>
          <div className="space-y-4">
            <select
              value={selectedChatbotId}
              onChange={(e) => setSelectedChatbotId(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">Select a chatbot</option>
              {chatbots.map((bot) => (
                <option key={bot._id} value={bot._id}>{bot.chatbot_name}</option>
              ))}
            </select>

            <div className="h-64 overflow-y-auto border rounded p-4 bg-white">
              {conversationHistory.map((message, index) => (
                <div key={index} className={`mb-2 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <span className={`inline-block p-2 rounded ${message.role === 'user' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    {message.content}
                  </span>
                </div>
              ))}
            </div>

            <form onSubmit={handleChatbotTest} className="flex space-x-2">
              <input
                className="flex-grow p-2 border rounded"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Type your message..."
                disabled={loading || !selectedChatbotId}
              />
              <button
                type="submit"
                disabled={loading || !selectedChatbotId}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
              >
                {loading ? 'Sending...' : 'Send'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;