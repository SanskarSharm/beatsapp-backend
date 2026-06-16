-- Users
-- Seed users (passwords are plain-text placeholders; change in production)
INSERT INTO users (name, email, mobile, password, address)
VALUES
(
    'Sanskar Sharma',
    'sanskar@gmail.com',
    '+919999999999',
    'password',
    'Gurgaon, India'
),
(
    'Amit Garg',
    'amit@gmail.com',
    '+918888888888',
    'password',
    'Delhi, India'
);

-- Seed an artist and a beat (use last_insert_rowid() for artist_id)
INSERT INTO artists (artist_name, mobile, email, address)
VALUES ('Sanskar Beats', '+911234567890', 'sanskar.artist@gmail.com', 'Gurgaon, India');

INSERT INTO beats (artist_id, beat_name, genre, audio_url, status)
VALUES (
    last_insert_rowid(),
    'The Mountain Storytelling',
    'Storytelling',
    'https://prabhmusik.com/1780414576089-the_mountain-storytelling-audio-136105.mp3',
    'published'
);