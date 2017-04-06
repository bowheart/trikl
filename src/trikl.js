'use strict'

module.exports = trikl

/*
	trikl() -- a factory for creating new instances of Trikl. Accepts an optional first drop to start the trickle.
*/
function trikl(drop) {
	let trikl = new Trikl()
	if (drop) trikl.drop(drop)
	return trikl
}

trikl.all = function(trikls) {
	let promises = trikls.map(trikl => {
		if (trikl instanceof Trikl) return trikl.promise
		if (trikl instanceof Promise) return trikl
		throw new TypeError('trikl.all() -- Item is not an instance of Trikl or Promise.')
	})
	return Promise.all(promises)
}

function drip(val) {
	let nextDrop = this.drops.shift()
	if (!nextDrop) return this.drip.stop(...arguments)
	
	try {
		nextDrop(this.drip, ...arguments)
	} catch (ex) {
		this.drip.stop(ex)
	}
}

function skipDrop(num = 1) {
	num = Math.max(parseInt(num), 1) // can't skip less than 1 item
	this.drops.splice(0, num)
	this.drip()
}

function stopDrip(val) {
	this.drops = []
	if (val instanceof Error) return this.reject(val)
	this.resolve(...arguments)
}

class Trikl {
	constructor() {
		this.promise = new Promise((resolve, reject) => {
			this.resolve = resolve
			this.reject = reject
		})
		this.drops = []
		this.drip = drip.bind(this)
		this.drip.skip = skipDrop.bind(this)
		this.drip.stop = stopDrip.bind(this)
		setTimeout(this.drip)
	}
	
	catch() {
		return this.promise.catch(...arguments)
	}
	
	drop(drop) {
		this.drops.push(drop)
		return this // for chaining
	}
	
	then() {
		return this.promise.then(...arguments)
	}
}
debugger
