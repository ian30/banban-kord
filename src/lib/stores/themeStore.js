import { writable } from 'svelte/store';
import { getSetting, saveSetting } from '$lib/services/db.js';

// Available themes
export const themes = [
  { id: 'light', name: 'Light Theme' },
  { id: 'dark', name: 'Dark Theme' },
  { id: 'win95', name: 'Windows 95' },
  { id: 'macos', name: 'macOS' }
];

// Create a writable store for the current theme
export const currentTheme = writable('light');

// Load theme from database
export async function loadTheme() {
  try {
    const themeSetting = await getSetting('theme');
    if (themeSetting) {
      currentTheme.set(themeSetting.value);
      applyTheme(themeSetting.value);
    }
  } catch (error) {
    console.error('Error loading theme:', error);
  }
}

// Save theme to database
export async function saveTheme(themeId) {
  try {
    await saveSetting({ id: 'theme', value: themeId });
    currentTheme.set(themeId);
    applyTheme(themeId);
  } catch (error) {
    console.error('Error saving theme:', error);
  }
}

// Apply theme by loading the appropriate CSS
function applyTheme(themeId) {
  // Remove any existing theme links
  const existingThemeLinks = document.querySelectorAll('link[data-theme]');
  existingThemeLinks.forEach(link => link.remove());
  
  // Add the new theme link
  const themeLink = document.createElement('link');
  themeLink.rel = 'stylesheet';
  themeLink.href = `/themes/${themeId}.css`;
  themeLink.setAttribute('data-theme', themeId);
  document.head.appendChild(themeLink);
  
  // Update body class for global theme styling
  document.body.className = `theme-${themeId}`;
}