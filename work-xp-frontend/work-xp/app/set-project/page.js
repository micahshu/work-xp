
'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "../../utils/api";

export default function SetProject() {
  const [projectName, setProjectName] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      const user = await getCurrentUser();
      if (!user) {
        setIsAuthenticated(false);
        router.replace("/"); // Redirect to homepage if not authenticated
      } else {
        setIsAuthenticated(true);
      }
    }
    checkAuth();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) return;
    // TODO: Replace with actual asana_gid from user context/session
    const asana_gid = "1207290816562217";
    const res = await fetch("http://localhost:8080/project/set-project", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ asana_gid, project_name: projectName }),
      credentials: "include",
    });
    const data = await res.json();
    alert(data.message || data.error);
  };

  if (isAuthenticated === null) {
    return null; // Or: return <div>Loading...</div>;
  }
  if (isAuthenticated === false) {
    return null;
  }

  return (
    <div className="p-8 max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label htmlFor="projectName">Enter your Asana project name:</label>
        <input
          id="projectName"
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="border px-2 py-1 rounded"
          required
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Save Project</button>
      </form>
    </div>
  );
}
