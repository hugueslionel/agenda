exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GITHUB_REPO  = process.env.GITHUB_REPO;   
  const FILE_PATH    = "agenda.json"; // Cible bien le fichier agenda
  const BRANCH       = "main";

  try {
    const getRes = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}?ref=${BRANCH}`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          "User-Agent": "netlify-function",
          "Cache-Control": "no-cache"
        },
      }
    );

    if (!getRes.ok) {
      // Si le fichier n'existe pas encore sur GitHub, on renvoie une structure d'agenda vide propre
      if (getRes.status === 404) {
        return { 
          statusCode: 200, 
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ events: {}, notes: [] }) 
        };
      }
      const err = await getRes.text();
      return { statusCode: 500, body: "Erreur GitHub: " + err };
    }

    const fileData = await getRes.json();
    // Décodage du contenu Base64 envoyé par GitHub
    const jsonString = Buffer.from(fileData.content, "base64").toString("utf-8");
    
    return {
      statusCode: 200,
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate" 
      },
      body: jsonString
    };

  } catch (error) {
    return { statusCode: 500, body: error.toString() };
  }
};
