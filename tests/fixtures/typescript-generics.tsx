import type { Component, JSX } from "solid-js";
import { createMemo, createSignal, For } from "solid-js";

// Basic generic interface
interface GenericProps<T> {
  value: T;
  onChange?: (value: T) => void;
  disabled?: boolean;
}

// Generic component with simple type
function GenericInput<T extends string | number>(props: GenericProps<T>) {
  const [value, setValue] = createSignal(props.value);

  const handleChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const newValue = target.value as T;
    setValue(() => newValue);
    props.onChange?.(newValue);
  };

  return (
    <input
      type="text"
      value={value()}
      onChange={handleChange}
      disabled={props.disabled}
    />
  );
}

// Complex generic interface with constraints
interface ListProps<T extends { id: string; name: string }> {
  items: T[];
  selectedId?: string;
  onSelect?: (item: T) => void;
  renderItem?: (item: T) => JSX.Element;
  filterFn?: (item: T) => boolean;
}

// Generic component with multiple type parameters
interface MultiGenericProps<T, K extends keyof T> {
  data: T[];
  sortKey: K;
  direction?: "asc" | "desc";
  transform?: (item: T) => JSX.Element;
}

function MultiGenericList<T extends { id: string }, K extends keyof T>(
  props: MultiGenericProps<T, K>,
) {
  const sortedItems = createMemo(() => {
    const sorted = [...props.data].sort((a, b) => {
      const aVal = a[props.sortKey];
      const bVal = b[props.sortKey];

      if (aVal < bVal) return props.direction === "desc" ? 1 : -1;
      if (aVal > bVal) return props.direction === "desc" ? -1 : 1;
      return 0;
    });
    return sorted;
  });

  return (
    <ul>
      <For each={sortedItems()}>
        {(item) => (
          <li>
            {props.transform
              ? props.transform(item)
              : String(item[props.sortKey])}
          </li>
        )}
      </For>
    </ul>
  );
}

// Generic component with conditional types
interface ConditionalProps<T> {
  data: T;
  render: (value: T) => JSX.Element;
}

function ConditionalRenderer<T>(props: ConditionalProps<T>) {
  return props.render(props.data);
}

// Generic higher-order component
interface HocProps<T> {
  data: T[];
  loading: boolean;
  error?: string;
  renderItem: (item: T) => JSX.Element;
}

function withLoadingState<T extends { id: string }>(
  Component: Component<HocProps<T>>,
) {
  return (props: HocProps<T>) => {
    if (props.loading) return <div>Loading...</div>;
    if (props.error) return <div>Error: {props.error}</div>;
    return <Component {...props} />;
  };
}

// Generic component with utility types
interface UtilityProps {
  users: Array<{ id: string; name: string; email?: string }>;
  onUpdate: (
    id: string,
    updates: Partial<{ name: string; email?: string }>,
  ) => void;
}

function UserList(props: UtilityProps) {
  return (
    <ul>
      <For each={props.users}>
        {(user) => (
          <li>
            <span>{user.name}</span>
            {user.email && <span>({user.email})</span>}
            <button
              onClick={() => props.onUpdate(user.id, { name: user.name + "!" })}
            >
              Update
            </button>
          </li>
        )}
      </For>
    </ul>
  );
}

// Usage examples with different types
const stringInput = (
  <GenericInput<string> value="hello" onChange={(v) => console.log(v)} />
);
const numberInput = (
  <GenericInput<number> value={42} onChange={(v) => console.log(v)} />
);

interface Item {
  id: string;
  name: string;
  value: number;
}

const complexList = (
  <MultiGenericList<Item, "name">
    data={[{ id: "1", name: "Item 1", value: 10 }]}
    sortKey="name"
    direction="asc"
  />
);

const conditionalString = (
  <ConditionalRenderer
    data="hello world"
    render={(value) => <span>{value.toUpperCase()}</span>}
  />
);

const conditionalNumber = (
  <ConditionalRenderer
    data={123}
    render={(value) => <span>Number: {value * 2}</span>}
  />
);

export {
  GenericInput,
  MultiGenericList,
  ConditionalRenderer,
  withLoadingState,
  UserList,
  type GenericProps,
  type ListProps,
  type MultiGenericProps,
  type ConditionalProps,
  type HocProps,
  type UtilityProps,
};
