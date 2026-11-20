import { useEffect, useState } from "react";
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

function App() {
  const [token, setToken] = useState(localStorage.getItem("studenthub-token"));
  const [page, setPage] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [dashboard, setDashboard] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;

    api
      .get("/auth/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        setDashboard(response.data);
        setPage("dashboard");
      })
      .catch((requestError) => {
        setError(
          requestError.response?.data?.message ||
            "Could not load the dashboard. Please try again.",
        );
      });
  }, [token]);

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (page === "register") {
        const response = await api.post("/auth/register", form);
        setMessage(response.data.message);
        setForm({ ...form, name: "", password: "" });
        setPage("login");
      } else {
        const response = await api.post("/auth/login", {
          email: form.email,
          password: form.password,
        });
        localStorage.setItem("studenthub-token", response.data.token);
        setForm({ name: "", email: form.email, password: "" });
        setToken(response.data.token);
      }
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to connect to the server. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("studenthub-token");
    setToken(null);
    setDashboard(null);
    setForm({ name: "", email: "", password: "" });
    setMessage("");
    setError("");
    setPage("login");
  }

  function changePage(nextPage) {
    setPage(nextPage);
    setMessage("");
    setError("");
  }

  if (token && page === "dashboard") {
    return (
      <main className="dashboard-page">
        <header className="topbar">
          <a className="brand" href="/">StudentHub</a>
          <button className="button button-outline" onClick={handleLogout}>
            Log out
          </button>
        </header>
        <section className="dashboard-content">
          <p className="eyebrow">YOUR SPACE</p>
          <h1>Welcome, {dashboard?.user.name}</h1>
          <p className="page-description">
            You are signed in as {dashboard?.user.email}.
          </p>

          <section className="users-card">
            <div className="users-heading">
              <div>
                <h2>Student community</h2>
                <p>Registered members</p>
              </div>
              <span className="user-count">{dashboard?.users.length ?? 0}</span>
            </div>
            {dashboard?.users.length ? (
              <ul className="user-list">
                {dashboard.users.map((user) => (
                  <li className="user-row" key={user._id}>
                    <span className="avatar">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="user-details">
                      <strong>{user.name}</strong>
                      <span>{user.email}</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-state">No students have registered yet.</p>
            )}
          </section>
          {error && <p className="form-message error-message">{error}</p>}
        </section>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <section className="auth-intro">
        <a className="brand brand-light" href="/">StudentHub</a>
        <div className="intro-copy">
          <span className="intro-badge">A community for students</span>
          <h1>Learn, connect, and grow together.</h1>
          <p>
            Your simple space to meet fellow students and keep your learning
            community close.
          </p>
        </div>
        <p className="intro-footer">Built for students, one step at a time.</p>
      </section>

      <section className="auth-panel">
        <div className="auth-form-wrap">
          <p className="eyebrow">{page === "register" ? "GET STARTED" : "WELCOME BACK"}</p>
          <h2>{page === "register" ? "Create your account" : "Sign in to StudentHub"}</h2>
          <p className="form-description">
            {page === "register"
              ? "Join the student community today."
              : "Enter your details to continue."}
          </p>

          {message && <p className="form-message success-message">{message}</p>}
          {error && <p className="form-message error-message">{error}</p>}

          <form onSubmit={handleSubmit}>
            {page === "register" && (
              <label>
                Full name
                <input
                  type="text"
                  name="name"
                  placeholder="Your name"
                  value={form.name}
                  onChange={handleChange}
                  autoComplete="name"
                  required
                />
              </label>
            )}
            <label>
              Email address
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                name="password"
                placeholder="At least 6 characters"
                value={form.password}
                onChange={handleChange}
                autoComplete={page === "register" ? "new-password" : "current-password"}
                minLength={6}
                required
              />
            </label>
            <button className="button button-primary submit-button" disabled={loading}>
              {loading
                ? "Please wait..."
                : page === "register"
                  ? "Create account"
                  : "Sign in"}
            </button>
          </form>

          <p className="switch-page">
            {page === "register" ? "Already have an account?" : "New to StudentHub?"}{" "}
            <button
              className="text-button"
              onClick={() => changePage(page === "register" ? "login" : "register")}
            >
              {page === "register" ? "Sign in" : "Create an account"}
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}

export default App;
