module.exports = function(grunt) {

    // load tasks
    [
        'grunt-contrib-jshint',
        'grunt-contrib-qunit',
        'grunt-contrib-watch',
        'grunt-contrib-clean',
        'grunt-contrib-copy',
        'grunt-contrib-concat',
        'grunt-contrib-uglify',
        'grunt-contrib-cssmin',
        'grunt-contrib-concat',
        'grunt-contrib-less',
        'grunt-compile-handlebars',
        'grunt-usemin',
        'grunt-filerev',
        'grunt-aws-s3',
        'grunt-contrib-compress'
    ].forEach(function(task) { grunt.loadNpmTasks(task); });


    // setup init config
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        aws: grunt.file.readJSON('aws.json'),

        // clean up the `dist/` directory, i.e., delete files
        clean: {
            dist: {
                src: [
                    'dist/*',

                    // funny dance to keep old versioned dist/css/*.pkg.*.css
                    '!dist/css/**',
                    'dist/css/*',
                    '!dist/css/*.pkg.*.css',

                    // funny dance to keep old versioned dist/css/*.pkg.*.js
                    '!dist/js/**',
                    'dist/js/*',
                    '!dist/js/*.pkg.*.js'
                ]
            },
            css: [
                'dist/css/*.css',
                '!dist/css/*.min.css',
            ]
        },

        // copy over `src/` files to `dist/`
        copy: {
            dist: {
                files: [{
                    expand: true,
                    dot: true,
                    cwd: 'src/',
                    dest: 'dist/',
                    src: [
                        'js/**',
                        'img/**'
                    ],
                    filter: 'isFile'
                }]
            }
        },

        // compile LESS files in `src/less/` into CSS files
        less: {
            css: {
                options: {
                    paths: ["src/less"]
                },
                files: [
                    {
                        expand: true,
                        cwd: 'src/less',
                        src: ['!mixins.less','*.less'],
                        dest: 'dist/css/',
                        ext: '.css'
                    }
                ]
            }
        },
        
        // compile handlebar templates into static html
        'compile-handlebars': {
            allStatic: {
                files: [{
                    src: 'src/index.handlebars',
                    dest: 'dist/index.html'
                }],
                templateData: 'src/data/index.json'
            }
        },

        // prep call for usemin (target all html files)
        useminPrepare: {
            html: [
                'dist/*.html'
            ]
        },

        // final call for usemin (target all html files)
        usemin: {
            html: [
                'dist/*.html'
            ],
            options: {
                dirs: ['dist/']
            }
        },
        
        // compress js
        uglify: {
            all: {
                files: {
                    'dist/js/app.min.js': [
                        'src/js/*.js'
                    ]
                }
            }
        },
        
        // compress css
        cssmin: {
            target: {
                files: {
                    'dist/css/styles.min.css': [
                        'dist/css/*.css'
                    ]
                }
            }
        },

        // revision a specific set of static files, this can be
        // extended to do more files and images too
        filerev: {
            files: {
                src: [
                    'dist/css/*.pkg.css',
                    'dist/js/*.pkg.js'
                ]
            }
        },
        
        // push to s3 for preview
        
        aws_s3: {
          options: {
            accessKeyId: '<%= aws.AWSAccessKeyId %>',
            secretAccessKey: '<%= aws.AWSSecretKey %>',
            region: '<%= aws.AWSRegion %>',
            uploadConcurrency: 5, // 5 simultaneous uploads
            downloadConcurrency: 5 // 5 simultaneous downloads
          },
          preview: {
            options: {
              bucket: 'poprule',
              differential: true // Only uploads the files that have changed
            },
            files: [
              {expand: true, cwd: 'dist/', src: ['**'], dest: 'clients/economist/fujitsu_de/'}
            ]
          }
        },

        // TODO - support qunit
        qunit: {
            files: ['test/**/*.html']
        },

        // validate JS files using jshint (great for catching simple bugs)
        jshint: {
            files: ['Gruntfile.js', 'src/**/*.js', 'test/**/*.js'],
            options: {
                // options here to override JSHint defaults
                globals: {
                    jQuery: true,
                    console: true,
                    module: true,
                    document: true
                },
                ignores: [
                    // enter paths to ignore here, e.g., 'src/js/jquery.js'
                ]
            }
        },

        // watch command to auto-compile files that have changed
        watch: {
            scripts: {
                files: ['Gruntfile.js','src/**/*.js'],
                tasks: ['jshint']
            },
            handlebars: {
                files: ['src/*.handlebars'],
                tasks: ['clean:dist','copy','compile-handlebars','less'],
            },
            less: {
                files: ['src/**/*.less'],
                tasks: ['less']
            }
        },

        // zip distribution folder        
        compress: {
          main: {
            options: {
              archive: 'fujitsu_de.zip'
            },
            files: [
              {src: ['dist/**'], dest: '', filter: 'isFile'}
            ]
          }
        }
    });

    // Composite tasks...

    // run tests
    grunt.registerTask('test', ['jshint', 'qunit']);

    // like watch, but build stuff at start too!
    grunt.registerTask('dev', ['clean:dist', 'copy', 'compile-handlebars', 'less', 'watch']);

    // full build of project to `dist/`
    grunt.registerTask('default', ['clean:dist', 'copy', 'compile-handlebars', 'less', 
                                   'useminPrepare',
                                   'cssmin',
                                   'usemin',
                                   'clean:css',
                                   'compress']);
    
    // push to preview site
    grunt.registerTask('push', ['clean:dist', 'copy', 'compile-handlebars', 'less', 
                                   'useminPrepare',
                                   'cssmin',
                                   'usemin',
                                   'clean:css',
                                   'aws_s3:preview']);
};
