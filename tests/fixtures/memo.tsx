import { createEffect, createMemo, createSignal } from "solid-js";

const MemoCounter = () => {
  const [count, setCount] = createSignal(0);
  const [multiplier, setMultiplier] = createSignal(2);

  // Derived value that only recalculates when count or multiplier changes
  const doubled = createMemo(() => count() * multiplier());

  // Memo with custom comparison function
  const expensiveValue = createMemo(
    () => {
      console.log("Expensive calculation running...");
      return Math.sqrt(count()) * Math.sqrt(multiplier());
    },
    undefined,
    { equals: (prev, next) => Math.abs(prev - next) < 0.01 },
  );

  // Memo that depends on another memo
  const quadrupled = createMemo(() => doubled() * 2);

  createEffect(() => {
    console.log("Count changed:", count());
  });

  createEffect(() => {
    console.log("Doubled changed:", doubled());
  });

  return (
    <div>
      <h3>Counter with Memos</h3>
      <p>Count: {count()}</p>
      <p>Multiplier: {multiplier()}</p>
      <p>Doubled: {doubled()}</p>
      <p>Quadrupled: {quadrupled()}</p>
      <p>Expensive: {expensiveValue().toFixed(3)}</p>

      <button onClick={() => setCount((c) => c + 1)}>Increment</button>
      <button onClick={() => setMultiplier((m) => m + 1)}>
        Increase Multiplier
      </button>
    </div>
  );
};

const FilteredList = () => {
  const [items, setItems] = createSignal([
    { id: 1, name: "Apple", category: "fruit", price: 1.0 },
    { id: 2, name: "Banana", category: "fruit", price: 0.5 },
    { id: 3, name: "Carrot", category: "vegetable", price: 0.8 },
    { id: 4, name: "Bread", category: "grain", price: 2.0 },
    { id: 5, name: "Orange", category: "fruit", price: 1.2 },
  ]);

  const [searchTerm, setSearchTerm] = createSignal("");
  const [categoryFilter, setCategoryFilter] = createSignal("all");
  const [minPrice, setMinPrice] = createSignal(0);

  // Memoized filtering - only recalculates when dependencies change
  const filteredItems = createMemo(() => {
    const search = searchTerm().toLowerCase();
    const category = categoryFilter();
    const minP = minPrice();

    console.log("Filtering items...");

    return items().filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(search);
      const matchesCategory = category === "all" || item.category === category;
      const matchesPrice = item.price >= minP;

      return matchesSearch && matchesCategory && matchesPrice;
    });
  });

  // Memoized total price calculation
  const totalPrice = createMemo(() => {
    return filteredItems().reduce((sum, item) => sum + item.price, 0);
  });

  const addItem = () => {
    const newId = items().length + 1;
    setItems([
      ...items(),
      {
        id: newId,
        name: `Item ${newId}`,
        category: "other",
        price: Math.random() * 5,
      },
    ]);
  };

  return (
    <div>
      <h3>Filtered List with Memos</h3>

      <div style="margin-bottom: 1rem;">
        <input
          type="text"
          placeholder="Search..."
          onInput={(e) => setSearchTerm(e.currentTarget.value)}
        />
        <select
          onChange={(e) => setCategoryFilter(e.currentTarget.value)}
          style="margin-left: 0.5rem;"
        >
          <option value="all">All Categories</option>
          <option value="fruit">Fruit</option>
          <option value="vegetable">Vegetable</option>
          <option value="grain">Grain</option>
        </select>
        <input
          type="number"
          placeholder="Min Price"
          min="0"
          step="0.1"
          onInput={(e) => setMinPrice(Number(e.currentTarget.value))}
          style="margin-left: 0.5rem; width: 100px;"
        />
      </div>

      <button onClick={addItem}>Add Random Item</button>

      <p>Total items: {filteredItems().length}</p>
      <p>Total price: ${totalPrice().toFixed(2)}</p>

      <ul>
        {filteredItems().map((item) => (
          <li>
            {item.name} ({item.category}) - ${item.price.toFixed(2)}
          </li>
        ))}
      </ul>
    </div>
  );
};

const ComputedValues = () => {
  const [base, setBase] = createSignal(10);
  const [exponent, setExponent] = createSignal(2);

  // Complex computed value
  const power = createMemo(() => base() ** exponent());

  // Memo that depends on another memo
  const formattedPower = createMemo(() => {
    const value = power();
    if (value > 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toFixed(0);
  });

  // Conditional memo
  const isLargeNumber = createMemo(() => power() > 500);

  // Memo with string manipulation
  const description = createMemo(() => {
    const b = base();
    const e = exponent();
    const p = power();
    return `${b}^${e} = ${p}`;
  });

  return (
    <div>
      <h3>Computed Values</h3>
      <div style="display: flex; gap: 1rem; align-items: center;">
        <div>
          <label>Base: {base()}</label>
          <input
            type="range"
            min="1"
            max="20"
            value={base()}
            onInput={(e) => setBase(Number(e.currentTarget.value))}
          />
        </div>

        <div>
          <label>Exponent: {exponent()}</label>
          <input
            type="range"
            min="1"
            max="5"
            value={exponent()}
            onInput={(e) => setExponent(Number(e.currentTarget.value))}
          />
        </div>
      </div>

      <p>Raw power: {power()}</p>
      <p>Formatted: {formattedPower()}</p>
      <p>Is large: {isLargeNumber() ? "Yes" : "No"}</p>
      <p>Description: {description()}</p>

      {isLargeNumber() && (
        <div style="color: red; font-weight: bold;">
          This is a large number!
        </div>
      )}
    </div>
  );
};

const MemoDemo = () => {
  return (
    <div>
      <h2>createMemo Demo</h2>
      <MemoCounter />
      <hr />
      <FilteredList />
      <hr />
      <ComputedValues />
    </div>
  );
};

export default MemoDemo;
