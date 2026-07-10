export default async function handler(req: any, res: any) {
  try {
    const url = "https://wis.upperbooking.com/tamarindvillage/Offers.xml?locale=en";
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 seconds timeout
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Upperbooking responded with status ${response.status}`);
    }

    const text = await response.text();
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120"); // cache on CDN for speed
    return res.status(200).send(text);
  } catch (error: any) {
    console.error("Error in proxy /api/offers handler:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
