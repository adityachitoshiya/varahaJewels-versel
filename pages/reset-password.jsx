import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://backend.varahajewels.in';

export default function ResetPassword() {
  const router = useRouter();
  const { token } = router.query;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!token) {
      setError('Invalid reset link. Please request a new one.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to reset password');
      setSuccess(true);
      // Auto-redirect after 3 seconds
      setTimeout(() => router.push('/login'), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Reset Password — Varaha Jewels</title>
        <meta name="description" content="Set a new password for your Varaha Jewels account." />
      </Head>

      <main style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1410 0%, #3a2518 50%, #1a1410 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        fontFamily: "'Inter', sans-serif",
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(224,122,36,0.2)',
          borderRadius: '24px',
          padding: '48px',
          maxWidth: '440px',
          width: '100%',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔑</div>
            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '26px',
              fontWeight: '700',
              color: '#fff',
              marginBottom: '8px',
            }}>Set New Password</h1>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>
              Choose a strong password for your account.
            </p>
          </div>

          {success ? (
            <div style={{
              background: 'rgba(34,197,94,0.1)',
              border: '1px solid rgba(34,197,94,0.3)',
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>✅</div>
              <p style={{ color: '#4ade80', fontSize: '15px', marginBottom: '8px', fontWeight: '600' }}>
                Password updated!
              </p>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
                Redirecting to login in 3 seconds...
              </p>
              <Link href="/login" style={{
                display: 'inline-block',
                marginTop: '16px',
                color: '#E07A24',
                fontSize: '14px',
                textDecoration: 'none',
              }}>
                Login Now →
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* New Password */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>
                  New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    required
                    style={{
                      width: '100%',
                      padding: '14px 44px 14px 16px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(224,122,36,0.25)',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '15px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute', right: '12px', top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none', border: 'none',
                      color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '16px',
                    }}
                  >
                    {showPassword ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  required
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    background: 'rgba(255,255,255,0.06)',
                    border: `1px solid ${confirmPassword && confirmPassword !== password ? 'rgba(239,68,68,0.5)' : 'rgba(224,122,36,0.25)'}`,
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '15px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                {confirmPassword && confirmPassword !== password && (
                  <p style={{ color: '#f87171', fontSize: '12px', marginTop: '4px' }}>Passwords don't match</p>
                )}
              </div>

              {error && (
                <div style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#f87171',
                  fontSize: '13px',
                  marginBottom: '16px',
                }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !token}
                style={{
                  width: '100%',
                  padding: '15px',
                  background: loading ? 'rgba(224,122,36,0.5)' : 'linear-gradient(135deg, #E07A24, #A3562A)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginBottom: '16px',
                }}
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>

              <div style={{ textAlign: 'center' }}>
                <Link href="/forgot-password" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', textDecoration: 'none' }}>
                  Request a new link
                </Link>
              </div>
            </form>
          )}
        </div>
      </main>
    </>
  );
}
