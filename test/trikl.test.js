const trikl = require('../src/trikl')

describe('trikl()', () => {
	test('it returns an object that implements the Promise interface', () => {
		let trickle = trikl()
		expect(typeof trickle.then).toBe('function')
		expect(typeof trickle.catch).toBe('function')
	})
	
	test('trickles contain an underlying promise chain', () => {
		let trickle = trikl()
		expect(trickle.promise).toBeInstanceOf(Promise)
		expect(trickle.lastPromise).toBe(trickle.promise)
	})
	
	test('the `lastPromise` property advances down the underlying promise chain as links are added', () => {
		let trickle = trikl()
		trickle.then(() => {})
		expect(trickle.lastPromise).toBeInstanceOf(Promise)
		expect(trickle.lastPromise).not.toBe(trickle.promise)
	})
	
	test('the underlying promise can be resolved manually', () => {
		return trikl()
			.resolve('result')
			.promise
			.then(result => {
				expect(result).toBe('result')
			})
	})
	
	test('the underlying promise can be rejected manually', () => {
		let trickle = trikl(drip => {})
		
		trikl()
			.catch(trickle.resolve)
			.reject('rejected')
		
		return trickle.promise
			.then(result => {
				expect(result).toBe('rejected')
			})
	})
	
	test('drops can be added to the trickle via `trickle.drop()`', () => {
		return trikl()
			.drop(drip => drip('dripped'))
			.promise
			.then(result => {
				expect(result).toBe('dripped')
			})
	})
	
	test('drops must be functions', () => {
		expect(trikl().drop.bind(null, 'non-function')).toThrowError(/must be a function/i)
	})
	
	test('accepts an optional first drop as an argument', () => {
		return trikl(drip => drip('trikl drop'))
			.promise
			.then(result => {
				expect(result).toBe('trikl drop')
			})
	})
	
	test('drops can be added indefinitely', () => {
		return trikl()
			.drop(drip => drip(1))
			.drop((drip, val) => drip(val + 1))
			.drop((drip, val) => drip(val + 1))
			.promise
			.then(result => {
				expect(result).toBe(3)
			})
	})
	
	test('trickles can be used with Promise.all()', () => {
		return Promise.all([
			trikl(drip => drip('result 0')),
			trikl(drip => drip('result 1'))
		]).then(result => {
			expect(result[0]).toBe('result 0')
			expect(result[1]).toBe('result 1')
		})
	})
	
	test('trickles can be used with Promise.race()', () => {
		return Promise.race([
			trikl(drip => setTimeout(drip.bind(null, 'result 00'))),
			trikl(drip => drip('result 11'))
		]).then(result => {
			expect(result).toBe('result 11')
		})
	})
	
	test('a drop can skip the next drop via `drip.skip()()`', () => {
		return trikl(drip => drip.skip()(1))
			.drop(drip => drip(2))
			.promise
			.then(result => {
				expect(result).toBe(1)
			})
	})
	
	test('a drop can skip any number of drops via `drip.skip(num)()`', () => {
		return trikl(drip => drip.skip(3)(1))
			.drop(drip => drip(2))
			.drop(drip => drip(3))
			.drop(drip => drip(4))
			.promise
			.then(result => {
				expect(result).toBe(1)
			})
	})
	
	test('attempting to skip less than one drop will result in one drop being skipped', () => {
		return trikl(drip => drip.skip(-3)(1))
			.drop((drip, val) => drip(val + 1))
			.drop((drip, val) => drip(val + 1))
			.drop((drip, val) => drip(val + 1))
			.promise
			.then(result => {
				expect(result).toBe(3)
			})
	})
	
	test('a drop can drip through multiple drops', () => {
		return trikl(drip => {
				drip()
				drip()
				drip('done')
			})
			.drop(() => {})
			.drop(() => {})
			.promise
			.then(result => {
				expect(result).toBe('done')
			})
	})
	
	test('throwing anything in a drop will reject the underlying promise', () => {
		let trickle = trikl(drip => {})
		
		trikl(drip => {throw 'err'})
			.catch(trickle.resolve)
		
		return trickle
			.promise
			.then(result => {
				expect(result).toBe('err')
			})
	})
	
	test('calling `drip.stop()` will resolve the underlying promise immediately', () => {
		return trikl(drip => drip.stop('val'))
			.drop(drip => drip.stop('other val'))
			.promise
			.then(result => {
				expect(result).toBe('val')
			})
	})
	
	test('calling `drip.stop()` with an instance of Error as the first argument will reject the underlying promise', () => {
		let trickle = trikl(drip => {})
		
		trikl(drip => drip.stop(new Error()))
			.drop(drip => drip('non-error'))
			.catch(trickle.resolve)
		
		return trickle
			.promise
			.then(result => {
				expect(result).toBeInstanceOf(Error)
			})
	})
	
	test('`trikl()` and `trickle.drop()` can be passed an indefinite number of drops', () => {
		return trikl(drip => drip('one'), (drip, val) => drip(val + 'two'))
			.drop((drip, val) => drip(val + 'three'), (drip, val) => drip(val + 'four'))
			.promise
			.then(result => {
				expect(result).toBe('onetwothreefour')
			})
	})
	
	test('drop arguments can optionally be accessed via trickle.dropArgs', () => {
		let trickle = trikl(drip => drip(1, 2, 3))
			.drop(drip => {
				let [one, two, three] = trickle.dropArgs
				drip(one + two + three)
			})
		
		return trickle
			.promise
			.then(result => {
				expect(result).toBe(6)
			})
	})
	
	test('the `pure` flag prevents the `drip` function from being passed to drops', () => {
		let trickle1 = trikl.pure(() => trickle1.drip(1))
			.drop(val => trickle1.drip(val + 1))
		
		let trickle2 = trikl.pure()
			.drop(() => trickle2.drip(2))
			.drop(val => trickle2.drip(val + 2))
		
		return Promise.all([trickle1, trickle2])
			.then(result => {
				expect(result[0]).toBe(2)
				expect(result[1]).toBe(4)
			})
	})
	
	test('the `halt` flag prevents a trickle from dripping until `trickle.drip()` is called manually', () => {
		let trickle = trikl.halt(drip => drip(1))
			.drop((drip, val) => drip(val + 1))
		
		setTimeout(trickle.drip)
		
		return trickle
			.promise
			.then(result => {
				expect(result).toBe(2)
			})
	})
	
	test('the `halt` flag can be used to enforce synchronous execution', () => {
		let val = 0
		trikl.halt(() => val++)
		    .drop(() => val++)
			.drip()
			.drip()
		
		expect(val).toBe(2)
	})
	
	test('the `halt` and `pure` flags can be used together in any order', () => {
		let trickle1 = trikl.pure.halt(() => trickle1.drip(1))
			.drop(val => trickle1.drip(val + 1))
		
		let trickle2 = trikl.halt.pure(() => trickle2.drip(2))
			.drop(val => trickle2.drip(val + 2))
		
		setTimeout(trickle1.drip)
		setTimeout(trickle2.drip)
		
		return Promise.all([trickle1, trickle2])
			.then(result => {
				expect(result[0]).toBe(2)
				expect(result[1]).toBe(4)
			})
	})
})
