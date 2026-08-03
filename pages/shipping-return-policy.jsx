import Head from 'next/head';
import Link from 'next/link';

export default function ShippingReturnPolicy() {
  const sections = [
    {
      title: '🚚 Shipping Policy',
      content: [
        {
          heading: 'Delivery Timelines',
          text: `We offer multiple delivery options based on your location:
• Flash Delivery (Select Pincodes): 2–4 Hours
• Express Delivery (Metro Cities): 1–2 Business Days
• Standard Delivery (All India): 3–5 Business Days

Orders are processed Monday–Saturday, excluding public holidays. Orders placed after 3:00 PM may be dispatched the following business day.`
        },
        {
          heading: 'Shipping Charges',
          text: `Free shipping on all orders above ₹999.
Orders below ₹999 may incur a shipping fee of ₹49–₹99 depending on your location.
Cash on Delivery (COD) orders may attract an additional handling fee of ₹50.`
        },
        {
          heading: 'Shipping Partners',
          text: `We ship through trusted logistics partners including DTDC, Delhivery, and Ekart. Once your order is shipped, you will receive a tracking number via email and SMS to track your package in real-time.`
        },
        {
          heading: 'International Shipping',
          text: `Currently, Varaha Jewels ships within India only. International shipping is not available at this time.`
        },
      ]
    },
    {
      title: '🔄 Return & Exchange Policy',
      content: [
        {
          heading: 'Return Window',
          text: `We accept returns within 7 days of delivery, provided the product is:
• In its original, unused condition
• In the original packaging with all tags intact
• Accompanied by the original invoice/receipt

Custom-made or personalized jewellery pieces are not eligible for return unless they are defective.`
        },
        {
          heading: 'Non-Returnable Items',
          text: `The following items cannot be returned or exchanged:
• Earrings (for hygiene reasons)
• Customized / personalized jewellery
• Sale / clearance items marked as Final Sale
• Items damaged due to misuse, mishandling, or improper storage`
        },
        {
          heading: 'How to Initiate a Return',
          text: `To initiate a return:
1. Email us at support@varahajewels.in with your Order ID and reason for return
2. Our team will review your request within 1–2 business days
3. Upon approval, we will arrange a reverse pickup from your address
4. Once the item is received and quality-checked, your refund will be processed`
        },
        {
          heading: 'Refund Process',
          text: `Refunds are processed within 7–10 business days after we receive and inspect the returned item.

Prepaid Orders: Refund to original payment method (bank account, UPI, or card)
COD Orders: Refund via NEFT/bank transfer (bank details required)`
        },
        {
          heading: 'Damaged or Defective Items',
          text: `If you receive a damaged or defective product, please contact us within 48 hours of delivery with photographs. We will arrange a free replacement or full refund without any hassle.`
        },
      ]
    },
    {
      title: '📞 Contact Us',
      content: [
        {
          heading: 'Get in Touch',
          text: `For any shipping or return queries:
📧 Email: support@varahajewels.in
📱 WhatsApp: +91 [Your Number]
⏰ Support Hours: Mon–Sat, 10 AM – 6 PM IST`
        }
      ]
    }
  ];

  return (
    <>
      <Head>
        <title>Shipping & Return Policy — Varaha Jewels</title>
        <meta name="description" content="Learn about Varaha Jewels' shipping timelines, return policy, refund process, and how to initiate a return or exchange." />
      </Head>

      <main style={{ fontFamily: "'Inter', sans-serif", background: '#FFFBF5', minHeight: '100vh' }}>
        {/* Hero */}
        <section style={{
          background: 'linear-gradient(135deg, #1a1410, #3a2518)',
          padding: '80px 24px 60px',
          textAlign: 'center',
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(224,122,36,0.15)',
            border: '1px solid rgba(224,122,36,0.3)',
            padding: '8px 20px',
            borderRadius: '100px',
            fontSize: '12px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: '#E07A24',
            marginBottom: '24px',
          }}>
            Customer Care
          </div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(32px, 5vw, 56px)',
            fontWeight: '800',
            color: '#fff',
            marginBottom: '16px',
          }}>
            Shipping & Return Policy
          </h1>
          <p style={{
            fontSize: '16px',
            color: 'rgba(255,255,255,0.6)',
            maxWidth: '600px',
            margin: '0 auto',
          }}>
            Everything you need to know about delivery, returns, and refunds.
          </p>
        </section>

        {/* Content */}
        <section style={{ maxWidth: '860px', margin: '0 auto', padding: '60px 24px' }}>
          {sections.map((section, i) => (
            <div key={i} style={{ marginBottom: '60px' }}>
              <h2 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: '26px',
                fontWeight: '700',
                color: '#7A3B23',
                marginBottom: '32px',
                paddingBottom: '16px',
                borderBottom: '2px solid rgba(224,122,36,0.2)',
              }}>
                {section.title}
              </h2>

              {section.content.map((item, j) => (
                <div key={j} style={{
                  background: '#fff',
                  borderRadius: '16px',
                  padding: '24px 28px',
                  marginBottom: '16px',
                  border: '1px solid rgba(122,59,35,0.08)',
                  boxShadow: '0 2px 12px rgba(122,59,35,0.04)',
                }}>
                  <h3 style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#A3562A',
                    marginBottom: '12px',
                  }}>
                    {item.heading}
                  </h3>
                  <p style={{
                    fontSize: '15px',
                    color: '#5a3a2a',
                    lineHeight: '1.8',
                    whiteSpace: 'pre-line',
                  }}>
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          ))}

          {/* Last Updated */}
          <div style={{
            textAlign: 'center',
            padding: '32px',
            borderTop: '2px solid rgba(122,59,35,0.1)',
            color: '#8a7060',
            fontSize: '13px',
          }}>
            <p style={{ marginBottom: '8px' }}>Last updated: July 2025</p>
            <p>
              Questions?{' '}
              <Link href="/contact" style={{ color: '#E07A24', textDecoration: 'none' }}>
                Contact us
              </Link>
              {' '}or read our{' '}
              <Link href="/faq" style={{ color: '#E07A24', textDecoration: 'none' }}>
                FAQ
              </Link>.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
