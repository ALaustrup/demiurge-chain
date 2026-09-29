'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page with signup step
    router.push('/login?step=register');
  }, [router]);

  return null; // Will redirect immediately
}
