import API_BASE_URL from "./config";

export async function getAssets() {
  const token = localStorage.getItem("token");

  const res = await fetch("${API_BASE_URL}/backend/api/assets.php", {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch assets");

  return data;
}
