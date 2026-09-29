import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

interface ChainNewsPost {
  id: number
  title: string
  excerpt: string
  date: string
  category: string
  featured: boolean
  commitHash?: string
  filesChanged?: string[]
}

/**
 * Monitor blockchain repository for new additions and generate blog posts
 * This checks git commits, new pallets, and other blockchain changes
 */
export async function GET() {
  try {
    const posts: ChainNewsPost[] = []

    // In production, this would:
    // 1. Monitor git commits to the blockchain repository
    // 2. Detect new pallets, features, or updates
    // 3. Generate blog posts automatically
    // 4. Store in a database

    // Check for recent commits and generate posts from actual git history
    try {
      const { stdout } = await execAsync('git log --oneline -10', {
        cwd: process.cwd(),
      }).catch(() => ({ stdout: '' }))

      // Parse commits and generate posts
      // This is a simplified example - in production, you'd have more sophisticated parsing
      const commits = stdout.split('\n').filter(Boolean)
      
      commits.forEach((commit, index) => {
        const [hash, ...messageParts] = commit.split(' ')
        const message = messageParts.join(' ')

        // Detect different types of changes
        if (message.toLowerCase().includes('pallet')) {
          posts.push({
            id: Date.now() + index,
            title: `New Pallet: ${message}`,
            excerpt: `A new pallet has been added to the blockchain: ${message}`,
            date: new Date().toISOString(),
            category: 'Blockchain Updates',
            featured: index === 0,
            commitHash: hash,
          })
        } else if (message.toLowerCase().includes('cgt') || message.toLowerCase().includes('token')) {
          posts.push({
            id: Date.now() + index + 100,
            title: `CGT Update: ${message}`,
            excerpt: `Creator God Token related changes: ${message}`,
            date: new Date().toISOString(),
            category: 'Tokenomics',
            featured: false,
            commitHash: hash,
          })
        } else if (message.toLowerCase().includes('sdk') || message.toLowerCase().includes('tool')) {
          posts.push({
            id: Date.now() + index + 200,
            title: `Developer Tools: ${message}`,
            excerpt: `New developer tools or SDK updates: ${message}`,
            date: new Date().toISOString(),
            category: 'Developer Tools',
            featured: false,
            commitHash: hash,
          })
        }
      })
    } catch (error) {
      console.error('Error checking git commits:', error)
      // If git check fails, return empty array - no posts will be shown
      // Frontend will display appropriate empty state
    }

    // Sort by date (newest first)
    posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return NextResponse.json({ posts: posts.slice(0, 20) }) // Return latest 20 posts
  } catch (error: any) {
    console.error('Chain news error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch chain news' },
      { status: 500 }
    )
  }
}
