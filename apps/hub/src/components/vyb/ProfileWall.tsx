'use client';

import { useState } from 'react';
import Link from 'next/link';

interface WallPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorQorId: string;
  content: string;
  createdAt: Date;
  likes: number;
  isLiked: boolean;
  comments: WallComment[];
}

interface WallComment {
  id: string;
  authorId: string;
  authorName: string;
  authorQorId: string;
  content: string;
  createdAt: Date;
}

interface ProfileWallProps {
  profileId: string;
  profileName: string;
  isOwnProfile: boolean;
  wallPosts?: WallPost[];
  onPostToWall?: (content: string) => Promise<void>;
  onLikePost?: (postId: string) => Promise<void>;
  onCommentPost?: (postId: string, content: string) => Promise<void>;
}

export function ProfileWall({ 
  profileId, 
  profileName, 
  isOwnProfile, 
  wallPosts = [],
  onPostToWall,
  onLikePost,
  onCommentPost
}: ProfileWallProps) {
  const [newPost, setNewPost] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  // Use provided wall posts or empty array - no mock data
  const displayWallPosts: WallPost[] = wallPosts;

  const handlePostToWall = async () => {
    if (!newPost.trim()) return;
    setIsPosting(true);
    try {
      if (onPostToWall) {
        await onPostToWall(newPost);
      }
      setNewPost('');
    } catch (error) {
      console.error('Failed to post:', error);
    } finally {
      setIsPosting(false);
    }
  };

  const toggleComments = (postId: string) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId);
    } else {
      newExpanded.add(postId);
    }
    setExpandedComments(newExpanded);
  };

  const handleComment = async (postId: string) => {
    const content = commentInputs[postId];
    if (!content?.trim()) return;
    
    if (onCommentPost) {
      await onCommentPost(postId, content);
    }
    setCommentInputs({ ...commentInputs, [postId]: '' });
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Wall Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-grunge-alt text-2xl text-white flex items-center gap-2">
          📝 {isOwnProfile ? 'My Wall' : `${profileName}'s Wall`}
        </h2>
        <span className="text-gray-500 text-sm">{displayWallPosts.length} posts</span>
      </div>

      {/* Write on Wall Box */}
      {!isOwnProfile && (
        <div className="glass-panel p-4 rounded-xl border-2 border-dashed border-gray-700 hover:border-neon-cyan/50 transition-colors">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-cyan/50 to-neon-purple/50 flex items-center justify-center text-lg flex-shrink-0">
              👤
            </div>
            <div className="flex-1">
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder={`Write something on ${profileName}'s wall...`}
                className="w-full bg-transparent border-none resize-none focus:outline-none text-white placeholder-gray-500 font-body min-h-[80px]"
                maxLength={500}
              />
              <div className="flex items-center justify-between pt-3 border-t border-gray-800">
                <div className="flex items-center gap-3">
                  <button className="text-gray-500 hover:text-neon-cyan transition-colors text-sm">
                    📷 Photo
                  </button>
                  <button className="text-gray-500 hover:text-neon-cyan transition-colors text-sm">
                    🎁 Gift
                  </button>
                  <button className="text-gray-500 hover:text-neon-cyan transition-colors text-sm">
                    😊 Emoji
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">{newPost.length}/500</span>
                  <button
                    onClick={handlePostToWall}
                    disabled={!newPost.trim() || isPosting}
                    className="neon-button px-4 py-2 rounded-lg text-sm disabled:opacity-50"
                  >
                    {isPosting ? 'Posting...' : 'Post to Wall'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wall Posts */}
      <div className="space-y-4">
        {displayWallPosts.length === 0 ? (
          <div className="glass-panel p-8 rounded-xl text-center">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-gray-400">No wall posts yet.</p>
            {!isOwnProfile && (
              <p className="text-gray-500 text-sm mt-2">Be the first to write something!</p>
            )}
          </div>
        ) : (
          displayWallPosts.map((post) => (
            <div key={post.id} className="glass-panel rounded-xl overflow-hidden">
              {/* Post Header */}
              <div className="p-4 border-b border-gray-800/50">
                <div className="flex items-start gap-3">
                  <Link href={`/social/profile/${post.authorQorId}`}>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-cyan/50 to-neon-purple/50 flex items-center justify-center text-lg hover:scale-105 transition-transform cursor-pointer">
                      {post.authorAvatar ? (
                        <img src={post.authorAvatar} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        '👤'
                      )}
                    </div>
                  </Link>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Link 
                        href={`/social/profile/${post.authorQorId}`}
                        className="font-grunge-alt text-white hover:text-neon-cyan transition-colors"
                      >
                        {post.authorName}
                      </Link>
                      <span className="text-gray-500 text-sm">wrote on {isOwnProfile ? 'your' : `${profileName}'s`} wall</span>
                    </div>
                    <p className="text-gray-500 text-xs">@{post.authorQorId} · {formatTimeAgo(post.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Post Content */}
              <div className="p-4">
                <p className="text-white font-body whitespace-pre-wrap">{post.content}</p>
              </div>

              {/* Post Actions */}
              <div className="px-4 pb-4 flex items-center gap-4">
                <button 
                  onClick={() => onLikePost?.(post.id)}
                  className={`flex items-center gap-1 text-sm transition-colors ${
                    post.isLiked ? 'text-pink-500' : 'text-gray-500 hover:text-pink-500'
                  }`}
                >
                  {post.isLiked ? '❤️' : '🤍'} {post.likes}
                </button>
                <button 
                  onClick={() => toggleComments(post.id)}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-neon-cyan transition-colors"
                >
                  💬 {post.comments.length} {post.comments.length === 1 ? 'comment' : 'comments'}
                </button>
                <button className="text-gray-500 hover:text-green-400 transition-colors text-sm">
                  💎 Tip
                </button>
              </div>

              {/* Comments Section */}
              {expandedComments.has(post.id) && (
                <div className="border-t border-gray-800/50 bg-blockchain-light/20">
                  {/* Existing Comments */}
                  {post.comments.map((comment) => (
                    <div key={comment.id} className="p-4 border-b border-gray-800/30 last:border-b-0">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-purple/50 to-neon-cyan/50 flex items-center justify-center text-sm">
                          👤
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Link 
                              href={`/social/profile/${comment.authorQorId}`}
                              className="font-grunge-alt text-sm text-white hover:text-neon-cyan transition-colors"
                            >
                              {comment.authorName}
                            </Link>
                            <span className="text-gray-500 text-xs">{formatTimeAgo(comment.createdAt)}</span>
                          </div>
                          <p className="text-gray-300 text-sm mt-1">{comment.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add Comment */}
                  <div className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-cyan/50 to-neon-purple/50 flex items-center justify-center text-sm flex-shrink-0">
                        👤
                      </div>
                      <input
                        type="text"
                        value={commentInputs[post.id] || ''}
                        onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                        placeholder="Write a comment..."
                        className="flex-1 bg-white/90 border border-gray-300 rounded-full px-4 py-2 text-gray-900 text-sm focus:border-neon-cyan/50 focus:outline-none"
                        onKeyDown={(e) => e.key === 'Enter' && handleComment(post.id)}
                      />
                      <button
                        onClick={() => handleComment(post.id)}
                        disabled={!commentInputs[post.id]?.trim()}
                        className="text-neon-cyan hover:text-neon-cyan/80 transition-colors disabled:opacity-50"
                      >
                        ➤
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
