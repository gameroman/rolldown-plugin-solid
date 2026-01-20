import { createMemo, createSignal, For } from "solid-js";

// Const enums (should be inlined by TypeScript)
enum Direction {
  Up,
  Down,
  Left,
  Right,
}

enum Status {
  Pending = "pending",
  Loading = "loading",
  Success = "success",
  Error = "error",
}

enum Priority {
  Low = 1,
  Medium = 2,
  High = 3,
  Critical = 4,
}

// Regular enums (become real objects at runtime)
enum Color {
  Red = "#FF0000",
  Green = "#00FF00",
  Blue = "#0000FF",
}

enum Size {
  Small = "small",
  Medium = "medium",
  Large = "large",
}

enum LogLevel {
  Debug = 0,
  Info = 1,
  Warn = 2,
  Error = 3,
}

// Component using const enums
function ConstEnumComponent() {
  const [direction, setDirection] = createSignal(Direction.Up);
  const [status, setStatus] = createSignal(Status.Pending);
  const [priority] = createSignal(Priority.Medium);

  const directionText = createMemo(() => {
    switch (direction()) {
      case Direction.Up:
        return "↑";
      case Direction.Down:
        return "↓";
      case Direction.Left:
        return "←";
      case Direction.Right:
        return "→";
      default:
        return "?";
    }
  });

  const statusColor = createMemo(() => {
    switch (status()) {
      case Status.Pending:
        return "gray";
      case Status.Loading:
        return "blue";
      case Status.Success:
        return "green";
      case Status.Error:
        return "red";
      default:
        return "black";
    }
  });

  const priorityLabel = createMemo(() => {
    switch (priority()) {
      case Priority.Low:
        return "Low";
      case Priority.Medium:
        return "Medium";
      case Priority.High:
        return "High";
      case Priority.Critical:
        return "Critical";
      default:
        return "Unknown";
    }
  });

  return (
    <div>
      <h3>Const Enum Usage</h3>
      <div>
        Direction: {directionText()} ({direction()})
      </div>
      <div style={{ color: statusColor() }}>Status: {status()}</div>
      <div>Priority: {priorityLabel()}</div>

      <div>
        <button onClick={() => setDirection(Direction.Up)}>Up</button>
        <button onClick={() => setDirection(Direction.Down)}>Down</button>
        <button onClick={() => setDirection(Direction.Left)}>Left</button>
        <button onClick={() => setDirection(Direction.Right)}>Right</button>
      </div>

      <div>
        <button onClick={() => setStatus(Status.Pending)}>Pending</button>
        <button onClick={() => setStatus(Status.Loading)}>Loading</button>
        <button onClick={() => setStatus(Status.Success)}>Success</button>
        <button onClick={() => setStatus(Status.Error)}>Error</button>
      </div>
    </div>
  );
}

// Component using regular enums
function RegularEnumComponent() {
  const [selectedColor] = createSignal(Color.Red);
  const [selectedSize, setSize] = createSignal(Size.Medium);
  const [logLevel, setLogLevel] = createSignal(LogLevel.Info);

  return (
    <div>
      <h3>Regular Enum Usage</h3>
      <div style={{ color: selectedColor() }}>
        Selected Color: {Color[selectedColor()]} = {selectedColor()}
      </div>
      <div>
        Size: {selectedSize()}
        <button onClick={() => setSize(Size.Small)}>Small</button>
        <button onClick={() => setSize(Size.Medium)}>Medium</button>
        <button onClick={() => setSize(Size.Large)}>Large</button>
      </div>
      <div>
        Log Level: {LogLevel[logLevel()]} ({logLevel()})
        <button onClick={() => setLogLevel(LogLevel.Debug)}>Debug</button>
        <button onClick={() => setLogLevel(LogLevel.Info)}>Info</button>
        <button onClick={() => setLogLevel(LogLevel.Warn)}>Warn</button>
        <button onClick={() => setLogLevel(LogLevel.Error)}>Error</button>
      </div>
    </div>
  );
}

// Mixed enum usage
function MixedEnumComponent() {
  const tasks = [
    { id: 1, text: "Task 1", priority: Priority.High, status: Status.Pending },
    { id: 2, text: "Task 2", priority: Priority.Low, status: Status.Success },
    {
      id: 3,
      text: "Task 3",
      priority: Priority.Critical,
      status: Status.Error,
    },
    {
      id: 4,
      text: "Task 4",
      priority: Priority.Medium,
      status: Status.Loading,
    },
  ];

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case Priority.Low:
        return "green";
      case Priority.Medium:
        return "orange";
      case Priority.High:
        return "red";
      case Priority.Critical:
        return "darkred";
      default:
        return "black";
    }
  };

  const getStatusIcon = (status: Status) => {
    switch (status) {
      case Status.Pending:
        return "⏳";
      case Status.Loading:
        return "🔄";
      case Status.Success:
        return "✅";
      case Status.Error:
        return "❌";
      default:
        return "❓";
    }
  };

  return (
    <div>
      <h3>Mixed Enum Usage</h3>
      <ul>
        <For each={tasks}>
          {(task) => (
            <li style={{ color: getPriorityColor(task.priority) }}>
              {getStatusIcon(task.status)} {task.text}
              (Priority: {task.priority}, Status: {task.status})
            </li>
          )}
        </For>
      </ul>
    </div>
  );
}

// Enum mapping and conversion
function EnumMappingComponent() {
  // Const enum to string mapping
  const directionNames = {
    [Direction.Up]: "Up",
    [Direction.Down]: "Down",
    [Direction.Left]: "Left",
    [Direction.Right]: "Right",
  } as const;

  // Regular enum object access
  const colorNames: Record<Color, string> = {
    [Color.Red]: "Red",
    [Color.Green]: "Green",
    [Color.Blue]: "Blue",
  };

  return (
    <div>
      <h3>Enum Mapping</h3>
      <div>
        Const Direction {Direction.Up} = {directionNames[Direction.Up]}
      </div>
      <div>
        Regular Color {Color.Red} = {colorNames[Color.Red]}
      </div>
    </div>
  );
}

// Complex enum with computed values
enum ComplexEnum {
  None = 0,
  Flag1 = 1 << 0, // 1
  Flag2 = 1 << 1, // 2
  Flag3 = 1 << 2, // 4
  All = Flag1 | Flag2 | Flag3, // 7
}

// Component using complex enum patterns
function ComplexEnumComponent() {
  const [flags, setFlags] = createSignal(ComplexEnum.None);

  const hasFlag = (flag: ComplexEnum) => (flags() & flag) === flag;

  const toggleFlag = (flag: ComplexEnum) => {
    setFlags((current) => current ^ flag);
  };

  const allFlags = [ComplexEnum.Flag1, ComplexEnum.Flag2, ComplexEnum.Flag3];

  return (
    <div>
      <h3>Complex Enum Flags</h3>
      <div>
        Current: {flags()} (Binary: {flags().toString(2)})
      </div>
      <div>
        {allFlags.map((flag) => (
          <label style={{ "margin-right": "1rem" }}>
            <input
              type="checkbox"
              checked={hasFlag(flag)}
              onChange={() => toggleFlag(flag)}
            />
            Flag{flag}
          </label>
        ))}
      </div>
      <button onClick={() => setFlags(ComplexEnum.All)}>Select All</button>
      <button onClick={() => setFlags(ComplexEnum.None)}>Clear All</button>
    </div>
  );
}

export {
  ConstEnumComponent,
  RegularEnumComponent,
  MixedEnumComponent,
  EnumMappingComponent,
  ComplexEnumComponent,
  Direction,
  Status,
  Priority,
  Color,
  Size,
  LogLevel,
  ComplexEnum,
};
