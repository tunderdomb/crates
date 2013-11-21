//noinspection JSUnresolvedVariable
module.exports = function ( grunt ){

  grunt.initConfig({
    clean: {
    },
    concat: {
    },
    uglify: {
    },
    copy: {
    }
  })

  grunt.loadNpmTasks("grunt-contrib-clean")
  grunt.loadNpmTasks("grunt-contrib-concat")
  grunt.loadNpmTasks("grunt-contrib-uglify")
  grunt.loadNpmTasks("grunt-contrib-copy")

  grunt.registerTask("default", ["clean", "concat", "copy"])
}