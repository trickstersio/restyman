import forEach from 'lodash/forEach'

const resourceItem = ({ id, path, subresources, instanceMethods, createRequester }) => {
  const resourceItemPath = `${path}/${id}`

  const resource = () => {}
  resource.getId = () => id
  resource.getPath = () => resourceItemPath
  resource.getInstanceMethods = () => instanceMethods

  const requester = createRequester({ path: resourceItemPath })

  forEach(subresources, (subresource, subresourceName) => {
    subresource.setPrefix(resourceItemPath)
    resource[subresourceName] = subresource
  })

  forEach(instanceMethods, (method, methodName) => {
    resource[methodName] = function() {
      return method(requester, ...arguments)
    }
  })

  return resource
}

export default resourceItem
