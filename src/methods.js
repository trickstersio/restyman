import { createEndpoint } from './createEndpoint'

const methodMapping = {}

const registerMethod = (scope, code) => {
  const endpoint = createEndpoint()
  methodMapping[code] = { scope, endpoint }
  return endpoint
}

export const defineMethods = (instance) => {
  for (let code in methodMapping) {
    const { scope, endpoint } = methodMapping[code]
    instance[scope](code, endpoint)
  }
}

export const methods = {
  collection: (code) => registerMethod('collection', code),
  member: (code) => registerMethod('member', code)
}
