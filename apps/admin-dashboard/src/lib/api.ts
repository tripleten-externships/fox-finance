import { getAuth } from "firebase/auth";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export const postClient = async (data: any) => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User must be authenticated");
  }

  const token = await user.getIdToken(true);

  // Debug: Log the token payload to see user role
  const tokenPayload = JSON.parse(atob(token.split(".")[1]));
  console.log("User token payload:", tokenPayload);

  const response = await fetch(`${API_BASE_URL}/api/admin/clients`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("API Error:", errorData);
    throw new Error(`API Error: ${errorData.error || response.statusText}`);
  }

  return response.json();
};
