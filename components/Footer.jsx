import { Instagram, Facebook, Twitter } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-heritage text-warm-sand pb-20 lg:pb-0 border-t border-copper/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-10 mb-16">
          {/* Newsletter */}
          <div className="col-span-2">
            <div className="mb-6">
              <Image
                src="/varaha-assets/logo.png"
                alt="Varaha Jewels"
                width={180}
                height={60}
                className="h-14 w-auto brightness-[2]"
              />
              <p className="text-warm-sand/70 text-xs italic font-light mt-2 tracking-wide">
                Where heritage meets royalty
              </p>
            </div>
            <h3 className="text-2xl font-royal font-bold mb-6 text-copper">Stay Connected</h3>
            <p className="text-warm-sand/95 text-base mb-4 font-light leading-relaxed">
              Subscribe to receive exclusive offers and new collection updates.
            </p>
            <p className="text-copper text-sm mb-6 font-semibold">
              ✓ 7 Day Easy Returns
            </p>
            <form className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-5 py-3.5 rounded-sm bg-heritage/50 border border-copper/40 text-warm-sand text-sm placeholder-warm-sand/50 focus:outline-none focus:ring-2 focus:ring-copper focus:border-copper transition-all"
              />
              <button
                type="submit"
                className="px-8 py-3.5 bg-copper text-warm-sand font-semibold rounded-sm hover:bg-copper/90 transition-all duration-300 shadow-md"
              >
                Subscribe
              </button>
            </form>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-semibold mb-6 text-copper text-lg">Collections</h4>
            <ul className="space-y-3 text-sm text-warm-sand/90">
              <li><Link href="/coming-soon" className="hover:text-copper transition-colors duration-300">New Arrivals</Link></li>
              <li><Link href="/coming-soon" className="hover:text-copper transition-colors duration-300">Heritage</Link></li>
              <li><Link href="/coming-soon" className="hover:text-copper transition-colors duration-300">Bridal</Link></li>
              <li><Link href="/coming-soon" className="hover:text-copper transition-colors duration-300">Exclusive</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-6 text-copper text-lg">Support</h4>
            <ul className="space-y-3 text-sm text-warm-sand/90">
              <li><Link href="/contact" className="hover:text-copper transition-colors duration-300">Contact Us</Link></li>
              <li><Link href="/coming-soon" className="hover:text-copper transition-colors duration-300">FAQs</Link></li>
              <li><Link href="/coming-soon" className="hover:text-copper transition-colors duration-300">Shipping</Link></li>
              <li><Link href="/coming-soon" className="hover:text-copper transition-colors duration-300">Returns</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-6 text-copper text-lg">Company</h4>
            <ul className="space-y-3 text-sm text-warm-sand/90">
              <li><Link href="/coming-soon" className="hover:text-copper transition-colors duration-300">About Us</Link></li>
              <li><Link href="/coming-soon" className="hover:text-copper transition-colors duration-300">Privacy Policy</Link></li>
              <li><Link href="/coming-soon" className="hover:text-copper transition-colors duration-300">Terms of Service</Link></li>
              <li><Link href="/coming-soon" className="hover:text-copper transition-colors duration-300">Accessibility</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-10 border-t border-copper/40 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <p className="text-sm text-warm-sand/90 font-light">
              © {new Date().getFullYear()} Varaha Jewels. All rights reserved.
            </p>
            
            {/* Payment Icons */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-warm-sand/90 mr-2">We Accept:</span>
              <Image
                src="/varaha-assets/visa_icon.svg"
                alt="Visa"
                width={40}
                height={25}
                className="h-6 w-auto opacity-80 hover:opacity-100 transition-opacity"
              />
              <Image
                src="/varaha-assets/mastercard_icon.svg"
                alt="Mastercard"
                width={40}
                height={25}
                className="h-6 w-auto opacity-80 hover:opacity-100 transition-opacity"
              />
              <Image
                src="/varaha-assets/rupay_icon.svg"
                alt="RuPay"
                width={40}
                height={25}
                className="h-6 w-auto opacity-80 hover:opacity-100 transition-opacity"
              />
            </div>
          </div>
          
          {/* Social Icons */}
          <div className="flex space-x-5">
            <a href="#" className="p-3 bg-heritage/50 rounded-full hover:bg-copper hover:text-warm-sand transition-all duration-300 border border-copper/30" aria-label="Instagram">
              <Instagram size={22} />
            </a>
            <a href="#" className="p-3 bg-heritage/50 rounded-full hover:bg-copper hover:text-warm-sand transition-all duration-300 border border-copper/30" aria-label="Facebook">
              <Facebook size={22} />
            </a>
            <a href="#" className="p-3 bg-heritage/50 rounded-full hover:bg-copper hover:text-warm-sand transition-all duration-300 border border-copper/30" aria-label="Twitter">
              <Twitter size={22} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
