'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Plus, Search, Clock, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface ForumPost {
  id: number
  title: string
  author: string
  replies: number
  views: number
  lastActivity: string
  category: string
}

const categories = ['All', 'Development', 'Mining', 'Games', 'General', 'Support']

export default function ForumPage() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setError(null)
        // TODO: Replace with actual forum API endpoint when available
        // const response = await fetch('/api/forum/posts')
        // const data = await response.json()
        // setPosts(data.posts || [])
        
        // For now, return empty array - forum functionality not yet implemented
        setPosts([])
      } catch (error) {
        console.error('Failed to fetch forum posts:', error)
        setError(error instanceof Error ? error.message : 'Failed to fetch forum posts')
        setPosts([])
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [])

  const filteredPosts = posts.filter((post) => {
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-5xl font-orbitron font-bold neon-text mb-2">Community Forum</h1>
            <p className="text-gray-400">Connect with developers, creators, and validators</p>
          </div>
          <button className="neon-button inline-flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>New Post</span>
          </button>
        </div>

        {/* Search and Categories */}
        <div className="glass-panel p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search forum posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-blockchain-dark border border-neon-cyan/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-neon-cyan text-blockchain-dark'
                      : 'bg-blockchain-dark text-gray-300 hover:bg-neon-cyan/20'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Forum Posts */}
        {loading ? (
          <div className="glass-panel p-12 text-center">
            <Loader2 className="w-16 h-16 text-neon-cyan mx-auto mb-4 animate-spin" />
            <p className="text-gray-400">Loading forum posts...</p>
          </div>
        ) : error ? (
          <div className="glass-panel p-12 text-center">
            <MessageSquare className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-2xl font-orbitron font-bold text-gray-400 mb-2">Error loading forum</h3>
            <p className="text-gray-500">{error}</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/forum/${post.id}`}
                  className="glass-panel p-6 hover:scale-[1.02] transition-all duration-300 block"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="px-2 py-1 bg-neon-cyan/20 text-neon-cyan text-xs font-medium rounded">
                          {post.category}
                        </span>
                        <h3 className="text-xl font-orbitron font-bold text-white">{post.title}</h3>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span>By {post.author}</span>
                        <span className="flex items-center space-x-1">
                          <MessageSquare className="w-4 h-4" />
                          <span>{post.replies} replies</span>
                        </span>
                        <span>{post.views} views</span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{post.lastActivity}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {filteredPosts.length === 0 && (
              <div className="glass-panel p-12 text-center">
                <MessageSquare className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-2xl font-orbitron font-bold text-gray-400 mb-2">
                  {posts.length === 0 ? 'Forum coming soon' : 'No posts found'}
                </h3>
                <p className="text-gray-500">
                  {posts.length === 0
                    ? 'The community forum is under development. Check back soon!'
                    : 'Try adjusting your search or category filter'}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
