-- KindredGrants Initial Schema
-- All tables prefixed with kg_ to avoid conflicts on shared Supabase project

-- Enable pgvector extension (run once per project)
CREATE EXTENSION IF NOT EXISTS vector;

-- ─── Organizations ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kg_organizations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  ein         text,
  mission     text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE kg_organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_owner_all" ON kg_organizations
  FOR ALL USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- ─── Documents ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kg_documents (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            uuid NOT NULL REFERENCES kg_organizations(id) ON DELETE CASCADE,
  filename          text NOT NULL,
  file_url          text NOT NULL,
  document_type     text NOT NULL CHECK (document_type IN ('990', 'financial', 'board_bios', 'past_grant', 'program', 'outcomes', 'other')),
  processing_status text NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'complete', 'error')),
  page_count        integer,
  uploaded_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE kg_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "doc_org_owner" ON kg_documents
  FOR ALL USING (
    org_id IN (SELECT id FROM kg_organizations WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    org_id IN (SELECT id FROM kg_organizations WHERE owner_id = auth.uid())
  );

-- ─── Chunks (pgvector) ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kg_chunks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id   uuid NOT NULL REFERENCES kg_documents(id) ON DELETE CASCADE,
  org_id        uuid NOT NULL REFERENCES kg_organizations(id) ON DELETE CASCADE,
  content       text NOT NULL,
  embedding     vector(1536),
  chunk_index   integer NOT NULL,
  metadata      jsonb NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE kg_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chunk_org_owner" ON kg_chunks
  FOR ALL USING (
    org_id IN (SELECT id FROM kg_organizations WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    org_id IN (SELECT id FROM kg_organizations WHERE owner_id = auth.uid())
  );

-- Vector similarity index
CREATE INDEX IF NOT EXISTS kg_chunks_embedding_idx
  ON kg_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ─── Grants ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kg_grants (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id               uuid NOT NULL REFERENCES kg_organizations(id) ON DELETE CASCADE,
  funder_name          text NOT NULL,
  program_name         text,
  deadline             date,
  funding_amount       numeric(12, 2),
  required_sections    jsonb NOT NULL DEFAULT '[]',
  special_instructions text,
  status               text NOT NULL DEFAULT 'drafting' CHECK (status IN ('drafting', 'review', 'complete', 'submitted')),
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE kg_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "grant_org_owner" ON kg_grants
  FOR ALL USING (
    org_id IN (SELECT id FROM kg_organizations WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    org_id IN (SELECT id FROM kg_organizations WHERE owner_id = auth.uid())
  );

-- ─── Sections ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kg_sections (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grant_id      uuid NOT NULL REFERENCES kg_grants(id) ON DELETE CASCADE,
  section_name  text NOT NULL,
  ai_draft      text,
  user_edited   text,
  word_limit    integer,
  word_count    integer,
  sources_used  jsonb NOT NULL DEFAULT '[]',
  data_gaps     jsonb NOT NULL DEFAULT '[]',
  version       integer NOT NULL DEFAULT 1,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE kg_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "section_grant_owner" ON kg_sections
  FOR ALL USING (
    grant_id IN (
      SELECT g.id FROM kg_grants g
      JOIN kg_organizations o ON g.org_id = o.id
      WHERE o.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    grant_id IN (
      SELECT g.id FROM kg_grants g
      JOIN kg_organizations o ON g.org_id = o.id
      WHERE o.owner_id = auth.uid()
    )
  );

-- ─── Subscriptions ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kg_subscriptions (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id               uuid NOT NULL REFERENCES kg_organizations(id) ON DELETE CASCADE,
  stripe_customer_id   text,
  stripe_sub_id        text,
  status               text,
  current_period_end   timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE kg_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sub_org_owner" ON kg_subscriptions
  FOR ALL USING (
    org_id IN (SELECT id FROM kg_organizations WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    org_id IN (SELECT id FROM kg_organizations WHERE owner_id = auth.uid())
  );

-- ─── Updated_at trigger ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER kg_grants_updated_at
  BEFORE UPDATE ON kg_grants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER kg_sections_updated_at
  BEFORE UPDATE ON kg_sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER kg_subscriptions_updated_at
  BEFORE UPDATE ON kg_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── pgvector similarity search function ─────────────────────────────────────
CREATE OR REPLACE FUNCTION kg_match_chunks(
  query_embedding   vector(1536),
  match_org_id      uuid,
  match_count       int DEFAULT 15,
  match_threshold   float DEFAULT 0.3
)
RETURNS TABLE (
  id          uuid,
  content     text,
  metadata    jsonb,
  document_id uuid,
  similarity  float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    c.id,
    c.content,
    c.metadata,
    c.document_id,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM kg_chunks c
  WHERE c.org_id = match_org_id
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
$$;
