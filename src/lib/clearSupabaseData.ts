// Utility to clear any Supabase-related data from localStorage
export function clearSupabaseData() {
  if (typeof window === 'undefined') return;
  
  // Clear any Supabase auth tokens
  const keysToRemove: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('supabase') || key.includes('sb-') || key.includes('ulnsvkrrdcmfiguibkpx'))) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => {
    console.log(`Removing localStorage key: ${key}`);
    localStorage.removeItem(key);
  });
  
  // Also clear session storage
  const sessionKeysToRemove: string[] = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && (key.includes('supabase') || key.includes('sb-') || key.includes('ulnsvkrrdcmfiguibkpx'))) {
      sessionKeysToRemove.push(key);
    }
  }
  
  sessionKeysToRemove.forEach(key => {
    console.log(`Removing sessionStorage key: ${key}`);
    sessionStorage.removeItem(key);
  });
  
  // Clear any cookies that might contain Supabase tokens
  if (document.cookie) {
    document.cookie.split(';').forEach(cookie => {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      if (name.includes('supabase') || name.includes('sb-')) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      }
    });
  }
}