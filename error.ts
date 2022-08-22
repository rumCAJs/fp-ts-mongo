// https://dev.to/anthonyjoeseph/fp-ts-and-even-more-beautiful-api-calls-w-sum-types-53j0

export interface ConnectionError {
	_type: 'ConnectionError'
	message: string
	details?: any
}

export interface DbError {
	_type: 'DbError'
	message: string
	details?: any
}

export type MongoError = DbError | ConnectionError
