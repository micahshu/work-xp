import { useState } from "react";
import { useUser } from "../UserContext";

export default function Step2({ data, onChange, onNext, onBack }) {
  const { user } = useUser();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSections = async () => {
    if (!user || !user.asana_gid) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:8080/project/project-sections/${user.asana_gid}`, {
        credentials: "include"
      });
      const data = await res.json();
      if (res.ok && data.sections) {
        setSections(data.sections);
      } else {
        setError(data.error || "Failed to fetch sections.");
      }
    } catch (err) {
      setError("Failed to fetch sections.");
    }
    setLoading(false);
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Step 2: Project Sections</h2>
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
        onClick={fetchSections}
        disabled={loading}
      >
        {loading ? "Fetching..." : "Fetch Project Sections"}
      </button>
      {loading && <p>Loading sections...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && sections.length > 1 && (
        <>
          <ul className="mb-4">
            {sections.slice(1).map(section => (
              <li key={section.gid} className="border-b py-2">{section.name}</li>
            ))}
          </ul>
          <button
            className="bg-green-600 text-white px-4 py-2 rounded mb-4"
            onClick={async () => {
              if (!user || !user.asana_gid) return;
              const curatedSections = sections.slice(1); // skip index 0
              const res = await fetch("http://localhost:8080/skills/set-skills", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ asana_gid: user.asana_gid, sections: curatedSections })
              });
              const data = await res.json();
              if (data.message) {
                if (typeof onChange === 'function') onChange({ skills: curatedSections });
              }
              alert(data.message || data.error);
            }}
          >
            Save Skills
          </button>
        </>
      )}
      <div className="flex gap-2">
        <button
          className="bg-gray-400 text-white px-4 py-2 rounded"
          onClick={onBack}
        >
          Back
        </button>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={onNext}
        >
          Next
        </button>
      </div>
    </div>
  );
}
