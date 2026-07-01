import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Inquiry Submissions
  app.post("/api/inquire", async (req, res) => {
    try {
      const { type, payload } = req.body;
      if (!type || !payload) {
        return res.status(400).json({ error: "Incomplete request. Type and payload are required." });
      }

      const resendApiKey = process.env.RESEND_API_KEY;
      if (!resendApiKey) {
        console.warn("RESEND_API_KEY not configured. Simulating email send.");
        return res.json({ 
          success: true, 
          simulated: true, 
          message: "RESEND_API_KEY not set. Your inquiry was captured successfully in demo mode!" 
        });
      }

      const resend = new Resend(resendApiKey);

      // Determine recipient email based on department or inquiry type
      let toEmail = "";
      let subject = "";
      let htmlContent = "";

      const fromEmail = process.env.EMAIL_FROM || "onboarding@resend.dev";

      if (type === "general") {
        const { name, email, message, department } = payload;
        
        let deptName = "General / Guest Experience";
        if (department === "restaurant") {
          toEmail = process.env.EMAIL_RESTAURANT || "mombasa@tamarind.co.ke";
          deptName = "Tamarind Mombasa Restaurant";
        } else if (department === "dhow") {
          toEmail = process.env.EMAIL_DHOW || "dhow@tamarind.co.ke";
          deptName = "Tamarind Dhow Cruise";
        } else {
          toEmail = process.env.EMAIL_VILLAGE || "reservation.village@tamarind.co.ke";
          deptName = "Tamarind Village Mombasa Apartments";
        }

        subject = `[${deptName}] New Contact Message from ${name}`;
        htmlContent = `
          <div style="font-family: sans-serif; max-width: 600px; color: #1F1615; line-height: 1.5;">
            <div style="background-color: #821124; padding: 25px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-family: Georgia, serif; font-size: 24px; tracking: 0.05em;">Tamarind Mombasa</h1>
              <p style="color: #C59B27; margin: 5px 0 0 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.15em;">Guest Experience & Desk Inquiries</p>
            </div>
            <div style="padding: 30px; border: 1px solid #FAF6F0; background-color: #ffffff;">
              <h2 style="color: #821124; font-family: Georgia, serif; font-size: 18px; border-bottom: 2px solid #FAF6F0; padding-bottom: 12px; margin-top: 0;">General Inquiry Received</h2>
              
              <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 20px;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; width: 120px; color: #560A17;">Name:</td>
                  <td style="padding: 8px 0; color: #1F1615;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #560A17;">Email:</td>
                  <td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #821124; text-decoration: none; border-bottom: 1px solid #821124;">${email}</a></td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #560A17;">Department:</td>
                  <td style="padding: 8px 0; font-weight: bold; color: #821124;">${deptName}</td>
                </tr>
              </table>

              <div style="margin-top: 30px; padding: 20px; background-color: #FAF6F0; border-left: 4px solid #821124;">
                <p style="margin: 0 0 8px 0; font-weight: bold; font-size: 11px; text-transform: uppercase; tracking: 0.05em; color: #560A17;">Message Details:</p>
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #1F1615; white-space: pre-wrap;">${message}</p>
              </div>
            </div>
            <div style="background-color: #1F1615; color: #a1918a; font-size: 11px; text-align: center; padding: 15px;">
              Tamarind Mombasa • Silo Park Road, Nyali Creek, Mombasa, Kenya
            </div>
          </div>
        `;
      } else if (type === "apartment") {
        const { name, email, phone, apartmentName, checkIn, checkOut, guests, packageId, requests, totalCost } = payload;
        toEmail = process.env.EMAIL_VILLAGE || "reservation.village@tamarind.co.ke";
        subject = `[Tamarind Village] Booking Inquiry for ${apartmentName} - ${name}`;
        
        htmlContent = `
          <div style="font-family: sans-serif; max-width: 600px; color: #1F1615; line-height: 1.5;">
            <div style="background-color: #821124; padding: 25px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-family: Georgia, serif; font-size: 24px; tracking: 0.05em;">Tamarind Village Mombasa</h1>
              <p style="color: #C59B27; margin: 5px 0 0 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.15em;">Luxury Serviced Apartments</p>
            </div>
            <div style="padding: 30px; border: 1px solid #FAF6F0; background-color: #ffffff;">
              <h2 style="color: #821124; font-family: Georgia, serif; font-size: 18px; border-bottom: 2px solid #FAF6F0; padding-bottom: 12px; margin-top: 0;">Apartment Stay Proposal Inquiry</h2>
              
              <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 20px;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; width: 140px; color: #560A17;">Apartment Type:</td>
                  <td style="padding: 8px 0; color: #1F1615;"><strong>${apartmentName}</strong></td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #560A17;">Check-In Date:</td>
                  <td style="padding: 8px 0; color: #1F1615;">${checkIn || "Flexible / Not specified"}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #560A17;">Check-Out Date:</td>
                  <td style="padding: 8px 0; color: #1F1615;">${checkOut || "Flexible / Not specified"}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #560A17;">Number of Guests:</td>
                  <td style="padding: 8px 0; color: #1F1615;">${guests || 1} Guests</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #560A17;">Boarding Plan:</td>
                  <td style="padding: 8px 0; text-transform: uppercase; color: #1F1615;"><strong>${packageId || "Self Catering (RO)"}</strong></td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #560A17;">Estimated Total:</td>
                  <td style="padding: 8px 0; color: #821124; font-weight: bold; font-size: 16px;">$${totalCost || "N/A"}</td>
                </tr>
              </table>

              <h3 style="color: #821124; font-family: Georgia, serif; font-size: 16px; margin-top: 30px; border-bottom: 1px solid #FAF6F0; padding-bottom: 8px;">Lead Guest Information</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; width: 140px; color: #560A17;">Guest Name:</td>
                  <td style="padding: 8px 0; color: #1F1615;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #560A17;">Email Address:</td>
                  <td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #821124; text-decoration: none; border-bottom: 1px solid #821124;">${email}</a></td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #560A17;">Phone Number:</td>
                  <td style="padding: 8px 0; color: #1F1615;">${phone}</td>
                </tr>
              </table>

              ${requests ? `
                <div style="margin-top: 30px; padding: 20px; background-color: #FAF6F0; border-left: 4px solid #821124;">
                  <p style="margin: 0 0 8px 0; font-weight: bold; font-size: 11px; text-transform: uppercase; tracking: 0.05em; color: #560A17;">Guest Special Requests:</p>
                  <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #1F1615; white-space: pre-wrap;">${requests}</p>
                </div>
              ` : ""}
            </div>
            <div style="background-color: #1F1615; color: #a1918a; font-size: 11px; text-align: center; padding: 15px;">
              Tamarind Village Mombasa • Nyali Creek, Mombasa, Kenya
            </div>
          </div>
        `;
      } else if (type === "dining") {
        const { name, email, phone, diningName, date, time, guests, details, totalCost } = payload;
        
        const isDhow = diningName.toLowerCase().includes("dhow");
        toEmail = isDhow 
          ? (process.env.EMAIL_DHOW || "dhow@tamarind.co.ke")
          : (process.env.EMAIL_RESTAURANT || "mombasa@tamarind.co.ke");

        subject = `[${isDhow ? "Tamarind Dhow" : "Tamarind Restaurant"}] Seating / Reservation Inquiry - ${name}`;

        htmlContent = `
          <div style="font-family: sans-serif; max-width: 600px; color: #1F1615; line-height: 1.5;">
            <div style="background-color: #821124; padding: 25px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-family: Georgia, serif; font-size: 24px; tracking: 0.05em;">${isDhow ? "Tamarind Dhow Cruises" : "Tamarind Mombasa Restaurant"}</h1>
              <p style="color: #C59B27; margin: 5px 0 0 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.15em;">Luxury Seating Reservation Desk</p>
            </div>
            <div style="padding: 30px; border: 1px solid #FAF6F0; background-color: #ffffff;">
              <h2 style="color: #821124; font-family: Georgia, serif; font-size: 18px; border-bottom: 2px solid #FAF6F0; padding-bottom: 12px; margin-top: 0;">Dining Reservation Inquiry</h2>
              
              <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 20px;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; width: 140px; color: #560A17;">Dining Option:</td>
                  <td style="padding: 8px 0; color: #1F1615;"><strong>${diningName}</strong></td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #560A17;">Preferred Date:</td>
                  <td style="padding: 8px 0; color: #1F1615;">${date}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #560A17;">Preferred Time:</td>
                  <td style="padding: 8px 0; color: #1F1615;">${time}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #560A17;">Table/Deck Seats:</td>
                  <td style="padding: 8px 0; color: #1F1615;">${guests} Guests</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #560A17;">Budget Estimate:</td>
                  <td style="padding: 8px 0; color: #821124; font-weight: bold; font-size: 16px;">$${totalCost || "Custom Pricing"}</td>
                </tr>
              </table>

              <h3 style="color: #821124; font-family: Georgia, serif; font-size: 16px; margin-top: 30px; border-bottom: 1px solid #FAF6F0; padding-bottom: 8px;">Lead Guest Information</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; width: 140px; color: #560A17;">Guest Name:</td>
                  <td style="padding: 8px 0; color: #1F1615;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #560A17;">Email Address:</td>
                  <td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #821124; text-decoration: none; border-bottom: 1px solid #821124;">${email}</a></td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #560A17;">Phone Number:</td>
                  <td style="padding: 8px 0; color: #1F1615;">${phone}</td>
                </tr>
              </table>

              ${details ? `
                <div style="margin-top: 30px; padding: 20px; background-color: #FAF6F0; border-left: 4px solid #821124;">
                  <p style="margin: 0 0 8px 0; font-weight: bold; font-size: 11px; text-transform: uppercase; tracking: 0.05em; color: #560A17;">Guest Seating & Culinary Preferences:</p>
                  <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #1F1615; white-space: pre-wrap;">${details}</p>
                </div>
              ` : ""}
            </div>
            <div style="background-color: #1F1615; color: #a1918a; font-size: 11px; text-align: center; padding: 15px;">
              Tamarind Dining Service Mombasa • Nyali Creek, Kenya
            </div>
          </div>
        `;
      } else {
        return res.status(400).json({ error: "Unknown inquiry type." });
      }

      console.log(`Sending email to ${toEmail} from ${fromEmail}`);

      const emailResponse = await resend.emails.send({
        from: fromEmail,
        to: toEmail,
        subject: subject,
        html: htmlContent,
      });

      if (emailResponse.error) {
        console.error("Resend API returned error:", emailResponse.error);
        return res.status(500).json({ error: emailResponse.error.message });
      }

      return res.json({ success: true, data: emailResponse.data });
    } catch (error: any) {
      console.error("Error in /api/inquire handler:", error);
      return res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  // Serve static files in production / Vite development middleware in dev
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
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
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
