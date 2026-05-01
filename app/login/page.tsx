//TODO: Replace logo placeholder with actual image
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser, forgotPassword, isValidEmail, getUserProfile } from "../../src/services/authService";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailBlur = () => {
    if (!email) setEmailError("Email is required.");
    else if (!isValidEmail(email)) setEmailError("Please enter a valid email address.");
    else setEmailError("");
  };

  const handlePasswordBlur = () => {
    if (!password) setPasswordError("Password is required.");
    else setPasswordError("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");
    setSuccessMessage("");

    if (!email || !isValidEmail(email)) { setEmailError("Please enter a valid email address."); return; }
    if (!password) { setPasswordError("Password is required."); return; }

    setLoading(true);
    try {
      const user = await loginUser({ email, password });
      const profile = await getUserProfile(user.uid);
      setSuccessMessage("Login successful! Redirecting...");
      setTimeout(() => { router.push("/"); }, 1000);
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message.includes("invalid-credential") || error.message.includes("wrong-password")) {
          setGeneralError("Incorrect email or password.");
        } else if (error.message.includes("user-not-found")) {
          setGeneralError("No account found with this email.");
        } else if (error.message.includes("too-many-requests")) {
          setGeneralError("Too many failed attempts. Please try again later.");
        } else {
          setGeneralError(error.message);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setGeneralError("");
    setSuccessMessage("");
    if (!email || !isValidEmail(email)) { setEmailError("Enter your email address above first."); return; }
    setLoading(true);
    try {
      await forgotPassword(email);
      setSuccessMessage("Password reset email sent! Check your inbox.");
    } catch (error: unknown) {
      if (error instanceof Error) setGeneralError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .login-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f0f4f0;
          background-image:
            radial-gradient(ellipse at 20% 50%, rgba(45, 106, 79, 0.08) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 20%, rgba(88, 157, 113, 0.06) 0%, transparent 50%);
          font-family: 'DM Sans', sans-serif;
          padding: 1.5rem;
        }

        .login-card {
          background: #ffffff;
          border-radius: 20px;
          padding: 2.5rem 2.25rem;
          width: 100%;
          max-width: 420px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.04), 0 20px 60px rgba(45, 106, 79, 0.1);
        }

        .login-logo-wrap {
          display: flex;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        .login-logo-circle {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: linear-gradient(135deg, #2d6a4f, #52b788);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(45, 106, 79, 0.3);
        }

        .login-logo-circle svg {
          width: 34px;
          height: 34px;
          fill: white;
        }

        .login-title {
          font-family: 'Lora', serif;
          font-size: 1.75rem;
          font-weight: 600;
          color: #1a3328;
          text-align: center;
          margin-bottom: 0.4rem;
          letter-spacing: -0.3px;
        }

        .login-subtitle {
          font-size: 0.875rem;
          color: #6b7c74;
          text-align: center;
          margin-bottom: 2rem;
          font-weight: 300;
        }

        .alert {
          padding: 0.75rem 1rem;
          border-radius: 10px;
          font-size: 0.85rem;
          margin-bottom: 1.25rem;
          font-weight: 400;
        }

        .alert-error {
          background: #fef2f2;
          color: #c0392b;
          border: 1px solid #fecaca;
        }

        .alert-success {
          background: #f0fdf4;
          color: #166534;
          border: 1px solid #bbf7d0;
        }

        .field-group {
          margin-bottom: 1.1rem;
        }

        .field-label {
          display: block;
          font-size: 0.82rem;
          font-weight: 500;
          color: #2d4a3e;
          margin-bottom: 0.4rem;
          letter-spacing: 0.01em;
        }

        .input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 0.9rem;
          color: #8aab98;
          display: flex;
          align-items: center;
          pointer-events: none;
        }

        .field-input {
          width: 100%;
          padding: 0.72rem 1rem 0.72rem 2.5rem;
          border: 1.5px solid #d4e4db;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          color: #1a3328;
          background: #f8fbf9;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          outline: none;
        }

        .field-input::placeholder { color: #adc4b8; }

        .field-input:focus {
          border-color: #2d6a4f;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(45, 106, 79, 0.1);
        }

        .field-input.has-error { border-color: #e74c3c; }

        .toggle-btn {
          position: absolute;
          right: 0.9rem;
          background: none;
          border: none;
          cursor: pointer;
          color: #8aab98;
          display: flex;
          align-items: center;
          padding: 0;
          transition: color 0.2s;
        }

        .toggle-btn:hover { color: #2d6a4f; }

        .field-error {
          font-size: 0.78rem;
          color: #e74c3c;
          margin-top: 0.3rem;
          padding-left: 0.25rem;
        }

        .row-between {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
          margin-top: 0.25rem;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.83rem;
          color: #4a6358;
          cursor: pointer;
        }

        .checkbox-label input[type="checkbox"] {
          width: 15px;
          height: 15px;
          accent-color: #2d6a4f;
          cursor: pointer;
        }

        .forgot-btn {
          background: none;
          border: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.83rem;
          color: #2d6a4f;
          cursor: pointer;
          font-weight: 500;
          padding: 0;
          transition: color 0.2s;
        }

        .forgot-btn:hover { color: #1a3328; }
        .forgot-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .submit-btn {
          width: 100%;
          padding: 0.85rem;
          background: linear-gradient(135deg, #2d6a4f, #40916c);
          color: white;
          border: none;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 4px 14px rgba(45, 106, 79, 0.35);
          letter-spacing: 0.01em;
        }

        .submit-btn:hover:not(:disabled) {
          opacity: 0.92;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(45, 106, 79, 0.4);
        }

        .submit-btn:active:not(:disabled) { transform: translateY(0); }
        .submit-btn:disabled { opacity: 0.65; cursor: not-allowed; }

        .login-footer {
          text-align: center;
          margin-top: 1.5rem;
          font-size: 0.85rem;
          color: #6b7c74;
        }

        .login-footer a {
          color: #2d6a4f;
          font-weight: 500;
          text-decoration: none;
          transition: color 0.2s;
        }

        .login-footer a:hover { color: #1a3328; text-decoration: underline; }

        .divider {
          height: 1px;
          background: linear-gradient(to right, transparent, #d4e4db, transparent);
          margin: 1.5rem 0;
        }
      `}</style>

      <div className="login-root">
        <div className="login-card">

          {/* Logo */}
          <div className="login-logo-wrap">
            <div className="login-logo-circle">
              {/* Replace with <Image> when logo is ready */}
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2-8 2 1-1.5 3-3.5 3-6-2 1.5-5 4.5-5 7z"/>
              </svg>
            </div>
          </div>

          <h1 className="login-title">Welcome Back</h1>
          <p className="login-subtitle">Sign in to access the biodiversity inventory system</p>

          {generalError && <div className="alert alert-error">{generalError}</div>}
          {successMessage && <div className="alert alert-success">{successMessage}</div>}

          <form onSubmit={handleLogin} noValidate>

            {/* Email */}
            <div className="field-group">
              <label className="field-label" htmlFor="email">Email Address</label>
              <div className="input-wrap">
                <span className="input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2"/>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                </span>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={handleEmailBlur}
                  className={`field-input${emailError ? " has-error" : ""}`}
                />
              </div>
              {emailError && <p className="field-error">{emailError}</p>}
            </div>

            {/* Password */}
            <div className="field-group">
              <label className="field-label" htmlFor="password">Password</label>
              <div className="input-wrap">
                <span className="input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={handlePasswordBlur}
                  className={`field-input${passwordError ? " has-error" : ""}`}
                />
                <button type="button" className="toggle-btn" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
              {passwordError && <p className="field-error">{passwordError}</p>}
            </div>

            {/* Remember me + Forgot password */}
            <div className="row-between">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember me
              </label>
              <button type="button" className="forgot-btn" onClick={handleForgotPassword} disabled={loading}>
                Forgot password?
              </button>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Signing in..." : <>Sign In <span>&#8594;</span></>}
            </button>

          </form>

          <div className="divider" />

          <p className="login-footer">
            Don&apos;t have an account?{" "}
            <a href="/register">Register here</a>
          </p>

        </div>
      </div>
    </>
  );
}