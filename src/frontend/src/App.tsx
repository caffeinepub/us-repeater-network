import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Link,
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  useNavigate,
} from "@tanstack/react-router";
import { ThemeProvider } from "next-themes";
import React from "react";
import Footer from "./components/Footer";
import Header from "./components/Header";
import AdminPage from "./pages/AdminPage";
import DirectoryPage from "./pages/DirectoryPage";
import FavoritesPage from "./pages/FavoritesPage";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import SubmitPage from "./pages/SubmitPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

// Root layout
function RootLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

// Routes
const rootRoute = createRootRoute({ component: RootLayout });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const directoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/directory",
  component: DirectoryPage,
});

const submitRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/submit",
  component: SubmitPage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminPage,
});

const favoritesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/favorites",
  component: FavoritesPage,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: ProfilePage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  directoryRoute,
  submitRoute,
  adminRoute,
  favoritesRoute,
  profileRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <RouterProvider router={router} />
        <Toaster richColors position="top-right" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
