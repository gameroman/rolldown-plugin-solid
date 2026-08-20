import { createSignal, For, Show } from "solid-js";
import {
  calculateUserStats,
  createApiResponse,
  createUserManagementService,
  DEFAULT_PAGE_SIZE,
  type ExtendedUser,
  formatUserName,
  paginateData,
  type User,
  UserRole,
  UserStatus,
  validateUser,
} from "./utils";

// Component that imports and uses pure TS utilities
function UserManagementComponent() {
  const userService = createUserManagementService();
  const [users, setUsers] = createSignal<ExtendedUser[]>([]);
  const [currentPage, setCurrentPage] = createSignal(1);
  const [searchTerm, setSearchTerm] = createSignal("");
  const [selectedRole, setSelectedRole] = createSignal<UserRole | "">("");
  const [selectedStatus, setSelectedStatus] = createSignal<UserStatus | "">("");

  // Initialize with sample data
  const initializeData = () => {
    const sampleUsers: ExtendedUser[] = [
      {
        id: "1",
        name: "John Doe",
        email: "john@example.com",
        age: 30,
        isActive: true,
        role: UserRole.Admin,
        status: UserStatus.Active,
        createdAt: new Date("2023-01-01"),
        updatedAt: new Date(),
      },
      {
        id: "2",
        name: "Jane Smith",
        email: "jane@example.com",
        age: 25,
        isActive: true,
        role: UserRole.User,
        status: UserStatus.Active,
        createdAt: new Date("2023-01-02"),
        updatedAt: new Date(),
      },
      {
        id: "3",
        name: "Bob Johnson",
        email: "bob@example.com",
        age: 35,
        isActive: false,
        role: UserRole.Guest,
        status: UserStatus.Inactive,
        createdAt: new Date("2023-01-03"),
        updatedAt: new Date(),
      },
    ];

    sampleUsers.forEach((user) => userService.addUser(user));
    setUsers(userService.getAllUsers());
  };

  // Filter users based on search and filters
  const filteredUsers = () => {
    return userService.getUsers({
      search: searchTerm() || undefined,
      role: selectedRole() || undefined,
      status: selectedStatus() || undefined,
    });
  };

  // Paginated users
  const paginatedUsers = () => {
    const filtered = filteredUsers();
    return paginateData(filtered, currentPage(), DEFAULT_PAGE_SIZE);
  };

  // User statistics
  const stats = () => {
    return calculateUserStats(users());
  };

  // API response simulation
  const apiResponse = () => {
    const filtered = filteredUsers();
    return createApiResponse(
      paginatedUsers(),
      currentPage(),
      DEFAULT_PAGE_SIZE,
    );
  };

  const addUser = () => {
    const newUser: ExtendedUser = {
      name: "New User",
      email: `user${Date.now()}@example.com`,
      age: Math.floor(Math.random() * 50) + 18,
      isActive: true,
      role: UserRole.User,
      status: UserStatus.Active,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    userService.addUser(newUser);
    setUsers(userService.getAllUsers());
  };

  const deleteUser = (id: string) => {
    userService.deleteUser(id);
    setUsers(userService.getAllUsers());
  };

  const toggleUserStatus = (id: string) => {
    const user = users().find((u) => u.id === id);
    if (user) {
      const newStatus =
        user.status === UserStatus.Active
          ? UserStatus.Inactive
          : UserStatus.Active;
      const newActive = newStatus === UserStatus.Active;
      userService.updateUser(id, {
        status: newStatus,
        isActive: newActive,
        updatedAt: new Date(),
      });
      setUsers(userService.getAllUsers());
    }
  };

  // Initialize on component mount
  initializeData();

  return (
    <div>
      <h2>User Management System</h2>

      {/* Statistics */}
      <div class="stats-panel">
        <h3>Statistics</h3>
        <p>Total Users: {stats().total}</p>
        <p>Active Users: {stats().active}</p>
        <p>Average Age: {stats().averageAge?.toFixed(1) || "N/A"}</p>
      </div>

      {/* Filters */}
      <div class="filter-panel">
        <h3>Filters</h3>
        <input
          type="text"
          placeholder="Search by name or email"
          value={searchTerm()}
          onInput={(e) => setSearchTerm(e.currentTarget.value)}
        />

        <select
          value={selectedRole()}
          onChange={(e) => setSelectedRole(e.currentTarget.value as UserRole)}
        >
          <option value="">All Roles</option>
          <option value={UserRole.Admin}>Admin</option>
          <option value={UserRole.User}>User</option>
          <option value={UserRole.Guest}>Guest</option>
        </select>

        <select
          value={selectedStatus()}
          onChange={(e) =>
            setSelectedStatus(e.currentTarget.value as UserStatus)
          }
        >
          <option value="">All Statuses</option>
          <option value={UserStatus.Active}>Active</option>
          <option value={UserStatus.Inactive}>Inactive</option>
          <option value={UserStatus.Pending}>Pending</option>
          <option value={UserStatus.Suspended}>Suspended</option>
        </select>

        <button onClick={addUser}>Add User</button>
      </div>

      {/* Users List */}
      <div class="users-list">
        <h3>Users ({filteredUsers().length} found)</h3>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Age</th>
              <th>Role</th>
              <th>Status</th>
              <th>Valid</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <For each={paginatedUsers()}>
              {(user) => (
                <tr>
                  <td>{formatUserName(user)}</td>
                  <td>{user.email}</td>
                  <td>{user.age}</td>
                  <td>{user.role}</td>
                  <td>{user.status}</td>
                  <td>{validateUser(user) ? "✅" : "❌"}</td>
                  <td>
                    <button onClick={() => toggleUserStatus(user.id || "")}>
                      Toggle Status
                    </button>
                    <button onClick={() => deleteUser(user.id || "")}>
                      Delete
                    </button>
                  </td>
                </tr>
              )}
            </For>
          </tbody>
        </table>

        <Show when={filteredUsers().length > DEFAULT_PAGE_SIZE}>
          <div class="pagination">
            <button
              disabled={currentPage() === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <span>Page {currentPage()}</span>
            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={paginatedUsers().length < DEFAULT_PAGE_SIZE}
            >
              Next
            </button>
          </div>
        </Show>
      </div>

      {/* API Response Debug */}
      <div class="debug-panel">
        <h3>API Response (Debug)</h3>
        <pre>{JSON.stringify(apiResponse(), null, 2)}</pre>
      </div>
    </div>
  );
}

// Component demonstrating type imports from .ts files
function TypeImportDemo() {
  const [user] = createSignal<User>({
    id: "demo-123",
    name: "Demo User",
    email: "demo@example.com",
    age: 25,
    isActive: true,
  });

  const [extendedUser] = createSignal<ExtendedUser>({
    ...user(),
    role: UserRole.User,
    status: UserStatus.Active,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return (
    <div>
      <h3>Type Import Demo</h3>
      <p>User Name: {formatUserName(user())}</p>
      <p>User Valid: {validateUser(user()) ? "Yes" : "No"}</p>
      <p>Extended User Role: {extendedUser().role}</p>
      <p>Extended User Status: {extendedUser().status}</p>
    </div>
  );
}

export default UserManagementComponent;
export { TypeImportDemo };
