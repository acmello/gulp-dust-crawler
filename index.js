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

  // _.merge(jsonData, keys);


  return through.obj(function(file, encode, callback) {
    try {
      var templateCode = file.contents.toString(encode || 'utf8');
      var filePath = file.base;
      var fileNameExt = file.path.split('/').pop()
      var fileName = fileNameExt.split('.')[0];
      var that = this;
      var withGameFormat = [];
      var withoutGameFormat = [];
      var dustRender = function(code, templateName, data, path) {
        var compiled = dust.compile(code, templateName);
        dust.loadSource(compiled);
        dust.render(templateName, data, function(err, output) {
          var tempFile = new gutil.File({
            base: file.base,
            cwd: file.cwd,
            path: path
          });

          tempFile.contents = new Buffer(beautifyHtml(output));
          that.push(tempFile);
        })
      };

      _.forEach(keys, function(key) {
        _.forEach(key.pageState, function(state) {
          if(state.gameFormat) {
            withGameFormat.push(key);
          } else {
            withoutGameFormat.push(key);
          }
        });
      });

      _.forEach(withGameFormat, function (pages) {
        _.forEach(pages.pageState, function (state) {
          _.forEach(state.gameFormat, function (format) {
            dustRender(
              templateCode,
              fileName,
              _.merge(jsonData, format),
              file.path.replace('.dust', '.html').replace(fileName, fileName + '/' + pages.code + '-' + fileName + '-' + format.name + '-' + state.name)
            );
          });
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
