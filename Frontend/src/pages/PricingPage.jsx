import React, { useState } from 'react';
import { planCards } from '../assets/constants';
import { api, authHeader, getToken } from '../components/api';

function PricingPage() {
  const [status, setStatus] = useState('');

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

  const upgradePlan = async (plan) => {
    if (plan === 'Premium Vendor') {
      const message = 'Current this subscription not available.';
      window.alert(message);
      setStatus(message);
      return;
    }

    if (!getToken('vendor')) {
      setStatus('Login as vendor to upgrade your plan.');
      return;
    }

    try {
      if (plan === 'Free Vendor Listing') {
        await api.post('/subscriptions/upgrade', { plan }, { headers: authHeader('vendor') });
        setStatus(`Plan upgraded to ${plan}.`);
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
            setStatus(`Plan upgraded to ${plan}.`);
          } catch (error) {
            setStatus(error?.response?.data?.message || 'Payment verification failed.');
          }
        },
        theme: { color: '#3f4eae' }
      });

      razorpay.open();
    } catch (error) {
      setStatus(error?.response?.data?.message || 'Plan upgrade failed.');
    }
  };

  return (
    <section className="container section-space pricing-3d-section">
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
              <button type="button" className="order-btn" onClick={() => upgradePlan(plan.key)}>
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

export default PricingPage;
