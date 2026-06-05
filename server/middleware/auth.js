function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Not authenticated' });
  next();
}
function requireSeller(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Not authenticated' });
  if (req.session.user.role !== 'seller') return res.status(403).json({ error: 'Seller access only' });
  next();
}
module.exports = { requireAuth, requireSeller };
