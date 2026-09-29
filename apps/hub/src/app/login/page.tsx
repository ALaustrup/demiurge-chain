'use client';

import { useState, Suspense, ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { QorIdAuthFlow } from '@/components/auth/QorIdAuthFlow';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(true);
  
  // Check if we should start at signup step
  const stepParam = searchParams.get('step');
  const initialStep = stepParam === 'register' ? 'register-username' : 'login';

  const handleSuccess = () => {
    // Redirect to portal after successful login
    router.push('/portal');
  };

  const handleClose = () => {
    // If user closes, redirect to home
    router.push('/');
  };

  return (
    <QorIdAuthFlow
      isOpen={isOpen}
      onClose={handleClose}
      onSuccess={handleSuccess}
      variant="page"
      initialStep={initialStep}
    />
  );
}

// Wrapper to fix React 19 types compatibility with Suspense
function SuspenseWrapper({ children, fallback }: { children: ReactNode; fallback: ReactNode }) {
  return <Suspense fallback={fallback}>{children}</Suspense>;
}

export default function LoginPage() {
  return (
    <SuspenseWrapper fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginContent />
    </SuspenseWrapper>
  );
}
