import Head from 'next/head';
import Image from 'next/image';
import { MapPin, AlertTriangle, Mail, Phone } from 'lucide-react';

export default function GeoBlocked() {
    return (
        <>
            <Head>
                <title>Region Not Supported | Varaha Jewels</title>
                <meta name="robots" content="noindex, nofollow" />
            </Head>

            <div className="min-h-screen bg-gradient-to-br from-warm-sand via-white to-warm-sand flex items-center justify-center p-6">
                <div className="max-w-lg w-full text-center">

                    {/* Logo */}
                    <div className="mb-8">
                        <Image
                            src="/varaha-assets/logo.png"
                            alt="Varaha Jewels"
                            width={180}
                            height={60}
                            className="mx-auto"
                        />
                    </div>

                    {/* Icon */}
                    <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-heritage to-copper rounded-full flex items-center justify-center shadow-lg">
                        <MapPin size={40} className="text-white" />
                    </div>

                    {/* Message */}
                    <h1 className="text-3xl font-royal font-bold text-heritage mb-4">
                        Service Not Available
                    </h1>

                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-copper/20 mb-8">
                        <div className="flex items-center justify-center gap-2 text-heritage mb-3">
                            <AlertTriangle size={20} className="text-copper" />
                            <span className="font-semibold">Your Region</span>
                        </div>
                        <p className="text-matte-brown leading-relaxed">
                            We regret to inform you that <span className="font-bold text-heritage">Varaha Jewels</span> is
                            not available in your area.
                        </p>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-3 text-sm text-matte-brown">
                        <p className="font-semibold text-heritage">Need assistance?</p>
                        <div className="flex items-center justify-center gap-2">
                            <Mail size={16} className="text-copper" />
                            <a href="mailto:support@varahajewels.in" className="hover:text-copper transition">
                                support@varahajewels.in
                            </a>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                            <Phone size={16} className="text-copper" />
                            <a href="tel:+919876543210" className="hover:text-copper transition">
                                +91 98765 43210
                            </a>
                        </div>
                    </div>

                    {/* Footer */}
                    <p className="mt-8 text-xs text-matte-brown/60">
                        © {new Date().getFullYear()} Varaha Jewels. Where Heritage Meets Royalty.
                    </p>
                </div>
            </div>
        </>
    );
}
