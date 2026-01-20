import type { Component, JSX } from "solid-js";
import { createSignal } from "solid-js";
import type { ButtonProps, UserProps } from "./typescript-imports/types";

// Type-only interface import
interface MyComponentProps {
  title: string;
  count: number;
  onClick?: () => void;
}

// Component using type-only imports
function MyComponent(props: MyComponentProps & UserProps) {
  const [value, setValue] = createSignal(0);

  return (
    <div>
      <h1>{props.title}</h1>
      <p>Count: {props.count}</p>
      <p>User: {props.name}</p>
      <button onClick={() => setValue((v) => v + 1)}>Value: {value()}</button>
    </div>
  );
}

// Generic component with type-only constraints
interface GenericProps<T extends { id: string }> {
  items: T[];
  renderItem: (item: T) => JSX.Element;
  onSelect?: (item: T) => void;
}

function GenericList<T extends { id: string }>(props: GenericProps<T>) {
  return (
    <ul>
      {props.items.map((item) => (
        <li onClick={() => props.onSelect?.(item)}>{props.renderItem(item)}</li>
      ))}
    </ul>
  );
}

// Export type definitions
export type { MyComponentProps, GenericProps };
export type ComponentType<T extends Record<string, any> = {}> = Component<T>;
export type EventHandler<T = Event> = (event: T) => void;

// Component using exported types
function Button(props: ButtonProps & { onClickType: EventHandler }) {
  return <button onClick={props.onClickType}>{props.label}</button>;
}

// Export components
export default MyComponent;
export { GenericList, Button };
