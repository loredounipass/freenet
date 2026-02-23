import React from 'react'
import useFeedAndMultimedia from '../../hooks/useFeedAndMultimedia'
import FeedItem from './FeedItem'
import PostForm from './PostForm'

export default function FeedList() {
  const { posts, loading } = useFeedAndMultimedia()

  return (
    <div className="fb-list-wrapper">
      <PostForm />
      {loading && <div className="text-center py-4">Loading...</div>}
      {posts && posts.length === 0 && <div className="fb-empty">No hay publicaciones aún.</div>}
      <div className="space-y-4">
        {posts && posts.map((p) => <FeedItem key={p._id} post={p} />)}
      </div>
    </div>
  )
}
