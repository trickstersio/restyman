const NAMESPACES = ['collection', 'member']

export const reduceNamespaces = (reducer) => NAMESPACES.reduce(reducer, {})

export const forOwn = (obj, iteratee) => Object.keys(obj).forEach((key) => iteratee(obj[key], key))
