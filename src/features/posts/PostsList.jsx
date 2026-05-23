import React, { useState } from 'react'
import { useGetPostsQuery, useCreatePostMutation } from '../api/apiSlice'

export default function PostsList() {
  const { data: posts, error, isLoading } = useGetPostsQuery()
  const [createPost] = useCreatePostMutation()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  async function handleAdd(e) {
    e.preventDefault()
    if (!title) return
    await createPost({ title, body }).unwrap()
    setTitle('')
    setBody('')
  }

  if (isLoading) return <div className="loading">Loading posts...</div>
  if (error) return <div className="loading">Error loading posts</div>

  return (
    <div>
      <form onSubmit={handleAdd} style={{ marginBottom: 16 }}>
        <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input placeholder="Body" value={body} onChange={(e) => setBody(e.target.value)} />
        <button type="submit">Add Post</button>
      </form>

      {posts?.length ? (
        posts.map(p => (
          <div key={p._id} className="post">
            <h3>{p.title}</h3>
            <p>{p.body}</p>
          </div>
        ))
      ) : (
        <div>No posts yet</div>
      )}
    </div>
  )
}
