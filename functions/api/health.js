
export async function onRequestGet({ env }) {
  try {
    const result = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name"
    ).all();

    return Response.json({
      system: "Jeriko OS",
      status: "online",
      database: "connected",
      tables: result.results
    });
  } catch (error) {
    return Response.json({
      system: "Jeriko OS",
      status: "error",
      message: "Database connection failed"
    }, { status: 500 });
  }
}
