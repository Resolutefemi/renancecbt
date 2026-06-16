(function() {
  const defaults = {
    SUPABASE_URL: 'https://ubxsywaxdvkhiqepcvmq.supabase.co',
    SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVieHN5d2F4ZHZraGlxZXBjdm1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5ODcwMDAsImV4cCI6MjA4NzU2MzAwMH0.gkR3Aud3LRLNyNwpDHJTT0vIrWCnQkSBkFSaFjQ5qy4',
    GEMINI_API_KEY: 'AIzaSyBFqhMxNVNdti-8HFjVvxOFCiRKWnUfiZs'
  };

  window.env = { ...defaults };

  try {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', '/.env', false); // Synchronous request
    xhr.send();
    if (xhr.status === 200) {
      const lines = xhr.responseText.split('\n');
      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('#') || !trimmed.includes('=')) return;
        const index = trimmed.indexOf('=');
        const k = trimmed.substring(0, index).trim();
        let v = trimmed.substring(index + 1).trim();
        if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
        if (v.startsWith("'") && v.endsWith("'")) v = v.slice(1, -1);
        if (k) window.env[k] = v;
      });
    }
  } catch (e) {
    // Expected to fail on file:// protocol, fallback will be used
  }
})();
