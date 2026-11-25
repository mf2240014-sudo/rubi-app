import { useCallback, useEffect, useState } from 'react';
import { RubiApp } from './RubiApp';
import { DemoLabApp } from './DemoLabApp';

function isDemoRoute(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.startsWith('/demo');
}

export default function App() {
  const [onDemoSite, setOnDemoSite] = useState<boolean>(() => isDemoRoute());

  useEffect(() => {
    const onPopState = () => {
      setOnDemoSite(isDemoRoute());
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((path: '/' | '/demo') => {
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
    setOnDemoSite(path === '/demo');
  }, []);

  if (onDemoSite) {
    return <DemoLabApp onBackToRubi={() => navigate('/')} />;
  }

  return <RubiApp onOpenDemoSite={() => navigate('/demo')} />;
}
