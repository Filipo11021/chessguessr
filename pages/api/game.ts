import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req:NextApiRequest, res:NextApiResponse){
 try {
  const r = await fetch("http://35.224.173.125/");
  const data = await r.json();
  if(!data) return res.status(400)
  res.status(200).json(data)
 } catch (error) {
   res.status(400)
 }
}