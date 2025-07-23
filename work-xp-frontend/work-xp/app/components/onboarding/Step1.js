import { useState } from "react";
import { useUser } from "../UserContext";

export default function Step1({ data, onChange, onNext }) {
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useUser();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (!user || !user.asana_gid) {
      alert("User not found. Please log in again.");
      setLoading(false);
      return;
    }
    const asana_gid = user.asana_gid;
    const res = await fetch("http://localhost:8080/project/set-project", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ asana_gid, project_name: projectName }),
      credentials: "include",
    });
    const data = await res.json();
    setLoading(false);
    if (data.message) {
      onChange({ ...data, projectName });
      onNext();
    } else {
      alert(data.error || "Failed to save project.");
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Step 1: Set Your Asana Project</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label htmlFor="projectName">Enter your Asana project name:</label>
        <input
          id="projectName"
          type="text"
          value={projectName}
          onChange={e => setProjectName(e.target.value)}
          className="border px-2 py-1 rounded"
          required
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={loading}>
          {loading ? "Saving..." : "Next"}
        </button>
      </form>
    </div>
  );
}
