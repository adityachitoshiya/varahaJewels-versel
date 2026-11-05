import Head from 'next/head';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SectionGrid from '../components/SectionGrid';

export default function DivinePage() {
  return (
    <>
      <Head>
        <title>Divine Collection - Varaha Jewels™</title>
        <meta name="description" content="Shop Rudraksha malas and healing stone bracelets by Varaha Jewels." />
      </Head>
      <Header />
      <main className="min-h-screen bg-warm-sand">
        <SectionGrid category="Divine" title="Divine Collection" subtitle="Rudraksha malas and healing stone bracelets for faith and calm" />
      </main>
      <Footer />
    </>
  );
}
