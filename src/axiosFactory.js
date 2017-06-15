let factory = null

export const setAxiosFactory = (axiosFactory) => {
  factory = axiosFactory
}

export const getAxiosFactory = () => factory
