import { useState } from "react";
import { Outlet, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Select, Button } from "antd";

type Props = {
  darkMode: boolean;
  toggleDarkMode: () => void;
};

function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const handleSwitch = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <Select
      defaultValue={i18n.language}
      onChange={handleSwitch}
      style={{ width: 80 }}
      className="mr-4"
    >
      <Select.Option value="en">EN</Select.Option>
      <Select.Option value="fa">ES</Select.Option>
    </Select>
  );
}

export default function Layout({ darkMode, toggleDarkMode }: Props) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 dark:text-white transition-colors duration-200">
      {/* Top nav */}
      <nav className="bg-white dark:bg-gray-800 shadow p-4 flex items-center justify-between">
        <div className="flex items-center">
          {/* Hamburger icon on the left for small screens */}
          <button
            className="flex sm:hidden text-gray-800 dark:text-gray-200 mr-4 focus:outline-none"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">
            {t("siteTitle")}
          </h1>
        </div>

        {/* Right side: Language + Dark Mode */}
        <div className="flex items-center">
          <LanguageSwitcher />
          <Button
            onClick={toggleDarkMode}
            className="border rounded px-3 py-1 dark:border-gray-500 dark:bg-gray-700"
          >
            {darkMode ? t("lightMode") : t("darkMode")}
          </Button>
        </div>
      </nav>

      {/* Collapsible menu for small screens */}
      <div
        className={`bg-white dark:bg-gray-800 shadow sm:hidden transition-all duration-300 overflow-hidden ${
          menuOpen ? "max-h-40 p-4" : "max-h-0 p-0"
        }`}
      >
        <Link
          to="/"
          className="block py-1 hover:text-blue-500 dark:text-white"
          onClick={() => setMenuOpen(false)}
        >
          {t("home")}
        </Link>
        <Link
          to="/form"
          className="block py-1 hover:text-blue-500 dark:text-white"
          onClick={() => setMenuOpen(false)}
        >
          {t("apply")}
        </Link>
        <Link
          to="/submissions"
          className="block py-1 hover:text-blue-500 dark:text-white"
          onClick={() => setMenuOpen(false)}
        >
          {t("submissions")}
        </Link>
      </div>

      {/* Menu for larger screens */}
      <div className="hidden sm:block bg-white dark:bg-gray-800 shadow">
        <div className="p-4 flex space-x-4">
          <Link to="/" className="hover:text-blue-500">
            {t("home")}
          </Link>
          <Link to="/form" className="hover:text-blue-500">
            {t("apply")}
          </Link>
          <Link to="/submissions" className="hover:text-blue-500">
            {t("submissions")}
          </Link>
        </div>
      </div>

      <div className="p-6">
        <Outlet />
      </div>
    </div>
  );
}