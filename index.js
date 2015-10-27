'use strict';

// Vars
var _ = require('lodash');
var dust = require('dustjs-linkedin');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;
var fs = require('fs');
var path = require('path');

// Consts
var PLUGIN_NAME = 'gulp-dust-crawler';

var gulpDustCrawler = function(options) {
  if (!options) {
    throw new PluginError(PLUGIN_NAME, 'Missing options!');
  } else if (!options.pages) {
    throw new PluginError(PLUGIN_NAME, 'Missing pages path!');
  } else if (!options.templates) {
    throw new PluginError(PLUGIN_NAME, 'Missing templates path!');
  } else if (!options.components) {
    throw new PluginError(PLUGIN_NAME, 'Missing components path!');
  }

  var pagesPath = options.pages;
  var templatesPath = options.templates;
  var componentsPath = options.components;

  if(!fs.existsSync(pagesPath)){
    throw new PluginError(PLUGIN_NAME, 'Path not exist');
  }

  var makeJSON = function(templates, pages, components) {
    var folders = [];
    _.each(options, function (option) {
      folders.push(option);
    });
    // var files = fs.readdirSync(folder);
    // _.filter(files, function(file) {
    //   return path.extname(file) === '.json';
    // });
  };

  makeJSON(templatesPath, pagesPath, componentsPath);
};

gulpDustCrawler(
  {
    pages: 'test/pages',
    templates: 'test/templates',
    components: 'test/components'
  }
);
module.exports = gulpDustCrawler;
