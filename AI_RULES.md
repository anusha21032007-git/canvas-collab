# AI Development Rules

This document outlines the rules and conventions for AI-driven development of this application. Following these guidelines ensures consistency, maintainability, and adherence to the project's architecture.

## Tech Stack

This project is built with a modern, type-safe, and component-based stack:

- **Framework**: [React](https://react.dev/) with [Vite](https://vitejs.dev/) for a fast development experience.
- **Language**: [TypeScript](https://www.typescriptlang.org/) for static typing and improved code quality.
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) for a pre-built, accessible, and customizable component library.
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) for a utility-first CSS framework.
- **Routing**: [React Router](https://reactrouter.com/) for client-side navigation.
- **Data Fetching & State**: [TanStack Query](https://tanstack.com/query/latest) for managing server state, caching, and data fetching.
- **Forms**: [React Hook Form](https://react-hook-form.com/) for performant form handling, paired with [Zod](https://zod.dev/) for schema validation.
- **Icons**: [Lucide React](https://lucide.dev/) for a comprehensive and consistent set of icons.
- **Notifications**: [Sonner](https://sonner.emilkowal.ski/) for simple and elegant toast notifications.
- **Canvas**: [Fabric.js](http://fabricjs.com/) for interactive canvas drawing capabilities.

## Library Usage and Coding Conventions

### 1. Component Development
- **Primary Source**: Always use components from the `shadcn/ui` library (`@/components/ui/*`) whenever possible.
- **Custom Components**: If a required component does not exist in `shadcn/ui`, create a new, reusable component in the `src/components/` directory.
- **File Structure**: Each component must be in its own file. For example, `src/components/MyComponent.tsx`.

### 2. Styling
- **Utility-First**: All styling must be done using Tailwind CSS utility classes. Avoid writing custom CSS files or using inline `style` objects unless absolutely necessary (e.g., for dynamic values).
- **Class Merging**: Use the `cn` utility function from `@/lib/utils.ts` to conditionally apply or merge Tailwind classes.

### 3. Routing
- **Library**: Use `react-router-dom` for all routing logic.
- **Route Definitions**: All routes must be defined within the `<Routes>` component in `src/App.tsx`.
- **Navigation Links**: Use the custom `NavLink` component from `@/components/NavLink.tsx` for creating navigation links that require active styling.

### 4. State Management
- **Server State**: Use `@tanstack/react-query` for fetching, caching, and synchronizing data from a server.
- **Client State**: For local, component-level state, use React's built-in hooks (`useState`, `useReducer`, `useContext`). Avoid introducing complex global state management libraries unless the application's complexity demands it.

### 5. Forms
- **Implementation**: All forms should be built using `react-hook-form`.
- **Validation**: Use `zod` to define validation schemas for forms.

### 6. Icons
- **Exclusivity**: Only use icons from the `lucide-react` package. This ensures visual consistency across the application.

### 7. Notifications
- **Toasts**: Use the `toast` function from the `sonner` library for user feedback (e.g., success messages, errors). The provider is already set up in `src/App.tsx`.

### 8. Code Quality
- **TypeScript**: Write all code in TypeScript. Use strong types and avoid `any` whenever possible.
- **File Naming**: Use PascalCase for component files (e.g., `MyComponent.tsx`) and kebab-case for other files (e.g., `use-my-hook.ts`).
- **Directory Structure**:
    - Pages: `src/pages/`
    - Reusable Components: `src/components/`
    - Custom Hooks: `src/hooks/`
    - Utility Functions: `src/lib/`