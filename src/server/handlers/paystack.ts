import { Request, Response } from "express";
import { getDb, isDbConfigured } from "../../db/db.js";
import { bookings, inquiries, auditLogs } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import { Resend } from "resend";
import fs from "fs";
import path from "path";

const DATA_STORE_PATH = path.join(process.cwd(), "data_store.json");

// ─────────────────────────────────────────────
// PAYSTACK  — Initialize payment
// ─────────────────────────────────────────────
export async function handlePaystackInitialize(req: Request, res: Response) {
  try {
    const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
    if (!PAYSTACK_SECRET) {
      return res.status(503).json({ error: "Paystack is not configured. Please contact us to complete your booking." });
    }

    const { email, amount, currency, reference, metadata } = req.body;
    if (!email || !amount) {
      return res.status(400).json({ error: "Email and amount are required." });
    }

    // Amount must be in smallest unit (kobo for NGN, cents for USD)
    // We accept USD amounts and send in cents
    const amountInCents = Math.round(Number(amount) * 100);
    const callbackUrl = process.env.PAYSTACK_CALLBACK_URL || `${req.headers.origin}/booking-confirmed`;

    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        amount: amountInCents,
        currency: currency || "USD",
        reference: reference || `TV-${Date.now()}`,
        callback_url: callbackUrl,
        metadata: metadata || {}
      })
    });

    const data = await paystackRes.json() as any;
    if (!data.status) {
      return res.status(400).json({ error: data.message || "Paystack initialization failed." });
    }

    return res.json({
      success: true,
      authorizationUrl: data.data.authorization_url,
      accessCode: data.data.access_code,
      reference: data.data.reference
    });
  } catch (err: any) {
    console.error("Paystack initialize error:", err);
    return res.status(500).json({ error: err.message });
  }
}

// ─────────────────────────────────────────────
// PAYSTACK  — Verify payment & auto-create booking
// ─────────────────────────────────────────────
export async function handlePaystackVerify(req: Request, res: Response) {
  try {
    const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
    if (!PAYSTACK_SECRET) {
      return res.status(503).json({ error: "Paystack not configured." });
    }

    const { reference } = req.params;
    if (!reference) {
      return res.status(400).json({ error: "Payment reference is required." });
    }

    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }
    });

    const data = await verifyRes.json() as any;
    if (!data.status || data.data.status !== "success") {
      return res.status(400).json({ error: "Payment verification failed or payment not successful.", data: data.data });
    }

    const txMeta = data.data.metadata || {};
    const inquiryId = txMeta.inquiryId || null;

    // Build booking record from payment metadata
    const newBooking = {
      id: "bkg_" + Date.now(),
      bookingReference: reference,
      inquiryId,
      apartmentId: txMeta.apartmentId || "unknown",
      apartmentName: txMeta.apartmentName || "Tamarind Village Suite",
      guestName: txMeta.guestName || data.data.customer?.first_name || "Guest",
      guestEmail: data.data.customer?.email || txMeta.guestEmail || "",
      guestPhone: txMeta.guestPhone || "",
      checkIn: txMeta.checkIn || "",
      checkOut: txMeta.checkOut || "",
      adults: Number(txMeta.adults) || 1,
      children: Number(txMeta.children) || 0,
      packageId: txMeta.packageId || null,
      packageName: txMeta.packageName || null,
      totalAmount: data.data.amount / 100, // convert from cents
      currency: data.data.currency || "USD",
      paymentStatus: "paid" as const,
      paymentMethod: "paystack",
      bookingStatus: "confirmed" as const,
      specialRequests: txMeta.specialRequests || null,
      staffNotes: [],
      createdAt: new Date().toISOString()
    };

    // Save booking
    if (isDbConfigured()) {
      const db = getDb();
      await db.insert(bookings).values(newBooking);

      // Update inquiry status if linked
      if (inquiryId) {
        const existing = await db.select().from(inquiries).where(eq(inquiries.id, inquiryId));
        if (existing.length > 0) {
          const currentPayload = (existing[0].payload as any) || {};
          const auditTrail = currentPayload.auditTrail || [];
          auditTrail.push({
            id: "audit_paystack_" + Date.now(),
            timestamp: new Date().toISOString(),
            actor: "system",
            actorName: "Paystack Payment Gateway",
            action: `Payment of ${data.data.currency} ${newBooking.totalAmount} confirmed. Booking ${reference} auto-created.`,
            type: "payment_confirmed"
          });
          await db.update(inquiries)
            .set({ status: "Booked", payload: { ...currentPayload, paymentStatus: "paid", paymentReference: reference, auditTrail } })
            .where(eq(inquiries.id, inquiryId));
        }
      }

      await db.insert(auditLogs).values({
        id: "log_" + Date.now(),
        timestamp: new Date().toISOString(),
        actor: "paystack",
        actorRole: "system",
        category: "Bookings",
        action: "Booking Created via Paystack",
        details: `Paystack payment ${reference} verified. Booking auto-created for ${newBooking.guestName} (${newBooking.checkIn} to ${newBooking.checkOut}).`,
        targetId: newBooking.id
      });
    } else {
      const raw = fs.readFileSync(DATA_STORE_PATH, "utf-8");
      const store = JSON.parse(raw);
      store.bookings = store.bookings || [];
      store.bookings.unshift(newBooking);
      fs.writeFileSync(DATA_STORE_PATH, JSON.stringify(store, null, 2));
    }

    // Send confirmation email to guest
    await sendBookingConfirmationEmail(newBooking);

    return res.json({ success: true, booking: newBooking });
  } catch (err: any) {
    console.error("Paystack verify error:", err);
    return res.status(500).json({ error: err.message });
  }
}

// ─────────────────────────────────────────────
// PAYSTACK  — Webhook (server-to-server event)
// ─────────────────────────────────────────────
export async function handlePaystackWebhook(req: Request, res: Response) {
  try {
    const crypto = await import("crypto");
    const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || "";
    const hash = crypto.createHmac("sha512", PAYSTACK_SECRET).update(JSON.stringify(req.body)).digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    const event = req.body;
    if (event.event === "charge.success") {
      // Re-use verify logic (idempotent)
      req.params = { reference: event.data.reference };
      return handlePaystackVerify(req, res);
    }

    return res.json({ received: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

// ─────────────────────────────────────────────
// Helper: send guest confirmation email via Resend
// ─────────────────────────────────────────────
export async function sendBookingConfirmationEmail(booking: any) {
  const RESEND_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_KEY || !booking.guestEmail) return;

  const resend = new Resend(RESEND_KEY);
  const from = process.env.EMAIL_FROM || "reservations@tamarind.co.ke";

  const nights = booking.checkIn && booking.checkOut
    ? Math.ceil((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / 86400000)
    : "—";

  try {
    await resend.emails.send({
      from,
      to: booking.guestEmail,
      subject: `Your Tamarind Village Reservation — ${booking.bookingReference}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #1F1615; background: #fdfaf7; border: 1px solid #e2d9d0; padding: 40px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #821124; font-size: 24px; letter-spacing: 2px; text-transform: uppercase; margin: 0;">Tamarind Village</h1>
            <p style="color: #8b7355; font-size: 12px; margin: 4px 0 0;">Mombasa Serviced Apartments</p>
          </div>
          <hr style="border: 1px solid #e2d9d0; margin-bottom: 32px;" />

          <h2 style="color: #1F1615; font-size: 18px; margin: 0 0 8px;">Reservation Confirmed</h2>
          <p style="color: #5a4a42; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
            Dear ${booking.guestName}, thank you for choosing Tamarind Village. Your reservation has been confirmed. Our reservations team will be in touch shortly with further details.
          </p>

          <div style="background: #f5f0eb; border-left: 4px solid #821124; padding: 20px; margin-bottom: 24px;">
            <table style="width: 100%; font-size: 13px; color: #1F1615; border-collapse: collapse;">
              <tr><td style="padding: 4px 0; color: #8b7355;">Booking Ref</td><td style="padding: 4px 0; font-weight: bold;">${booking.bookingReference}</td></tr>
              <tr><td style="padding: 4px 0; color: #8b7355;">Suite</td><td style="padding: 4px 0;">${booking.apartmentName}</td></tr>
              <tr><td style="padding: 4px 0; color: #8b7355;">Check-In</td><td style="padding: 4px 0;">${booking.checkIn}</td></tr>
              <tr><td style="padding: 4px 0; color: #8b7355;">Check-Out</td><td style="padding: 4px 0;">${booking.checkOut}</td></tr>
              <tr><td style="padding: 4px 0; color: #8b7355;">Duration</td><td style="padding: 4px 0;">${nights} night(s)</td></tr>
              <tr><td style="padding: 4px 0; color: #8b7355;">Guests</td><td style="padding: 4px 0;">${booking.adults} adult(s)${booking.children > 0 ? `, ${booking.children} child(ren)` : ""}</td></tr>
              ${booking.totalAmount ? `<tr><td style="padding: 4px 0; color: #8b7355;">Total</td><td style="padding: 4px 0; font-weight: bold;">${booking.currency || "USD"} ${Number(booking.totalAmount).toLocaleString()}</td></tr>` : ""}
              <tr><td style="padding: 4px 0; color: #8b7355;">Payment</td><td style="padding: 4px 0;">${booking.paymentStatus === "paid" ? "✓ Paid" : booking.paymentStatus === "deposit_paid" ? "Deposit Received" : "Pending"}</td></tr>
            </table>
          </div>

          ${booking.specialRequests ? `<p style="font-size: 13px; color: #5a4a42;"><strong>Your special requests:</strong> ${booking.specialRequests}</p>` : ""}

          <p style="font-size: 13px; color: #5a4a42; line-height: 1.6;">
            For any queries, please contact our Reservations Team:<br>
            📞 <a href="tel:+254711123456" style="color: #821124;">+254 711 123 456</a><br>
            ✉ <a href="mailto:reservations.village@tamarind.co.ke" style="color: #821124;">reservations.village@tamarind.co.ke</a>
          </p>

          <hr style="border: 1px solid #e2d9d0; margin-top: 32px; margin-bottom: 16px;" />
          <p style="text-align: center; font-size: 11px; color: #a09080;">Tamarind Village Mombasa | Cement Silo Rd, Old Town, Mombasa, Kenya</p>
        </div>
      `
    });
  } catch (e) {
    console.warn("Failed to send booking confirmation email:", e);
  }
}

// ─────────────────────────────────────────────
// Helper: send new-inquiry alert to reservations staff
// ─────────────────────────────────────────────
export async function sendNewInquiryAlertEmail(inquiry: any) {
  const RESEND_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_KEY) return;

  const resend = new Resend(RESEND_KEY);
  const from = process.env.EMAIL_FROM || "reservations@tamarind.co.ke";
  const to = process.env.EMAIL_VILLAGE || "reservations.village@tamarind.co.ke";
  const payload = inquiry.payload || {};

  try {
    await resend.emails.send({
      from,
      to,
      subject: `[New Inquiry] ${payload.name || "Guest"} — ${inquiry.type === "apartment" ? payload.apartmentName || "Suite" : inquiry.type}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; color: #1F1615; padding: 24px; border: 1px solid #e2d9d0;">
          <h2 style="color: #821124; font-size: 18px; margin: 0 0 16px;">New Website Inquiry</h2>
          <table style="font-size: 13px; border-collapse: collapse; width: 100%;">
            <tr><td style="padding: 6px 0; color: #8b7355; width: 140px;">Type</td><td>${inquiry.type}</td></tr>
            <tr><td style="padding: 6px 0; color: #8b7355;">Guest Name</td><td>${payload.name || "—"}</td></tr>
            <tr><td style="padding: 6px 0; color: #8b7355;">Email</td><td><a href="mailto:${payload.email}" style="color:#821124">${payload.email || "—"}</a></td></tr>
            <tr><td style="padding: 6px 0; color: #8b7355;">Phone</td><td>${payload.phone || "—"}</td></tr>
            ${payload.apartmentName ? `<tr><td style="padding: 6px 0; color: #8b7355;">Suite</td><td>${payload.apartmentName}</td></tr>` : ""}
            ${payload.checkIn ? `<tr><td style="padding: 6px 0; color: #8b7355;">Check-In</td><td>${payload.checkIn}</td></tr>` : ""}
            ${payload.checkOut ? `<tr><td style="padding: 6px 0; color: #8b7355;">Check-Out</td><td>${payload.checkOut}</td></tr>` : ""}
            ${payload.guests ? `<tr><td style="padding: 6px 0; color: #8b7355;">Guests</td><td>${payload.guests}</td></tr>` : ""}
            ${payload.requests ? `<tr><td style="padding: 6px 0; color: #8b7355;">Requests</td><td>${payload.requests}</td></tr>` : ""}
            <tr><td style="padding: 6px 0; color: #8b7355;">Received</td><td>${new Date().toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })} (EAT)</td></tr>
          </table>
          <div style="margin-top: 24px;">
            <a href="${process.env.SITE_URL || "https://tamarindvillage.co.ke"}/admin" style="background:#821124;color:#fff;padding:10px 20px;text-decoration:none;font-size:13px;font-weight:bold;">
              View in Dashboard →
            </a>
          </div>
        </div>
      `
    });
  } catch (e) {
    console.warn("Failed to send new inquiry alert email:", e);
  }
}
