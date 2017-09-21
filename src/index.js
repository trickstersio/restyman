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
    execute: function () {
      for (let i in config.events.before) {
        const result = config.events.before[i](this)(...arguments)
        if (result) return result
      }

      return this.req(...arguments)
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

export const createResource = (parameters) => {
  const resources = {}
  const memberEndpoints = {}

  const collection = function (code, endpoint = createEndpoint()) {
    this[code] = _assignEndpoint(endpoint)
    return endpoint
  }

  const member = (code, endpoint = createEndpoint()) => {
    memberEndpoints[code] = endpoint
    return endpoint
  }

  const subresources = (_resources) => Object.assign(resources, _resources)

  const define = function (enhance) {
    enhance(reduceNamespaces(_definition(this)))
  }

  const _create = (path) => {
    const API = {
      collection,
      member,
      subresources,
      define,
      getPath: () => path
    }
    return Object.assign((id) => _createResource(`${path}/${id}`), API)
  }

  const _createResource = (path) => {
    const resource = createResource({ path })
    forOwn(resources, (sub, code) => {
      resource[code] = _copyWithPrefix(sub, resource.getPath())
    })
    forOwn(memberEndpoints, (endpoint, code) => {
      resource[code] = _assignEndpoint(endpoint)
    })
    return resource
  }

  const _definition = (resource) => (result, namespace) => {
    result[namespace] = (code, request) => resource[namespace](code).request(request)
    return result
  }

  const _assignEndpoint = (endpoint) => function () {
    const req = (parameters.factory || config.factory)(this.getPath())
    return endpoint.execute(Object.assign({ req }, parameters), ...arguments)
  }

  const _copyWithPrefix = function (resource, prefix) {
    const copy = _create(`${prefix}/${resource.getPath()}`)
    forOwn(resource, (v, k) => !copy[k] && (copy[k] = v))
    return copy
  }

  return defineMethods(_create(parameters.path))
}
