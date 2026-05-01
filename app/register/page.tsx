//TODO: Replace logo placeholder with actual image
"use client";

import { useState } from "react";
import { registerUser, isValidEmail } from "../../src/services/authService";
import { useRouter } from "next/navigation";

export default function Register() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);

  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [checkboxError, setCheckboxError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleFirstNameBlur = () => setFirstNameError(!firstName.trim() ? "First name is required." : "");
  const handleLastNameBlur = () => setLastNameError(!lastName.trim() ? "Last name is required." : "");
  const handleEmailBlur = () => {
    if (!email) setEmailError("Email is required.");
    else if (!isValidEmail(email)) setEmailError("Please enter a valid email address.");
    else setEmailError("");
  };
  const handlePasswordBlur = () => {
    if (!password) setPasswordError("Password is required.");
    else if (password.length < 6) setPasswordError("Password must be at least 6 characters.");
    else setPasswordError("");
  };
  const handleConfirmPasswordBlur = () => {
    if (!confirmPassword) setConfirmPasswordError("Please confirm your password.");
    else if (confirmPassword !== password) setConfirmPasswordError("Passwords do not match.");
    else setConfirmPasswordError("");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(""); setSuccessMessage(""); setCheckboxError("");
    let hasError = false;
    if (!firstName.trim()) { setFirstNameError("First name is required."); hasError = true; }
    if (!lastName.trim()) { setLastNameError("Last name is required."); hasError = true; }
    if (!email || !isValidEmail(email)) { setEmailError("Please enter a valid email address."); hasError = true; }
    if (!password || password.length < 6) { setPasswordError("Password must be at least 6 characters."); hasError = true; }
    if (confirmPassword !== password) { setConfirmPasswordError("Passwords do not match."); hasError = true; }
    if (!agreedToTerms || !agreedToPrivacy) { setCheckboxError("You must agree to both the Terms and Conditions and Data Privacy Policy."); hasError = true; }
    if (hasError) return;

    setLoading(true);
    try {
      const user = await registerUser({ firstName, lastName, email, password });
      console.log("Registered:", user.uid);
      setSuccessMessage("Account created! Please verify your email before logging in.");
      setTimeout(() => { router.push("/login"); }, 2000);
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message.includes("email-already-in-use")) setEmailError("This email is already registered.");
        else if (error.message.includes("weak-password")) setPasswordError("Password is too weak. Use at least 6 characters.");
        else setGeneralError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .reg-root {
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

        .reg-card {
          background: #ffffff;
          border-radius: 20px;
          padding: 2.5rem 2.25rem;
          width: 100%;
          max-width: 460px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.04), 0 20px 60px rgba(45, 106, 79, 0.1);
        }

        .reg-logo-wrap {
          display: flex;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        .reg-logo-circle {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: linear-gradient(135deg, #2d6a4f, #52b788);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(45, 106, 79, 0.3);
        }

        .reg-logo-circle svg { width: 34px; height: 34px; fill: white; }

        .reg-title {
          font-family: 'Lora', serif;
          font-size: 1.75rem;
          font-weight: 600;
          color: #1a3328;
          text-align: center;
          margin-bottom: 0.4rem;
          letter-spacing: -0.3px;
        }

        .reg-subtitle {
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
        }

        .alert-error { background: #fef2f2; color: #c0392b; border: 1px solid #fecaca; }
        .alert-success { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }

        .name-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.85rem;
          margin-bottom: 1.1rem;
        }

        .field-group { margin-bottom: 1.1rem; }

        .field-label {
          display: block;
          font-size: 0.82rem;
          font-weight: 500;
          color: #2d4a3e;
          margin-bottom: 0.4rem;
          letter-spacing: 0.01em;
        }

        .input-wrap { position: relative; display: flex; align-items: center; }

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

        .field-input-no-icon {
          padding-left: 1rem;
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

        .privacy-box {
          background: #f0f7f3;
          border: 1px solid #c3dece;
          border-radius: 10px;
          padding: 1rem 1.1rem;
          margin-bottom: 1.1rem;
          display: flex;
          gap: 0.75rem;
          align-items: flex-start;
        }

        .privacy-icon {
          color: #2d6a4f;
          margin-top: 2px;
          flex-shrink: 0;
        }

        .privacy-title {
          font-size: 0.82rem;
          font-weight: 600;
          color: #1a3328;
          margin-bottom: 0.3rem;
        }

        .privacy-text {
          font-size: 0.8rem;
          color: #4a6358;
          line-height: 1.55;
        }

        .checkbox-group { margin-bottom: 0.75rem; }

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
          flex-shrink: 0;
        }

        .checkbox-label a {
          color: #2d6a4f;
          font-weight: 500;
          text-decoration: none;
        }

        .checkbox-label a:hover { text-decoration: underline; }

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
          margin-top: 1.1rem;
        }

        .submit-btn:hover:not(:disabled) {
          opacity: 0.92;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(45, 106, 79, 0.4);
        }

        .submit-btn:active:not(:disabled) { transform: translateY(0); }
        .submit-btn:disabled { opacity: 0.65; cursor: not-allowed; }

        .reg-footer {
          text-align: center;
          margin-top: 1.5rem;
          font-size: 0.85rem;
          color: #6b7c74;
        }

        .reg-footer a {
          color: #2d6a4f;
          font-weight: 500;
          text-decoration: none;
          transition: color 0.2s;
        }

        .reg-footer a:hover { color: #1a3328; text-decoration: underline; }

        .divider {
          height: 1px;
          background: linear-gradient(to right, transparent, #d4e4db, transparent);
          margin: 1.5rem 0;
        }
      `}</style>

      <div className="reg-root">
        <div className="reg-card">

          {/* Logo */}
          <div className="reg-logo-wrap">
            <div className="reg-logo-circle">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2-8 2 1-1.5 3-3.5 3-6-2 1.5-5 4.5-5 7z"/>
              </svg>
            </div>
          </div>

          <h1 className="reg-title">Create Account</h1>
          <p className="reg-subtitle">Join as a citizen scientist and help document Marikina&apos;s biodiversity</p>

          {generalError && <div className="alert alert-error">{generalError}</div>}
          {successMessage && <div className="alert alert-success">{successMessage}</div>}

          <form onSubmit={handleRegister} noValidate>

            {/* First Name + Last Name */}
            <div className="name-row">
              <div>
                <label className="field-label" htmlFor="firstName">First Name</label>
                <div className="input-wrap">
                  <span className="input-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </span>
                  <input
                    id="firstName"
                    type="text"
                    placeholder="Juan"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    onBlur={handleFirstNameBlur}
                    className={`field-input${firstNameError ? " has-error" : ""}`}
                  />
                </div>
                {firstNameError && <p className="field-error">{firstNameError}</p>}
              </div>

              <div>
                <label className="field-label" htmlFor="lastName">Last Name</label>
                <div className="input-wrap">
                  <span className="input-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </span>
                  <input
                    id="lastName"
                    type="text"
                    placeholder="Dela Cruz"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    onBlur={handleLastNameBlur}
                    className={`field-input${lastNameError ? " has-error" : ""}`}
                  />
                </div>
                {lastNameError && <p className="field-error">{lastNameError}</p>}
              </div>
            </div>

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

            {/* Confirm Password */}
            <div className="field-group">
              <label className="field-label" htmlFor="confirmPassword">Confirm Password</label>
              <div className="input-wrap">
                <span className="input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={handleConfirmPasswordBlur}
                  className={`field-input${confirmPasswordError ? " has-error" : ""}`}
                />
                <button type="button" className="toggle-btn" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? (
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
              {confirmPasswordError && <p className="field-error">{confirmPasswordError}</p>}
            </div>

            {/* Data Privacy Notice */}
            <div className="privacy-box">
              <span className="privacy-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </span>
              <div>
                <p className="privacy-title">Data Privacy Notice</p>
                <p className="privacy-text">
                  Your personal information is protected under Republic Act 10173 (Data Privacy Act of 2012).
                  We collect only necessary data for biodiversity monitoring purposes.
                </p>
              </div>
            </div>

            {/* Checkboxes */}
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} />
                I agree to the <a href="/terms" target="_blank">Terms and Conditions</a>
              </label>
            </div>

            <div className="checkbox-group">
              <label className="checkbox-label">
                <input type="checkbox" checked={agreedToPrivacy} onChange={(e) => setAgreedToPrivacy(e.target.checked)} />
                I agree to the <a href="/privacy" target="_blank">Data Privacy Policy</a>
              </label>
            </div>

            {checkboxError && <p className="field-error" style={{ marginBottom: "0.5rem" }}>{checkboxError}</p>}

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Creating Account..." : <>Create Account <span>&#8594;</span></>}
            </button>

          </form>

          <div className="divider" />

          <p className="reg-footer">
            Already have an account?{" "}
            <a href="/login">Sign in here</a>
          </p>

        </div>
      </div>
    </>
  );
}