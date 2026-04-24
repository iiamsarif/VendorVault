import React, { useEffect, useState } from 'react';
import { planCards } from '../assets/constants';
import { api, authHeader } from '../components/api';

function SubscriptionUpgrade() {
  const [status, setStatus] = useState('');
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get('/vendor/analytics', { headers: authHeader('vendor') });
        setAnalytics(response.data || null);
      } catch (error) {
        setAnalytics(null);
      }
    };
    load();
  }, []);

  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const choosePlan = async (plan) => {
    if (plan === 'Premium Vendor') {
      const message = 'Current this subscription not available.';
      window.alert(message);
      setStatus(message);
      return;
    }

    try {
      if (plan === 'Free Vendor Listing') {
        await api.post('/subscriptions/upgrade', { plan }, { headers: authHeader('vendor') });
        setStatus('Subscription upgraded to Free Vendor Listing.');
        const latest = await api.get('/vendor/analytics', { headers: authHeader('vendor') });
        setAnalytics(latest.data || null);
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setStatus('Unable to load Razorpay checkout.');
        return;
      }

      const orderResponse = await api.post('/payments/create-order', { plan }, { headers: authHeader('vendor') });
      const order = orderResponse.data?.order;
      const keyId = orderResponse.data?.keyId;
      if (!order?.id || !keyId) {
        setStatus('Payment order creation failed.');
        return;
      }

      const razorpay = new window.Razorpay({
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'VendorVault Gujarat',
        description: `${plan} Subscription`,
        order_id: order.id,
        handler: async (response) => {
          try {
            await api.post(
              '/payments/verify',
              {
                plan,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              },
              { headers: authHeader('vendor') }
            );
            setStatus(`Subscription activated successfully: ${plan}.`);
            const latest = await api.get('/vendor/analytics', { headers: authHeader('vendor') });
            setAnalytics(latest.data || null);
          } catch (error) {
            setStatus(error?.response?.data?.message || 'Payment verification failed.');
          }
        },
        theme: { color: '#3f4eae' }
      });

      razorpay.open();
    } catch (error) {
      setStatus(error?.response?.data?.message || 'Subscription upgrade failed.');
    }
  };

  return (
    <section className="pricing-3d-section">
      <div className="section-head pricing-3d-head"><h1>Subscription Upgrade</h1></div>
      <div className="subscription-paid-status">
        <div className="subscription-paid-chip">
          <i className="fa-solid fa-crown" />
          <span>
            Currently Paid: <strong>{analytics?.paid || 'None'}</strong>
          </span>
        </div>
        <small>Listings and Profile Views unlock after Silver payment.</small>
      </div>
      <p className="pricing-3d-description">
        Choose the plan that best matches your business goals to improve visibility, receive better quality leads, and grow faster on VendorVault Gujarat.
      </p>
      <div className="pricing-3d-wrapper">
        {planCards.map((plan, index) => {
          const tierClass = index === 0 ? 'basic' : index === 1 ? 'standart' : 'premium';
          return (
            <article key={plan.key} className={`pricing-3d-card ${tierClass}`}>
              <h3 className="plan-name">{plan.label.toUpperCase()}</h3>
              <p className="plan-period">PER YEAR</p>
              <div className="price-ribbon">{plan.price}</div>
              <ul className="price-feature-list">
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <i className="fa-solid fa-check" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button type="button" className="order-btn" onClick={() => choosePlan(plan.key)}>
                Choose {plan.label} <i className="fa-solid fa-chevron-right price-arrow" />
              </button>
            </article>
          );
        })}
      </div>
      {status && <p className="status-text">{status}</p>}
    </section>
  );
}

export default SubscriptionUpgrade;
