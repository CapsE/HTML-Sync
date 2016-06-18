/**
 * Created by Lars on 06.03.2016.
 */

module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
                sourceMap:true,
            },
            build: {
                src: ['js/lib/socket.io.js', 'js/lib/underscore.js', 'js/html-sync.js','js/syncable.js', 'js/part.js'],
                dest: 'html-sync.min.js'
            }
        },
        copy: {
            main: {
                triangles: [
                    // includes files within path
                    {expand: true, src: ['index.ts', 'part.ts', 'room.ts'], dest: '../HTML-Sync-Examples/Triangles/node_modules/html-sync', filter: 'isFile'},
                    {expand: true, src: ['js/*'], dest: '../HTML-Sync-Examples/Triangles/node_modules/html-sync/js', filter: 'isFile'},
                    
                    {expand: true, src: ['html-sync.min.js'], dest: '../HTML-Sync-Examples/Triangles/public'},

                ],
                helloWorld: [
                    // includes files within path
                    {expand: true, src: ['index.ts', 'part.ts', 'room.ts'], dest: '../HTML-Sync-Examples/HelloWorld/node_modules/html-sync', filter: 'isFile'},
                    {expand: true, src: ['js/*'], dest: '../HTML-Sync-Examples/HelloWorld/node_modules/html-sync/js', filter: 'isFile'},

                    {expand: true, src: ['html-sync.min.js'], dest: '../HTML-Sync-Examples/HelloWorld/public'},

                ],
                stars: [
                    // includes files within path
                    {expand: true, src: ['index.ts', 'part.ts', 'room.ts'], dest: '../HTML-Sync-Examples/ThousandStars/node_modules/html-sync', filter: 'isFile'},
                    {expand: true, src: ['js/*'], dest: '../HTML-Sync-Examples/ThousandStars/node_modules/html-sync/js', filter: 'isFile'},

                    {expand: true, src: ['html-sync.min.js'], dest: '../HTML-Sync-Examples/ThousandStars/public'},

                ],
            },
        },
        typedoc : {
            build : {
                src: ['./index.ts', './part.ts', './room.ts', './js/html-sync.ts', './js/part.ts', './js/syncable.ts'],
                options: {
                    out: './docs/',
                    name: 'HTMLSync',
                    module: 'commonjs',
                    target: 'es5'
                }
            }
        },
    });

    var path = process.argv[1];
    console.log(path);

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-typedoc');

    grunt.registerTask('default', ['uglify']);
    grunt.registerTask('cp', ['uglify','copy:main:triangles','copy:main:helloWorld','copy:main:stars']);

};