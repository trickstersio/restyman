import { createEndpoint } from './createEndpoint'
import { reduceNamespaces, forOwn } from './utils'

const config = {
  factory: function () {
    throw new Error('Please, configure `factory` before use it!')
  },
  methodsMap: {}
}

const registerMethod = (scope, code) => {
  const endpoint = createEndpoint()
  config.methodsMap[code] = { scope, endpoint }
  return endpoint
}

export const defineMethods = (instance) => {
  forOwn(config.methodsMap, ({ scope, endpoint }, code) => instance[scope](code, endpoint))
  return instance
}

export default Object.assign(config, reduceNamespaces((result, namespace) => {
  result[namespace] = (code) => registerMethod(namespace, code)
  return result
}))
