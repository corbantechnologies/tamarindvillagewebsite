import { Resend } from "resend";

export default async function handler(req: any, res: any) {
  // Only allow POST requests for the inquiry submissions
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

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
        toEmail = process.env.EMAIL_RESTAURANT || "reservations.mombasa@tamarind.co.ke";
        deptName = "Tamarind Mombasa Restaurant";
      } else if (department === "dhow") {
        toEmail = process.env.EMAIL_DHOW || "reservations.dhow@tamarind.co.ke";
        deptName = "Tamarind Dhow Cruise";
      } else {
        toEmail = process.env.EMAIL_VILLAGE || "reservations.village@tamarind.co.ke";
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
      toEmail = process.env.EMAIL_VILLAGE || "reservations.village@tamarind.co.ke";
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
        ? (process.env.EMAIL_DHOW || "reservations.dhow@tamarind.co.ke")
        : (process.env.EMAIL_RESTAURANT || "reservations.mombasa@tamarind.co.ke");

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

    console.log(`[Vercel Serverless] Sending email to ${toEmail} from ${fromEmail}`);

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

    // Try sending a confirmation copy to the inquirer (guest)
    const guestEmail = payload.email;
    const guestName = payload.name || "Valued Guest";
    if (guestEmail) {
      let guestSubject = "Inquiry Received - Tamarind Mombasa";
      let guestBodyHeader = "Thank you for contacting Tamarind Mombasa";
      let guestBodyIntro = "We have received your inquiry and our desk team is currently reviewing it. We will be in touch with you shortly to assist with your request.";
      let detailsListHtml = "";

      if (type === "general") {
        guestSubject = "Thank you for reaching out - Tamarind Mombasa";
        guestBodyHeader = "Your Inquiry is Received";
        guestBodyIntro = `Thank you for contacting our team. We have received your message regarding our hospitality services and are preparing a response for you.`;
        detailsListHtml = `
          <div style="background-color: #FAF6F0; padding: 15px; border-left: 3px solid #821124; margin: 20px 0; font-size: 13px; color: #1F1615;">
            <strong>Your Message:</strong><br/>
            <span style="font-style: italic;">"${payload.message}"</span>
          </div>
        `;
      } else if (type === "apartment") {
        guestSubject = `Apartment Stay Request Acknowledged - Tamarind Village`;
        guestBodyHeader = "Thank You for Your Stay Proposal";
        guestBodyIntro = `We are delighted that you are considering a luxurious coastal retreat at Tamarind Village Mombasa. Our reservations office has received your apartment booking proposal and is verifying availability for your preferred dates.`;
        detailsListHtml = `
          <div style="background-color: #FAF6F0; padding: 15px; border-left: 3px solid #821124; margin: 20px 0; font-size: 13px; color: #1F1615;">
            <strong>Requested Stay Details:</strong><br/>
            • <strong>Apartment Type:</strong> ${payload.apartmentName}<br/>
            • <strong>Dates:</strong> ${payload.checkIn} to ${payload.checkOut}<br/>
            • <strong>Guests:</strong> ${payload.guests || 1} Guests<br/>
            • <strong>Estimated Total:</strong> $${payload.totalCost || "N/A"}
          </div>
        `;
      } else if (type === "dining") {
        const isDhow = payload.diningName?.toLowerCase().includes("dhow");
        guestSubject = isDhow 
          ? "Reservation Inquiry Received - Tamarind Dhow Cruise" 
          : "Table Inquiry Received - Tamarind Mombasa Restaurant";
        guestBodyHeader = isDhow ? "Your Dhow Cruise Request is Under Review" : "Your Dining Request is Under Review";
        guestBodyIntro = `Thank you for choosing Tamarind for your culinary experience. We have received your seating reservation request for ${payload.diningName} and are currently checking table availability for your requested date.`;
        detailsListHtml = `
          <div style="background-color: #FAF6F0; padding: 15px; border-left: 3px solid #821124; margin: 20px 0; font-size: 13px; color: #1F1615;">
            <strong>Requested Seating Details:</strong><br/>
            • <strong>Dining Option:</strong> ${payload.diningName}<br/>
            • <strong>Preferred Date:</strong> ${payload.date} at ${payload.time}<br/>
            • <strong>Guests:</strong> ${payload.guests} Guests
          </div>
        `;
      }

      const guestHtmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; color: #1F1615; line-height: 1.5;">
          <div style="background-color: #821124; padding: 25px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-family: Georgia, serif; font-size: 22px; tracking: 0.05em;">Tamarind Mombasa</h1>
            <p style="color: #C59B27; margin: 5px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em;">coastal luxury & fine dining</p>
          </div>
          <div style="padding: 30px; border: 1px solid #FAF6F0; background-color: #ffffff;">
            <h2 style="color: #821124; font-family: Georgia, serif; font-size: 18px; border-bottom: 2px solid #FAF6F0; padding-bottom: 12px; margin-top: 0;">${guestBodyHeader}</h2>
            <p style="font-size: 14px; color: #1F1615;">Dear ${guestName},</p>
            <p style="font-size: 14px; color: #1F1615; line-height: 1.6;">${guestBodyIntro}</p>
            
            ${detailsListHtml}

            <p style="font-size: 14px; color: #1F1615; line-height: 1.6;">Please note that this is an acknowledgment of your request and not a finalized booking confirmation. A member of our dedicated guest experience desk will contact you via email or phone within 12-24 hours with your invoice, payment instructions, or further confirmation details.</p>
            
            <p style="font-size: 14px; color: #1F1615; margin-top: 30px;">Warm regards,</p>
            <p style="font-size: 14px; color: #821124; font-weight: bold; margin: 0;">Guest Experience Team</p>
            <p style="font-size: 12px; color: #7F7372; margin: 0;">Tamarind Mombasa</p>
          </div>
          <div style="background-color: #1F1615; color: #a1918a; font-size: 11px; text-align: center; padding: 15px;">
            Tamarind Mombasa • Silo Park Road, Nyali Creek, Mombasa, Kenya<br/>
            This is an automated acknowledgment. Please do not reply directly to this email.
          </div>
        </div>
      `;

      try {
        console.log(`[Vercel Serverless] Attempting to send confirmation copy to guest: ${guestEmail}`);
        await resend.emails.send({
          from: fromEmail,
          to: guestEmail,
          subject: guestSubject,
          html: guestHtmlContent,
        });
        console.log(`[Vercel Serverless] Guest confirmation email successfully sent to: ${guestEmail}`);
      } catch (guestErr: any) {
        console.warn("Failed to send copy to guest (this is expected if Resend is in Sandbox/Onboarding mode with unverified domains):", guestErr.message || guestErr);
      }
    }

    return res.status(200).json({ success: true, data: emailResponse.data });
  } catch (error: any) {
    console.error("Error in serverless api handler:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
