const tenantMiddleware = (req, res, next) => {
  if (!req.user || !req.user.companyId) {
    return res.status(401).json({ error: 'Unauthorized: No tenant context found.' });
  }
  
  // Attach companyId to the request for easy access in controllers
  req.companyId = req.user.companyId;
  next();
};

module.exports = tenantMiddleware;
