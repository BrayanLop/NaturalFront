#!/usr/bin/env node
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const PORT = process.env.PORT || 3001;
const TARGET = process.env.CITAS_TARGET || 'https://citas-production-8755.up.railway.app';

const app = express();

app.use((req, res, next) => {
  // Optional simple logger
  console.log(`${req.method} ${req.url}`);
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization,Content-Type,Accept');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Vary', 'Origin');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use('/',
  createProxyMiddleware({
    target: TARGET,
    changeOrigin: true,
    secure: true,
    onProxyReq: (proxyReq, req, res) => {
      // The proxy forwards the request to the backend.
    },
    onProxyRes: (proxyRes, req, res) => {
      const origin = req.headers.origin || '*';
      proxyRes.headers['Access-Control-Allow-Origin'] = origin;
      proxyRes.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,PATCH,DELETE,OPTIONS';
      proxyRes.headers['Access-Control-Allow-Headers'] = 'Authorization,Content-Type,Accept';
      proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
      proxyRes.headers['Vary'] = 'Origin';
    },
    logLevel: 'info',
  })
);

app.listen(PORT, () => {
  console.log(`Citas proxy listening on http://localhost:${PORT} -> ${TARGET}`);
});
