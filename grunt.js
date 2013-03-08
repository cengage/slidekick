module.exports = function (grunt) {
	'use strict';

	// Project configuration.
	grunt.initConfig({
		beautify: {
			files: ['package.json', 'grunt.js', 'src/**/*.js', 'test/**/*.js']
		},
		beautifier: {
			options: {
				indentSize: 1
			}
		},
		copy: {
			web: {
				files: {
					'slidekick.min.js': 'src/slidekick.js'
				}
			}
		},
		lint: {
			files: ['grunt.js', 'src/**/*.js', 'test/**/*.js']
		},
		mindirect: {
			web: ['slidekick.min.js']
		},
		watch: {
			files: ['<config:jasmine.specs>'],
			tasks: 'jasmine'
		},
		jasmine: {
			src: ['test/helpers/**/*.js', 'src/**/*.js'],
			specs: ['test/**/*-spec.js'],
			template: 'test/helper/SpecRunner.tmpl'
		},
		jshint: {
			options: {
				curly: true,
				eqeqeq: true,
				immed: true,
				latedef: true,
				newcap: true,
				noarg: true,
				sub: true,
				undef: true,
				boss: true,
				eqnull: true,
				node: true,
				es5: true
			},
			globals: {
				jasmine: false,
				describe: false,
				afterEach: false,
				beforeEach: false,
				expect: false,
				it: false,
				xit: false,
				spyOn: false,
				window: false,
				jQuery: false,
				$: false
			}
		}
	});

	grunt.loadNpmTasks('grunt-beautify');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-mindirect');
	grunt.loadNpmTasks('grunt-jasmine-runner');

	// Default task.
	grunt.registerTask('default', 'beautify lint jasmine copy mindirect');

};