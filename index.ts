import { MongoClient, Db, Collection, Document } from 'mongodb'
import * as TE from 'fp-ts/TaskEither'
import * as E from 'fp-ts/Either'
import * as O from 'fp-ts/Option'
import { pipe } from 'fp-ts/lib/function'
import type { MongoError } from './error'

let _connection: O.Option<MongoClient> = O.none
let _db: O.Option<Db> = O.none

const tryConnect = (mongoUri: string, db?: string) =>
  TE.tryCatch<MongoError, MongoClient>(
    () =>
      new Promise(async (res, rej) => {
        try {
          const client = await MongoClient.connect(mongoUri)
          _connection = O.fromNullable(client)

          // try to set DB after connecting
          if (db) {
            await tryGetDb(db)()
          }

          res(client)
        } catch (e) {
          rej(e)
        }
      }),
    (e) => ({
      _type: 'ConnectionError',
      message: 'Connection error',
      details: e,
    })
  )

/**
 * Connect to MongoDB and save connection
 * @param host
 * @param user
 * @param pwd
 * @param db
 * @returns TaskEither<MongoError, MongoClient>
 */
export const connect = (
  host: string,
  user: string,
  pwd: string,
  db?: string
): TE.TaskEither<MongoError, MongoClient> =>
  pipe(
    _connection,
    O.match(() => {
      const mongoUri = `mongodb://${user}:${encodeURIComponent(pwd)}@${host}`
      return tryConnect(mongoUri, db)
    }, TE.right)
  )

/**
 * Get saved connection
 * @returns Either<MongoError, MongoClient>
 */
export const getConnection = (): E.Either<MongoError, MongoClient> =>
  pipe(
    _connection,
    O.match(
      () =>
        E.left({
          message: 'Mongo is not connected',
          _type: 'ConnectionError',
        } as MongoError),
      E.right
    )
  )

const tryGetDb = (db: string) =>
  pipe(
    getConnection(),
    TE.fromEither,
    TE.chain((client) => {
      const clientDb = client.db(db)
      _db = O.some(clientDb)
      return TE.right(clientDb)
    })
  )

/**
 * Get saved db, or connect to other db if different name is provided
 * @param dbName
 * @returns TaskEither<MongoError, Db>
 */
export const getDb = (dbName?: string): TE.TaskEither<MongoError, Db> =>
  pipe(
    _db,
    O.match(
      () =>
        dbName
          ? tryGetDb(dbName)
          : TE.left({
              _type: 'DbError',
              message: 'No db name provided',
            }),
      (db) => {
        if (dbName && db.databaseName !== dbName) {
          return tryGetDb(dbName)
        }
        return TE.right(db)
      }
    )
  )

/**
 * Get Mongo Collection
 * @param collection
 * @returns TaskEither<MongoError, Collection>
 */
export const getCollection = <SCHEMA extends Document>(
  collection: string
): TE.TaskEither<MongoError, Collection<SCHEMA>> =>
  pipe(
    getDb(),
    TE.map((db) => db.collection<SCHEMA>(collection))
  )

export type { MongoError, ConnectionError, DbError } from './error'
