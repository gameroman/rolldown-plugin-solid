import { createSignal, For, Index } from "solid-js";

const ListDemo = () => {
  const [items, setItems] = createSignal([
    { id: 1, name: "Apple", category: "fruit" },
    { id: 2, name: "Banana", category: "fruit" },
    { id: 3, name: "Carrot", category: "vegetable" },
    { id: 4, name: "Date", category: "fruit" },
  ]);

  const [simpleItems, setSimpleItems] = createSignal(["Red", "Green", "Blue"]);

  const addItem = () => {
    const newItem = {
      id: Date.now(),
      name: `Item ${items().length + 1}`,
      category: "other",
    };
    setItems([...items(), newItem]);
  };

  const removeItem = (id: number) => {
    setItems(items().filter((item) => item.id !== id));
  };

  const addSimpleItem = () => {
    const colors = ["Yellow", "Purple", "Orange", "Pink"];
    const newColor = colors[Math.floor(Math.random() * colors.length)];
    setSimpleItems([...simpleItems(), newColor]);
  };

  return (
    <div>
      <h2>Product List</h2>
      <button onClick={addItem}>Add Item</button>
      <ul>
        <For each={items()}>
          {(item) => (
            <li>
              {item.name} ({item.category})
              <button onClick={() => removeItem(item.id)}>Remove</button>
            </li>
          )}
        </For>
      </ul>

      <h2>Simple List</h2>
      <button onClick={addSimpleItem}>Add Color</button>
      <Index each={simpleItems()}>
        {(item, index) => (
          <div>
            <span>
              #{index}: {item()}
            </span>
          </div>
        )}
      </Index>
    </div>
  );
};

export default ListDemo;
