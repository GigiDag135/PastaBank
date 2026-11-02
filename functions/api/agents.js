
export async function onRequestGet({ env }) {
  try {
    const result = await env.DB.prepare(`
      SELECT id, name, role, department, status, created_at
      FROM agents
      ORDER BY
        CASE id
          WHEN 'gigi' THEN 1
          WHEN 'pepper' THEN 2
          ELSE 3
        END,
        name
    `).all();

    return Response.json(
      { success: true, agents: result.results },
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store"
        }
      }
    );
  } catch {
    return Response.json(
      { success: false, error: "Unable to load agents" },
      { status: 500 }
    );
  }
}
