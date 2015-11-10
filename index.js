'use strict';

// Vars
var _ = require('lodash');
var dust = require('dustjs-linkedin');
dust.helpers = require('dustjs-helpers').helpers;
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
  var filtersPath = options.filters;
  // var helpersPath = options.helpers;

  // register filters and helpers
  var filtersFiles = glob.sync(filtersPath + '/*.js');
  // var helpersFiles = glob.sync(helpersPath + '/*.js');
  _.forEach(filtersFiles, function(filter) {
    require(process.cwd() + '/' + filter)(dust);
  })
  // _.forEach(herlpersFiles, function(helper) {
  //   require(process.cwd() + '/' + helper)(dust);
  // })

  var jsonTemplatesFiles = glob.sync(templatesPath + '/*.json');
  var jsonTemplates = [];
  var jsonComponentsFiles = glob.sync(componentsPath + '/**/*.json');
  var jsonComponents = {'components': {}};
  var jsonPagesFiles = glob.sync(pagesPath + '/*.json');
  var componentTemplates = glob.sync(componentsPath + '/**/*.dust');
  var globalTemplates = glob.sync(templatesPath + '/*.dust');

  _.forEach(globalTemplates, function(templatePath) {
    var template =  fs.readFileSync(templatePath, 'utf8');
    var templateName = templatePath.split('/').pop().split('.')[0];
    var compiled = dust.compile(template, templateName);
    dust.loadSource(compiled);
  });

  _.forEach(componentTemplates, function(component) {
    var template =  fs.readFileSync(component, 'utf8');
    var templateName = component.split('/').pop().split('.')[0];
    var compiled = dust.compile(template, templateName);
    dust.loadSource(compiled);
  });

  _.forEach(jsonComponentsFiles, function (component) {
    var parsed = JSON.parse(fs.readFileSync(component, 'utf8'));
    var componentName = component.split('/').pop().split('.')[0];
    jsonComponents.components[componentName] = parsed;
  });

  _.forEach(jsonTemplatesFiles, function (template) {
    var parsed = JSON.parse(fs.readFileSync(template, 'utf8'));
    _.merge(jsonTemplates, parsed);
  });

  var jsonDefault = _.extend({}, jsonTemplates, jsonComponents);

  return through.obj(function(file, encode, callback) {
    try {
      var templateCode = file.contents.toString(encode || 'utf8');
      var that = this;
      var jsonData = null;

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

      // Get pages
      _.forEach(jsonPagesFiles, function(page) {
        var pageName = page.split('/').pop().split('.')[0];
        var parsed = JSON.parse(fs.readFileSync(page, 'utf8'));
        jsonData = _.merge({}, jsonDefault, parsed);

        // Get sports
        var jsonSportFile = glob.sync(pagesPath + '/' + pageName + '/*.json');
        _.forEach(jsonSportFile, function(sport) {
          var sportName = sport.split('/').pop().split('.')[0];
          var parsed = JSON.parse(fs.readFileSync(sport, 'utf8'));
          var sportData = _.omit(parsed, 'pageState');
          var sportData = _.extend({}, jsonData, sportData);

          // Get pageState
          _.forEach(parsed.pageState, function(state) {
            _.merge(sportData, {pageState: state.name});

            // Get gameFormat
            if(state.gameFormat) {
              _.forEach(state.gameFormat, function(format) {
                var withoutName = _.omit(format, 'name');
                var sportWithGameData = _.extend({}, sportData, {gameFormat: format.name});
                _.merge(sportWithGameData, withoutName);
                dustRender(
                  templateCode,
                  pageName,
                  sportWithGameData,
                  file.path.replace('.dust', '.html')
                  .replace(
                    pageName,
                    pageName + '/' + sportName + '-' + format.name + '--' + state.name
                  )
                );

              })
            } else {
              dustRender(
                templateCode,
                pageName,
                sportData,
                file.path.replace('.dust', '.html')
                .replace(
                  pageName,
                  pageName + '/' + sportName + '--' + state.name
                )
              );
            }
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
