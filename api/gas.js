// ==========================================
// 🌐 Vercel Serverless Function Proxy (CORS対策)
// ==========================================
import fetch from 'node-fetch';

export default async function handler(req, res) {
  // CORSヘッダーを設定（ブラウザからの安全なアクセスを許可）
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // プリフライト（OPTIONS）リクエストには即座に200 OKを返す
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const GAS_URL = process.env.VITE_GAS_URL;
  const GAS_TOKEN = process.env.VITE_GAS_TOKEN;

  if (!GAS_URL) {
    return res.status(500).json({ status: 'error', message: 'VITE_GAS_URL is not set on Vercel' });
  }

  try {
    if (req.method === 'GET') {
      // GETリクエストの転送
      const response = await fetch(`${GAS_URL}?token=${GAS_TOKEN}`, {
        redirect: 'follow'
      });
      const text = await response.text();
      try {
        const json = JSON.parse(text);
        return res.status(response.status).json(json);
      } catch {
        return res.status(response.status).send(text);
      }
    } else if (req.method === 'POST') {
      // POSTリクエストの転送
      let bodyData;
      try {
        bodyData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      } catch (e) {
        bodyData = req.body;
      }

      // トークンを自動注入
      bodyData.token = GAS_TOKEN;

      const response = await fetch(GAS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyData),
        redirect: 'follow'
      });

      const text = await response.text();
      try {
        const json = JSON.parse(text);
        return res.status(response.status).json(json);
      } catch {
        return res.status(response.status).send(text);
      }
    } else {
      return res.status(405).json({ status: 'error', message: 'Method Not Allowed' });
    }
  } catch (error) {
    console.error('Proxy Error:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
}
