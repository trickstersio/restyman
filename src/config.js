import { reduceNamespaces, forOwn } from './utils'

const _config = {
  factory: function () {
    throw new Error('Please, configure `factory` before use it!')
  },
  methodsMap: {},
  events: {
    'before': []
  },
  endpointMethods: {
    execute: function (...args) {
      for (let i in config.events.before) {
        const result = config.events.before[i](this)(...args)
        if (result) return result
      }

      return this.req(...args)
    },
    request: function (req) {
      this.req = req
      return this
    }
  }
}

export const createEndpoint = () => Object.assign({}, config.endpointMethods)

const registerMethod = (scope, code) => {
  const endpoint = createEndpoint()
  config.methodsMap[code] = { scope, endpoint }
  return endpoint
}

export const defineMethods = (instance) => {
  forOwn(config.methodsMap, ({ scope, endpoint }, code) => instance[scope](code, endpoint))
  return instance
}

export const config = Object.assign(_config, reduceNamespaces((result, namespace) => {
  result[namespace] = (code) => registerMethod(namespace, code)
  return result
}))
