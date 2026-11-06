import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';

// Thin bar at the top while a page is opening, so a tap on a link always shows
// that something is happening (instead of a frozen or blank screen).
export default function RouteProgress() {
  const router = useRouter();
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    const start = (url) => {
      if (url === router.asPath) return;
      clearInterval(timer.current);
      setVisible(true); setWidth(12);
      timer.current = setInterval(() => setWidth((w) => (w < 85 ? w + (90 - w) * 0.08 : w)), 180);
    };
    const done = () => {
      clearInterval(timer.current);
      setWidth(100);
      setTimeout(() => { setVisible(false); setWidth(0); }, 250);
    };
    router.events.on('routeChangeStart', start);
    router.events.on('routeChangeComplete', done);
    router.events.on('routeChangeError', done);
    return () => {
      clearInterval(timer.current);
      router.events.off('routeChangeStart', start);
      router.events.off('routeChangeComplete', done);
      router.events.off('routeChangeError', done);
    };
  }, [router]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[200] h-[3px]" style={{ opacity: visible ? 1 : 0, transition: 'opacity .2s' }}>
      <div className="h-full bg-gradient-to-r from-[#e2bd7c] to-[#a3562a]" style={{ width: `${width}%`, transition: 'width .2s ease-out' }} />
    </div>
  );
}
