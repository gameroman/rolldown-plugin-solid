import { createFixtureTest } from "./helpers";

createFixtureTest("standalone component", "component.tsx");
createFixtureTest("component with props", "props.tsx");
createFixtureTest("component with children", "children.tsx");
createFixtureTest("component with effects", "effects.tsx");
createFixtureTest("component with conditional rendering", "conditional.tsx");
createFixtureTest("component with list rendering", "list.tsx");
createFixtureTest("component with Suspense", "suspense.tsx");
createFixtureTest("component with ErrorBoundary", "error-boundary.tsx");
createFixtureTest("component with Context", "context.tsx");
createFixtureTest("component with Resource", "resource.tsx");
