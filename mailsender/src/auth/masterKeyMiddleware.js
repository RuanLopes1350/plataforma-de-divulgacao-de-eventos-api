export function requireMasterKey(req, res, next) {
  const key = req.header('x-master-key') || req.query.masterKey;
  if (!key || key !== process.env.MASTER_KEY)
    return res.status(403).json({ message: 'master key inválida' });
  next();
}
