export const fetcher = (url, config) => {
  return fetch(process.env.REACT_APP_API_URL + url, config).then(r => r.json())
}
