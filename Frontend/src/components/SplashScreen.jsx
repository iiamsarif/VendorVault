import React, { useEffect, useState } from 'react';

function SplashScreen({ onComplete }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onComplete) onComplete();
    }, 1800);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div className="splash-screen">
      <div className="splash-inner">
        <h1>VendorVault Gujarat</h1>
        <p>Digital Vendor Directory for Industrial Gujarat</p>
      </div>
    </div>
  );
}

export default SplashScreen;
