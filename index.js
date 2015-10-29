'use strict';

// Vars
var _ = require('lodash');
var dust = require('dustjs-linkedin');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;
var fs = require('fs');
var path = require('path');
var glob = require('glob');
var beautifyHtml = require('js-beautify').html;
var through = require('through2');

// Consts
var PLUGIN_NAME = 'gulp-dust-crawler';

var gulpDustCrawler = function(options) {
  return through.obj(function () {
    gutil.log('test');
  })
  // var pagesPath = options.pages;
  // var templatesPath = options.templates;
  // var componentsPath = options.components;
  //
  // var folders = [templatesPath, componentsPath, pagesPath];
  //
  // var jsonFiles = [];
  // var jsonData = [];
  // var pages = [];
  // var keys = {};
  //
  // _.each(folders, function(folder) {
  //   var file = glob.sync(folder + '/**/*.json');
  //   jsonFiles = jsonFiles.concat(file);
  // });
  //
  // _.each(jsonFiles, function (file) {
  //   var parsedJSON = JSON.parse(fs.readFileSync(file, 'utf8'));
  //
  //   if(parsedJSON.code) {
  //     jsonFiles = _.without(jsonFiles, file);
  //     pages = pages.concat(file);
  //     keys[parsedJSON.code] = JSON.parse(fs.readFileSync(file, 'utf8'));
  //   }
  //
  //   _.merge(jsonData, parsedJSON);
  //
  // });
  //
  // _.merge(jsonData, keys);
  //
  //
  // _.forEach(keys, function(key) {
  //   var compiled = dust.compile(
  //     fs.readFileSync('./src/pages/event.dust', 'utf8'), 'event');
  //   dust.loadSource(compiled);
  //   dust.render('event', key, function (error, output) {
  //     if (error) {
  //       console.log(error);
  //     } else {
  //       // var generatedFile = './dist/pages/' + key.code + '-event.html';
  //       // fs.writeFileSync(generatedFile, beautifyHtml(output));
  //       return beautifyHtml(output);
  //     }
  //   });
  // });
};
module.exports = gulpDustCrawler;
