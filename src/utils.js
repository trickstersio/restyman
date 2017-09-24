export const reduceNamespaces = (reducer) => ['collection', 'member'].reduce(reducer, {})

const definition = (resource) => (result, namespace) => {
  result[namespace] = (code, request) => resource[namespace](code).request(request)
  return result
}

export const define = function (enhance) {
  enhance(reduceNamespaces(definition(this)))
}

export const forOwn = (obj, iteratee) => Object.keys(obj).forEach((key) => iteratee(obj[key], key))
