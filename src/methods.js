import { createEndpoint } from './createEndpoint'
import { forOwn } from './helpers'

const methodsMap = {}

const registerMethod = (scope, code) => {
  const endpoint = createEndpoint()
  methodsMap[code] = { scope, endpoint }
  return endpoint
}

export const defineMethods = (instance) => {
  forOwn(methodsMap, ({ scope, endpoint }, code) => instance[scope](code, endpoint))
  return instance
}

export const methods = {
  collection: (code) => registerMethod('collection', code),
  member: (code) => registerMethod('member', code)
}
