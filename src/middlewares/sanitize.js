const xss = require("xss");

function sanitizeObject(obj) {
  if (!obj || typeof obj !== "object") return obj;
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === "string") obj[key] = xss(val);
    else if (typeof val === "object") sanitizeObject(val);
  }
}

module.exports = (req, res, next) => {
  try {
    if (req.body) sanitizeObject(req.body);
    if (req.params) sanitizeObject(req.params);
    if (req.query) sanitizeObject(req.query);
  } catch (e) {
    // don't block requests on sanitization errors
    console.error("Sanitize middleware error:", e.message);
  }
  next();
};
