// Serves fake business websites for the end-to-end test (never real businesses).
import http from "node:http";
const year = new Date().getFullYear();
const pages = {
  "/salon/": `<html><head><title>Velvet Nail Lounge</title></head><body><table><tr><td><font>Velvet Nail Lounge</font></td></tr></table><table><tr><td>Gel manicures, pedicures and nail art in Austin.</td></tr></table><table><tr><td>Call 512-555-0142</td></tr></table><table><tr><td><a href="/salon/contact.html">Contact us</a></td></tr></table><p>© 2017 Velvet Nail Lounge</p></body></html>`,
  "/salon/contact.html": `<html><body><p>Email <a href="mailto:lisa.test@inbox-test.dev">lisa.test@inbox-test.dev</a></p></body></html>`,
  "/fitness/": `<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>Core Studio</title></head><body><main><h1>Core Studio</h1><p>Pilates and strength classes for every level with experienced coaches in a friendly studio.</p><a href="https://example.mindbodyonline.com/book">Book a class</a><a href="tel:5125550177">Call</a></main><footer>© ${year}</footer></body></html>`,
};
http
  .createServer((req, res) => {
    const body = pages[req.url ?? ""];
    res.writeHead(body ? 200 : 404, { "content-type": "text/html; charset=utf-8" });
    res.end(body ?? "not found");
  })
  .listen(8791, "127.0.0.1");
