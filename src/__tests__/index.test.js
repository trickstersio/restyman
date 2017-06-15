/* eslint-env jest */
import axios from 'axios'
import moxios from 'moxios'
import createResource, { setAxiosFactory } from '..'

setAxiosFactory(({ path }) => (
  axios.create({
    baseURL: `/${path}`
  })
))

describe('restyman', () => {
  let companies, users

  beforeEach(() => {
    moxios.install()

    companies = createResource({ path: 'companies' })
    users = createResource({ path: 'users' })
  })

  afterEach(() => {
    moxios.uninstall()
  })

  describe('getPath', () => {
    it('generates correct path for collection', () => {
      expect(companies.getPath()).toMatchSnapshot()
    })

    it('generates correct path for member', () => {
      expect(companies(1).getPath()).toMatchSnapshot()
    })

    it('generates correct path for subresource collection', () => {
      companies.subresources({ users })

      expect(companies(1).users.getPath()).toMatchSnapshot()
    })

    it('generates correct path for subresource member', () => {
      companies.subresources({ users })

      expect(companies(1).users(1).getPath()).toMatchSnapshot()
    })

    it('keeps correct path for initial resource', () => {
      companies.subresources({ users })

      companies(1)
      expect(users.getPath()).toMatchSnapshot()
    })
  })
})
