import forEach from 'lodash/forEach'

const resourceItem = ({ id, path, subresources, instanceMethods, axiosFactory }) => {
  const resourceItemPath = `${path}/${id}`

  const resource = () => {}
  resource.getId = () => id

  const requester = axiosFactory({ path: resourceItemPath })

  forEach(subresources, (subresource, subresourceName) => {
    subresource.setPrefix(resourceItemPath)
    resource[subresourceName] = subresource
  })

  forEach(instanceMethods, (method, methodName) => {
    resource[methodName] = () => function() {
      return method(requester, ...arguments)
    }
  })

  return resource
}

export default resourceItem
