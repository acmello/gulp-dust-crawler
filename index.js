'use strict';

// Vars
var _ = require('lodash');
var dust = require('dustjs-linkedin');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;
var fs = require('fs');
var path = require('path');
var glob = require('glob');

// Consts
var PLUGIN_NAME = 'gulp-dust-crawler';

var gulpDustCrawler = function(options) {
  var pagesPath = options.pages;
  var templatesPath = options.templates;
  var componentsPath = options.components;

  var folders = [templatesPath, componentsPath, pagesPath];

  var jsonData = function(folders) {
    var jsonFiles = [];
    var jsonData = [];
    var pages = [];
    var keys = {};
    var regex =  /^(event|schedule|home)$/;

    _.each(folders, function(folder) {
      var file = glob.sync(folder + '/**/*.json');
      jsonFiles = jsonFiles.concat(file);
    });

    _.each(jsonFiles, function (file) {
      var parsedJSON = JSON.parse(fs.readFileSync(file, 'utf8'));

      if(parsedJSON.code) {
        jsonFiles = _.without(jsonFiles, file);
        pages = pages.concat(file);
        keys[parsedJSON.code] = JSON.parse(fs.readFileSync(file, 'utf8'));;
      }

      _.merge(jsonData, parsedJSON);

    });

    _.merge(jsonData, keys);

    console.log(jsonData);
  };

  jsonData(folders);
};

gulpDustCrawler(
  {
    pages: 'test/pages',
    templates: 'test/templates',
    components: 'test/components'
  }
);
module.exports = gulpDustCrawler;
