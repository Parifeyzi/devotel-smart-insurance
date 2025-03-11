import { Routes, Route } from "react-router-dom";
import Layout from "./layouts/Layout";
import FormPage from "./pages/FormPage";
import SubmissionListPage from "./pages/SubmissionListPage";
import { useTheme } from "./context/themeContext";

export default function App() {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <Routes>
      <Route path="/" element={<Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}>
        <Route
          index
          element={<h1 className="text-3xl font-bold">Welcome to Smart Insurance Portal</h1>}
        />
        <Route path="/form" element={<FormPage />} />
        <Route path="/submissions" element={<SubmissionListPage />} />
        <Route path="*" element={<div style={{ padding: 24 }}>404: Page not found</div>} />
      </Route>
    </Routes>
  );
}