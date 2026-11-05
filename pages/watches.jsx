import Head from 'next/head';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SectionGrid from '../components/SectionGrid';

export default function WatchesPage() {
  return (
    <>
      <Head>
        <title>Watches - Varaha Jewels™</title>
        <meta name="description" content="Shop Kundan and rose gold watches for women by Varaha Jewels." />
      </Head>
      <Header />
      <main className="min-h-screen bg-warm-sand">
        <SectionGrid category="Watches" title="Watches" subtitle="Kundan and rose gold watches for parties and every day" />
      </main>
      <Footer />
    </>
  );
}
