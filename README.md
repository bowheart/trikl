[![build status](https://travis-ci.org/bowheart/trikl.svg?branch=master)](https://travis-ci.org/bowheart/trikl)
[![Test Coverage](https://codeclimate.com/github/bowheart/trikl/badges/coverage.svg)](https://codeclimate.com/github/bowheart/trikl/coverage)
[![Issue Count](https://img.shields.io/codeclimate/issues/github/bowheart/trikl.svg)](https://codeclimate.com/github/bowheart/trikl/issues)
[![Code Climate](https://codeclimate.com/github/bowheart/trikl/badges/gpa.svg)](https://codeclimate.com/github/bowheart/trikl)

# Trikl

Creating callback heaven. Trikl provides a simplified promise chain syntax, allowing you to callback and callforth with reckless abandon.

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

Let's get right to the good stuff:

```javascript
let promise = trikl(drip => {
	drip(1)
}).drop((drip, val) => {
	drip(val + 2)
})

promise.then(result => {
	console.log('the result:', result) // <- 3
}).catch(ex => {
	console.error('there was an error!', ex)
})
```

Let's break this down.

`trikl()` &ndash; we created a promise chain (a "trickle").


In short: You add "drops" to the chain via `trikl().drop()` and move through the drops by calling "drip" &ndash; the first argument of every drop.

Since Trikl exposes `then` and `catch` methods, most code that expects a promise can receive a trickle instead.

## Examples

Here's a much more in-depth example of reading JSON from a file, parsing it asynchronously, making a modification, stringifying it asynchronously, and saving it:

```javascript
const fs = require('fs')
const parse = require('json-parse-async')
const stringify = require('async-json')
const trikl = require('trikl')

function modifyJsonFile(file) {
    return trikl(drip => {
        
		// An example of callback control (note: the next drop handles errors):
        fs.readFile(file, drip)
        
    }).drop((drip, err, contentBuffer) => {
        // Yes, you can throw stuff! Trikl will catch it and reject the underlying promise for you.
        if (err) throw err // or drip.stop(err)
        
		// An example of promise control (note: errors are handled right here):
        parse(contentBuffer.toString())
			.then(drip).catch(drip.stop)
		
    }).drop((drip, json) => {
		
		json.modification = 'modified!'
		stringify(json, drip)
		
	}).drop((drip, err, str) => {
		if (err) throw err
		
		// We don't need another drop to handle errors for the last operation;
		// Trikl will detect errors and reject/resolve the underlying promise accordingly.
		fs.writeFile(file, str, drip)
	})
}
```
