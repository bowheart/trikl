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
	setFlagGetter(trikl, context, 'hard')
	
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

function bindDrip(drip) {
	drip.bond = bond.bind(drip)
	drip.skip = registerSkip.bind(this)
	drip.stop = stopDrip.bind(this)
}

function bond() {
	return this.bind(this, ...arguments)
}

function drip() {
	let nextDrop = this.drops.shift()
	if (!nextDrop) return this.drip.stop(...arguments)
	
	this.dropArgs = [...arguments]
	
	try {
		this.isPure
			? nextDrop(...this.dropArgs)
			: nextDrop(getDrip.call(this), ...this.dropArgs)
	} catch (ex) {
		stopDripWithError.call(this, ex)
	}
	return this // for chaining
}

function getDrip() {
	if (!this.isHard) return this.drip
	
	let newDrip = hardDrip.bind(this, {called: false})
	bindDrip.call(this, newDrip)
	return newDrip
}

function hardDrip(info) {
	if (info.called) return // this drip has already been called; cancel
	
	info.called = true
	let args = slice.call(arguments, 1) // trim off the info object
	return this.drip(...args)
}

function registerSkip(num = 1) {
	num = Math.max(parseInt(num) || 1, 1) // can't skip less than 1 item
	return skip.bind(this, num)
}

function skip(num) {
	let args = slice.call(arguments, 1) // trim the num off the arguments
	this.drops.splice(0, num)
	this.drip(...args)
	return this // for chaining
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
	constructor({pure, halt, hard}) {
		this.isPure = pure
		this.isHard = hard
		this.promise = this.lastPromise = new Promise((resolve, reject) => {
			this.resolve = this.resolve.bind(this, resolve)
			this.reject = this.reject.bind(this, reject)
		})
		this.drops = []
		this.drip = drip.bind(this)
		bindDrip.call(this, this.drip)
		
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
