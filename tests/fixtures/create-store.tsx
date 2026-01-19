import { createEffect, createSignal } from "solid-js";
import { createStore } from "solid-js/store";

interface UserProfile {
  id: number;
  name: string;
  email: string;
  address: {
    street: string;
    city: string;
    zipCode: string;
  };
  preferences: {
    theme: "light" | "dark";
    notifications: {
      email: boolean;
      push: boolean;
      marketing: boolean;
    };
  };
}

interface AppState {
  currentUser: UserProfile | null;
  users: UserProfile[];
  isLoading: boolean;
  error: string | null;
}

const StoreExample = () => {
  const [store, setStore] = createStore<AppState>({
    currentUser: null,
    users: [],
    isLoading: false,
    error: null,
  });

  const [selectedUserId, setSelectedUserId] = createSignal<number | null>(null);

  const addUser = (user: Omit<UserProfile, "id">) => {
    const newUser: UserProfile = {
      ...user,
      id: Date.now(),
    };
    setStore("users", (users) => [...users, newUser]);
  };

  const updateNestedPreference = (
    id: number,
    preferenceType: keyof UserProfile["preferences"]["notifications"],
    value: boolean,
  ) => {
    setStore(
      "users",
      (user) => user.id === id,
      "preferences",
      "notifications",
      preferenceType,
      value,
    );
  };

  const setCurrentUser = (user: UserProfile | null) => {
    setStore("currentUser", user);
  };

  const updateCurrentAddress = (
    field: keyof UserProfile["address"],
    value: string,
  ) => {
    setStore("currentUser", "address", field, value);
  };

  createEffect(() => {
    if (store.users.length > 0) {
      console.log("Users updated:", store.users.length);
    }
  });

  createEffect(() => {
    if (store.currentUser) {
      console.log("Current user theme:", store.currentUser.preferences.theme);
    }
  });

  const handleAddSampleUsers = () => {
    addUser({
      name: "Alice Johnson",
      email: "alice@example.com",
      address: {
        street: "123 Main St",
        city: "San Francisco",
        zipCode: "94102",
      },
      preferences: {
        theme: "light",
        notifications: {
          email: true,
          push: false,
          marketing: true,
        },
      },
    });

    addUser({
      name: "Bob Smith",
      email: "bob@example.com",
      address: {
        street: "456 Oak Ave",
        city: "New York",
        zipCode: "10001",
      },
      preferences: {
        theme: "dark",
        notifications: {
          email: false,
          push: true,
          marketing: false,
        },
      },
    });
  };

  const handleSelectUser = (id: number) => {
    setSelectedUserId(id);
    const user = store.users.find((u) => u.id === id);
    setCurrentUser(user || null);
  };

  const handleToggleTheme = () => {
    if (store.currentUser) {
      const newTheme =
        store.currentUser.preferences.theme === "light" ? "dark" : "light";
      setStore("currentUser", "preferences", "theme", newTheme);
    }
  };

  const handleUpdateAddress = () => {
    if (store.currentUser) {
      updateCurrentAddress("city", "Updated City");
    }
  };

  const handleToggleNotification = (
    type: keyof UserProfile["preferences"]["notifications"],
  ) => {
    if (store.currentUser) {
      const currentValue = store.currentUser.preferences.notifications[type];
      setStore(
        "currentUser",
        "preferences",
        "notifications",
        type,
        !currentValue,
      );
    }
  };

  return (
    <div>
      <h2>Store Management Example</h2>

      <div>
        <button onClick={handleAddSampleUsers}>Add Sample Users</button>
        <p>Total Users: {store.users.length}</p>
      </div>

      {store.users.length > 0 && (
        <div>
          <h3>Users List</h3>
          {store.users.map((user) => (
            <div style="border: 1px solid #ccc; margin: 10px; padding: 10px;">
              <p>
                <strong>{user.name}</strong> ({user.email})
              </p>
              <p>City: {user.address.city}</p>
              <p>Theme: {user.preferences.theme}</p>
              <p>
                Notifications: Email=
                {user.preferences.notifications.email ? "✓" : "✗"}, Push=
                {user.preferences.notifications.push ? "✓" : "✗"}
              </p>
              <button onClick={() => handleSelectUser(user.id)}>
                Select User
              </button>
              <button
                onClick={() =>
                  updateNestedPreference(
                    user.id,
                    "email",
                    !user.preferences.notifications.email,
                  )
                }
              >
                Toggle Email
              </button>
            </div>
          ))}
        </div>
      )}

      {store.currentUser && (
        <div
          style={`background: ${store.currentUser.preferences.theme === "dark" ? "#333" : "#f5f5f5"}; color: ${store.currentUser.preferences.theme === "dark" ? "#fff" : "#000"}; padding: 15px; margin: 10px;`}
        >
          <h3>Current User: {store.currentUser.name}</h3>
          <p>Theme: {store.currentUser.preferences.theme}</p>
          <p>
            Address: {store.currentUser.address.street},{" "}
            {store.currentUser.address.city},{" "}
            {store.currentUser.address.zipCode}
          </p>

          <div>
            <h4>Actions:</h4>
            <button onClick={handleToggleTheme}>Toggle Theme</button>
            <button onClick={handleUpdateAddress}>Update Address City</button>
            <button onClick={() => handleToggleNotification("email")}>
              Toggle Email Notifications
            </button>
            <button onClick={() => handleToggleNotification("push")}>
              Toggle Push Notifications
            </button>
            <button onClick={() => handleToggleNotification("marketing")}>
              Toggle Marketing
            </button>
          </div>

          <div>
            <h4>Notification Preferences:</h4>
            <p>
              Email:{" "}
              {store.currentUser.preferences.notifications.email
                ? "Enabled"
                : "Disabled"}
            </p>
            <p>
              Push:{" "}
              {store.currentUser.preferences.notifications.push
                ? "Enabled"
                : "Disabled"}
            </p>
            <p>
              Marketing:{" "}
              {store.currentUser.preferences.notifications.marketing
                ? "Enabled"
                : "Disabled"}
            </p>
          </div>
        </div>
      )}

      <div>
        <h3>Store Debug Info</h3>
        <p>Is Loading: {store.isLoading ? "Yes" : "No"}</p>
        <p>Error: {store.error || "None"}</p>
        <p>Selected User ID: {selectedUserId() || "None"}</p>
      </div>
    </div>
  );
};

export default StoreExample;
