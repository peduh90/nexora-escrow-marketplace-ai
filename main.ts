import { Hono } from "hono";
import { serveStatic } from "hono/deno";

const app = new Hono();

// 1) Serve anything in /assets/**
app.use("/assets/*", serveStatic({ root: "./dist/assets" }));

// 2) SPA fallback — must come BEFORE the static catch-all
//    so /admin/login, /seller, /buyer, etc. all resolve to index.html
app.get("*", serveStatic({ path: "./dist/index.html" }));

Deno.serve(app.fetch);
