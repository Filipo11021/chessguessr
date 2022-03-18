import { NextApiResponse } from "next";
import { NextApiRequest } from "next";
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(400).json({ message: "error" });

  try {
    const r = await fetch(process.env.BOT_URL as string, {
      method: "POST",
      body: JSON.stringify(req.body),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const message = await r.json();

    return res.json({ message });
  } catch (error) {
    return res.status(400).json({ message: "error" });
  }
}
