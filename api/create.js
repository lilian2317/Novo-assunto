import { Client } from "@notionhq/client";

function pageIdToNotionUrl(pageId) {
  const compact = pageId.replace(/-/g, "");
  return `https://www.notion.so/${compact}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST" });
  }

  try {
    const notion = new Client({ auth: process.env.NOTION_TOKEN });
    const databaseId = process.env.NOTION_DATABASE_ID;

    if (!databaseId) {
      return res.status(500).json({ error: "NOTION_DATABASE_ID não configurado" });
    }

    const body = req.body || {};

    const assunto = String(body.assunto || "").trim();
    const materia = String(body.materia || "").trim();
    const topico = String(body.numero_topico || "").trim();
    const site = String(body.site || "").trim();
    const livro = String(body.livro || "Olhar ainda").trim();

    if (!assunto) {
      return res.status(400).json({ error: "Assunto é obrigatório" });
    }

    const properties = {
      // Title
      Assunto: { title: [{ text: { content: assunto } }] },

      // Site como texto "Qconcursos" com link (igual Ctrl+K)
      ...(site
        ? {
            Site: {
              rich_text: [
                {
                  text: {
                    content: "Qconcursos",
                    link: { url: site }
                  }
                }
              ]
            }
          }
        : {}),

      // Número do tópico em texto
      ...(topico
        ? { "Tópico q concursos": { rich_text: [{ text: { content: topico } }] } }
        : {}),

      // Matéria em texto
      ...(materia
        ? { Matéria: { rich_text: [{ text: { content: materia } }] } }
        : {}),

      // Livro como select
      ...(livro ? { Livro: { select: { name: livro } } } : {})
    };

    const page = await notion.pages.create({
      parent: { database_id: databaseId },
      properties
    });

    return res.status(200).json({
      ok: true,
      id: page.id,
      notion_url: pageIdToNotionUrl(page.id)
    });
  } catch (err) {
    return res.status(500).json({ error: err?.message || "Erro ao criar página no Notion" });
  }
}