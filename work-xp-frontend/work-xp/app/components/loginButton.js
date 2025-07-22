export default function LoginButton() {
  const handleLogin = () => {
    window.location.href = "http://localhost:8080/auth/asana";
  };

  return (
    <button
      onClick={handleLogin}
      className="bg-green-600 text-white px-4 py-2 rounded"
    >
      Login with Asana
    </button>
  );
}