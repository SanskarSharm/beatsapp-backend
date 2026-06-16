const axios = require("axios");
const r2 = require("../R2");
const { GetObjectCommand } = require("@aws-sdk/client-s3");

async function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

async function getObject(objectKey) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.Account_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  // Try Cloudflare REST API first
  if (accountId && apiToken) {
    try {
      const response = await axios.get(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${process.env.R2_BUCKET}/objects/${objectKey}`,
        {
          headers: { Authorization: `Bearer ${apiToken}` },
          responseType: "arraybuffer",
        },
      );

      return {
        source: "cloudflare",
        buffer: Buffer.from(response.data),
        contentType:
          response.headers["content-type"] || "application/octet-stream",
      };
    } catch (err) {
      console.error(
        "Cloudflare getObject failed:",
        err.response?.status || err.message || err,
      );
    }
  }

  // Fallback to R2 (S3-compatible)
  try {
    const resp = await r2.send(
      new GetObjectCommand({ Bucket: process.env.R2_BUCKET, Key: objectKey }),
    );
    const body = resp.Body;
    const buffer = await streamToBuffer(body);
    return {
      source: "r2",
      buffer,
      contentType: resp.ContentType || "application/octet-stream",
    };
  } catch (err) {
    console.error("R2 getObject failed:", err);
    throw err;
  }
}

module.exports = getObject;
