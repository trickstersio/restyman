import { createEndpoint } from './endpoint'

let axiosFactory = null
export const setAxiosFactory = (af) => {
  axiosFactory = af
}

export const createResource = ({ path }) => {
  const endpoints = {}
  const memberEndpoints = {}

  const r = (id) => {
    const member = createResource({ path: `${path}/${id}` })
    for (let code in memberEndpoints) {
      member.assignEndpoint(code, memberEndpoints[code])
    }
    return member
  }

  r.assignEndpoint = (code, endpoint) => {
    endpoints[code] = endpoint
    r[code] = function () {
      const axios = axiosFactory(path)
      return endpoints[code].execute({ axios }, ...arguments)
    }
    return endpoints[code]
  }

  r.collection = (code) => {
    return r.assignEndpoint(code, createEndpoint())
  }

  r.member = (code) => {
    memberEndpoints[code] = createEndpoint()
    return memberEndpoints[code]
  }

  return r
}
