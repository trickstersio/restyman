export const config = {
  factory: function () {
    throw new Error('Please, configure `factory` before use it!')
  }
}

export const configure = (_config) => Object.assign(config, _config)
