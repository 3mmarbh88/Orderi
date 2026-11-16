import express from 'express';
import { WhatsAppBridgeSupervisor } from './bridgeSupervisor';
import { signBridgeToken, verifyBridgeToken } from './whatsappBridgeCrypto';

export interface AuthenticatedBridgeRequest extends express.Request {
  bridgeUserId?: string;
}

export function extractBearerToken(req: express.Request): string {
  const header = String(req.headers.authorization || '').trim();
  if (header.toLowerCase().startsWith('bearer ')) {
    return header.slice(7).trim();
  }
  const alt = req.headers['x-bridge-token'];
  return typeof alt === 'string' ? alt.trim() : '';
}

export function createBridgeRouter(supervisor: WhatsAppBridgeSupervisor): express.Router {
  const router = express.Router();

  // Issue user-scoped signed Bridge session token so every session is strictly isolated per userId
  router.post('/auth/session', (req, res) => {
    try {
      const userId = String(req.body?.userId || '').trim();
      if (!userId || userId.length < 3 || userId.length > 128) {
        return res.status(400).json({
          success: false,
          error: 'معرف المستخدم (userId) مطلوب لعزل جلسة واتساب الخاصة بك.',
        });
      }

      const bridgeToken = signBridgeToken(userId, supervisor.masterSecret);
      const status = supervisor.getStatus(userId);
      return res.json({
        success: true,
        bridgeToken,
        userId,
        status,
      });
    } catch {
      return res.status(500).json({
        success: false,
        error: 'تعذر إصدار جلسة المصادقة الخاصة بـ WhatsApp Bridge.',
      });
    }
  });

  // Require valid signed user-scoped token on all Bridge operations
  const requireBridgeAuth: express.RequestHandler = (req: AuthenticatedBridgeRequest, res, next) => {
    const token = extractBearerToken(req);
    const verified = verifyBridgeToken(token, supervisor.masterSecret);
    if (!verified.valid || !verified.userId) {
      return res.status(401).json({
        success: false,
        errorCode: 'UNAUTHORIZED_BRIDGE_SESSION',
        error: 'يتطلب التحقق من هوية المستخدم للوصول إلى جلسة WhatsApp Bridge الخاصة به.',
      });
    }

    const requestedUser = String(req.body?.userId || req.query?.userId || '').trim();
    if (requestedUser && requestedUser !== verified.userId) {
      return res.status(403).json({
        success: false,
        errorCode: 'FORBIDDEN_CROSS_USER_ACCESS',
        error: 'ممنوع الوصول إلى جلسة واتساب الخاصة بمستخدم آخر.',
      });
    }

    req.bridgeUserId = verified.userId;
    next();
  };

  router.get('/session', requireBridgeAuth, (req: AuthenticatedBridgeRequest, res) => {
    const status = supervisor.getStatus(req.bridgeUserId!);
    return res.json({ success: true, status });
  });

  router.post('/session/connect', requireBridgeAuth, (req: AuthenticatedBridgeRequest, res) => {
    const phoneNumber = String(req.body?.phoneNumber || '').trim();
    const status = supervisor.startPairing(req.bridgeUserId!, phoneNumber);
    return res.json({ success: true, status });
  });

  router.post('/session/reconnect', requireBridgeAuth, (req: AuthenticatedBridgeRequest, res) => {
    const status = supervisor.reconnect(req.bridgeUserId!);
    return res.json({ success: true, status });
  });

  router.post('/session/disconnect', requireBridgeAuth, async (req: AuthenticatedBridgeRequest, res) => {
    const logout = req.body?.logout !== false;
    const status = await supervisor.disconnect(req.bridgeUserId!, logout);
    return res.json({ success: true, status });
  });

  router.get('/messages/since', requireBridgeAuth, (req: AuthenticatedBridgeRequest, res) => {
    const after = Number(req.query?.after || 0);
    const messages = supervisor.getRecentGroupMessages(
      req.bridgeUserId!,
      Number.isFinite(after) ? after : 0
    );
    return res.json({ success: true, messages });
  });

  router.post('/outreach/send', requireBridgeAuth, async (req: AuthenticatedBridgeRequest, res) => {
    try {
      const {
        orderId,
        operationId,
        targetJid,
        senderPhone,
        groupJid,
        originalMessageId,
        originalSenderName,
        message,
      } = req.body || {};

      if (!orderId || !message) {
        return res.status(400).json({
          success: false,
          errorCode: 'INVALID_OUTREACH_PAYLOAD',
          errorMessage: 'بيانات الطلب أو رسالة القبول ناقصة.',
        });
      }

      const result = await supervisor.sendPrivateMessage(req.bridgeUserId!, {
        orderId: String(orderId),
        operationId: String(operationId || `op-${orderId}`),
        targetJid: targetJid ? String(targetJid) : undefined,
        senderPhone: senderPhone ? String(senderPhone) : undefined,
        groupJid: groupJid ? String(groupJid) : undefined,
        originalMessageId: originalMessageId ? String(originalMessageId) : undefined,
        originalSenderName: originalSenderName ? String(originalSenderName) : undefined,
        message: String(message),
      });

      return res.status(result.success ? 200 : 422).json(result);
    } catch {
      return res.status(500).json({
        success: false,
        errorCode: 'BRIDGE_OUTREACH_ERROR',
        errorMessage: 'حدث خطأ داخلي في خدمة WhatsApp Bridge أثناء إرسال رسالة القبول.',
      });
    }
  });

  return router;
}
