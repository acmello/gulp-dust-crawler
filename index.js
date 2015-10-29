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
  var pagesPath = options.pages;
  var templatesPath = options.templates;
  var componentsPath = options.components;

  var folders = [templatesPath, componentsPath, pagesPath];

  var jsonFiles = [];
  var jsonData = [];
  var pages = [];
  var keys = {};

  _.each(folders, function(folder) {
    var file = glob.sync(folder + '/**/*.json');
    jsonFiles = jsonFiles.concat(file);
  });

  _.each(jsonFiles, function (file) {
    var parsedJSON = JSON.parse(fs.readFileSync(file, 'utf8'));

    if(parsedJSON.code) {
      jsonFiles = _.without(jsonFiles, file);
      pages = pages.concat(file);
      keys[parsedJSON.code] = JSON.parse(fs.readFileSync(file, 'utf8'));
    }

    _.merge(jsonData, parsedJSON);

  });

  _.merge(jsonData, keys);


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

  return through.obj(function(file, encode, callback) {
    try {
      var dustTemplate = file.contents.toString(encode || 'utf8');
      var filePath = file.base;
      var fileNameExt = file.path.split('/').pop()
      var fileName = fileNameExt.split('.')[0];
      var that = this;
      var tempFile = null;
      _.forEach(keys, function(key) {

        var compiled = dust.compile(dustTemplate, fileName);
        dust.loadSource(compiled);
        dust.render(fileName, key, function (err, output) {

          tempFile = new gutil.File({
            base: file.base,
            cwd: file.cwd,
            path: file.path.replace('.dust', '.html').replace(fileName, key.code + '/' + fileName)
          });

          tempFile.contents = new Buffer(beautifyHtml(output));
          that.push(tempFile);
        });
      });

      return callback();

    } catch (err) {
      return callback(new gutil.PluginError('gulp-dust-crawler', err, options));
    }

    callback(null, file);
  });
};
module.exports = gulpDustCrawler;
