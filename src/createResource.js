import { getReqFactory } from './reqFactory'
import createEndpoint from './createEndpoint'

const createResource = ({ path }) => {
  let subresources = {}
  const memberEndpoints = {}

  const createMember = (path) => {
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
        const axios = getReqFactory()(this.getPath())
        return endpoint.execute({ axios }, ...arguments)
      }
      return endpoint
    }

    r.copyWithPrefix = function (prefix) {
      const copy = createMember(`${prefix}${this.getPath()}`)

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

    r.subresources = (_subresourses) => {
      subresources = _subresourses
    }

    return r
  }

  return createMember(path)
}

export default createResource
