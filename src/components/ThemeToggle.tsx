import { useTheme } from "@/hooks/useTheme";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={() => {
        toggleTheme();
      }}
      className="px-4 py-2 bg-gray-800 text-white rounded"
    >
      Toggle Theme
    </button>
  );
}
