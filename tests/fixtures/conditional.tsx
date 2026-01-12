import { createSignal, Match, Show, Switch } from "solid-js";

const ConditionalDemo = () => {
  const [isLoggedIn, setIsLoggedIn] = createSignal(false);
  const [userType, setUserType] = createSignal<"guest" | "user" | "admin">(
    "guest",
  );

  const login = () => setIsLoggedIn(true);
  const logout = () => setIsLoggedIn(false);

  return (
    <div>
      <Show
        when={isLoggedIn()}
        fallback={<button onClick={login}>Login</button>}
      >
        <h2>Welcome back!</h2>
        <button onClick={logout}>Logout</button>
      </Show>

      <div>
        <p>User type: {userType()}</p>
        <button onClick={() => setUserType("guest")}>Guest</button>
        <button onClick={() => setUserType("user")}>User</button>
        <button onClick={() => setUserType("admin")}>Admin</button>
      </div>

      <Switch>
        <Match when={userType() === "admin"}>
          <p>Admin access granted</p>
        </Match>
        <Match when={userType() === "user"}>
          <p>User access granted</p>
        </Match>
        <Match when={userType() === "guest"}>
          <p>Guest access only</p>
        </Match>
      </Switch>
    </div>
  );
};

export default ConditionalDemo;
