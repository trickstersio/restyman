export const reduceNamespaces = (reducer) => ['collection', 'member'].reduce(reducer, {})

export const forOwn = (obj, iteratee) => Object.keys(obj).forEach((key) => iteratee(obj[key], key))
