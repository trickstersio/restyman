import { createEndpoint } from './endpoint'
import { getAxiosFactory } from './axiosFactory'

const createResource = ({ path }) => {
  let axios = null
  let prefix = null
  let subresources = {}
  const memberEndpoints = {}

  const getPath = () => `${prefix}${path}`

  const createAxios = (_prefix = '') => {
    prefix = _prefix
    axios = getAxiosFactory()(getPath())
  }

  createAxios()

  const r = (id) => {
    const memberPath = `${getPath()}/${id}`
    const member = createResource({ path: memberPath })

    for (let code in memberEndpoints) {
      member.assignEndpoint(code, memberEndpoints[code])
    }

    for (let code in subresources) {
      subresources[code].createAxios(`${memberPath}/`)
      member[code] = subresources[code]
    }

    return member
  }

  r.getPath = getPath
  r.createAxios = createAxios

  r.assignEndpoint = (code, endpoint) => {
    r[code] = function () {
      return endpoint.execute({ axios }, ...arguments)
    }
    return endpoint
  }

  r.collection = (code) => {
    return r.assignEndpoint(code, createEndpoint())
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

export default createResource
