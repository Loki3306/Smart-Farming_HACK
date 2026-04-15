-- Community Experts: schema safety + seed data
-- Applies only missing schema updates and seeds experts only when empty.

CREATE TABLE IF NOT EXISTS experts (
  id UUID PRIMARY KEY,
  farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
  is_verified BOOLEAN DEFAULT true,
  expertise_areas TEXT[] DEFAULT ARRAY[]::TEXT[],
  bio TEXT,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE experts
  ADD COLUMN IF NOT EXISTS farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE;
ALTER TABLE experts
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT true;
ALTER TABLE experts
  ADD COLUMN IF NOT EXISTS expertise_areas TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE experts
  ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE experts
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE experts
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS expert_follows (
  id UUID PRIMARY KEY,
  expert_id UUID NOT NULL REFERENCES experts(id) ON DELETE CASCADE,
  follower_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (expert_id, follower_id)
);

ALTER TABLE expert_follows
  ADD COLUMN IF NOT EXISTS expert_id UUID REFERENCES experts(id) ON DELETE CASCADE;
ALTER TABLE expert_follows
  ADD COLUMN IF NOT EXISTS follower_id UUID REFERENCES farmers(id) ON DELETE CASCADE;
ALTER TABLE expert_follows
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_experts_verified_active
  ON experts (is_verified, last_active_at DESC);

CREATE INDEX IF NOT EXISTS idx_expert_follows_expert
  ON expert_follows (expert_id);

CREATE INDEX IF NOT EXISTS idx_expert_follows_follower
  ON expert_follows (follower_id);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM experts LIMIT 1) THEN
    INSERT INTO farmers (id, name, phone, email, location, created_at, updated_at)
    VALUES
      ('11111111-1111-4111-8111-111111111111', 'Dr. Meera Kulkarni', '+919810000001', 'meera.kulkarni@smartfarming.demo', 'Nashik, Maharashtra', NOW(), NOW()),
      ('22222222-2222-4222-8222-222222222222', 'Raghav Singh', '+919810000002', 'raghav.singh@smartfarming.demo', 'Ludhiana, Punjab', NOW(), NOW()),
      ('33333333-3333-4333-8333-333333333333', 'Ananya Reddy', '+919810000003', 'ananya.reddy@smartfarming.demo', 'Warangal, Telangana', NOW(), NOW()),
      ('44444444-4444-4444-8444-444444444444', 'Vivek Patil', '+919810000004', 'vivek.patil@smartfarming.demo', 'Kolhapur, Maharashtra', NOW(), NOW()),
      ('55555555-5555-4555-8555-555555555555', 'Harpreet Kaur', '+919810000005', 'harpreet.kaur@smartfarming.demo', 'Patiala, Punjab', NOW(), NOW()),
      ('66666666-6666-4666-8666-666666666666', 'Sunita Verma', '+919810000006', 'sunita.verma@smartfarming.demo', 'Indore, Madhya Pradesh', NOW(), NOW()),
      ('77777777-7777-4777-8777-777777777777', 'Imran Shaikh', '+919810000007', 'imran.shaikh@smartfarming.demo', 'Ahmednagar, Maharashtra', NOW(), NOW()),
      ('88888888-8888-4888-8888-888888888888', 'Karthik Iyer', '+919810000008', 'karthik.iyer@smartfarming.demo', 'Coimbatore, Tamil Nadu', NOW(), NOW())
    ON CONFLICT (id) DO UPDATE
      SET name = EXCLUDED.name,
          phone = EXCLUDED.phone,
          email = EXCLUDED.email,
          location = EXCLUDED.location,
          updated_at = NOW();

    INSERT INTO experts (id, farmer_id, is_verified, expertise_areas, bio, last_active_at, created_at)
    VALUES
      ('a1111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', true, ARRAY['Grapes', 'Drip Irrigation', 'Soil Health'], '12+ years experience in vineyard irrigation planning and micronutrient balance.', NOW() - INTERVAL '2 hours', NOW()),
      ('a2222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', true, ARRAY['Wheat', 'Paddy', 'Water Scheduling'], '10+ years experience helping farmers optimize canal and borewell irrigation cycles.', NOW() - INTERVAL '6 hours', NOW()),
      ('a3333333-3333-4333-8333-333333333333', '33333333-3333-4333-8333-333333333333', true, ARRAY['Cotton', 'Pest Management', 'Fertigation'], '9+ years experience in cotton advisory and IPM based farm support.', NOW() - INTERVAL '1 day', NOW()),
      ('a4444444-4444-4444-8444-444444444444', '44444444-4444-4444-8444-444444444444', true, ARRAY['Sugarcane', 'Irrigation Automation', 'Yield Planning'], '14+ years experience in sugarcane water optimization and field automation.', NOW() - INTERVAL '3 days', NOW()),
      ('a5555555-5555-4555-8555-555555555555', '55555555-5555-4555-8555-555555555555', true, ARRAY['Dairy Fodder', 'Soil Moisture', 'Crop Rotation'], '8+ years experience in fodder planning and moisture-retention practices.', NOW() - INTERVAL '5 hours', NOW()),
      ('a6666666-6666-4666-8666-666666666666', '66666666-6666-4666-8666-666666666666', true, ARRAY['Soybean', 'Monsoon Planning', 'Nutrient Management'], '11+ years experience in rainfed soybean strategy and nutrient corrections.', NOW() - INTERVAL '12 hours', NOW()),
      ('a7777777-7777-4777-8777-777777777777', '77777777-7777-4777-8777-777777777777', true, ARRAY['Onion', 'Disease Control', 'Post-Harvest'], '7+ years experience supporting onion growers with disease prevention workflows.', NOW() - INTERVAL '2 days', NOW()),
      ('a8888888-8888-4888-8888-888888888888', '88888888-8888-4888-8888-888888888888', true, ARRAY['Banana', 'Micro-Irrigation', 'Plant Nutrition'], '13+ years experience in high-density banana cultivation and fertigation setup.', NOW() - INTERVAL '8 hours', NOW())
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;
