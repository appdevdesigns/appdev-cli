REPORTER = dot




test-before:

		@NODE_ENV=test ./node_modules/.bin/mocha \
	--reporter $(REPORTER) \
	test/install/appdev_install_before.js 	

test-after:

		@NODE_ENV=test ./node_modules/.bin/mocha \
	--reporter $(REPORTER) \
	test/install/appdev_install_after.js 
	
test:

		@NODE_ENV=test ./node_modules/.bin/mocha \
	--reporter $(REPORTER) \
	test/*.js 

	

.PHONY:test