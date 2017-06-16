/* eslint-env jest */
import createResource, { setReqFactory } from '..'
import axios from 'axios'
import moxios from 'moxios'
import fetchMock from 'fetch-mock'

describe('restyman', () => {
  let companies, users, comments

  beforeEach(() => {
    companies = createResource({ path: 'companies' })
    users = createResource({ path: 'users' })
    comments = createResource({ path: 'comments' })
  })

  it('has no request prodivers', () => {
    companies.collection('index')
      .request(({ req }, params = {}) => req.get('/', { params }))

    expect(() => companies.index()).toThrow()
  })

  describe('getPath', () => {
    it('generates correct path for collection', () => {
      expect(companies.getPath()).toEqual('companies')
    })

    it('generates correct path for member', () => {
      expect(companies(1).getPath()).toEqual('companies/1')
    })

    it('generates correct path for subresource collection', () => {
      companies.subresources({ users })

      expect(companies(1).users.getPath()).toEqual('companies/1/users')
    })

    it('generates correct path for subresource member', () => {
      companies.subresources({ users })

      expect(companies(1).users(1).getPath()).toEqual('companies/1/users/1')
    })

    it('generates correct path for several subresources', () => {
      companies.subresources({ comments })
      users.subresources({ comments })

      expect(companies(1).comments.getPath()).toEqual('companies/1/comments')
      expect(users(1).comments.getPath()).toEqual('users/1/comments')
      expect(comments.getPath()).toEqual('comments')
    })
  })

  describe('provider:axios', () => {
    beforeEach(() => {
      moxios.install()

      setReqFactory((path) => (
        axios.create({ baseURL: `/${path}` })
      ))
    })

    afterEach(() => {
      moxios.uninstall()
    })

    it('executes correct collection request', () => {
      companies.collection('index')
        .request(({ req }, params = {}) => req.get('/', { params }))

      moxios.stubRequest(/\/companies.*/, { status: 200 })

      return companies.index({ order: 'desc' })
        .then((response) => {
          expect(response.status).toEqual(200)
          expect(response.request.url).toEqual('/companies/?order=desc')
        })
    })

    it('executes correct member request', () => {
      companies.member('show')
        .request(({ req }) => req.get('/'))

      moxios.stubRequest(/\/companies\/\d+\//, { status: 200 })

      return companies(1).show()
        .then((response) => {
          expect(response.status).toEqual(200)
          expect(response.request.url).toEqual('/companies/1/')
        })
    })

    it('executes correct subresource collection request', () => {
      companies.subresources({ users })
      users.collection('index')
        .request(({ req }, params = {}) => req.get('/', { params }))

      moxios.stubRequest(/\/companies\/\d+\/users.*/, { status: 200 })

      return companies(1).users.index({ search: 'John' })
        .then((response) => {
          expect(response.status).toEqual(200)
          expect(response.request.url).toEqual('/companies/1/users/?search=John')
        })
    })
  })

  describe('provider:fetch', () => {
    let fetch

    beforeEach(() => {
      fetch = fetchMock.sandbox()

      setReqFactory((path) => (subpath, params) => (
        fetch(`/${path}${subpath}`)
      ))
    })

    afterEach(() => {
      fetch.reset()
    })

    it('executes correct collection request', () => {
      companies.collection('index')
        .request(({ req }) => req('/'))

      fetch.mock('/companies/', 200)

      return companies.index()
        .then((response) => {
          expect(response.status).toEqual(200)
        })
    })

    it('executes correct member request', () => {
      companies.member('show')
        .request(({ req }) => req('/'))

      fetch.mock(/\/companies\/\d+\//, 200)

      return companies(1).show()
        .then((response) => {
          expect(response.status).toEqual(200)
        })
    })

    it('executes correct subresource collection request', () => {
      companies.subresources({ users })
      users.collection('index')
        .request(({ req }) => req('/'))

      fetch.mock(/\/companies\/\d+\/users\//, 200)

      return companies(1).users.index()
        .then((response) => {
          expect(response.status).toEqual(200)
        })
    })
  })
})
