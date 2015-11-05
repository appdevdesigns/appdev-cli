REPORTER = dot

	
test:
		@NODE_ENV=test ./node_modules/.bin/mocha \
	--reporter $(REPORTER) \
	test/setup.test.js \
	test/*.js 

	
.PHONY:test