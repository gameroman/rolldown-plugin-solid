import { createResource, createSignal } from "solid-js";

const asyncFetchUser = async (
  id: number,
): Promise<{ name: string; id: number }> => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return { id, name: `User ${id}` };
};

const App = () => {
  const [userId] = createSignal(1);
  const [user] = createResource(userId, asyncFetchUser);

  return (
    <div>
      <h1>Config Test</h1>
      {user.loading && <p>Loading...</p>}
      {user.error && <p>Error: {user.error.message}</p>}
      {user() && <p>Hello, {user()?.name}!</p>}
    </div>
  );
};

export default App;
