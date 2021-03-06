import { forOwn, define } from './utils'
import { config, defineMethods, createEndpoint } from './config'

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

  const _create = (path, blueprint) => {
    const API = {
      collection,
      member,
      subresources,
      define,
      getPath: () => path
    }
    return Object.assign((id) => _createResource(`${path}/${id}`), blueprint, API)
  }

  const _createResource = (path) => {
    const resource = createResource({ path })
    forOwn(resources, (sub, code) => {
      resource[code] = _create(`${resource.getPath()}/${sub.getPath()}`, sub)
    })
    forOwn(memberEndpoints, (endpoint, code) => {
      resource[code] = _assignEndpoint(endpoint)
    })
    return resource
  }

  const _assignEndpoint = (endpoint) => function (...args) {
    const req = (parameters.factory || config.factory)(this.getPath())
    return endpoint.execute(Object.assign({ req }, parameters), ...args)
  }

  return defineMethods(_create(parameters.path))
}
