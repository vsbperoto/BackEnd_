-- Migration: Extend CMS functionality with blog, FAQs, reviews, pricing, and contact archives
-- Description: Adds tables required for the admin CMS expansion without modifying existing structures.

-- Blog posts
CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  excerpt text,
  content text,
  cover_image text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
  published_at timestamptz,
  scheduled_for timestamptz
);

CREATE TABLE IF NOT EXISTS blog_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS blog_post_tags (
  post_id uuid NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES blog_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- FAQs
CREATE TABLE IF NOT EXISTS faq_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  question text NOT NULL,
  answer text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true
);

-- Client reviews & feedback
CREATE TABLE IF NOT EXISTS client_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  reviewer_name text NOT NULL,
  event_name text,
  rating integer CHECK (rating BETWEEN 1 AND 5),
  content text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  display_order integer NOT NULL DEFAULT 0
);

-- Pricing packages
CREATE TABLE IF NOT EXISTS pricing_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  title text NOT NULL,
  description text,
  highlight text,
  is_featured boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS pricing_package_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES pricing_packages(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  feature text NOT NULL,
  display_order integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS pricing_package_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES pricing_packages(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  tier_name text NOT NULL,
  price_amount numeric(10,2),
  price_label text,
  display_order integer NOT NULL DEFAULT 0,
  is_featured boolean NOT NULL DEFAULT false
);

-- Contact message archive tracking
CREATE TABLE IF NOT EXISTS contact_message_archives (
  contact_id uuid PRIMARY KEY REFERENCES contacts(id) ON DELETE CASCADE,
  archived_at timestamptz NOT NULL DEFAULT now()
);

-- Enable row level security consistently
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_package_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_package_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_message_archives ENABLE ROW LEVEL SECURITY;

-- Grant full access to service role
GRANT ALL ON TABLE blog_posts TO service_role;
GRANT ALL ON TABLE blog_tags TO service_role;
GRANT ALL ON TABLE blog_post_tags TO service_role;
GRANT ALL ON TABLE faq_entries TO service_role;
GRANT ALL ON TABLE client_reviews TO service_role;
GRANT ALL ON TABLE pricing_packages TO service_role;
GRANT ALL ON TABLE pricing_package_features TO service_role;
GRANT ALL ON TABLE pricing_package_tiers TO service_role;
GRANT ALL ON TABLE contact_message_archives TO service_role;

-- Basic public read policies for published content
CREATE POLICY blog_posts_published_read ON blog_posts
  FOR SELECT
  TO public
  USING (status = 'published');

CREATE POLICY blog_tags_public_read ON blog_tags
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY faq_entries_public_read ON faq_entries
  FOR SELECT
  TO public
  USING (is_active);

CREATE POLICY client_reviews_public_read ON client_reviews
  FOR SELECT
  TO public
  USING (status = 'approved');

CREATE POLICY pricing_packages_public_read ON pricing_packages
  FOR SELECT
  TO public
  USING (is_active);

CREATE POLICY pricing_package_features_public_read ON pricing_package_features
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY pricing_package_tiers_public_read ON pricing_package_tiers
  FOR SELECT
  TO public
  USING (true);

-- Service role write policies
CREATE POLICY blog_posts_full_access ON blog_posts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY blog_tags_full_access ON blog_tags
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY blog_post_tags_full_access ON blog_post_tags
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY faq_entries_full_access ON faq_entries
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY client_reviews_full_access ON client_reviews
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY pricing_packages_full_access ON pricing_packages
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY pricing_package_features_full_access ON pricing_package_features
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY pricing_package_tiers_full_access ON pricing_package_tiers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY contact_archives_full_access ON contact_message_archives
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

