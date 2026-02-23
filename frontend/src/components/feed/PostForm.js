import React, { useState, useContext } from 'react'
import useFeedAndMultimedia from '../../hooks/useFeedAndMultimedia'
import { AuthContext } from '../../hooks/AuthContext'

export default function PostForm() {
  const { createPostWithFile, createPost, loading } = useFeedAndMultimedia()
  const { auth } = useContext(AuthContext)
  const [description, setDescription] = useState('')
  const [file, setFile] = useState(null)

  const onSubmit = async (e) => {
    e.preventDefault()
    try {
      if (file) {
        await createPostWithFile({ file, description, type: file.type && file.type.startsWith('video') ? 'video' : 'image' })
      } else {
        await createPost({ description, type: 'text', authorId: auth?._id })
      }
      setDescription('')
      setFile(null)
      e.target.reset()
    } catch (err) {
      console.error(err)
      alert('Error creando el post')
    }
  }

  return (
    <form onSubmit={onSubmit} className="fb-post-form">
      <textarea
        className="w-full resize-none p-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 dark:bg-gray-700 dark:text-white"
        placeholder="¿Qué estás pensando?"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
      />
      <div className="flex items-center justify-between mt-3">
        <input name="file" className="text-sm text-gray-600" type="file" accept="image/*,video/*" onChange={(e) => setFile(e.target.files[0])} />
        <button className="ml-4 fb-btn-primary" type="submit" disabled={loading || (!file && description.trim().length===0)}>{loading ? 'Publicando...' : 'Publicar'}</button>
      </div>
    </form>
  )
}
