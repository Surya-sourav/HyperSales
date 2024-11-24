import { useState, useEffect } from 'react'

export default function ChatbotIntegration() {
  const [apiKey, setApiKey] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchApiKey()
  }, [])

  const fetchApiKey = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:8000/get-api-key', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setApiKey(data.api_key)
      } else {
        throw new Error('Failed to fetch API key')
      }
    } catch (error) {
      console.error('Error fetching API key:', error)
      alert('Failed to fetch API key. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const integrationCode = `
<script src="https://your-chatbot-service.com/widget.js"></script>
<script>
  ChatbotWidget.init({
    apiKey: '${apiKey}'
  });
</script>
  `

  return (
    <div className="mt-4">
      <h2 className="text-xl font-semibold mb-2">Chatbot Integration</h2>
      {isLoading ? (
        <p>Loading API key...</p>
      ) : (
        <div>
          <p className="mb-2">Your API Key: <strong>{apiKey}</strong></p>
          <p className="mb-2">Add the following code to your website:</p>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
            {integrationCode}
          </pre>
        </div>
      )}
    </div>
  )
}