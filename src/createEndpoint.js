export const createEndpoint = () => {
  let req = null

  const execute = function () {
    return req(...arguments)
  }

  const request = function (_req) {
    req = _req
    return this
  }

  return {
    request,
    execute
  }
}
