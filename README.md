[![build status](https://travis-ci.org/bowheart/trikl.svg?branch=master)](https://travis-ci.org/bowheart/trikl)
[![Test Coverage](https://codeclimate.com/github/bowheart/trikl/badges/coverage.svg)](https://codeclimate.com/github/bowheart/trikl/coverage)
[![Issue Count](https://img.shields.io/codeclimate/issues/github/bowheart/trikl.svg)](https://codeclimate.com/github/bowheart/trikl/issues)
[![Code Climate](https://codeclimate.com/github/bowheart/trikl/badges/gpa.svg)](https://codeclimate.com/github/bowheart/trikl)
[![npm](https://img.shields.io/npm/v/trikl.svg)](https://www.npmjs.com/package/trikl)
[![npm](https://img.shields.io/npm/dt/trikl.svg)](https://www.npmjs.com/package/trikl)

# Trikl

Creating callback heaven. Trikl provides a simplified promise chain api, allowing you to callback and callforth with reckless abandon.

## Installation

Install using npm:

```bash
npm install trikl
```

## Usage

```javascript
const trikl = require('trikl')
```

## The Basics

```javascript
let trickle = trikl()
    .drop(drip => drip())
    .drop(drip => drip())
```

This illustrates the basic trickle flow. Let's break it down:

- `trikl()` &ndash; creates a new chain (a "trickle").

- `trickle.drop()` &ndash; adds a "drop" to the trickle. A drop is just a function whose execution is delayed until a previous drop tells it to go ahead. The first drop in the chain is run automatically by default.

- `drip` &ndash; the first argument that Trikl passes to every drop. Calling this will pass execution on to the next drop in the chain.

Simple enough. Let's bite off a bit more:

```javascript
let trickle = trikl(drip => drip(1))
    .drop((drip, val) => drip(val + 1))
    .drop((drip, val) => drip(val + 1))

trickle.then(result => {
    console.log(result) // <- logs "3"
})
```

Not too bad. Let's dig into this one:

- `trikl(drop)` &ndash; you can optionally pass drops right to the `trikl()` factory.

- `drip(args)` &ndash; anything you pass to `drip()` will be passed along as arguments to the next drop in the chain. Calling `drip()` in the last drop in the chain resolves the underlying promise.

> *Wait, what promise?* &ndash; Every trickle creates a promise chain internally. The first promise in the chain can be accessed via `trickle.promise` and resolved and rejected with `trickle.resolve()` and `trickle.reject()` respectively.

- `trickle.then()` &ndash; calls `then()` on the underlying promise, but returns the trickle for chaining. The usage is therefore exactly the same as [Promise.prototype.then()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/then).

Yep, you can add links to the underlying promise chain via `trickle.then()` and `trickle.catch()` respectively. Since Trikl exposes `then` and `catch` methods, most code that expects a promise can receive a trickle instead.

And that does it for the basics. You can now use Trikl like a pro (basically)! But that isn't everything. Read through the Method API and the more in-depth examples for real pro status.

## API

#### `trikl()`

The default factory for creating trickles. Accepts zero or more drops as arguments.

```javascript
let trickle = trikl()
```

```javascript
let trickle = trikl(drop1, drop2)
```

#### trickles

These properties and methods are available on trickles.

##### `trickle.promise`

A reference to the underlying promise &ndash; the first promise in the underlying promise chain.

##### `trickle.lastPromise`

A reference to the last promise in the underlying promise chain.

##### `trickle.then()`

Attach onFulfilled handlers to the last promise in the underlying promise chain. Can, of course, add onRejected handlers too, but prefer `trickle.catch()` for that. Adds a new promise to the underlying promise chain and points the `trickle.lastPromise` property to it. Returns the trickle for chaining.

```javascript
let trickle = trikl()

// This adds a second promise to the underlying promise chain.
    .then(result => result)

// This adds a third promise to the underlying promise chain.
// It will not be resolved until the second promise in the chain resolves it.
    .then(result => result)

// Note:
trickle.then(() => {})
// is equivalent to
trickle.lastPromise = trickle.lastPromise.then(() => {})
```

##### `trickle.catch()`

Attach onRejected handlers to the last promise in the underlying promise chain. Adds a new promise to the underlying promise chain and points the `trickle.lastPromise` property it. Returns the trickle for chaining.

```javascript
trickle.catch(() => {})
// is equivalent to
trickle.lastPromise = trickle.lastPromise.catch(() => {})
```

##### `trickle.resolve()`

Resolve the underlying promise (the first one in the underlying promise chain). This starts the chain unraveling. Calling `trickle.drip()` in the last drop in the trickle will call this automatically (unless it's called with an instance of `Error`, in which case, `trickle.reject()` will be called).

```javascript
trikl()
    .then(result => result + 1)
    .then(result => {
        console.log(result) // logs "2"
    })
    .resolve(1)
```

##### `trickle.reject()`

Reject the underlying promise (the first one in the underlying promise chain). This starts the chain unraveling. Calling `trickle.drip()` with an instance of `Error` in the last drop in the trickle will call this automatically. Throwing anything in any drops will also make Trikl call this automatically.

```javascript
trikl()
    .then(result => console.log('fulfilled'))
    .catch(result => console.log('rejected'))
    .reject() // hits the 'onRejected' handler
```

> Note: `trickle.resolve()` and `trickle.reject()` do not stop the trickle! If there are more drops, they'll keep on dripping. For this reason, you'll typically use `trickle.drip.stop()` instead of calling these directly.

##### `trickle.drop()`

Add drops modularly to a trickle. Signature is the same as the `trikl()` factory itself; zero or more drops may be specified.

```javascript
let trickle = trikl()
    .drop(drip => drip(), drip => drip()) // add two drops
    .drop(drip => {
        // Oh! We discovered that we have to do another task. Add it to the list.
        trickle.drop(drip => drip())
        drip()
    })
```

> Note: If we had called `drip()` in that last drop before adding the new task, it would have resolved the underlying promise, as Trikl would have detected that it was the last drop in the chain.

##### `trickle.drip()`

Drip to the next drop in the trickle. Any arguments will be passed to the target drop. By default, all drops will receive a reference to this function as their first argument. Typically, Trikl will call this automatically for the first drop in every trickle (to get the ball rolling). Then each drop will typically contain exactly one call to `trickle.drip()` to pass execution on to the next drop in line once it's finished doing its thing. Calling this after all drops are done (usually from within the last drop) is equivalent to calling `trickle.drip.stop()`.

```javascript
let trickle = trikl()

// `trickle.drip()` is the first argument of drops by default.
    .drop(drip => drip('one', 'two'))

// The last drop passed `val1` and `val2` to this guy.
    .drop((drip, val1, val2) => drip(val1 + val2))

// That last call to `trickle.drip()` resolved the underlying promise.
    .then(result => {
        console.log(result) // logs "onetwo"
    })
```

##### `trickle.drip.skip()`

Skip one or more drops. Returns a modified version of `trickle.drip()` that, when called (if called), removes the specified number of drops from the remaining drops in the chain. If this results in the last drop being removed, or there are no drops to remove, then this is equivalent to calling `trickle.drip.stop()`.

```javascript
trikl(drip => drip())
    .drop(drip => {
        drip.skip(2)('better')
    })
    .drop(drip => drip()) // will be skipped
    .drop(drip => drip('meh')) // will be skipped
    .drop((drip, val) => drip(`I got a ${val} value!`))
    .then(result => {
        console.log(result) // <- logs "I got a better value!"
    })
```

##### `trickle.drip.stop()`

Stop the trickle and resolve or reject the underlying promise. Accepts one argument. If that argument is an instance of `Error` (`ReferenceError`, `TypeError`, etc), the underlying promise is rejected with the argument as the reason. Otherwise, it's resolved with the argument as the result.

```javascript
trikl(drip => drip())
    .drop(drip => {
        drip.stop("actually, we're done early")
    })
    .drop(drip => drip("finally done")) // never runs
    .then(result => {
        console.log(result) // <- logs "actually, we're done early"
    })
```

##### `trickle.dropArgs`

A reference to the list of arguments passed to the last-called drop. Can be used for an alternative workflow.

```javascript
let trickle = trikl(drip => drip(1))
    .drop(drip => {
        let [val] = trickle.dropArgs
        drip(val + 1, val)
    })
    .drop(drip => {
        let [originalVal, newVal] = trickle.dropArgs
        drip(newVal + 1)
    })
```

##### `trickle.drops`

A reference to this trickle's array of drops. Exposed for fine-grained control. Use with caution! Typically you'll use this as a read-only value (e.g. to see how many tasks are remaining in the trickle). Prefer `trickle.drip.skip()` and `trickle.drip.stop()` when those suit your needs. But sometimes you need to add/remove a drop to/from the middle or end of the list:

```javascript
let trickle = trikl(drip => {
    // Oh! We discovered that we no longer need the last task. Kill it.
    trickle.drops.pop()
    drip('a')
}).drop((drip, val) => {
    drip(val + 'b')
}).drop((drip, val) => {
    drip(val + 'c')
})

trickle.then(result => {
    console.log(result) // <- logs "ab"
})
```

#### Flags

These flags will create a whole new trickle factory that will create specific types of trickles. They are completely inter-compatible and can be mixed and combined in any order.

##### `trikl.pure`

Creates a factory for creating pure trickles. The drops of pure trickles will not receive `trickle.drip()` as an argument. Instead, the drops must maintain a reference to their trickle and call `trickle.drip()` directly. This makes the drop function signatures simpler and potentially easier to read.

```javascript
const trikl = require('trikl').pure

let trickle = trikl(() => trickle.drip(2))
    .drop(val => trickle.drip(val * 2))
    .drop(val => trickle.drip(val * 3))
    .then(result => {
        console.log(result) // <- logs "12"
        return result
    })
```

##### `trikl.halt`

Creates a factory for creating halted trickles. A halted trickle will not start dripping automatically. Instead, it will wait until you call `trickle.drip()` manually. Useful for packaging operations together for later use, e.g. for build processes:

```javascript
const trikl = require('trikl').halt
const APP_DIR = 'app'

function getBuildProcess() {
    return trikl(findFiles, runBabel, uglify, writeFiles)
}

getBuildProcess().drip(APP_DIR)
```

Note that with this flag, arguments can be passed to the first drop. Can also be used to force a trickle to begin dripping immediately. This shaves off some time, since trickles normally wait until the end of the current turn of the event loop (via calling `setTimeout`) to start dripping. This flag is required to make synchronous trickles.

## Examples

**Example One** &ndash; Using `drip()` asynchronously.

```javascript
trikl(drip => {
    setTimeout(drip)
}).drop(drip => {
    let val = 'some-val'
    setTimeout(drip.bind(null, val))
}).drop((drip, val) => {
    console.log(val) // <- logs "some-val"
})
```

Mainly just two things to note here:

- You'll usually pass the `drip` function reference directly to async functions (e.g. `setTimeout`, `fs.readFile`).

- You can partially apply the `drip` function using `drip.bind(null, val1, val2...)`. Those bound values will be passed to the next drop normally.

**Example Two** &ndash; A convention: Return the underlying promise from functions that define trickles. This just ensures that code that might expect a real promise receives one.

```javascript
function compile(code) {
    return trikl(drip => {
        transpile(code, drip)
    }).drop((drip, transpiledCode) => {
        compile(transpiledCode, drip) // this last drop will resolve the promise
    }).promise // <- return the underlying promise
}

// Anything that calls `compile()` can just use the promise normally.
compile(theCode)
    .then(compiledCode => {})
    .catch(error => {})
```

**Example Three** &ndash; A much more in-depth example with various methods of error handling. This example reads some JSON from a file, parses it asynchronously, makes a modification, stringifies it asynchronously, and saves it:

```javascript
const fs = require('fs')
const parse = require('json-parse-async')
const stringify = require('async-json')
const trikl = require('trikl')

function modifyJsonFile(file) {
    return trikl(drip => {
        
        // An example of callback control (note: the next drop handles errors):
        fs.readFile(file, 'utf8', drip)
        
    }).drop((drip, err, contents) => {
        // Yes, we can throw stuff! Trikl will catch it and reject the underlying promise for us.
        if (err) throw err // or drip.stop(err)
        
        // An example of promise control (note: errors are handled right here):
        parse(contents)
            .then(drip).catch(drip.stop) // just a good habit; whenever a drop handles promises, catch any errors and pass them to`drip.stop()`
        
    }).drop((drip, json) => {
        
        json.modification = 'modified!'
        stringify(json, drip)
        
    }).drop((drip, err, str) => {
        // Instead of throwing the error, we can also call `drip.stop()` with it and Trikl will reject the promise for us.
        if (err) drip.stop(err)
        
        // We don't need another drop to handle errors for the last operation;
        // Trikl will detect errors and reject/resolve the underlying promise accordingly.
        fs.writeFile(file, str, drip)
    }).promise
}
```

> Note: If you want to reject the underlying promise with something that isn't an instance of Error, calling `drip.stop()` won't work. You have to throw it or call `trickle.reject()` manually.

**Example Four** &ndash; A `trikl()` factory with multiple flags.

```javascript
let trickle = trikl.halt.pure(val => trickle.drip(val + 'b'))
    .drop(val => trickle.drip(val + 'c'))
    .drip('a') // start the halted trickle
    .then(result => {
        console.log(result) // <- logs "abc"
    })
```

## Advantages

So you were probably impressed by this. But in case you weren't, or you just didn't notice some of these, I figured I'd spell out the benefits of using Trikl over a normal promise chain here:

**Drops are asynchronous by default**

Whereas in a promise chain, the links are assumed to be synchronous, unless told otherwise, in Trikl it's the other way around. This makes Trikl ideal for performing many dependent asynchronous operations, while promise chains are more useful as middleware &ndash; a series of functions that take a value, modify it, and pass it on to the next function.

This saves a level of nesting. To get a promise chain to flow like Trikl does by default, you have to create and return a new promise from every link in the chain:

```javascript
let promise = new Promise(resolve => {
    resolve(1)
}).then(result => {
    return new Promise(resolve => {
        setTimeout(resolve.bind(null, result + 1))
    })
}).then(result => {
    console.log(result) // <- logs "2"
    return result
})
```

This is equivalent to the following trickle:

```javascript
let trickle = trikl(drip => {
    drip(1)
}).drop((drip, result) => {
    setTimeout(drip.bind(null, result + 1))
}).drop((drip, result) => {
    console.log(result) // <- logs "2"
    drip(result)
})
```

On the other hand, making a drop synchronous is simple; just call `drip()` synchronously. Making drops asynchronous by default is definitely the way to go, offering no disadvantages and several advantages over the synchronous-by-default approach.

**Less confusing**

I have seen many people confused by the difference between the function passed to the Promise constructor and the function passed to `promise.then()`. Trikl doesn't have any difference here. A drop is a drop.

**It provides another asynchronous layer**

Trikl is not meant to replace the Promise api. You should use Trikl and promises hand-in-hand. I found while working with promise chains that it can be confusing which links are middleware and which are endware &ndash; which links modify the value and pass it on and which take the finished value and use it. Trikl can be useful here. Use Trikl to perform the business logic and then use the underlying promise to perform the end operations. Since the last drop in a trickle resolves the underlying promise, it gives you a clear "business logic done" point:

```javascript
trikl(doSomeBusinessLogic)
    .drop(doSomeMoreBusinessLogic)
    .then(doStuffWithResult)
```

**Multiple values can trickle down**

Once you start using Trikl, you'll probably start to find this pretty annoying about promise chains: You can only resolve a promise with a single value. This means that in order to pass multiple points of data on to the next link, you have to wrap them all in an object or an array, or save them in a containing scope. While with ES6, this isn't all that annoying, it's still simpler with Trikl:

```javascript
// With Promises:
let promise = new Promise(resolve => {
    resolve(['one', 'two'])
}).then(([one, two]) => {
    console.log(one, two)
    return [one, two]
})

// With Trikl:
let trickle = trikl(drip => {
    drip('one', 'two')
}).drop((drip, one, two) => {
    console.log(one, two)
    drip([one, two])
})
```

Note that since the last drop in the trickle resolves the underlying promise, it unfortunately does have to pass just one value to `drip()`.

**More control**

With promise chains, you must assume the code will run asynchronously and basically immediately. Using the `trikl.halt` flag, you have perfect control over when and how your trickle executes. You can run it synchronously:

```javascript
let val = 0
trikl.halt(() => val++)
    .drop(() => val++)
    .drip()
    .drip()

console.log(val) // <- logs "2"
```

Or put a trickle together and use it later:

```javascript
let buildProcess = trikl.halt(findFiles, convertJsx, uglify, bundle, compileSass)

// somewhere later:
buildProcess.drip()
```

**Smarter workflow**

I doubt I'm the only one who's had to do this many times:

```javascript
let resolve, reject
let promise = new Promise((_resolve, _reject) => {
    // I don't want to resolve or reject anything in here!
    // Maybe because I don't know whether to resolve or reject yet.
    // Maybe because I don't want to nest more async calls inside this already-nested callback.
    resolve = _resolve
    reject = _reject
})

promise.then(...)
    .then(...)
    .catch(...)

resolve('I am resolving you down here! Not inside the lame promise resolver function.')
```

Trikl does this for you. The `resolve()` and `reject()` functions come packaged with every trickle.

```javascript
let trickle = trikl()

trickle.then(...)
    .then(...)
    .catch(...)

trickle.resolve('Whoa, my life just got easy.')
```

## Bugs, Pull Requests, Feedback, Comments, Requests, Whatever

Bugs can be reported at the [github issues page](https://github.com/bowheart/trikl/issues). All suggestions and feedback are most welcome. Also feel free to fork and pull request &ndash; just make sure the tests pass (`npm test`) and try to keep the tests at ~100% coverage. Happy coding!

## License

The [MIT License](LICENSE)
