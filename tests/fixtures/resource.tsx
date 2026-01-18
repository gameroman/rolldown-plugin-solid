import { createResource, createSignal, Suspense } from "solid-js";

// Simulate API calls
const fetchUser = async (id: number) => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  if (id === 1) {
    return { id: 1, name: "John Doe", email: "john@example.com" };
  }
  if (id === 2) {
    return { id: 2, name: "Jane Smith", email: "jane@example.com" };
  }
  throw new Error("User not found");
};

const fetchPosts = async () => {
  await new Promise((resolve) => setTimeout(resolve, 1500));
  return [
    { id: 1, title: "First Post", userId: 1 },
    { id: 2, title: "Second Post", userId: 2 },
    { id: 3, title: "Third Post", userId: 1 },
  ];
};

const fetchComments = async (postId: number) => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return [
    { id: 1, postId, text: "Great post!", userId: 1 },
    { id: 2, postId, text: "Thanks for sharing", userId: 2 },
  ];
};

const UserComponent = () => {
  const [userId] = createSignal(1);
  const [user, { mutate, refetch }] = createResource(userId, fetchUser);

  return (
    <div>
      <h3>User Info</h3>
      <Suspense fallback={<div>Loading user...</div>}>
        {user() && (
          <div>
            <p>ID: {user()!.id}</p>
            <p>Name: {user()!.name}</p>
            <p>Email: {user()!.email}</p>
          </div>
        )}
      </Suspense>
      <button onClick={() => refetch()}>Refresh User</button>
      <button
        onClick={() =>
          mutate({ id: 999, name: "Mutated", email: "mutated@example.com" })
        }
      >
        Mutate User
      </button>
    </div>
  );
};

const PostsComponent = () => {
  const [shouldLoad, setShouldLoad] = createSignal(false);
  const [posts, { refetch }] = createResource(shouldLoad, fetchPosts);

  return (
    <div>
      <h3>Posts</h3>
      <button onClick={() => setShouldLoad(true)}>Load Posts</button>

      <Suspense fallback={<div>Loading posts...</div>}>
        {posts() && (
          <ul>
            {posts()!.map((post) => (
              <li>
                {post.title} (User ID: {post.userId})
              </li>
            ))}
          </ul>
        )}
      </Suspense>

      {shouldLoad() && <button onClick={() => refetch()}>Refresh Posts</button>}
    </div>
  );
};

const CommentsComponent = (props: { postId: number }) => {
  const [comments, { refetch }] = createResource(
    () => props.postId,
    fetchComments,
    {
      initialValue: [],
    },
  );

  return (
    <div>
      <h4>Comments for Post {props.postId}</h4>
      <button onClick={() => refetch()}>Refresh Comments</button>

      <Suspense fallback={<div>Loading comments...</div>}>
        {comments() && comments()!.length > 0 ? (
          <ul>
            {comments()!.map((comment) => (
              <li>
                {comment.text} (User ID: {comment.userId})
              </li>
            ))}
          </ul>
        ) : (
          <p>No comments yet</p>
        )}
      </Suspense>
    </div>
  );
};

const ResourceDemo = () => {
  const [selectedUserId, setSelectedUserId] = createSignal(1);
  const [selectedPostId, setSelectedPostId] = createSignal(1);

  const [user] = createResource(selectedUserId, fetchUser, {
    initialValue: { id: 0, name: "Loading...", email: "" },
  });

  return (
    <div>
      <h2>createResource Demo</h2>

      <div>
        <h3>User Selection</h3>
        <button onClick={() => setSelectedUserId(1)}>User 1</button>
        <button onClick={() => setSelectedUserId(2)}>User 2</button>
        <button onClick={() => setSelectedUserId(999)}>Invalid User</button>

        <Suspense fallback={<div>Loading selected user...</div>}>
          {user() && (
            <div>
              <p>Selected: {user()!.name}</p>
              <p>Email: {user()!.email}</p>
            </div>
          )}
        </Suspense>
      </div>

      <div style="margin-top: 2rem;">
        <UserComponent />
      </div>

      <div style="margin-top: 2rem;">
        <PostsComponent />
      </div>

      <div style="margin-top: 2rem;">
        <h3>Comments Selection</h3>
        <button onClick={() => setSelectedPostId(1)}>Post 1 Comments</button>
        <button onClick={() => setSelectedPostId(2)}>Post 2 Comments</button>
        <button onClick={() => setSelectedPostId(3)}>Post 3 Comments</button>

        <Suspense fallback={<div>Loading comments section...</div>}>
          <CommentsComponent postId={selectedPostId()} />
        </Suspense>
      </div>
    </div>
  );
};

export default ResourceDemo;
