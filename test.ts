import { pipe } from 'fp-ts/lib/function'
import { match as matchE } from 'fp-ts/lib/Either'
import { match as matchTE } from 'fp-ts/lib/TaskEither'
import test from 'tape'
import mock from 'mock-require'

const MOCK_CLIENT = 'test_client'
const MOCK_DB = 'test_db'
const MOCK_COLLECTION = 'test_collection'

mock('mongodb', {
  MongoClient: {
    connect() {
      return {
        _test: MOCK_CLIENT,
        db() {
          return {
            _test: MOCK_DB,
            collection() {
              return {
                _test: MOCK_COLLECTION,
              }
            },
          }
        },
      }
    },
  },
})

test('it should fail when no db connection is available', async (t) => {
  t.plan(3)

  const db = await import('./index')
  const { getCollection, getConnection, getDb } = db

  await pipe(
    getConnection(),
    matchE(
      (e: any) => t.equal(e._type, 'ConnectionError'),
      () => t.fail()
    )
  )

  await pipe(
    getDb(),
    matchTE(
      (e: any) => t.equal(e._type, 'DbError'),
      () => t.fail()
    ),
    (x) => x()
  )

  await pipe(
    getCollection<any>('test'),
    matchTE(
      (e: any) => t.equal(e._type, 'DbError'),
      () => t.fail()
    ),
    (x) => x()
  )
})

test('should return client when connected', async (t) => {
  t.plan(3)

  const db = await import('./index')
  const { getConnection, connect, getDb, getCollection } = db

  await pipe(connect('a', 'b', 'c'), (x) => x())

  pipe(
    getConnection(),
    matchE(
      (e) => t.fail(),
      (client: any) => t.equal(client._test, MOCK_CLIENT)
    )
  )

  await pipe(
    getDb('test'),
    matchTE(
      () => t.fail(),
      (db: any) => t.equal(db._test, MOCK_DB)
    ),
    (x) => x()
  )

  await pipe(
    getCollection('test'),
    matchTE(
      () => t.fail(),
      (coll: any) => t.equal(coll._test, MOCK_COLLECTION)
    ),
    (x) => x()
  )
})
