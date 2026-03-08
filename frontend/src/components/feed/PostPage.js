import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import feedService from '../../services/feedAndMultimedia'
import useFeedAndMultimedia from '../../hooks/useFeedAndMultimedia'
import FeedItem from './FeedItem'
import LeftSidebar from './LeftSidebar'
import RightSidebar from './RightSidebar'

export default function PostPage() {
  const { id } = useParams()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Use the hook to get actions but ignore the posts list it fetches
  const {
    likePost,
    unlikePost,
    addComment,
    joinPost,
    viewPost,
    getComments,
    likeComment,
    unlikeComment,
    sharePost
  } = useFeedAndMultimedia()

  useEffect(() => {
    let mounted = true
    const fetchPost = async () => {
      try {
        setLoading(true)
        const res = await feedService.getPostById(id)
        if (mounted) {
          // Check if response is the data directly or if it has a data property
          const postData = (res && res.data) ? res.data : res
          setPost(postData)
        }
      } catch (err) {
        if (mounted) {
          console.error('Error fetching post:', err)
          setError(err)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    if (id) {
      fetchPost()
    }
    
    return () => {
      mounted = false
    }
  }, [id])

  if (loading) {
    return (
      <div className="fb-loading">
        Cargando publicación...
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="fb-empty">
        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⚠️</div>
        Publicación no encontrada o eliminada
      </div>
    )
  }

  return (
    <>
      <div className="fb-left-sidebar-fixed">
        <LeftSidebar />
      </div>

      <div className="fb-list-wrapper">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <FeedItem
            key={post._id}
            post={post}
            actions={{
              likePost,
              unlikePost,
              addComment,
              joinPost,
              viewPost,
              getComments,
              likeComment,
              unlikeComment,
              sharePost
            }}
          />
        </div>
      </div>

      <div className="fb-right-sidebar-fixed">
        <RightSidebar />
      </div>
    </>
  )
}
