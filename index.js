'use strict'

const fs = require('fs')
const yaml = require('js-yaml').safeDump
const co = require('co')

const HOOKS = ['coverageUpload', 'lint']

module.exports = (opts) => ({
  validate: () => {
    return fs.existsSync('circle.yml')
  },

  execute: co.wrap(function * (hooks) {
    const state = {}
    for (let i of HOOKS) {
      if (hooks[i]) {
        state[i] = yield Promise.resolve(hooks[i]())
      }
    }

    const circleConfig = {
      machine: {
        node: {
          version: '4.4.0'
        }
      }
    }

    if (state.lint || state.test) {
      const testCommands = []

      if (state.lint) testCommands.push(state.lint)
      testCommands.push(state.test ? state.test : 'npm test')

      circleConfig.test = {
        override: testCommands
      }

      if (state.coverageUpload) {
        circleConfig.test.post = [
          state.coverageUpload
        ]
      }
    }

    const circleConfigYml = yaml(circleConfig)
    fs.writeFileSync('circle.yml', circleConfigYml)
  })
})
