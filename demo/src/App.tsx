import { FeedbackWidget } from "@vijiatjack/feedback-widget";
import "@vijiatjack/feedback-widget/styles.css";

const API_BASE = import.meta.env.VITE_FEEDBACK_API_BASE ?? "http://localhost:3001";

function App() {
  return (
    <div style={{ padding: 40, fontFamily: "sans-serif", color: "#e4e4e7", background: "#09090b", minHeight: "100vh" }}>
      <h1>Demo host app</h1>
      <p>
        Isso simula um app host qualquer com o widget de feedback montado. API alvo:{" "}
        <code>{API_BASE}</code>
      </p>

      <FeedbackWidget
        app="demo"
        apiBase={API_BASE}
        user={{ name: "Usuário Demo", email: "demo@example.com", role: "tester" }}
        appVersion="0.1.0-demo"
      />
    </div>
  );
}

export default App;
