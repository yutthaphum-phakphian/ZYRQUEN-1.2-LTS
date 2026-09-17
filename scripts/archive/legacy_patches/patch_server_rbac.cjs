const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const rbacCode = `
// ==========================================
// RBAC & ADMIN CONSOLE API (Sovereign Dashboard)
// ==========================================

export interface AuthenticatedRequest extends express.Request {
  user?: {
    id: string;
    openid: string;
    email: string;
    role: 'owner' | 'admin' | 'user';
  };
}

const parseUserToken = (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
     return res.status(401).json({ error: 'Unauthenticated: Please log in via Manus OAuth.' });
  }
  try {
     const tokenParts = authHeader.split(' ');
     if (tokenParts[0] === 'Bearer' && tokenParts[1]) {
       const userStr = Buffer.from(tokenParts[1], 'base64').toString('utf-8');
       req.user = JSON.parse(userStr);
     }
  } catch(e) {
     // Ignore and let requireAdmin fail it
  }
  next();
};

const requireAdmin = (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthenticated: Please log in via Manus OAuth.' });
  }
  if (req.user.role !== 'admin' && req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Forbidden: Admin privileges required.' });
  }
  next();
};

app.get('/api/admin/users', parseUserToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: 'DatabaseConnectionError: Permanent storage not established. Cannot fetch users from database.' });
  }
  return res.json({ data: [] });
});

app.put('/api/admin/users/:id/role', parseUserToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: 'DatabaseConnectionError: Permanent storage not established.' });
  }
  const { newRole } = req.body;
  const targetUserId = req.params.id;
  
  if (targetUserId === 'owner-id-protected') {
    return res.status(403).json({ error: 'Owner Protection: Cannot modify project owner role.' });
  }

  if (!['admin', 'user'].includes(newRole)) {
    return res.status(400).json({ error: 'Invalid role specified.' });
  }

  return res.json({ success: true });
});
`;

if (!code.includes("RBAC & ADMIN CONSOLE API")) {
  code = code.replace(
    `// Real-time WebSocket Telemetry Broadcaster (every 5s)`,
    `${rbacCode}\n// Real-time WebSocket Telemetry Broadcaster (every 5s)`
  );
  fs.writeFileSync('server.ts', code);
}
