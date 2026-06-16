-- Users

INSERT INTO users (
    full_name,
    email,
    phone,
    city,
    country
)
VALUES
(
    'Sanskar Sharma',
    'sanskar@gmail.com',
    '+919999999999',
    'Gurgaon',
    'India'
),
(
    'Amit Garg',
    'amit@gmail.com',
    '+918888888888',
    'Delhi',
    'India'
);

-- Beats

INSERT INTO beats (
    beat_name,
    genre,
    audio_url,
    status
)
VALUES (
    'The Mountain Storytelling',
    'Storytelling',
    'https://prabhmusik.com/1780414576089-the_mountain-storytelling-audio-136105.mp3',
    'published'
);