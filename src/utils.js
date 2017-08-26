export const NAMESPACES = ['collection', 'member']

export const forOwn = (obj, iteratee) => Object.keys(obj).forEach((key) => iteratee(obj[key], key))