const axios = require("axios");
const r2 = require("../R2");
const { ListObjectsV2Command } = require("@aws-sdk/client-s3");

async function listObjects(options = {}) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.Account_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const maxKeys = options.maxKeys ? Number(options.maxKeys) : undefined;
  const continuationToken = options.continuationToken;

  // Try Cloudflare REST API first
  if (accountId && apiToken) {
    try {
      const params = {};
      if (maxKeys) params.limit = maxKeys;
      if (continuationToken) params.cursor = continuationToken;

      const response = await axios.get(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${process.env.R2_BUCKET}/objects`,
        {
          headers: { Authorization: `Bearer ${apiToken}` },
          params,
        },
      );

      const objects = response.data?.result || response.data || [];
      const items = (objects || []).map((o) => ({
        key: o.key || o.name || o.filename || o.object || o.id,
        size: o.size || o.bytes,
        lastModified: o.updated || o.created || o.lastModified,
        etag: o.etag,
      }));

      return {
        success: true,
        items,
        isTruncated:
          response.data?.result_info?.count > (maxKeys || items.length),
        nextContinuationToken: response.data?.result_info?.cursor || null,
      };
    } catch (err) {
      console.error(
        "Cloudflare REST list failed:",
        err.response?.status || err.message || err,
      );
      // fall through to S3 client
    }
  }

  // Fallback to S3-compatible client (R2)
  try {
    const params = { Bucket: process.env.R2_BUCKET };
    if (maxKeys) params.MaxKeys = maxKeys;
    if (continuationToken) params.ContinuationToken = continuationToken;

    const resp = await r2.send(new ListObjectsV2Command(params));
    const items = (resp.Contents || []).map((c) => ({
      key: c.Key,
      size: c.Size,
      lastModified: c.LastModified,
      etag: c.ETag,
    }));

    return {
      success: true,
      items,
      isTruncated: resp.IsTruncated || false,
      nextContinuationToken: resp.NextContinuationToken || null,
    };
  } catch (err) {
    console.error("R2 S3 list failed:", err);
    throw err;
  }
}

module.exports = listObjects;
