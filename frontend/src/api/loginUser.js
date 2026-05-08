import API_BASE_URL from "./config";

export async function loginUser(email, password) {
  try {
    const body = { email, password };
    console.log("Login request body:", body);

    const response = await fetch(`${API_BASE_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Login failed");
    return data;
  } catch (error) {
    throw new Error(error.message || "Failed to login");
  }
}