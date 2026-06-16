# Backend

Express backend for BeatsApp. Key points:

- Start: `node index.js` (reads `.env`)
- Upload endpoint: `POST /beats/upload-audio` (form field `audio`)
- List objects: `GET /beats/list` (query `maxKeys`, `continuationToken`)
- Download object: `GET /beats/object/:key`
- Delete object: `DELETE /beats/object/:key`

Copy `.env.example` to `.env` and fill credentials.
