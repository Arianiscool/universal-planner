
-- Add XP to every user
ALTER TABLE users
ADD COLUMN IF NOT EXISTS xp INTEGER NOT NULL DEFAULT 0;

-- XP earning history
CREATE TABLE IF NOT EXISTS xp_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Achievement definitions
CREATE TABLE IF NOT EXISTS achievements (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    xp_reward INTEGER NOT NULL DEFAULT 0
);

-- Achievements earned by users
CREATE TABLE IF NOT EXISTS user_achievements (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    achievement_id INTEGER REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, achievement_id)
);

-- Custom rewards created by users
CREATE TABLE IF NOT EXISTS custom_rewards (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    xp_cost INTEGER NOT NULL CHECK (xp_cost > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reward redemption history
CREATE TABLE IF NOT EXISTS reward_redemptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reward_id INTEGER REFERENCES custom_rewards(id) ON DELETE SET NULL,
    reward_title VARCHAR(150) NOT NULL,
    xp_spent INTEGER NOT NULL,
    redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
