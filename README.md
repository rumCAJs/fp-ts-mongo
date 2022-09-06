# fp-ts Mongo

Basic fp-ts utils for mongodb

## Connect

- first you need to establish global connection with DB

```ts
import { connect, getDb } from '@polena/fp-ts-mongo'
import { pipe } from 'fp-ts/lib/function'

pipe(connect('host', 'user', 'password', 'databaseName'), (run) => run())
// or without pipe
connect('host', 'user', 'password', 'databaseName')()

// or set database separately (also for change to other db later)
pipe(connect('host', 'user', 'password'), getDb('databaseName'), (run) => run())

// just change DB
pipe(getDb('someOtherDatabase'), (run) => run())
```

## Query collection

- then you can retrieve, change or query collection

```ts
import { getCollection } from '@polena/fp-ts-mongo'
import { match } from 'fp-ts/lib/TaskEither'
import { pipe } from 'fp-ts/lib/function'

pipe(
	getCollection<TSchema>('test'),
	match(
		// e -> MongoError
		(e) => console.error(e),
		// collection -> Collection<TSchema>
		(collection) => collection.find().toArray()
	),
	(run) => run()
)
```
