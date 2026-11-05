// Festival offers shown in the homepage hero. Each one appears only between
// its start and end (India time) and needs its coupon switched on in the
// backend for the same dates (see test-data/festive_coupons.py and the
// scheduled coupon switches).

export const FESTIVAL_OFFERS = [
  {
    id: 'diwali',
    title: 'Big Diwali Offer',
    code: 'DIWALI25',
    start: '2026-11-01T00:00:00+05:30',
    end: '2026-11-10T00:00:00+05:30',
  },
  {
    id: 'chhath',
    title: 'Chhath Puja Offer',
    code: 'CHHATH25',
    start: '2026-11-10T00:00:00+05:30',
    end: '2026-11-17T00:00:00+05:30',
  },
  {
    id: 'yearend',
    title: 'Year End Offer',
    code: 'YEAREND25',
    start: '2026-12-12T00:00:00+05:30',
    end: '2027-01-02T00:00:00+05:30',
  },
];

export const OFFER_TERMS = {
  percent: 25,
  minOrder: 999,
  maxOff: 2000,
};

export function activeOffer(now = new Date()) {
  const t = now.getTime();
  return FESTIVAL_OFFERS.find((o) => t >= Date.parse(o.start) && t < Date.parse(o.end)) || null;
}

// "Ends 9 Nov" (the last full day, India time)
export function lastDayLabel(offer) {
  const last = new Date(Date.parse(offer.end) - 1);
  return last.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });
}
