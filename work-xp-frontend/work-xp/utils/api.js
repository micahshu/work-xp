// utils/api.ts
export async function getCurrentUser() {
  const res = await fetch('http://localhost:8080/auth/me', {
    credentials: 'include',
  });

  if (!res.ok) return null;
  return await res.json();
}
