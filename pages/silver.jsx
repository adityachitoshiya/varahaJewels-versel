import Head from 'next/head';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SectionGrid from '../components/SectionGrid';

export default function SilverPage() {
  return (
    <>
      <Head>
        <title>Silver Collection - Varaha Jewels™</title>
        <meta name="description" content="Shop 925 sterling silver pendants by Varaha Jewels." />
      </Head>
      <Header />
      <main className="min-h-screen bg-warm-sand">
        <SectionGrid category="Silver" title="Silver Collection" subtitle="925 sterling silver pendants, made to wear every day" />
      </main>
      <Footer />
    </>
  );
}
