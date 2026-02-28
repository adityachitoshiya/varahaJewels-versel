import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function CouponsRedirect() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/admin/offers?tab=coupons');
    }, []);
    return null;
}
