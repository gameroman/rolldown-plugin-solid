import { batch, createEffect, createSignal } from "solid-js";

const BatchExample = () => {
  const [count, setCount] = createSignal(0);
  const [double, setDouble] = createSignal(0);
  const [name, setName] = createSignal("");
  const [greeting, setGreeting] = createSignal("");

  createEffect(() => {
    console.log("Count changed:", count());
  });

  createEffect(() => {
    console.log("Double changed:", double());
  });

  createEffect(() => {
    console.log("Name changed:", name());
  });

  createEffect(() => {
    console.log("Greeting changed:", greeting());
  });

  const updateWithoutBatch = () => {
    console.log("=== Updating without batch ===");
    setCount((c) => c + 1);
    setDouble((d) => d + 2);
    setName("Alice");
    setGreeting("Hello, Alice!");
  };

  const updateWithBatch = () => {
    console.log("=== Updating with batch ===");
    batch(() => {
      setCount((c) => c + 1);
      setDouble((d) => d + 2);
      setName("Bob");
      setGreeting("Hello, Bob!");
    });
  };

  const nestedBatchExample = () => {
    console.log("=== Nested batch example ===");
    batch(() => {
      setCount(0);
      setDouble(0);
      setName("");
      setGreeting("");

      batch(() => {
        setCount(10);
        setDouble(20);
      });

      setName("Charlie");
      setGreeting("Hello, Charlie!");
    });
  };

  const complexUpdate = () => {
    console.log("=== Complex update with dependencies ===");
    batch(() => {
      const newCount = count() + 5;
      setCount(newCount);
      setDouble(newCount * 2);
      setName(newCount > 10 ? "High Count" : "Low Count");
      setGreeting(`Count is ${newCount}`);
    });
  };

  return (
    <div class="batch-example">
      <h2>Batch Example</h2>

      <div class="state-display">
        <p>Count: {count()}</p>
        <p>Double: {double()}</p>
        <p>Name: {name()}</p>
        <p>Greeting: {greeting()}</p>
      </div>

      <div class="controls">
        <button onClick={updateWithoutBatch}>Update Without Batch</button>
        <button onClick={updateWithBatch}>Update With Batch</button>
        <button onClick={nestedBatchExample}>Nested Batch Example</button>
        <button onClick={complexUpdate}>Complex Update</button>
      </div>

      <div class="info">
        <p>Check console to see the difference in effect triggers!</p>
        <p>Without batch: Each signal update triggers effects separately</p>
        <p>With batch: All updates trigger effects together once</p>
      </div>
    </div>
  );
};

export default BatchExample;
