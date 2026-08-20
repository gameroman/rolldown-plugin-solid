import { createSignal, onCleanup, onMount } from "solid-js";

const OnMountExample = () => {
  const [mountedTime, setMountedTime] = createSignal("");
  const [elapsed, setElapsed] = createSignal(0);
  const [data, setData] = createSignal<string | null>(null);
  const [error, setError] = createSignal<string | null>(null);

  let intervalId: number | undefined;

  onMount(() => {
    console.log("Component mounted!");

    const mountTime = new Date().toLocaleTimeString();
    setMountedTime(mountTime);

    intervalId = window.setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);

    fetch("https://jsonplaceholder.typicode.com/todos/1")
      .then((response) => response.json())
      .then((todo) => {
        setData(JSON.stringify(todo, null, 2));
        setError(null);
      })
      .catch((err) => {
        setError(err.message);
        setData(null);
      });

    const handleResize = () => {
      console.log(
        "Window resized:",
        window.innerWidth,
        "x",
        window.innerHeight,
      );
    };
    window.addEventListener("resize", handleResize);

    onCleanup(() => {
      console.log("Component will unmount - cleaning up!");
      if (intervalId) {
        clearInterval(intervalId);
      }
      window.removeEventListener("resize", handleResize);
    });
  });

  const DataLoader = () => {
    const [loading, setLoading] = createSignal(true);
    const [posts, setPosts] = createSignal<any[]>([]);

    onMount(async () => {
      try {
        setLoading(true);
        const response = await fetch(
          "https://jsonplaceholder.typicode.com/posts?_limit=5",
        );
        const data = await response.json();
        setPosts(data);
      } catch (err) {
        console.error("Failed to load posts:", err);
      } finally {
        setLoading(false);
      }
    });

    return (
      <div class="data-loader">
        <h3>Data Loader Component</h3>
        {loading() ? (
          <p>Loading posts...</p>
        ) : (
          <ul>
            {posts().map((post) => (
              <li>{post.title}</li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  const TimerComponent = () => {
    const [seconds, setSeconds] = createSignal(0);

    onMount(() => {
      const timer = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);

      onCleanup(() => {
        clearInterval(timer);
      });
    });

    return (
      <div class="timer-component">
        <h4>Timer: {seconds()}s</h4>
      </div>
    );
  };

  return (
    <div class="onmount-example">
      <h2>onMount Example</h2>

      <div class="mount-info">
        <p>Mounted at: {mountedTime()}</p>
        <p>Time elapsed: {elapsed()}s</p>
      </div>

      <div class="async-data">
        <h3>Async Data Loading</h3>
        {error() ? (
          <p class="error">Error: {error()}</p>
        ) : data() ? (
          <pre>{data()}</pre>
        ) : (
          <p>Loading data...</p>
        )}
      </div>

      <DataLoader />
      <TimerComponent />

      <div class="instructions">
        <p>✅ Component mounted - check console for logs</p>
        <p>🔄 Timer and resize listener are active</p>
        <p>📊 Data fetched from API on mount</p>
      </div>
    </div>
  );
};

export default OnMountExample;
