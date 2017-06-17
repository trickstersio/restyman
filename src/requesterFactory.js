let requesterFactory = function () {
  throw new Error('Please, provide requester before use it!')
}

export const setRequesterFactory = (_requesterFactory) => {
  requesterFactory = _requesterFactory
}

export const getRequesterFactory = () => requesterFactory
