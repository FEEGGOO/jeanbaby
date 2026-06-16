// ══════════════════════════════════════════════════════════════════
//  Jean Baby — PesaPal API 3.0 Payment Integration
//  Sandbox:    https://cybqa.pesapal.com/pesapalv3
//  Production: https://pay.pesapal.com/v3
//  Docs:       https://developer.pesapal.com
// ══════════════════════════════════════════════════════════════════
const router = require('express').Router();
const db     = require('../db');
const { requireAuth } = require('../middleware/auth');

const IS_PROD        = process.env.NODE_ENV === 'production';
const PESAPAL_BASE   = IS_PROD
  ? 'https://pay.pesapal.com/v3'
  : 'https://cybqa.pesapal.com/pesapalv3';

const CONSUMER_KEY    = process.env.PESAPAL_CONSUMER_KEY    || 'p8OVY5s9UdfVKIEKSgW3aWuQ40y9DcO0';
const CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET || 'lhRD2pWfKXv66DSfpv3XPCHw8c8=';
const APP_URL         = process.env.APP_URL || 'https://jeanbaby.onrender.com';

// ── Step 1: Get Bearer Token ─────────────────────────────────────
async function getToken() {
  const res  = await fetch(`${PESAPAL_BASE}/api/Auth/RequestToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ consumer_key: CONSUMER_KEY, consumer_secret: CONSUMER_SECRET })
  });
  const data = await res.json();
  if (!data.token) throw new Error('PesaPal auth failed: ' + JSON.stringify(data));
  return data.token;
}

// ── Step 2: Register IPN URL ─────────────────────────────────────
async function registerIPN(token) {
  const res  = await fetch(`${PESAPAL_BASE}/api/URLSetup/RegisterIPN`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      url: `${APP_URL}/api/payment/ipn`,
      ipn_notification_type: 'POST'
    })
  });
  const data = await res.json();
  if (!data.ipn_id) {
    // If IPN already registered, get existing one
    const listRes  = await fetch(`${PESAPAL_BASE}/api/URLSetup/GetIpnList`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
    });
    const listData = await listRes.json();
    if (listData && listData.length > 0) return listData[0].ipn_id;
    throw new Error('IPN registration failed: ' + JSON.stringify(data));
  }
  return data.ipn_id;
}

// ── POST /api/payment/initiate ───────────────────────────────────
// Called after order is created — redirects to PesaPal payment page
router.post('/initiate', requireAuth, async (req, res) => {
  const uid      = req.session.user.id;
  const { order_id } = req.body;

  try {
    // Load order
    const [[order]] = await db.query(
      'SELECT * FROM orders WHERE id=$1 AND user_id=$2', [order_id, uid]);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const token  = await getToken();
    const ipn_id = await registerIPN(token);

    // Unique merchant reference
    const merchantRef = `JB-${order_id}-${Date.now()}`;

    const payload = {
      id:              merchantRef,
      currency:        'RWF',
      amount:          parseFloat(order.total_amount),
      description:     `Jean Baby Order #JB-${String(order_id).padStart(6, '0')}`,
      callback_url:    `${APP_URL}/payment/success?order_id=${order_id}`,
      notification_id: ipn_id,
      billing_address: {
        email_address: req.session.user.email || 'customer@jeanbaby.rw',
        phone_number:  (order.shipping_phone || '').replace(/\s/g, ''),
        country_code:  'RW',
        first_name:    (order.shipping_name || req.session.user.names || 'Customer').split(' ')[0],
        last_name:     (order.shipping_name || req.session.user.names || 'Customer').split(' ').slice(1).join(' ') || 'Customer',
      }
    };

    const submitRes  = await fetch(`${PESAPAL_BASE}/api/Transactions/SubmitOrderRequest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    const submitData = await submitRes.json();

    if (!submitData.redirect_url) {
      throw new Error('PesaPal submit failed: ' + JSON.stringify(submitData));
    }

    // Save reference to order
    await db.query(
      "UPDATE orders SET payment_ref=$1, payment_method='pesapal' WHERE id=$2",
      [merchantRef, order_id]);

    res.json({
      redirect_url:       submitData.redirect_url,
      order_tracking_id:  submitData.order_tracking_id,
      merchant_reference: merchantRef
    });
  } catch (e) {
    console.error('PesaPal initiate error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── GET /api/payment/status/:order_id ───────────────────────────
// Check payment status after returning from PesaPal
router.get('/status/:order_id', requireAuth, async (req, res) => {
  const { order_tracking_id } = req.query;
  try {
    const [[order]] = await db.query(
      'SELECT * FROM orders WHERE id=$1 AND user_id=$2',
      [req.params.order_id, req.session.user.id]);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const trackingId = order_tracking_id || order.payment_tracking_id;
    if (!trackingId) return res.json({ status: 'PENDING', order });

    const token     = await getToken();
    const statusRes = await fetch(
      `${PESAPAL_BASE}/api/Transactions/GetTransactionStatus?orderTrackingId=${trackingId}`,
      { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' } }
    );
    const data = await statusRes.json();

    // Update order status in DB based on PesaPal response
    const pesapalStatus = (data.payment_status_description || '').toLowerCase();
    let dbStatus = order.status;
    if (pesapalStatus === 'completed') {
      dbStatus = 'processing';
      await db.query(
        "UPDATE orders SET status='processing', payment_tracking_id=$1 WHERE id=$2",
        [trackingId, req.params.order_id]);
    } else if (pesapalStatus === 'failed' || pesapalStatus === 'invalid') {
      dbStatus = 'cancelled';
      await db.query("UPDATE orders SET status='cancelled' WHERE id=$1", [req.params.order_id]);
    }

    res.json({ status: pesapalStatus || 'pending', db_status: dbStatus, data });
  } catch (e) {
    console.error('PesaPal status error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/payment/ipn ────────────────────────────────────────
// PesaPal server-to-server notification (IPN)
router.post('/ipn', async (req, res) => {
  console.log('PesaPal IPN received:', req.body);
  try {
    const { OrderNotificationType, OrderTrackingId, OrderMerchantReference } = req.body;
    if (OrderMerchantReference) {
      // Extract order ID from reference (format: JB-{id}-{timestamp})
      const parts   = OrderMerchantReference.split('-');
      const orderId = parts.length >= 2 ? parseInt(parts[1]) : null;
      if (orderId) {
        await db.query(
          "UPDATE orders SET payment_tracking_id=$1, status='processing' WHERE id=$2",
          [OrderTrackingId, orderId]);
      }
    }
    res.status(200).json({ orderNotificationType: OrderNotificationType, orderTrackingId: OrderTrackingId, status: '200' });
  } catch (e) {
    console.error('IPN error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── GET /api/payment/ipn ─────────────────────────────────────────
// PesaPal sometimes sends GET for IPN verification
router.get('/ipn', (req, res) => {
  console.log('PesaPal IPN GET:', req.query);
  res.status(200).json({ status: '200' });
});

module.exports = router;
