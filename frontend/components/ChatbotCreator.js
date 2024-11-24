import { useState } from 'react'

export default function ChatbotCreator({ onComplete }) {
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:8000/create-chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, avatar })
      })
      if (response.ok) {
        onComplete()
      } else {
        throw new Error('Failed to create chatbot')
      }
    } catch (error) {
      console.error('Chatbot creation error:', error)
      alert('Failed to create chatbot. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mt-4">
      <h2 className="text-xl font-semibold mb-2">Create Your Chatbot</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block mb-1">Chatbot Name:</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        <div>
          <label htmlFor="avatar" className="block mb-1">Avatar:</label>
          <select
            id="avatar"
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded"
          >
            <option value="">Select an avatar</option>
            <option value="avatar1">Avatar 1</option>
            <option value="avatar2">Avatar 2</option>
            <option value="avatar3">Avatar 3</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className={`bg-green-500 text-white px-4 py-2 rounded ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading ? 'Creating...' : 'Create Chatbot'}
        </button>
      </form>
    </div>
  )
}