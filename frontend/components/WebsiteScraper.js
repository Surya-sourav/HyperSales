import { useState } from 'react'

export default function WebsiteScraper({ onComplete }) {
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:8000/scrape-website', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ website_url: url })
      })
      if (response.ok) {
        onComplete()
      } else {
        throw new Error('Failed to scrape website')
      }
    } catch (error) {
      console.error('Scraping error:', error)
      alert('Failed to scrape website. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mt-4">
      <h2 className="text-xl font-semibold mb-2">Website Scraper</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="url" className="block mb-1">Website URL:</label>
          <input
            type="url"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className={`bg-blue-500 text-white px-4 py-2 rounded ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading ? 'Scraping...' : 'Scrape Website'}
        </button>
      </form>
    </div>
  )
}