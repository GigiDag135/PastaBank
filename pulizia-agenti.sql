-- Da incollare nella console del database jeriko-db su Cloudflare (D1 → jeriko-db → Console).
-- Toglie gli assistenti IA esclusi dalla v1 di Jeriko.
DELETE FROM agents WHERE name IN ('Research AI', 'DevBot', 'DataAnalyst');
SELECT id, name, status FROM agents;
