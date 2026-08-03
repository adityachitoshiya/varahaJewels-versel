import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Custom404() {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>Page Not Found — Varaha Jewels</title>
        <meta name="description" content="The page you're looking for doesn't exist. Explore our jewellery collections." />
      </Head>

      <main style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1410 0%, #3a2518 50%, #1a1410 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '40px 24px',
        fontFamily: "'Inter', sans-serif",
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(224,122,36,0.2)',
          borderRadius: '24px',
          padding: '64px 48px',
          maxWidth: '560px',
          width: '100%',
        }}>
          {/* 404 Number */}
          <div style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '120px',
            fontWeight: '800',
            lineHeight: '1',
            background: 'linear-gradient(135deg, #E07A24, #d4a574, #A3562A)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '16px',
          }}>
            404
          </div>

          {/* Crown/Logo */}
          <div style={{ fontSize: '48px', marginBottom: '24px' }}>👑</div>

          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '28px',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '12px',
          }}>
            Page Not Found
          </h1>

          <p style={{
            fontSize: '16px',
            color: 'rgba(255,255,255,0.6)',
            lineHeight: '1.7',
            marginBottom: '40px',
          }}>
            The jewel you're looking for seems to have moved. 
            Let's guide you back to our collections.
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => router.back()}
              style={{
                padding: '14px 28px',
                background: 'transparent',
                border: '1px solid rgba(224,122,36,0.5)',
                color: '#E07A24',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              ← Go Back
            </button>

            <Link href="/shop" style={{
              display: 'inline-block',
              padding: '14px 28px',
              background: 'linear-gradient(135deg, #E07A24, #A3562A)',
              color: '#fff',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '600',
              textDecoration: 'none',
              transition: 'all 0.2s',
            }}>
              Shop Collections →
            </Link>
          </div>

          <div style={{ marginTop: '40px', borderTop: '1px solid rgba(224,122,36,0.15)', paddingTop: '32px' }}>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '16px' }}>
              Quick links
            </p>
            <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {[
                { label: 'Home', href: '/' },
                { label: 'New Arrivals', href: '/new-arrivals' },
                { label: 'Women', href: '/women' },
                { label: 'Men', href: '/men' },
                { label: 'Contact', href: '/contact' },
              ].map(link => (
                <Link key={link.href} href={link.href} style={{
                  fontSize: '14px',
                  color: 'rgba(255,255,255,0.5)',
                  textDecoration: 'none',
                }}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
