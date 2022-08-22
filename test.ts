import { pipe } from 'fp-ts/lib/function'
import { match as matchE } from 'fp-ts/lib/Either'
import { match as matchTE } from 'fp-ts/lib/TaskEither'
import test from 'tape'
import { getCollection, getConnection, getDb } from '.'

test('it should fail when no db connection is available', (t) => {
	t.plan(3)

	pipe(
		getConnection(),
		matchE(
			(e) => t.equal(e._type, 'ConnectionError'),
			() => t.fail()
		)
	)

	pipe(
		getDb(),
		matchTE(
			(e) => t.equal(e._type, 'DbError'),
			() => t.fail()
		),
		(x) => x()
	)

	pipe(
		getCollection<any>('test'),
		matchTE(
			(e) => t.equal(e._type, 'DbError'),
			() => t.fail()
		),
		(x) => x()
	)
})
