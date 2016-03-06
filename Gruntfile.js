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
                src: ['js/lib/socket.io.js', 'js/lib/undersocre.js', 'js/html-sync.js', 'js/part.js'],
                dest: 'html-sync.js'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.registerTask('default', ['uglify']);

};