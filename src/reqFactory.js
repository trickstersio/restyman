let req = function () {
  throw new Error('Please, provide requester before use it!')
}

export const setReqFactory = (reqFactory) => {
  req = reqFactory
}

export const getReqFactory = () => req
