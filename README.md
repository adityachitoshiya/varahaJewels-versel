# ⚡ Dev Reference: Varaha Jewels Frontend

## 🖥️ Commands
```bash
npm run dev      # Start Local Server (http://localhost:3000)
npm run build    # Production Build
npm start        # Run Production Build
npm run lint     # Check Code Quality
```

## 🔑 Environment (`.env.local`)
```properties
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_MSG91_WIDGET_ID=...
```

## 📂 Architecture Map
| Path | Purpose |
| :--- | :--- |
| `pages/` | **Route Handlers.** `index.jsx` (Home), `product/[id].jsx`, `checkout.jsx`. |
| `components/` | **UI Blocks.** `Header.jsx`, `Footer.jsx`, `MobileBottomNav.jsx`. |
| `styles/` | Global CSS & Tailwind layers. |
| `lib/` | Shared logic/utils. |
| `context/` | Global State (Cart, Auth). |

## 🛠️ Core Stack
*   **Core:** Next.js 14, React 18
*   **Styling:** Tailwind CSS 3
*   **Auth:** Supabase, Firebase
*   **Payments:** Razorpay
*   **Icons:** Lucide React

## 📍 Critical Files (Quick Access)
*   **Home:** `pages/index.jsx`
*   **Header:** `components/Header.jsx`
*   **Footer:** `components/Footer.jsx`
*   **Mobile Nav:** `components/MobileBottomNav.jsx`
*   **Product ID:** `pages/product/[id].jsx`
*   **Checkout:** `pages/checkout.jsx`
*   **Admin Panel:** `pages/admin/`

## 📝 Notes
*   **Images:** Using `browser-image-compression` for uploads.
*   **Invoices:** Generated client-side using `jspdf`.
*   **Mobile:** Logic often splits between `Header.jsx` (Desktop) and `MobileBottomNav.jsx`.
