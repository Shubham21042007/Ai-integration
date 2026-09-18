import { useEffect, useState } from "react";

function App() {
  const [backendStatus, setBackendStatus] = useState("Checking...");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/health")
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "ok") {
          setBackendStatus("Backend connected ✅");
        }
      })
      .catch(() => {
        setBackendStatus("Backend connection failed ❌");
      });
  }, []);

  return (
    <div>
      <h1>AI Integration Trial</h1>
      <p>{backendStatus}</p>
    </div>
  );
}

export default App;