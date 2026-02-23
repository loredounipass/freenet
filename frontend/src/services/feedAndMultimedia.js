import { get, post, postMultipart, feedApi, feedUploadApi, myFeedApi } from '../api/http'

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

export async function getMyPosts() {
  return await get(myFeedApi)
}

const feedService = {
  createPost,
  createPostWithFile,
  getMyPosts,
}

export default feedService
