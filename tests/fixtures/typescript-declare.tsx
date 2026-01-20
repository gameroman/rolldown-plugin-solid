import { createSignal, For } from "solid-js";

// Class with declare fields (common pattern for store definitions)
class UserStore {
  declare id: string;
  declare name: string;
  declare email?: string;
  declare age: number;
  declare isActive: boolean;

  constructor(id: string) {
    this.id = id;
    // Other properties will be assigned by store or external initialization
  }
}

// Component using declare fields pattern
function UserProfile() {
  const [user] = createSignal<UserStore>(new UserStore("123"));

  // Simulating external property assignment (common in stores)
  const currentUser = user();
  currentUser.name = "John Doe";
  currentUser.email = "john@example.com";
  currentUser.age = 30;
  currentUser.isActive = true;

  return (
    <div>
      <h1>{user().name}</h1>
      <p>Email: {user().email}</p>
      <p>Age: {user().age}</p>
      <p>Status: {user().isActive ? "Active" : "Inactive"}</p>
    </div>
  );
}

// Class with mixed declare and regular fields
class DataStore {
  declare version: string;
  declare lastModified: Date;

  items: Array<{ id: string; data: any }> = [];
  loading = false;

  constructor(version: string) {
    this.version = version;
    this.lastModified = new Date();
  }
}

// Component using mixed declare/regular fields
function StoreComponent() {
  const [store] = createSignal(new DataStore("1.0.0"));

  const addItem = () => {
    store().items.push({ id: Date.now().toString(), data: Math.random() });
  };

  return (
    <div>
      <p>Store version: {store().version}</p>
      <p>Last modified: {store().lastModified.toISOString()}</p>
      <p>Items count: {store().items.length}</p>
      <button onClick={addItem}>Add Item</button>
      <ul>
        <For each={store().items}>
          {(item) => <li>Item: {JSON.stringify(item.data)}</li>}
        </For>
      </ul>
    </div>
  );
}

// Interface with declare-like behavior (for type-only checking)
interface ConfigInterface {
  apiUrl: string;
  timeout: number;
  retries: number;
  debug: boolean;
}

// Class implementing interface with declare fields
class Config implements ConfigInterface {
  declare apiUrl: string;
  declare timeout: number;
  declare retries: number;
  declare debug: boolean;

  constructor() {
    // Initialize from environment or external config
    this.apiUrl = "https://api.example.com";
    this.timeout = 5000;
    this.retries = 3;
    this.debug = false;
  }
}

// Component using config with declare fields
function ConfigComponent() {
  const [config] = createSignal(new Config());

  return (
    <div>
      <p>API URL: {config().apiUrl}</p>
      <p>Timeout: {config().timeout}ms</p>
      <p>Retries: {config().retries}</p>
      <p>Debug: {config().debug ? "Enabled" : "Disabled"}</p>
    </div>
  );
}

// Abstract class with declare fields
abstract class BaseComponent {
  declare id: string;
  declare props: Record<string, any>;
  declare state: Record<string, any>;

  constructor(id: string) {
    this.id = id;
  }

  abstract render(): any;
}

// Concrete implementation
class ConcreteComponent extends BaseComponent {
  declare specificProp: string;

  constructor(id: string) {
    super(id);
    this.specificProp = "specific value";
  }

  render() {
    return (
      <div>
        Component {this.id}: {this.specificProp}
      </div>
    );
  }
}

// Generic class with declare fields
class GenericStore<T extends { id: string }> {
  declare items: T[];
  declare selectedId: string | null;

  constructor() {
    this.items = [];
    this.selectedId = null;
  }

  select(id: string) {
    this.selectedId = id;
  }

  add(item: T) {
    this.items.push(item);
  }
}

// Component using generic store with declare fields
function GenericStoreComponent() {
  const [store] = createSignal(
    new GenericStore<{ id: string; name: string }>(),
  );

  const addItems = () => {
    store().add({ id: "1", name: "Item 1" });
    store().add({ id: "2", name: "Item 2" });
    store().select("1");
  };

  return (
    <div>
      <button onClick={addItems}>Add Items</button>
      <p>Selected: {store().selectedId || "None"}</p>
      <ul>
        <For each={store().items}>
          {(item) => (
            <li
              style={{
                "font-weight":
                  item.id === store().selectedId ? "bold" : "normal",
              }}
            >
              {item.name}
            </li>
          )}
        </For>
      </ul>
    </div>
  );
}

export {
  UserProfile,
  StoreComponent,
  ConfigComponent,
  ConcreteComponent,
  GenericStoreComponent,
  UserStore,
  DataStore,
  Config,
  BaseComponent,
  ConcreteComponent as Concrete,
  GenericStore,
};
