'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, ArrowRight, Newspaper, Loader2, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'

interface BlogPost {
  id: number
  title: string
  excerpt: string
  date: string
  category: string
  featured: boolean
  commitHash?: string
  filesChanged?: string[]
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        setError(null)
        const response = await fetch('/api/chain-news')
        
        if (!response.ok) {
          throw new Error(`Failed to fetch chain news: ${response.statusText}`)
        }
        
        const data = await response.json()
        setPosts(data.posts || [])
      } catch (error) {
        console.error('Failed to fetch chain news:', error)
        setError(error instanceof Error ? error.message : 'Failed to fetch chain news')
        setPosts([])
      } finally {
        setLoading(false)
      }
    }

    fetchUpdates()
    const interval = setInterval(fetchUpdates, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [])

  const featuredPost = posts.find((p) => p.featured) || posts[0]
  const regularPosts = posts.filter((p) => p.id !== featuredPost?.id)

  if (loading) {
    return (
      <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 mb-4">
              <Newspaper className="w-8 h-8 text-neon-cyan" />
              <h1 className="text-5xl md:text-6xl font-orbitron font-bold neon-text">
                Chain News
              </h1>
            </div>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Stay updated with the latest blockchain updates, features, and announcements
            </p>
          </div>
          <div className="glass-panel p-12 text-center">
            <Loader2 className="w-16 h-16 text-neon-cyan mx-auto mb-4 animate-spin" />
            <p className="text-gray-400">Loading chain news...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 mb-4">
              <Newspaper className="w-8 h-8 text-neon-cyan" />
              <h1 className="text-5xl md:text-6xl font-orbitron font-bold neon-text">
                Chain News
              </h1>
            </div>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Stay updated with the latest blockchain updates, features, and announcements
            </p>
          </div>
          <div className="glass-panel p-12 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-2xl font-orbitron font-bold text-gray-400 mb-2">Error loading news</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <button
              onClick={() => {
                setLoading(true)
                setError(null)
                fetch('/api/chain-news')
                  .then((res) => res.json())
                  .then((data) => {
                    setPosts(data.posts || [])
                    setLoading(false)
                  })
                  .catch((err) => {
                    setError(err.message)
                    setLoading(false)
                  })
              }}
              className="neon-button"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 mb-4">
            <Newspaper className="w-8 h-8 text-neon-cyan" />
            <h1 className="text-5xl md:text-6xl font-orbitron font-bold neon-text">
              Chain News
            </h1>
          </div>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Stay updated with the latest blockchain updates, features, and announcements
          </p>
        </div>

        {/* Featured Post */}
        {featuredPost && (
          <Link
            href={`/blog/${featuredPost.id}`}
            className="glass-panel p-8 mb-12 hover:scale-[1.02] transition-all duration-300 block"
          >
            <div className="flex items-center space-x-2 mb-4">
              <span className="px-3 py-1 bg-neon-cyan text-blockchain-dark text-xs font-bold rounded-full uppercase">
                Featured
              </span>
              <span className="px-3 py-1 bg-neon-magenta/20 text-neon-magenta text-xs font-medium rounded">
                {featuredPost.category}
              </span>
            </div>
            <h2 className="text-4xl font-orbitron font-bold text-white mb-4">{featuredPost.title}</h2>
            <p className="text-gray-400 text-lg mb-4">{featuredPost.excerpt}</p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{format(new Date(featuredPost.date), 'MMMM d, yyyy')}</span>
              </div>
              <span className="flex items-center space-x-1 text-neon-cyan">
                <span>Read more</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Link>
        )}

        {/* Regular Posts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {regularPosts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.id}`}
              className="glass-panel p-6 hover:scale-105 transition-all duration-300 block"
            >
              <span className="px-2 py-1 bg-neon-magenta/20 text-neon-magenta text-xs font-medium rounded mb-3 inline-block">
                {post.category}
              </span>
              <h3 className="text-xl font-orbitron font-bold text-white mb-2">{post.title}</h3>
              <p className="text-gray-400 text-sm mb-4">{post.excerpt}</p>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <Calendar className="w-3 h-3" />
                <span>{format(new Date(post.date), 'MMM d, yyyy')}</span>
              </div>
            </Link>
          ))}
        </div>

        {posts.length === 0 && (
          <div className="glass-panel p-12 text-center">
            <Newspaper className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-2xl font-orbitron font-bold text-gray-400 mb-2">No news yet</h3>
            <p className="text-gray-500">Check back soon for the latest blockchain updates</p>
          </div>
        )}
      </div>
    </div>
  )
}
