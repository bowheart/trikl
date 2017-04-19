'use strict'

module.exports = createFactory({})

const slice = Array.prototype.slice


// Factory creation and implementation functions:

function triklTemplate(drop) {
	let trikl = new Trikl(this)
	if (drop) trikl.drop(...arguments)
	return trikl
}

function createFactory(context) {
	let trikl = triklTemplate.bind(context)
	
	setFlagGetter(trikl, context, 'pure')
	setFlagGetter(trikl, context, 'halt')
	
	return trikl
}

function setFlagGetter(trikl, context, flagName) {
	Object.defineProperty(trikl, flagName, {
		get() {
			let newContext = Object.assign({}, context) // shallowly clone the old context
			newContext[flagName] = true
			return createFactory(newContext)
		}
	})
}


// Trikl methods and definition:

function drip() {
	let nextDrop = this.drops.shift()
	if (!nextDrop) return this.drip.stop(...arguments)
	
	this.dropArgs = [...arguments]
	try {
		this.isPure
			? nextDrop(...this.dropArgs)
			: nextDrop(this.drip, ...this.dropArgs)
	} catch (ex) {
		stopDripWithError.call(this, ex)
	}
	return this // for chaining
}

function skip(num) {
	let args = slice.call(arguments, 1) // trim the num off the arguments
	this.drops.splice(0, num)
	this.drip(...args)
	return this // for chaining
}

function skipDrop(num = 1) {
	num = Math.max(parseInt(num), 1) // can't skip less than 1 item
	return skip.bind(this, num)
}

function stopDrip(val) {
	if (val instanceof Error) return stopDripWithError.call(this, ...arguments)
	this.drops = []
	this.resolve(...arguments)
	return this // for chaining
}

function stopDripWithError() {
	this.drops = []
	this.reject(...arguments)
	return this // for chaining
}

class Trikl {
	constructor({pure, halt}) {
		this.isPure = pure
		this.promise = this.lastPromise = new Promise((resolve, reject) => {
			this.resolve = this.resolve.bind(this, resolve)
			this.reject = this.reject.bind(this, reject)
		})
		this.drops = []
		this.drip = drip.bind(this)
		this.drip.skip = skipDrop.bind(this)
		this.drip.stop = stopDrip.bind(this)
		
		if (!halt) setTimeout(this.drip) // allow the drops to be added in this turn of the event loop
	}
	
	catch() {
		this.lastPromise = this.lastPromise.catch(...arguments)
		return this // for chaining
	}

	drop() {
		let args = slice.call(arguments)
		while (args.length) {
			let drop = args.shift()
			if (typeof drop !== 'function') {
				throw new TypeError('Trikl Error - trickle.drop() - Drop must be a function. Received "' + typeof drop + '".')
			}
			this.drops.push(drop)
		}
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
		this.lastPromise = this.lastPromise.then(...arguments)
		return this // for chaining
	}
}
