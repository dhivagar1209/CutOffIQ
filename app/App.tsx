import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/theme-provider";
import HomePage from "./routes/index";
import FindCollegesPage from "./routes/find-colleges";
import ComparePage from "./routes/compare";
import TrendsPage from "./routes/trends";

export default function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="cutoffiq-theme">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/find-colleges" element={<FindCollegesPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/trends" element={<TrendsPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
} 