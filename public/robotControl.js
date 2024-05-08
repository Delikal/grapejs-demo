const socket = io();

// Funkce pro načtení stavu proměnné z localStorage nebo použití default hodnoty
function loadState(key, defaultValue) {
  const storedValue = localStorage.getItem(key);
  if (storedValue !== null) {
    return JSON.parse(storedValue); // Převede uložený řetězec zpět na boolean
  } else {
    localStorage.setItem(key, JSON.stringify(defaultValue)); // Uloží default hodnotu
    return defaultValue;
  }
}
