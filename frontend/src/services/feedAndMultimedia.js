import {
  get,
  getFeed as apiGetFeed,
  getVideoFeed as apiGetVideoFeed,
  post,
  postMultipart,
  del,
  feedApi,
  feedUploadApi,
  feedCommentsApi,
  feedLikesApi,
  feedViewsApi,
  feedPostApi,
  feedCommentLikesApi,
  feedSharesApi,
} from '../api/http'

export async function createPost(dto) {
  return await post(feedApi, dto)
}

export async function createPostWithFile({ file, description = '', type = 'image', multimediaId }) {
  const form = new FormData()
  if (file) form.append('file', file, file.name)
  form.append('description', description)
  form.append('type', type)
  if (multimediaId) form.append('multimediaId', multimediaId)
  return await postMultipart(feedUploadApi, form)
}

export async function getFeed(limit = 50) {
  return await apiGetFeed({ limit })
}

// Video-only feed — delegates to the dedicated http.js convenience function `getVideoFeed`
export async function getVideoFeed() {
  return await apiGetVideoFeed()
}

export async function getPostById(id) {
  return await get(feedPostApi(id))
}

export async function addComment(postId, content, parentId) {
  if (!postId) throw new Error('postId required')
  const body = { content }
  if (parentId) body.parentId = parentId
  return await post(feedCommentsApi(postId), body)
}

export async function getComments(postId) {
  if (!postId) throw new Error('postId required')
  return await get(feedCommentsApi(postId))
}

export async function likeComment(commentId) {
  if (!commentId) throw new Error('commentId required')
  return await post(feedCommentLikesApi(commentId))
}

export async function unlikeComment(commentId) {
  if (!commentId) throw new Error('commentId required')
  return await del(feedCommentLikesApi(commentId))
}

export async function likePost(postId) {
  if (!postId) throw new Error('postId required')
  return await post(feedLikesApi(postId))
}

export async function unlikePost(postId) {
  if (!postId) throw new Error('postId required')
  return await del(feedLikesApi(postId))
}

export async function viewPost(postId) {
  if (!postId) throw new Error('postId required')
  return await post(feedViewsApi(postId))
}

export async function sharePost(postId) {
  if (!postId) throw new Error('postId required')
  return await post(feedSharesApi(postId))
}

const feedService = {
  createPost,
  createPostWithFile,
  getFeed,
  getVideoFeed,
  getPostById,
  addComment,
  getComments,
  likeComment,
  unlikeComment,
  likePost,
  unlikePost,
  viewPost,
  sharePost,
}

export default feedService
