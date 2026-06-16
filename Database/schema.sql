-- =========================
-- USERS
-- =========================

DROP TABLE IF EXISTS beat_purchases;
DROP TABLE IF EXISTS beats;
DROP TABLE IF EXISTS artists;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    name TEXT NOT NULL,
    mobile TEXT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,

    address TEXT,

    beats_buy INTEGER DEFAULT 0,

    user_created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_purchase_date DATETIME,
    last_login_time DATETIME
);

-- =========================
-- ARTISTS
-- =========================

CREATE TABLE artists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    artist_name TEXT NOT NULL,
    mobile TEXT,
    email TEXT UNIQUE,

    address TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- BEATS
-- =========================

CREATE TABLE beats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    artist_id INTEGER NOT NULL,

    beat_name TEXT NOT NULL,
    beat_type TEXT,

    price REAL DEFAULT 0,

    genre TEXT,
    bpm INTEGER,

    description TEXT,

    audio_url TEXT NOT NULL,

    cover_image_url TEXT,
    banner_image_url TEXT,

    duration INTEGER,

    track_type TEXT,
    mood TEXT,

    selling_status TEXT DEFAULT 'available',

    status TEXT DEFAULT 'draft',

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (artist_id)
    REFERENCES artists(id)
);

-- =========================
-- PURCHASES
-- =========================

CREATE TABLE beat_purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL,
    beat_id INTEGER NOT NULL,

    purchase_price REAL,

    purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(user_id)
    REFERENCES users(id),

    FOREIGN KEY(beat_id)
    REFERENCES beats(id)
);