import { get, getFeed as apiGetFeed, post, postMultipart, del, feedApi, feedUploadApi, feedCommentsApi, feedLikesApi, feedViewsApi } from '../api/http'

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

// legacy: getMyPosts removed (use getFeed)

export async function getFeed(limit = 50) {
  return await apiGetFeed({ limit })
}

export async function getPostById(id) {
  return await get(`${feedApi}/${id}`)
}

export async function addComment(postId, content) {
  if (!postId) throw new Error('postId required')
  return await post(feedCommentsApi(postId), { content })
}

export async function getComments(postId) {
  if (!postId) throw new Error('postId required')
  return await get(feedCommentsApi(postId))
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

const feedService = {
  createPost,
  createPostWithFile,
  getFeed,
  getPostById,
  addComment,
  likePost,
  unlikePost,
  viewPost,
}

export default feedService
