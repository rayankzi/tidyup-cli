export const getRecommendations = async (
  treeRepresentation: string,
  additionalText: string
) => {
  const query = `
    query {
      aIRecommendations(
        treeRepresentation: ${JSON.stringify(treeRepresentation)},
        additionalText: ${JSON.stringify(additionalText)}
      )
    }
  `

  const API_KEY = process.env.API_KEY
  const ENDPOINT = process.env.ENDPOINT

  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      query: query
    })
  }).then((res) => res.json())

  return response.data.aIRecommendations as string
}
