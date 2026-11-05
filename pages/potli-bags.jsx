import Head from 'next/head';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SectionGrid from '../components/SectionGrid';

export default function PotliBagsPage() {
  return (
    <>
      <Head>
        <title>Potli Bags - Varaha Jewels™</title>
        <meta name="description" content="Shop handmade potli bags and metal clutches by Varaha Jewels." />
      </Head>
      <Header />
      <main className="min-h-screen bg-warm-sand">
        <SectionGrid category="Potli Bags" title="Potli Bags" subtitle="Handmade potlis and clutches to carry with your wedding look" />
      </main>
      <Footer />
    </>
  );
}
