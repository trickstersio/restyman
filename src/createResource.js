import { getRequesterFactory } from './requesterFactory'
import createEndpoint from './createEndpoint'

const createResource = (parameters) => {
  let subresources = {}
  const memberEndpoints = {}

  const createInstance = (path) => {
    const r = (id) => {
      const resourcePath = `${path}/${id}`
      const resource = createResource({ path: resourcePath })

      for (let code in memberEndpoints) {
        resource.assignEndpoint(code, memberEndpoints[code])
      }

      for (let code in subresources) {
        resource[code] = subresources[code].copyWithPrefix(`${resourcePath}/`)
      }

      return resource
    }

    r.getPath = () => path

    r.assignEndpoint = function (code, endpoint) {
      r[code] = function () {
        const createRequester = parameters.requesterFactory || getRequesterFactory()
        const req = createRequester(this.getPath())
        return endpoint.execute({ req, ...parameters }, ...arguments)
      }
      return endpoint
    }

    r.copyWithPrefix = function (prefix) {
      const copy = createInstance(`${prefix}${this.getPath()}`)

      for (let field in this) {
        if (!copy[field]) {
          copy[field] = this[field]
        }
      }

      return copy
    }

    r.collection = function (code) {
      return this.assignEndpoint(code, createEndpoint())
    }

    r.member = (code) => {
      memberEndpoints[code] = createEndpoint()
      return memberEndpoints[code]
    }

    r.subresources = (_subresources) => {
      subresources = {
        ...subresources,
        ..._subresources
      }
    }

    return r
  }

  return createInstance(parameters.path)
}

export default createResource
