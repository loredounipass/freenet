import React from 'react'
import { mediaBase } from '../../api/http'

export default function FeedItem({ post }) {
  if (!post) return null
  const { description, multimedia, author, createdAt, thumbnailUrl, multimediaUrl } = post

  // prefer provided multimediaUrl or thumbnailUrl
  const mediaUrl = multimediaUrl || thumbnailUrl || (multimedia && multimedia.filename ? `${mediaBase}/${multimedia.filename}` : null)

  return (
    <div className="fb-card mb-4">
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="fb-author">{author?.username || 'Usuario'}</div>
          <div className="fb-time">{createdAt ? new Date(createdAt).toLocaleString() : ''}</div>
        </div>
        <div className="fb-desc">{description}</div>
      </div>
      {mediaUrl && (
        <div className="fb-media">
          <img src={mediaUrl} alt="media" className="w-full h-auto object-contain" />
        </div>
      )}
    </div>
  )
}
