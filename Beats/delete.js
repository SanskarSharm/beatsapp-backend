const axios = require("axios");
const r2 = require("../R2");
const { DeleteObjectCommand } = require("@aws-sdk/client-s3");

async function deleteObject(objectKey) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.Account_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (accountId && apiToken) {
    try {
      const response = await axios.delete(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${process.env.R2_BUCKET}/objects/${objectKey}`,
        {
          headers: { Authorization: `Bearer ${apiToken}` },
        },
      );
      return response.data;
    } catch (err) {
      console.error(
        "Cloudflare delete failed:",
        err.response?.status || err.message || err,
      );
    }
  }

  // Fallback to R2 S3-compatible delete
  try {
    await r2.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: objectKey,
      }),
    );
    return { success: true };
  } catch (err) {
    console.error("R2 delete failed:", err);
    throw err;
  }
}

module.exports = deleteObject;
