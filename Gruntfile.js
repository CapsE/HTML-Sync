/**
 * Created by Lars on 06.03.2016.
 */

module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build: {
                src: ['js/lib/socket.io.js', 'js/lib/underscore.js', 'js/html-sync.js','js/syncable.js', 'js/part.js'],
                dest: 'html-sync.min.js'
            }
        },
        copy: {
            main: {
                files: [
                    // includes files within path
                    {expand: true, src: ['index.js', 'part.js', 'room.js'], dest: '../HTML-Sync-Examples/HelloWorld/node_modules/html-sync', filter: 'isFile'},

                    // includes files within path and its sub-directories
                    {expand: true, src: ['html-sync.min.js'], dest: '../HTML-Sync-Examples/HelloWorld/public'},

                ],
            },
        },
    });

    var path = process.argv[1];
    console.log(path);

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-copy');

    grunt.registerTask('default', ['uglify']);
    grunt.registerTask('cp', ['uglify','copy:main:files']);

};