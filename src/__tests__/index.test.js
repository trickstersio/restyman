/* eslint-env jest */
import { createResource, configure, methods } from '..'
import axios from 'axios'
import fetch from 'node-fetch'

import jsonServer from 'json-server'
import killable from 'killable'

const JSON_PORT = 30001
const EXTERNAL_JSON_PORT = 30002

const url = (path) => `http://localhost:${JSON_PORT}/${path}`
const externalUrl = (path) => `http://localhost:${EXTERNAL_JSON_PORT}/${path}`
const createServer = (port, db) => {
  const server = jsonServer.create()
  server.use(jsonServer.defaults())
  server.use(jsonServer.router(db))
  const app = server.listen(port)
  killable(app)
  return app
}

const axiosFactory = (path) => axios.create({ baseURL: url(path) })
const externalFactory = (path) => axios.create({ baseURL: externalUrl(path) })
const fetchFactory = (path) => (subpath, params) => fetch(url(`${path}${subpath}`))

describe('restyman', () => {
  let server, expernalServer, companies, users, comments

  beforeAll(() => {
    server = createServer(JSON_PORT, {
      companies: [
        { id: 1, title: 'Horns' },
        { id: 2, title: 'Hooves' }
      ],
      users: [
        { id: 1, name: 'John', companyId: 1 }
      ],
      countries: [],
      books: [
        { id: 1, title: 'Javascript Ninja' },
        { id: 2, title: 'Gone with the Wind' }
      ]
    })

    expernalServer = createServer(EXTERNAL_JSON_PORT, {
      comments: []
    })
  })

  afterAll(() => {
    server.kill()
    expernalServer.kill()
  })

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

    it('executes correct collection request', async () => {
      companies.collection('index')
        .request(({ req }, params = {}) => req.get('/', { params }))

      const { status, config } = await companies.index({ order: 'desc' })
      expect(status).toEqual(200)
      expect(config.url).toEqual(url('companies/'))
      expect(config.params).toEqual({ order: 'desc' })
    })

    it('executes correct member request', async () => {
      companies.member('show')
        .request(({ req }) => req.get('/'))

      const { status, config } = await companies(1).show()
      expect(status).toEqual(200)
      expect(config.url).toEqual(url('companies/1/'))
    })

    it('executes correct subresource collection request', async () => {
      companies.subresources({ users })
      users.collection('index')
        .request(({ req }, params = {}) => req.get('/', { params }))

      const { status, config } = await companies(1).users.index({ search: 'John' })
      expect(status).toEqual(200)
      expect(config.url).toEqual(url('companies/1/users/'))
      expect(config.params).toEqual({ search: 'John' })
    })

    it('has ability to specify different request provider for concrete resource item', async () => {
      companies.collection('index')
        .request(({ req }) => req.get('/'))

      const externalComments = createResource({
        path: 'comments',
        factory: externalFactory
      })

      externalComments.collection('index')
        .request(({ req }) => req.get('/'))

      const general = await companies.index()
      expect(general.status).toEqual(200)
      expect(general.config.url).toEqual(url('companies/'))

      const external = await externalComments.index()
      expect(external.status).toEqual(200)
      expect(external.config.url).toEqual(externalUrl('comments/'))
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

      const { status, config } = await countries.create(countryAttributes)
      expect(status).toEqual(201)
      expect(JSON.parse(config.data)).toEqual({
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

      const { status, config } = await companies(1).users.create(userAttributes)
      expect(status).toEqual(201)
      expect(JSON.parse(config.data)).toEqual({
        'user': userAttributes
      })
    })

    describe('context syntax', () => {
      describe('registers 2 collection methods', () => {
        let books

        beforeAll(() => {
          books = createResource({ path: 'books' })
          books.define(({ collection }) => {
            collection('index', ({ req }, params = {}) => req.get('/', { params }))
            collection('create', ({ req }, data = {}) => req.post('/', data))
          })
        })

        it('executes index method', async () => {
          const { status, config } = await books.index({ order: 'asc' })
          expect(status).toEqual(200)
          expect(config.url).toEqual(url('books/'))
          expect(config.params).toEqual({ order: 'asc' })
        })

        it('executes create method', async () => {
          const { status, config } = await books.create({ title: 'Abc' })
          expect(status).toEqual(201)
          expect(config.url).toEqual(url('books/'))
          expect(config.method).toEqual('post')
        })
      })

      describe('registers 3 member methods', () => {
        let books

        beforeAll(() => {
          books = createResource({ path: 'books' })
          books.define(({ member }) => {
            member('show', ({ req }) => req.get('/'))
            member('update', ({ req }, data = {}) => req.patch('/', data))
            member('destroy', ({ req }) => req.delete('/'))
          })
        })

        it('executes show method', async () => {
          const { status, config } = await books(1).show()
          expect(status).toEqual(200)
          expect(config.url).toEqual(url('books/1/'))
        })

        it('executes update method', async () => {
          const { status, config } = await books(1).update({ title: 'Abc' })
          expect(status).toEqual(200)
          expect(config.url).toEqual(url('books/1/'))
          expect(config.method).toEqual('patch')
        })

        it('executes delete method', async () => {
          const { status, config } = await books(1).destroy()
          expect(status).toEqual(200)
          expect(config.url).toEqual(url('books/1/'))
          expect(config.method).toEqual('delete')
        })
      })
    })

    describe('methods', () => {
      it('registers global collection method', async () => {
        methods.collection('index')
          .request(({ req }, params = {}) => req.get('/', { params }))

        const books = createResource({ path: 'books' })

        const { status, config } = await books.index({ order: 'asc' })
        expect(status).toEqual(200)
        expect(config.url).toEqual(url('books/'))
        expect(config.params).toEqual({ order: 'asc' })
      })

      it('registers global member method', async () => {
        methods.member('destroy')
          .request(({ req }) => req.delete('/'))

        const books = createResource({ path: 'books' })

        const { status, config } = await books(2).destroy()
        expect(status).toEqual(200)
        expect(config.url).toEqual(url('books/2/'))
        expect(config.method).toEqual('delete')
      })
    })
  })

  describe('provider:fetch', () => {
    beforeAll(() => {
      configure({
        factory: fetchFactory
      })
    })

    it('executes correct collection request', async () => {
      companies.collection('index')
        .request(({ req }) => req('/'))

      const { status } = await companies.index()
      expect(status).toEqual(200)
    })

    it('executes correct member request', async () => {
      companies.member('show')
        .request(({ req }) => req('/'))

      const response = await companies(1).show()
      expect(response.status).toEqual(200)
    })

    it('executes correct subresource collection request', async () => {
      companies.subresources({ users })
      users.collection('index')
        .request(({ req }) => req('/'))

      const response = await companies(1).users.index()
      expect(response.status).toEqual(200)
    })
  })
})
