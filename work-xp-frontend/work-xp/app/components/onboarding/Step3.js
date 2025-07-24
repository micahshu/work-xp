import { useUser } from "../UserContext";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Step3({ data, onChange, onBack }) {
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const projectName = data.projectName || "";
  const skills = data.skills || [];

  const handleFinish = async () => {
    if (!user || !user.asana_gid) return;
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/user/complete-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ asana_gid: user.asana_gid })
      });
      const result = await res.json();
      if (res.ok) {
        router.push("/");
      } else {
        alert(result.error || "Failed to complete onboarding.");
      }
    } catch (err) {
      alert("Failed to complete onboarding.");
    }
    setLoading(false);
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Step 3: Confirm & Finish</h2>
      <div className="mb-4">
        <p><strong>Project Name:</strong> {projectName}</p>
        <p><strong>Skills Selected:</strong></p>
        <ul className="list-disc ml-6">
          {skills.length > 0 ? skills.map(skill => (
            <li key={skill.gid || skill.section_gid}>{skill.name || skill.section_name}</li>
          )) : <li>No skills selected.</li>}
        </ul>
      </div>
      <div className="flex gap-2">
        <button
          className="bg-gray-400 text-white px-4 py-2 rounded"
          onClick={onBack}
        >
          Back
        </button>
        <button
          className="bg-green-600 text-white px-4 py-2 rounded"
          onClick={handleFinish}
          disabled={loading}
        >
          {loading ? "Saving..." : "Finish"}
        </button>
      </div>
    </div>
  );
}
