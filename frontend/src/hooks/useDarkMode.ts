import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';

export function useDarkMode() {
  const { user, token, setUser } = useAuthStore();
  const [isDark, setIsDark] = useState(false);

  // Initialize dark mode based on user preference or system preference
  useEffect(() => {
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const prefersDark = user?.darkMode ?? systemPrefersDark;

    setIsDark(prefersDark);

    if (prefersDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [user?.darkMode]);

  // Toggle dark mode
  const toggleDarkMode = async () => {
    if (!token || !user) return;

    const newDarkMode = !isDark;
    setIsDark(newDarkMode);

    // Apply immediately
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Update user in store immediately
    setUser({ ...user, darkMode: newDarkMode });

    // Save to database in background
    try {
      await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/users/profile`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            darkMode: newDarkMode,
          }),
        }
      );
    } catch (error) {
      console.error('Failed to save dark mode preference:', error);
    }
  };

  return { isDark, toggleDarkMode };
}
