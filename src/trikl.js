'use strict'

module.exports = trikl

const slice = Array.prototype.slice

/*
	trikl() -- a factory for creating new instances of Trikl. Accepts an optional first drop to start the trickle.
*/
function trikl(drop) {
	let trikl = new Trikl()
	if (drop) trikl.drop(drop)
	return trikl
}

function drip() {
	let nextDrop = this.drops.shift()
	if (!nextDrop) return this.drip.stop(...arguments)
	
	try {
		nextDrop(this.drip, ...arguments)
	} catch (ex) {
		stopDripWithError.call(this, ex)
	}
}

function skip(num) {
	let args = slice.call(arguments, 1) // trim the num off the arguments
	this.drops.splice(0, num)
	this.drip(...args)
}

function skipDrop(num = 1) {
	num = Math.max(parseInt(num, 10), 1) // can't skip less than 1 item
	return skip.bind(this, num)
}

function stopDrip(val) {
	if (val instanceof Error) return stopDripWithError.call(this, ...arguments)
	this.drops = []
	this.resolve(...arguments)
}

function stopDripWithError() {
	this.drops = []
	this.reject(...arguments)
}

class Trikl {
	constructor() {
		this.promise = new Promise((resolve, reject) => {
			this.resolve = this.resolve.bind(this, resolve)
			this.reject = this.reject.bind(this, reject)
		})
		this.drops = []
		this.drip = drip.bind(this)
		this.drip.skip = skipDrop.bind(this)
		this.drip.stop = stopDrip.bind(this)
		setTimeout(this.drip) // allow the drops to be added in this turn of the event loop
	}
	
	catch() {
		this.promise.catch(...arguments)
		return this
	}

	drop(drop) {
		if (typeof drop !== 'function') throw new TypeError('Trikl Error - trikl.drop() - Drop must be a function. Received "' + typeof drop + '".')
		this.drops.push(drop)
		return this // for chaining
	}
	
	resolve(resolve) {
		resolve(...slice.call(arguments, 1))
		return this // for chaining
	}
	
	reject(reject) {
		reject(...slice.call(arguments, 1))
		return this // for chaining
	}
	
	then() {
		this.promise.then(...arguments)
		return this
	}
}
