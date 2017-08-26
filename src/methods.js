import { createEndpoint } from './createEndpoint'
import { NAMESPACES, forOwn } from './utils'

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

export const methods = NAMESPACES.reduce((result, namespace) => {
  result[namespace] = (code) => registerMethod(namespace, code)
  return result
}, {})
