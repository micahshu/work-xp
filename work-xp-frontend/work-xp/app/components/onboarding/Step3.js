export default function Step3({ data, onChange, onBack, onFinish, loading }) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Step 3: Confirm & Finish</h2>
      <div className="mb-4">
        <p><strong>Display Name:</strong> {data.displayName}</p>
        <p><strong>Role:</strong> {data.role}</p>
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
          onClick={onFinish}
          disabled={loading}
        >
          {loading ? "Saving..." : "Finish"}
        </button>
      </div>
    </div>
  );
}
