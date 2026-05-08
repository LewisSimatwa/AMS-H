import API_BASE_URL from "./config";

const API_BASE = '${API_BASE_URL}/api';

export async function createUser(userData) {
  try {
    console.log('Sending registration data:', userData);
    
    const response = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });

    console.log('Response status:', response.status);

    const rawText = await response.text();
    console.log('Raw response:', rawText);

    // Handle empty response (server error)
    if (!rawText || rawText.trim() === '') {
      throw new Error(`Server error (${response.status}): No response body. Check server logs.`);
    }

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      console.error('JSON parse error:', e);
      console.error('Failed to parse:', rawText);
      throw new Error('Server returned invalid response: ' + rawText.substring(0, 100));
    }

    if (!response.ok) {
      throw new Error(data.error || `Registration failed (${response.status})`);
    }

    return data.message || 'Account created successfully';
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

export async function loginUser(credentials) {
  try {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    // Store token in localStorage
    if (data.token) {
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return data;
  } catch (error) {
    throw error;
  }
}

export async function logoutUser() {
  try {
    const token = localStorage.getItem('authToken');
    
    const response = await fetch(`${API_BASE}/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    // Clear local storage regardless of response
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');

    return true;
  } catch (error) {
    // Clear local storage even if request fails
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    throw error;
  }
}

// Helper function for authenticated requests
export async function authenticatedFetch(url, options = {}) {
  const token = localStorage.getItem('authToken');
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    }
  });

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    throw new Error(data.error || 'Request failed');
  }

  return data;
}