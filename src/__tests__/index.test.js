/* eslint-env jest */
import { createResource, configure, methods } from '..'
import axios from 'axios'
import moxios from 'moxios'
import fetchMock from 'fetch-mock'

const axiosFactory = (path) => axios.create({ baseURL: `/${path}` })

const fetch = fetchMock.sandbox()
const fetchFactory = (path) => (subpath, params) => fetch(`/${path}${subpath}`)

describe('restyman', () => {
  let companies, users, comments

  beforeEach(() => {
    companies = createResource({ path: 'companies' })
    users = createResource({ path: 'users', singular: 'user' })
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

    it('combines subresources correctly', () => {
      companies.subresources({ users })
      companies.subresources({ comments })

      const company = companies(1)
      expect(company.users.getPath()).toEqual('companies/1/users')
      expect(company.comments.getPath()).toEqual('companies/1/comments')
    })
  })

  describe('provider:axios', () => {
    beforeAll(() => {
      configure({
        factory: axiosFactory
      })
    })

    beforeEach(() => {
      moxios.install()
    })

    afterEach(() => {
      moxios.uninstall()
    })

    it('executes correct collection request', async () => {
      companies.collection('index')
        .request(({ req }, params = {}) => req.get('/', { params }))

      moxios.stubRequest(/\/companies.*/, { status: 200 })

      const response = await companies.index({ order: 'desc' })
      expect(response.status).toEqual(200)
      expect(response.request.url).toEqual('/companies/?order=desc')
    })

    it('executes correct member request', async () => {
      companies.member('show')
        .request(({ req }) => req.get('/'))

      moxios.stubRequest(/\/companies\/\d+\//, { status: 200 })

      const response = await companies(1).show()
      expect(response.status).toEqual(200)
      expect(response.request.url).toEqual('/companies/1/')
    })

    it('executes correct subresource collection request', async () => {
      companies.subresources({ users })
      users.collection('index')
        .request(({ req }, params = {}) => req.get('/', { params }))

      moxios.stubRequest(/\/companies\/\d+\/users.*/, { status: 200 })

      const response = await companies(1).users.index({ search: 'John' })
      expect(response.status).toEqual(200)
      expect(response.request.url).toEqual('/companies/1/users/?search=John')
    })

    it('has ability to specify different request provider for concrete resource item', async () => {
      companies.collection('index')
        .request(({ req }) => req.get('/'))

      const externalFactory = (path) => (
        axios.create({ baseURL: `http://external/${path}` })
      )

      const externalComments = createResource({
        path: 'comments',
        factory: externalFactory
      })

      externalComments.collection('index')
        .request(({ req }) => req.get('/'))

      moxios.stubRequest('/companies/', { status: 200, response: 'generalResourceResponse' })
      moxios.stubRequest('http://external/comments/', { status: 200, response: 'externalResourceResponse' })

      const general = await companies.index()
      expect(general.status).toEqual(200)
      expect(general.data).toEqual('generalResourceResponse')

      const external = await externalComments.index()
      expect(external.status).toEqual(200)
      expect(external.data).toEqual('externalResourceResponse')
    })

    it('passes constructor parameters to requester', async () => {
      const countryAttributes = {
        name: 'Russia'
      }

      const countries = createResource({
        path: 'countries',
        singular: 'country'
      })

      countries.collection('create')
        .request(({ req, singular }, attributes) => req.post('/', { [singular]: attributes }))

      moxios.stubRequest('/countries/', { status: 200 })

      const response = await countries.create(countryAttributes)
      expect(response.status).toEqual(200)

      const data = JSON.parse(response.config.data)
      expect(data).toEqual({
        country: countryAttributes
      })
    })

    it('keeps constructor parameters for subresources', async () => {
      const userAttributes = {
        name: 'John'
      }

      companies.subresources({ users })
      users.collection('create')
        .request(({ req, singular }, attributes) => req.post('/', { [singular]: attributes }))

      moxios.stubRequest(/\/companies\/\d+\/users\//, { status: 200 })

      const response = await companies(1).users.create(userAttributes)
      expect(response.status).toEqual(200)

      const data = JSON.parse(response.config.data)
      expect(data).toEqual({
        'user': userAttributes
      })
    })

    describe('context syntax', () => {
      it('registers 2 collection methods', async () => {
        const books = createResource({ path: 'books' })
        books.define(({ collection }) => {
          collection('index', ({ req }, params = {}) => req.get('/', { params }))
          collection('create', ({ req }, data = {}) => req.post('/', data))
        })

        moxios.stubRequest(/\/books.*/, { status: 200 })

        const indexResponse = await books.index({ order: 'asc' })
        expect(indexResponse.status).toEqual(200)
        expect(indexResponse.request.url).toEqual('/books/?order=asc')

        const createResponse = await books.create({ title: 'Abc' })
        expect(createResponse.status).toEqual(200)
        expect(createResponse.request.url).toEqual('/books/')
        expect(createResponse.request.config.method).toEqual('post')
      })

      it('registers 3 member methods', async () => {
        const books = createResource({ path: 'books' })
        books.define(({ member }) => {
          member('show', ({ req }) => req.get('/'))
          member('update', ({ req }, data = {}) => req.post('/', data))
          member('delete', ({ req }) => req.delete('/'))
        })

        moxios.stubRequest(/\/books.*/, { status: 200 })

        const showResponse = await books(1).show()
        expect(showResponse.status).toEqual(200)
        expect(showResponse.request.url).toEqual('/books/1/')

        const updateResponse = await books(1).update({ title: 'Abc' })
        expect(updateResponse.status).toEqual(200)
        expect(updateResponse.request.url).toEqual('/books/1/')
        expect(updateResponse.request.config.method).toEqual('post')

        const deleteResponse = await books(1).delete()
        expect(deleteResponse.status).toEqual(200)
        expect(deleteResponse.request.url).toEqual('/books/1/')
        expect(deleteResponse.request.config.method).toEqual('delete')
      })
    })

    describe('methods', () => {
      it('registers global collection method', async () => {
        methods.collection('index')
          .request(({ req }, params = {}) => req.get('/', { params }))

        const books = createResource({ path: 'books' })

        moxios.stubRequest(/\/books.*/, { status: 200 })

        const response = await books.index({ order: 'asc' })
        expect(response.status).toEqual(200)
        expect(response.request.url).toEqual('/books/?order=asc')
      })

      it('registers global member method', async () => {
        methods.member('destroy')
          .request(({ req }) => req.delete('/'))

        const books = createResource({ path: 'books' })

        moxios.stubRequest(/\/books\/\d+\//, { status: 200 })

        const response = await books(1).destroy()
        expect(response.status).toEqual(200)
        expect(response.config.method).toEqual('delete')
        expect(response.request.url).toEqual('/books/1/')
      })
    })
  })

  describe('provider:fetch', () => {
    beforeAll(() => {
      configure({
        factory: fetchFactory
      })
    })

    afterEach(() => {
      fetch.reset()
    })

    it('executes correct collection request', async () => {
      companies.collection('index')
        .request(({ req }) => req('/'))

      fetch.mock('/companies/', 200)

      const response = await companies.index()
      expect(response.status).toEqual(200)
    })

    it('executes correct member request', async () => {
      companies.member('show')
        .request(({ req }) => req('/'))

      fetch.mock(/\/companies\/\d+\/$/, 200)

      const response = await companies(1).show()
      expect(response.status).toEqual(200)
    })

    it('executes correct subresource collection request', async () => {
      companies.subresources({ users })
      users.collection('index')
        .request(({ req }) => req('/'))

      fetch.mock(/\/companies\/\d+\/users\/$/, 200)

      const response = await companies(1).users.index()
      expect(response.status).toEqual(200)
    })
  })
})
