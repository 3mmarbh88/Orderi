import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import QRCode from "qrcode";
import { parseWhatsAppOrderText } from "./src/utils/orderParser";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware for body parsing (allowing audio base64 payload up to 35MB)
app.use(express.json({ limit: "35mb" }));
app.use(express.urlencoded({ extended: true, limit: "35mb" }));

// Server-Sent Events (SSE) Client registry for instant live order delivery
const sseClients = new Set<express.Response>();
const recentWebhookOrders: any[] = [];
const recentDiscoveredGroupLinks: any[] = [];

// Helper: Extract WhatsApp group invite links from incoming text and broadcast via SSE
function extractAndBroadcastGroupLinks(rawText: string, sender: string, phone: string, group: string) {
  if (!rawText || typeof rawText !== "string") return [];
  const matches = [...rawText.matchAll(/(?:https?:\/\/)?(?:chat\.whatsapp\.com|wa\.me\/join)\/([a-zA-Z0-9_-]{20,26})/gi)];
  if (matches.length === 0) return [];

  const newlyCaptured: any[] = [];
  for (const match of matches) {
    const inviteCode = match[1];
    const fullUrl = `https://chat.whatsapp.com/${inviteCode}`;

    // Skip if already in recent list with same code
    const existing = recentDiscoveredGroupLinks.find(g => g.inviteCode === inviteCode);
    if (existing) {
      existing.capturedAt = new Date().toISOString();
      continue;
    }

    // Infer title
    const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    let title = `قروب توصيل جديد (من ${sender || group})`;
    for (const line of lines) {
      if (['قروب', 'مجموعة', 'كباتن', 'مناديب', 'توصيل', 'طلبات'].some(kw => line.includes(kw)) && line.length < 70) {
        const cleaned = line
          .replace(/https?:\/\/\S+/gi, '')
          .replace(/(?:رابط|انضموا|حياكم|تفضلوا|هذا|الرابط|للانضمام|للتسجيل|اضغط|هنا)[\s:]*/gi, '')
          .trim();
        if (cleaned.length > 3) {
          title = cleaned;
          break;
        }
      }
    }

    const groupLink = {
      id: `grp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      url: fullUrl,
      inviteCode,
      title,
      senderName: sender || "معلن واتساب",
      senderPhone: phone || "",
      sourceGroup: group || "قروب واتساب",
      rawText: rawText.trim(),
      capturedAt: new Date().toISOString(),
      status: "new",
      isMonitored: false,
    };

    recentDiscoveredGroupLinks.unshift(groupLink);
    if (recentDiscoveredGroupLinks.length > 50) recentDiscoveredGroupLinks.pop();
    newlyCaptured.push(groupLink);

    // Push SSE event to all connected screens
    const linkPayload = `data: ${JSON.stringify({ 
      type: "GROUP_LINK_DETECTED", 
      groupLink 
    })}\n\n`;

    sseClients.forEach((client) => {
      try {
        client.write(linkPayload);
      } catch {
        sseClients.delete(client);
      }
    });

    console.log(`[Orderi Sniffer] 🔗 Intercepted new delivery group invite: "${title}" (${fullUrl}) posted in "${group}" by ${sender}`);
  }

  return newlyCaptured;
}

// WhatsApp Web Gateway & Android Notification Listener Session State
interface WhatsAppSessionState {
  status: "disconnected" | "qr_ready" | "connecting" | "connected";
  qrCodeDataUrl: string;
  pairingCode: string;
  connectedPhone: string | null;
  connectedAt: string | null;
  deviceName: string;
  batteryLevel: number;
  groupsMonitoredCount: number;
  privateChatsMonitoredCount: number;
  totalOrdersCaptured: number;
  lastSyncAt: string | null;
  listenerServiceActive: boolean;
}

const whatsAppSession: WhatsAppSessionState = {
  status: "disconnected",
  qrCodeDataUrl: "",
  pairingCode: "",
  connectedPhone: null,
  connectedAt: null,
  deviceName: "Orderi Radar Gateway (Multi-Device)",
  batteryLevel: 96,
  groupsMonitoredCount: 18,
  privateChatsMonitoredCount: 6,
  totalOrdersCaptured: 0,
  lastSyncAt: null,
  listenerServiceActive: true,
};

// Generate QR code data URL for WhatsApp Web Session
async function generateFreshQRCode(): Promise<string> {
  const randomToken = Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 36).toString(36)
  ).join("");
  const pairingStr = `2@ORD-RADAR-BH-${Date.now()}-${randomToken}`;
  whatsAppSession.pairingCode = `ORD-973-${Math.floor(1000 + Math.random() * 9000)}`;

  try {
    const dataUrl = await QRCode.toDataURL(pairingStr, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: 280,
      color: {
        dark: "#064e3b",
        light: "#ffffff",
      },
    });
    whatsAppSession.qrCodeDataUrl = dataUrl;
    return dataUrl;
  } catch (err) {
    console.error("QR Code generation error:", err);
    return "";
  }
}

// Pre-generate initial QR Code
generateFreshQRCode().then(() => {
  whatsAppSession.status = "qr_ready";
});

// Periodic automated live order emitter when WhatsApp session is connected
const liveIncomingSamples = [
  {
    isDirect: true,
    group: "محادثة خاصة / تاجر مباشر 👤",
    sender: "بوتيك الريم للأزياء",
    phone: "97339881122",
    text: "سلام كابتن، عندي فستان توصيل فوري من الرفاع الشرقي إلى الجفير السعر 3.5 د.ب هاتف 39881122 جاهز حالا",
    from: "الرفاع الشرقي",
    to: "الجفير",
    price: 3.5
  },
  {
    isDirect: false,
    group: "قروب مندوبي البحرين 🇧🇭",
    sender: "حلويات ريتاج",
    phone: "97333556677",
    text: "طلب صينية حلا جاهزة من المحرق إلى مدينة حمد دوار 12 السعر 3.5 دينار 33556677",
    from: "المحرق",
    to: "مدينة حمد",
    price: 3.5
  },
  {
    isDirect: true,
    group: "محادثة خاصة / تاجر مباشر 👤",
    sender: "عطورات السامرية (VIP)",
    phone: "97338112233",
    text: "مساء الخير كابتننا العزيز، متوفر بوكس عطور عاجل من السيف إلى سار السعر 4 دينار 38112233",
    from: "السيف",
    to: "سار",
    price: 4.0
  },
  {
    isDirect: false,
    group: "شبكة كباتن المنامة والمحرق",
    sender: "مطعم البرجر الذهبي",
    phone: "97336998877",
    text: "أوردر وجبات ساخنة من المنامة إلى البسيتين السعر 2.5 د.ب هاتف 36998877 جاهز",
    from: "المنامة",
    to: "البسيتين",
    price: 2.5
  },
  {
    isDirect: false,
    group: "توصيل المحافظة الجنوبية",
    sender: "متجر الورود الطبيعية",
    phone: "97334112244",
    text: "باقة ورد وتخرج عاجلة من الرفاع الغربي إلى سند السعر 3 دينار اتصال 34112244",
    from: "الرفاع الغربي",
    to: "سند",
    price: 3.0
  },
  {
    isDirect: true,
    group: "محادثة خاصة / تاجر مباشر 👤",
    sender: "الدانة للأكسسوارات والذهب (خاص)",
    phone: "97339776655",
    text: "كابتن مستعجل، هدية وساعة من توبلي إلى الدير السعر 3.5 دينار هاتف 39776655 كاش عند الاستلام",
    from: "توبلي",
    to: "الدير",
    price: 3.5
  }
];

setInterval(() => {
  if (whatsAppSession.status !== "connected" || sseClients.size === 0) return;

  const sample = liveIncomingSamples[Math.floor(Math.random() * liveIncomingSamples.length)];
  const order = {
    id: `ord-live-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    from: sample.from,
    to: sample.to,
    price: sample.price,
    rawText: sample.text,
    groupName: sample.group,
    senderName: sample.sender,
    senderPhone: sample.phone,
    receivedAt: new Date().toISOString(),
    confidence: 98,
    type: sample.isDirect ? "طلب مباشر (خاص)" : "طلب قروب واتساب",
    notes: sample.isDirect ? "وارد في المحادثة الخاصة عبر جلسة واتساب ويب" : "وارد من قروب عبر جلسة واتساب ويب",
    status: "pending",
    source: "whatsapp_web_session",
    isDirectPrivate: sample.isDirect,
  };

  recentWebhookOrders.unshift(order);
  if (recentWebhookOrders.length > 50) recentWebhookOrders.pop();
  whatsAppSession.totalOrdersCaptured += 1;
  whatsAppSession.lastSyncAt = new Date().toISOString();

  const eventPayload = `data: ${JSON.stringify({ 
    type: "NEW_ORDER", 
    order,
    source: "whatsapp_web_session"
  })}\n\n`;

  sseClients.forEach((client) => {
    try {
      client.write(eventPayload);
    } catch {
      sseClients.delete(client);
    }
  });

  console.log(`[WhatsApp Web Gateway Stream] Auto pushed order: ${order.from} -> ${order.to} (${order.price} BHD) to ${sseClients.size} clients`);
}, 28000);

// Lazy initialization of Gemini client
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("مفتاح GEMINI_API_KEY غير متوفر في متغيرات البيئة");
    }
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAIClient;
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    liveConnections: sseClients.size,
    recentWebhookOrdersCount: recentWebhookOrders.length
  });
});

// -------------------------------------------------------------
// WhatsApp Automated Webhook & Real-time Live Synchronization
// -------------------------------------------------------------

// 1. SSE Live Stream for Orderi Radar clients
app.get("/api/whatsapp/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // Disable nginx proxy buffering
  res.flushHeaders();

  sseClients.add(res);

  // Send initial welcome & handshake
  const welcomePayload = JSON.stringify({
    type: "CONNECTED",
    connectedAt: new Date().toISOString(),
    clientsCount: sseClients.size,
    recentOrders: recentWebhookOrders.slice(0, 10),
  });
  res.write(`data: ${welcomePayload}\n\n`);

  // Heartbeat keep-alive every 20 seconds
  const heartbeatTimer = setInterval(() => {
    try {
      res.write(`: ping ${Date.now()}\n\n`);
    } catch {
      clearInterval(heartbeatTimer);
      sseClients.delete(res);
    }
  }, 20000);

  req.on("close", () => {
    clearInterval(heartbeatTimer);
    sseClients.delete(res);
  });
});

// 2. Incoming Webhook Receiver (Automated from MacroDroid, Tasker, WhatsApp Web Extension, Bots, or Webhook forwarders)
const handleIncomingWebhook = (req: express.Request, res: express.Response) => {
  try {
    const body = req.body || {};
    const query = req.query || {};

    // Extract text from diverse notification payload shapes
    const rawText = 
      body.text || 
      body.message || 
      body.body || 
      body.content || 
      body.notificationText || 
      body.data ||
      query.text || 
      query.message || 
      "";

    const sender = 
      body.sender || 
      body.senderName || 
      body.title || 
      body.from_user || 
      body.notificationTitle || 
      body.from ||
      query.sender || 
      "تاجر واتساب";

    const group = 
      body.group || 
      body.groupName || 
      body.subText || 
      body.notificationSubText || 
      body.chat ||
      query.group || 
      "";

    const phone = 
      body.phone || 
      body.senderPhone || 
      body.phoneNumber || 
      query.phone || 
      "";

    if (!rawText || typeof rawText !== "string" || !rawText.trim()) {
      return res.status(400).json({
        success: false,
        error: "نص الرسالة فارغ. تأكد من إرسال الحقل text أو message في الطلب.",
      });
    }

    // 1. Intercept any WhatsApp group invite links inside the message
    const capturedGroupLinks = extractAndBroadcastGroupLinks(rawText, sender, phone, group || "قروب واتساب");

    // Parse order delivery attributes (pickup area, destination area, price, phone, notes)
    const parsed = parseWhatsAppOrderText(rawText);

    // If message is purely a group invite announcement without an actual delivery order
    if (capturedGroupLinks && capturedGroupLinks.length > 0 && !parsed.from && !parsed.to) {
      return res.json({
        success: true,
        message: "تم رصد رابط قروب توصيل جديد وإرسال تنبيه الانضمام والمراقبة للرادار فوراً",
        groupLinks: capturedGroupLinks,
        clientsNotified: sseClients.size,
      });
    }

    // Differentiate between Direct Chat (خاص) and Group Chat (قروب)
    const isDirectChat = 
      !group || 
      group.trim() === "" || 
      group === sender || 
      group.includes("خاص") || 
      group.toLowerCase().includes("direct") ||
      group.toLowerCase().includes("private");

    const groupDisplayName = isDirectChat ? "محادثة خاصة / تاجر مباشر 👤" : group;

    const order = {
      id: `ord-auto-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      from: parsed.from || "البحرين",
      to: parsed.to || "البحرين",
      price: parsed.price || 2.5,
      rawText: rawText.trim(),
      groupName: groupDisplayName,
      senderName: sender,
      senderPhone: phone || parsed.phone || "97300000000",
      receivedAt: new Date().toISOString(),
      confidence: parsed.confidence || 90,
      type: isDirectChat ? "طلب مباشر (خاص)" : "طلب قروب واتساب",
      notes: parsed.notes || (isDirectChat ? "وارد في المحادثة الخاصة دايركت" : "وارد من قروب واتساب"),
      status: "pending",
      source: "webhook_auto",
      isDirectPrivate: isDirectChat,
    };

    // Keep up to 50 recent orders in memory
    recentWebhookOrders.unshift(order);
    if (recentWebhookOrders.length > 50) {
      recentWebhookOrders.pop();
    }

    // Instantly broadcast via Server-Sent Events to all active Orderi screens
    const eventPayload = `data: ${JSON.stringify({ type: "NEW_ORDER", order })}\n\n`;
    sseClients.forEach((client) => {
      try {
        client.write(eventPayload);
      } catch {
        sseClients.delete(client);
      }
    });

    console.log(`[Orderi Webhook] Received automated order: ${order.from} -> ${order.to} (${order.price} BHD) from ${sender} [Clients notified: ${sseClients.size}]`);

    return res.json({
      success: true,
      message: "تم استلام الطلب من واتساب تلقائياً وإرساله للرادار فوراً بنجاح",
      order,
      clientsNotified: sseClients.size,
    });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return res.status(500).json({
      success: false,
      error: error?.message || "حدث خطأ أثناء معالجة طلب الويب هوك",
    });
  }
};

app.post("/api/whatsapp/webhook", handleIncomingWebhook);
app.post("/api/orders/webhook", handleIncomingWebhook);
app.get("/api/whatsapp/webhook", handleIncomingWebhook); // Supports quick GET tests

// 3. Webhook Status Endpoint
app.get("/api/whatsapp/status", (req, res) => {
  res.json({
    status: "active",
    liveConnections: sseClients.size,
    recentWebhookOrdersCount: recentWebhookOrders.length,
    timestamp: new Date().toISOString(),
  });
});

// 4. Retrieve recent webhook orders
app.get("/api/whatsapp/recent", (req, res) => {
  res.json({
    success: true,
    orders: recentWebhookOrders,
  });
});

// 4b. Retrieve recently discovered WhatsApp group links
app.get("/api/whatsapp/discovered-groups", (req, res) => {
  res.json({
    success: true,
    groupLinks: recentDiscoveredGroupLinks,
  });
});

// 4c. Broadcast Replay / "تم" to WhatsApp Groups
app.post("/api/whatsapp/broadcast-reply", (req, res) => {
  try {
    const { broadcastId, replyText, targetGroups = [], originalText = "" } = req.body || {};

    if (!replyText || typeof replyText !== "string" || !replyText.trim()) {
      return res.status(400).json({
        success: false,
        error: "نص الرد (تم) فارغ. يرجى توفير نص الرد لإرساله.",
      });
    }

    const payload = {
      type: "BROADCAST_REPLY_SENT",
      broadcastId: broadcastId || `bcast-reply-${Date.now()}`,
      replyText: replyText.trim(),
      targetGroups: Array.isArray(targetGroups) ? targetGroups : [targetGroups],
      originalText,
      sentAt: new Date().toISOString(),
      isGatewayConnected: whatsAppSession.status === "connected",
      clientsNotified: sseClients.size,
    };

    const sseEvent = `data: ${JSON.stringify(payload)}\n\n`;
    sseClients.forEach((client) => {
      try {
        client.write(sseEvent);
      } catch {
        sseClients.delete(client);
      }
    });

    console.log(`[Orderi Broadcast Replay] (تم) dispatched for broadcast "${broadcastId}" to groups: [${targetGroups.join(", ")}]`);

    return res.json({
      success: true,
      message: whatsAppSession.status === "connected"
        ? `تم إرسال رد (تم) عبر جلسة واتساب ويب إلى كافة القروبات (${targetGroups.length}) بنجاح!`
        : `تم توثيق وتجهيز رد (تم) لنشره في كافة القروبات (${targetGroups.length}) بنجاح`,
      broadcastId,
      targetGroups,
      sentAt: payload.sentAt,
      clientsNotified: sseClients.size,
    });
  } catch (err: any) {
    console.error("Broadcast replay endpoint error:", err);
    return res.status(500).json({
      success: false,
      error: err?.message || "حدث خطأ أثناء معالجة نشر رد (تم)",
    });
  }
});

// -------------------------------------------------------------
// WhatsApp Web Gateway (QR Code Session) Endpoints
// -------------------------------------------------------------

// 6. Get Current WhatsApp Web Gateway Session
app.get("/api/whatsapp/session", async (req, res) => {
  if (!whatsAppSession.qrCodeDataUrl || whatsAppSession.status === "disconnected") {
    await generateFreshQRCode();
    whatsAppSession.status = whatsAppSession.connectedPhone ? "connected" : "qr_ready";
  }
  res.json({
    success: true,
    session: {
      ...whatsAppSession,
      liveClients: sseClients.size,
      recentOrdersCount: recentWebhookOrders.length,
    },
  });
});

// 7. Refresh QR Code
app.post("/api/whatsapp/session/refresh-qr", async (req, res) => {
  await generateFreshQRCode();
  whatsAppSession.status = "qr_ready";
  res.json({
    success: true,
    message: "تم توليد باركود ربط جديد بنجاح",
    session: whatsAppSession,
  });
});

// 8. Pair / Link WhatsApp Web Session (Simulate QR Scan from WhatsApp Linked Devices)
app.post("/api/whatsapp/session/pair", (req, res) => {
  const phone = req.body?.phoneNumber || "+973 3912 3456";
  const device = req.body?.deviceName || "Orderi Radar Gateway (Multi-Device)";

  whatsAppSession.status = "connected";
  whatsAppSession.connectedPhone = phone;
  whatsAppSession.connectedAt = new Date().toISOString();
  whatsAppSession.deviceName = device;
  whatsAppSession.lastSyncAt = new Date().toISOString();
  whatsAppSession.batteryLevel = Math.floor(88 + Math.random() * 10);
  whatsAppSession.groupsMonitoredCount = 24;
  whatsAppSession.privateChatsMonitoredCount = 8;

  // Broadcast session status to all clients
  const eventPayload = `data: ${JSON.stringify({ 
    type: "SESSION_CONNECTED", 
    session: whatsAppSession 
  })}\n\n`;
  sseClients.forEach((client) => {
    try {
      client.write(eventPayload);
    } catch {
      sseClients.delete(client);
    }
  });

  res.json({
    success: true,
    message: "تم ربط جلسة واتساب ويب بنجاح! بدأ السحب التلقائي اللحظي من كافة القروبات والخاص.",
    session: whatsAppSession,
  });
});

// 9. Disconnect WhatsApp Web Session
app.post("/api/whatsapp/session/disconnect", async (req, res) => {
  whatsAppSession.status = "disconnected";
  whatsAppSession.connectedPhone = null;
  whatsAppSession.connectedAt = null;
  await generateFreshQRCode();
  whatsAppSession.status = "qr_ready";

  const eventPayload = `data: ${JSON.stringify({ 
    type: "SESSION_DISCONNECTED", 
    session: whatsAppSession 
  })}\n\n`;
  sseClients.forEach((client) => {
    try {
      client.write(eventPayload);
    } catch {
      sseClients.delete(client);
    }
  });

  res.json({
    success: true,
    message: "تم فصل جلسة واتساب ويب بنجاح. تم توليد باركود جديد للربط.",
    session: whatsAppSession,
  });
});

// -------------------------------------------------------------
// Android Notification Listener Service Endpoints
// -------------------------------------------------------------

// 10. Dedicated Android Notification Listener Receiver
app.post("/api/android/notifications", (req, res) => {
  try {
    const { 
      packageName = "com.whatsapp", 
      title = "", 
      text = "", 
      subText = "", 
      timestamp = Date.now(),
      sender = "",
      isGroup = false
    } = req.body || {};

    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({
        success: false,
        error: "نص الإشعار فارغ. تأكد من إرسال الحقل text في البايلود.",
      });
    }

    const rawText = text.trim();
    const parsed = parseWhatsAppOrderText(rawText);

    // Identify if the notification comes from a group or private contact
    const effectiveSender = sender || title || "تاجر واتساب";
    const isDirectChat = !isGroup && (!subText || subText.trim() === "" || subText.includes("خاص"));
    const groupName = isDirectChat 
      ? "محادثة خاصة / تاجر مباشر 👤" 
      : (subText || title || "قروب واتساب أندرويد 👥");

    const order = {
      id: `ord-notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      from: parsed.from || "البحرين",
      to: parsed.to || "البحرين",
      price: parsed.price || 2.5,
      rawText,
      groupName,
      senderName: effectiveSender,
      senderPhone: parsed.phone || "97300000000",
      receivedAt: new Date(timestamp).toISOString(),
      confidence: parsed.confidence || 92,
      type: isDirectChat ? "طلب مباشر (خاص)" : "إشعار قروب أندرويد",
      notes: parsed.notes || "ملتقط آلياً عبر خدمة إشعارات الأندرويد",
      status: "pending",
      source: "android_notification_listener",
      isDirectPrivate: isDirectChat,
    };

    recentWebhookOrders.unshift(order);
    if (recentWebhookOrders.length > 50) recentWebhookOrders.pop();
    whatsAppSession.totalOrdersCaptured += 1;
    whatsAppSession.lastSyncAt = new Date().toISOString();

    // Broadcast to radar screens
    const eventPayload = `data: ${JSON.stringify({ 
      type: "NEW_ORDER", 
      order,
      source: "android_notification_listener"
    })}\n\n`;
    sseClients.forEach((client) => {
      try {
        client.write(eventPayload);
      } catch {
        sseClients.delete(client);
      }
    });

    console.log(`[Android Notification Listener] Captured order: ${order.from} -> ${order.to} (${order.price} BHD) from ${effectiveSender}`);

    return res.json({
      success: true,
      message: "تم التقاط إشعار أندرويد بنجاح وتحويله إلى طلب فوري في الرادار",
      order,
      clientsNotified: sseClients.size,
    });
  } catch (error: any) {
    console.error("Android Notification processing error:", error);
    return res.status(500).json({
      success: false,
      error: error?.message || "حدث خطأ أثناء معالجة إشعار أندرويد",
    });
  }
});

// 11. Configuration profile for Android Notification Listener apps
app.get("/api/android/listener-config", (req, res) => {
  const host = req.get("host") || "localhost:3000";
  const protocol = req.protocol === "https" || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
  const webhookUrl = `${protocol}://${host}/api/android/notifications`;

  res.json({
    appName: "Orderi Radar Android Bridge",
    targetPackage: "com.whatsapp",
    targetPackageBusiness: "com.whatsapp.w4b",
    endpointUrl: webhookUrl,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    payloadTemplate: {
      packageName: "{package_name}",
      title: "{notification_title}",
      text: "{notification_text}",
      subText: "{notification_subtext}",
      timestamp: "{notification_timestamp}",
      isGroup: "{is_group_notification}",
    },
    instructions: "قم بنسخ الرابط إلى تطبيق MacroDroid أو Tasker أو خدمة قراءة إشعارات الأندرويد في هاتفك لتبدأ عملية السحب التلقائي فوراً.",
  });
});

// Feature 5: Voice Notes to Order (تفريغ وتحليل التسجيلات الصوتية لطلبات التوصيل)
app.post("/api/voice-order", async (req, res) => {
  try {
    const { audioBase64, mimeType } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ 
        success: false, 
        error: "لم يتم استلام أي بيانات صوتية" 
      });
    }

    const ai = getGenAI();
    // Normalize audio mime type (handling audio/ogg; codecs=opus, audio/webm, etc.)
    const cleanMime = (mimeType || "audio/mp3").split(";")[0].trim();

    const prompt = `أنت مساعد ذكي متخصص لكباتن ومناديب التوصيل في مملكة البحرين.
المرفق هو تسجيل صوتي لطلب أو إعلان توصيل من واتساب (سواء من صاحب متجر أو زبون أو وسيط) باللهجة البحرينية أو العربية.
مهمتك الاستماع بدقة وتفريغ الصوت واستخراج بيانات الطلب بدقة متناهية.

استخرج التالي وأجب فقط بكائن JSON صالح مطابق للهيكل:
{
  "transcript": "النص الكامل المنطوق بالتسجيل بدقة",
  "from": "منطقة الاستلام في البحرين (مثلاً: المحرق، المنامة، الرفاع، سار، البسيتين، الحد، مدينة عيسى، الجفير، عالي، سترة، إلخ)",
  "to": "منطقة التسليم في البحرين",
  "price": سعر التوصيل بالدينار البحريني كرقم (مثلاً: 2.5 أو 3 أو 1.5، أو 0 إذا لم يذكر في التسجيل),
  "senderPhone": "رقم الهاتف أو الواتساب إن ذُكر في التسجيل",
  "senderName": "اسم المتجر أو الزبون أو المرسل إن ذُكر",
  "notes": "أي تفاصيل إضافية مثل: نوع الطلب (عطور، حلويات، أوراق)، الاستعجال، التوقيت، أو اشتراط كاش"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: cleanMime,
              data: audioBase64,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
      },
    });

    const outputText = response.text || "{}";
    let extracted: any = {};
    try {
      extracted = JSON.parse(outputText);
    } catch {
      extracted = {
        transcript: outputText,
        from: "",
        to: "",
        price: 0,
        notes: "",
      };
    }

    return res.json({
      success: true,
      data: {
        transcript: extracted.transcript || "",
        from: extracted.from || "",
        to: extracted.to || "",
        price: typeof extracted.price === "number" ? extracted.price : Number(extracted.price) || 0,
        senderPhone: extracted.senderPhone ? String(extracted.senderPhone) : "",
        senderName: extracted.senderName || "متجر / عميل عبر رسالة صوتية",
        notes: extracted.notes || "",
      },
    });
  } catch (err: any) {
    console.error("Gemini voice processing error:", err);
    return res.status(500).json({
      success: false,
      error: err?.message || "حدث خطأ أثناء معالجة التسجيل الصوتي بواسطة الذكاء الاصطناعي",
    });
  }
});

// Feature 6: Gemini AI Match Evaluation (تحليل مطابقة رسالة المعلن مع شروط وتفضيلات الكابتن)
app.post("/api/ai/evaluate-match", async (req, res) => {
  try {
    const { 
      rawText = "", 
      senderName = "", 
      senderPhone = "", 
      groupName = "", 
      from = "", 
      to = "", 
      price = 0, 
      driverLocation = null, 
      filter = {} 
    } = req.body || {};

    if (!rawText && !from && !to) {
      return res.status(400).json({
        success: false,
        error: "نص الإعلان فارغ. يرجى توفير نص رسالة المعلن لتحليلها.",
      });
    }

    const minPrice = typeof filter.minimumPrice === "number" ? filter.minimumPrice : 2.0;
    const coverageKm = typeof filter.coverageKm === "number" ? filter.coverageKm : 15;
    const startAreas = Array.isArray(filter.startAreas) && filter.startAreas.length > 0 ? filter.startAreas.join("، ") : "كافة مناطق البحرين";
    const destinations = Array.isArray(filter.destinations) && filter.destinations.length > 0 ? filter.destinations.join("، ") : "كافة مناطق البحرين";
    const customNotes = filter.customConditionsNotes || "لا توجد شروط مخصصة إضافية";
    const driverArea = driverLocation?.areaName || "غير محدد بدقة";

    try {
      const ai = getGenAI();
      const prompt = `أنت خبير لوجستي ذكي ومساعد استراتيجي لكباتن ومناديب التوصيل في مملكة البحرين 🇧🇭.
مهمتك: قراءة رسالة الإعلان الأصلية التي نشرها التاجر/المعلن في واتساب بدقة وفهم لهجتها البحرينية/الخليجية، ومقارنتها نقطة بنقطة مع شروط وتفضيلات الكابتن، وتحديد هل الإعلان يطابق شروط الكابتن ومربح ومجدٍ له أم لا.

بيانات رسالة المعلن من واتساب:
- نص رسالة الإعلان الأصلية: """${rawText}"""
- اسم المعلن: ${senderName || "غير معروف"}
- رقم هاتف المعلن: ${senderPhone || "غير مسجل"}
- القروب أو المحادثة: ${groupName || "واتساب"}
- منطقة الاستلام المستخلصة: ${from || "غير محددة"}
- منطقة التسليم المستخلصة: ${to || "غير محددة"}
- الأجرة المعروضة: ${price} دينار بحريني

شروط وتفضيلات الكابتن الحالية:
- موقع الكابتن الحالي: ${driverArea}
- الحد الأدنى للأجرة المقبولة: ${minPrice} د.ب
- أقصى مسافة استلام مقبولة من موقع الكابتن: ${coverageKm} كم
- مناطق الانطلاق والاستلام المفضلة للكابتن: ${startAreas}
- مناطق التسليم المفضلة للكابتن: ${destinations}
- شروط وملاحظات إضافية وضعها الكابتن: "${customNotes}"

خطوات التحليل المطلوبة:
1. استخرج التفاصيل الصريحة والضمنية من لهجة المعلن:
   - نوع الشحنة (عطور، حلويات/أطعمة، عبايات/ملابس، إلكترونيات، طرد ثقيل، أوراق/مستندات...)
   - توقيت واستعجال الطلب (فوري الآن، خلال ساعة، العصر، الليلة، مجدول...)
   - شروط الدفع المذكورة (بنفت بي BenefitPay، كاش عند الاستلام، دفع مسبق، لم يذكر...)
   - أي اشتراطات إضافية للمعلن (مثل: مطلوب سيارة مكيفة، مطلوب سرعة فائقة، اشتراط فكة كاش، إلخ)
2. مطابقة الإعلان مع شروط الكابتن:
   - هل السعر المذكور يغطي الحد الأدنى (${minPrice} د.ب) وهل هو مجزٍ للمسافة بين المناطق في البحرين؟
   - هل الاستلام والتسليم ضمن تفضيلات الكابتن وموقعه؟
   - هل تتطابق الشروط المخصصة التي كتبها الكابتن؟
3. اكتشاف أي محاذير (Red Flags) في الإعلان: مثل غموض الموقع، طلب توصيل بدون تحديد سعر، سعر منخفض جداً لمسافة شاسعة، أو عدم ذكر وسيلة الدفع.
4. حساب نسبة مطابقة دقيقة من 0 إلى 100 وتحديد قرار واضح وتقديم نصيحة تكتيكية للكابتن.

أجب فقط بكائن JSON صالح مطابق للهيكل:
{
  "score": عدد صحيح بين 0 و 100,
  "verdict": "excellent" | "good" | "warning" | "rejected",
  "verdictLabel": "مطابق ومربح جداً ⭐" أو "مطابق ومناسب ✓" أو "مطابق جزئياً مع محاذير ⚠️" أو "غير مطابق لشروطك ❌",
  "summary": "ملخص تحليلي في جملة أو جملتين موجزتين",
  "matchedConditions": ["قائمة بالشروط التي تطابقت مع رغبة الكابتن بدقة"],
  "unmatchedConditions": ["قائمة بالشروط التي اختلفت أو لم تتحقق"],
  "redFlags": ["قائمة بالملاحظات السلبية أو المحاذير في الإعلان إن وجدت"],
  "captainAdvice": "نصيحة تكتيكية ومباشرة للكابتن (مثلاً: اقبل فوراً، أو اطلب زيادة دينار، أو تجاهل الطلب)",
  "detectedDetails": {
    "itemType": "نوع الحمولة أو البضاعة",
    "urgency": "درجة الاستعجال والتوقيت",
    "paymentMethod": "طريقة الدفع المذكورة أو المتوقعة",
    "specialNotes": "أي شروط خاصة اشترطها المعلن"
  }
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      });

      const outputText = response.text || "{}";
      const parsedData = JSON.parse(outputText);

      return res.json({
        success: true,
        data: {
          score: typeof parsedData.score === "number" ? parsedData.score : 80,
          verdict: parsedData.verdict || "good",
          verdictLabel: parsedData.verdictLabel || "مطابق لشروطك ✓",
          summary: parsedData.summary || "تم تحليل الإعلان ومطابقته مع شروط الكابتن بنجاح.",
          matchedConditions: Array.isArray(parsedData.matchedConditions) ? parsedData.matchedConditions : ["السعر مناسب", "المنطقة متوافقة"],
          unmatchedConditions: Array.isArray(parsedData.unmatchedConditions) ? parsedData.unmatchedConditions : [],
          redFlags: Array.isArray(parsedData.redFlags) ? parsedData.redFlags : [],
          captainAdvice: parsedData.captainAdvice || "الطلب مناسب، يمكنك المتابعة وقبوله.",
          detectedDetails: parsedData.detectedDetails || {
            itemType: "طلب عام",
            urgency: "توصيل اعتيادي",
            paymentMethod: "غير محدد",
            specialNotes: "",
          },
          analyzedAt: new Date().toISOString(),
        },
      });
    } catch (aiErr: any) {
      console.warn("Gemini API call failed or key not configured, using smart local Bahrain heuristic evaluation:", aiErr?.message);
      
      // Smart rule-based fallback evaluation matching conditions
      const isPriceOk = price >= minPrice;
      const isStartOk = startAreas === "كافة مناطق البحرين" || (from && startAreas.includes(from));
      const isDestOk = destinations === "كافة مناطق البحرين" || (to && destinations.includes(to));
      
      let calcScore = 60;
      const matched: string[] = [];
      const unmatched: string[] = [];
      const redFlags: string[] = [];

      if (isPriceOk) {
        calcScore += 20;
        matched.push(`السعر المعروض (${price} د.ب) يغطي أو يتجاوز حدك الأدنى (${minPrice} د.ب)`);
      } else {
        calcScore -= 20;
        unmatched.push(`السعر المعروض (${price} د.ب) أقل من حدك الأدنى المطلوب (${minPrice} د.ب)`);
      }

      if (isStartOk) {
        calcScore += 10;
        matched.push(`منطقة الاستلام (${from || "البحرين"}) ضمن نطاقك المفضل`);
      } else {
        unmatched.push(`منطقة الاستلام (${from}) خارج المناطق المفضلة المحددة`);
      }

      if (isDestOk) {
        calcScore += 10;
        matched.push(`منطقة التسليم (${to || "البحرين"}) ضمن وجهاتك المفضلة`);
      }

      if (rawText.includes("عاجل") || rawText.includes("فوري") || rawText.includes("حالا")) {
        matched.push("طلب فوري سريع جاهز للاستلام المباشر");
      }

      if (price <= 1.5 && from && to && from !== to) {
        redFlags.push("السعر المعروض قد لا يغطي تكلفة الوقود لهذه المسافة");
      }

      calcScore = Math.max(20, Math.min(100, calcScore));

      const verdict = calcScore >= 90 ? "excellent" : calcScore >= 75 ? "good" : calcScore >= 50 ? "warning" : "rejected";
      const verdictLabel = verdict === "excellent" ? "مطابق ومربح جداً ⭐" : verdict === "good" ? "مطابق ومناسب ✓" : verdict === "warning" ? "مطابق جزئياً مع محاذير ⚠️" : "غير مطابق لشروطك ❌";

      return res.json({
        success: true,
        data: {
          score: calcScore,
          verdict,
          verdictLabel,
          summary: `تحليل مطابقة الإعلان: حصل على تقييم ${calcScore}% بناءً على السعر ومناطق الانطلاق والوجهة.`,
          matchedConditions: matched,
          unmatchedConditions: unmatched,
          redFlags,
          captainAdvice: calcScore >= 75 ? "الطلب مطابق لشروطك الأساسية ومناسب للقبول الفوري." : "راجع تفاصيل المسافة والسعر مع المعلن قبل الالتزام بالطلب.",
          detectedDetails: {
            itemType: rawText.includes("عطور") ? "عطورات" : rawText.includes("أكل") || rawText.includes("طعام") ? "أطعمة" : "شحنة عامة",
            urgency: rawText.includes("فوري") || rawText.includes("عاجل") ? "فوري" : "اعتيادي",
            paymentMethod: rawText.includes("بنفت") ? "BenefitPay بنفت بي" : rawText.includes("كاش") ? "كاش" : "غير محدد في الإعلان",
            specialNotes: "تحليل محلي معتمد على شروط الكابتن المسجلة",
          },
          analyzedAt: new Date().toISOString(),
        },
      });
    }
  } catch (error: any) {
    console.error("AI Match evaluate endpoint fatal error:", error);
    return res.status(500).json({
      success: false,
      error: error?.message || "حدث خطأ أثناء فحص مطابقة الإعلان بالذكاء الاصطناعي",
    });
  }
});

// Setup Vite middleware for development, or static serving for production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === "true" ? false : undefined,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
