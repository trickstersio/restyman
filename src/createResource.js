import { config } from './config'
import { defineMethods } from './methods'
import { createEndpoint } from './createEndpoint'
import { NAMESPACES, forOwn } from './utils'

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
    enhance(NAMESPACES.reduce(_definition(this), {}))
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
