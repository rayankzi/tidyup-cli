const API_KEY = process.env.API_KEY;
const ENDPOINT = process.env.ENDPOINT;

export const getRecommendations = async (treeRepresentation: string) => {
  const query = `
    query {
      aIRecommendations(treeRepresentation: ${JSON.stringify(treeRepresentation)})
    }
  `

  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      query: query,
    }),
  }).then(res => res.json())

  console.log(response)
  return response
}