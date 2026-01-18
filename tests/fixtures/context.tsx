import {
  type Accessor,
  createContext,
  createSignal,
  type ParentComponent,
  useContext,
} from "solid-js";

interface ThemeContextType {
  theme: Accessor<"light" | "dark">;
  toggleTheme: () => void;
}

interface UserContextType {
  user: Accessor<{ name: string; role: string } | null>;
  login: (name: string, role: string) => void;
  logout: () => void;
}

const ThemeContext = createContext<ThemeContextType>();

const UserContext = createContext<UserContextType>();

const ThemeProvider: ParentComponent = (props) => {
  const [theme, setTheme] = createSignal<"light" | "dark">("light");

  const toggleTheme = () => {
    setTheme((current) => (current === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {props.children}
    </ThemeContext.Provider>
  );
};

const UserProvider: ParentComponent = (props) => {
  const [user, setUser] = createSignal<{ name: string; role: string } | null>(
    null,
  );

  const login = (name: string, role: string) => {
    setUser({ name, role });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {props.children}
    </UserContext.Provider>
  );
};

const ThemedComponent = () => {
  const context = useContext(ThemeContext);
  if (!context) return <div>No theme context</div>;
  const { theme, toggleTheme } = context;

  return (
    <div
      style={`background: ${theme() === "light" ? "#fff" : "#333"}; color: ${theme() === "light" ? "#000" : "#fff"}; padding: 1rem;`}
    >
      <p>Current theme: {theme()}</p>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
};

const UserProfile = () => {
  const context = useContext(UserContext);
  if (!context) return <div>No user context</div>;
  const { user, login, logout } = context;

  if (!user()) {
    return (
      <div>
        <p>Please log in</p>
        <button onClick={() => login("John Doe", "user")}>Login as User</button>
        <button onClick={() => login("Admin", "admin")}>Login as Admin</button>
      </div>
    );
  }

  return (
    <div>
      <p>Welcome, {user()?.name}!</p>
      <p>Role: {user()?.role}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

const NestedComponent = () => {
  const themeContext = useContext(ThemeContext);
  const userContext = useContext(UserContext);

  if (!themeContext || !userContext) return <div>No context available</div>;

  return (
    <div>
      <h3>Nested Context Usage</h3>
      <p>Theme from parent: {themeContext.theme()}</p>
      <p>User from parent: {userContext.user()?.name || "Not logged in"}</p>
    </div>
  );
};

const ContextDemo = () => {
  return (
    <ThemeProvider>
      <UserProvider>
        <div>
          <h2>Context Demo</h2>
          <ThemedComponent />
          <UserProfile />
          <NestedComponent />
        </div>
      </UserProvider>
    </ThemeProvider>
  );
};

export default ContextDemo;
