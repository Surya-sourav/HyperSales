import Head from 'next/head'
import Link from 'next/link'
import '../styles/globals.css'; // Adjust the path accordingly if it's in a different folder

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>AI Chatbot Platform</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link href="/">
                <a className="flex-shrink-0 flex items-center">
                  AI Chatbot Platform
                </a>
              </Link>
            </div>
            <div className="flex items-center">
              <Link href="/dashboard">
                <a className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Dashboard
                </a>
              </Link>
              <Link href="/login">
                <a className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Login
                </a>
              </Link>
              <Link href="/register">
                <a className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Register
                </a>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}