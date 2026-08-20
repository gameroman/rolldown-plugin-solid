import type { JSX } from "solid-js";

// Export type definitions for type-only imports
export interface UserProps {
  name: string;
  email?: string;
  age?: number;
}

export interface ButtonProps {
  label: string;
  disabled?: boolean;
  variant?: "primary" | "secondary";
  type?: "button" | "submit" | "reset";
}

// Generic utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Conditional types for Solid
export type MaybeJSX =
  | JSX.Element
  | string
  | number
  | boolean
  | null
  | undefined;

// Export type-only functions signatures
export type EventHandler<T = Event> = (event: T) => void;
export type AsyncEventHandler<T = Event> = (event: T) => Promise<void>;

// Complex generic types
export interface StoreState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
}

export type StoreActions<T> = {
  add: (item: T) => void;
  remove: (id: string) => void;
  update: (id: string, updates: Partial<T>) => void;
  clear: () => void;
};
