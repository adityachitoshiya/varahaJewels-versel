import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://backend.varahajewels.in';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Something went wrong');
      }
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Forgot Password — Varaha Jewels</title>
        <meta name="description" content="Reset your Varaha Jewels account password." />
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
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔐</div>
            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '26px',
              fontWeight: '700',
              color: '#fff',
              marginBottom: '8px',
            }}>Forgot Password</h1>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>
              Enter your email and we'll send you a reset link.
            </p>
          </div>

          {sent ? (
            <div style={{
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34,197,94,0.3)',
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>✅</div>
              <p style={{ color: '#4ade80', fontSize: '15px', marginBottom: '8px', fontWeight: '600' }}>
                Reset link sent!
              </p>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
                Check your inbox (and spam folder) for the reset link. It expires in 1 hour.
              </p>
              <Link href="/login" style={{
                display: 'inline-block',
                marginTop: '20px',
                color: '#E07A24',
                fontSize: '14px',
                textDecoration: 'none',
              }}>
                ← Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(224,122,36,0.25)',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '15px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
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
                disabled={loading}
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
                  marginBottom: '20px',
                }}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>

              <div style={{ textAlign: 'center' }}>
                <Link href="/login" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', textDecoration: 'none' }}>
                  ← Back to Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </main>
    </>
  );
}
