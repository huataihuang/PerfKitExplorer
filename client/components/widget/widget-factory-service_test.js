/**
 * @copyright Copyright 2014 Google Inc. All rights reserved.
 *
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://developers.google.com/open-source/licenses/bsd
 *
 * @fileoverview Tests for the widgetFactoryService service.
 * @author joemu@google.com (Joe Allan Muharsky)
 */

goog.require('p3rf.dashkit.explorer.application.module');
goog.require('p3rf.dashkit.explorer.components.container.ContainerWidgetConfig');
goog.require('p3rf.dashkit.explorer.components.container.ContainerWidgetModel');
goog.require('p3rf.dashkit.explorer.components.dashboard.DashboardConfig');
goog.require('p3rf.dashkit.explorer.components.dashboard.DashboardModel');
goog.require('p3rf.dashkit.explorer.models.ChartWidgetConfig');
goog.require('p3rf.dashkit.explorer.models.ChartWidgetModel');
goog.require('p3rf.dashkit.explorer.models.WidgetConfig');
goog.require('p3rf.dashkit.explorer.models.WidgetModel');
goog.require('p3rf.dashkit.explorer.models.WidgetType');

describe('widgetFactoryService', function() {
  var explorer = p3rf.dashkit.explorer;
  var ChartWidgetConfig = explorer.models.ChartWidgetConfig;
  var ChartWidgetModel = explorer.models.ChartWidgetModel;
  var ContainerWidgetConfig =
      explorer.components.container.ContainerWidgetConfig;
  var ContainerWidgetModel = explorer.components.container.ContainerWidgetModel;
  var DashboardConfig = explorer.components.dashboard.DashboardConfig;
  var DashboardModel = explorer.components.dashboard.DashboardModel;
  var WidgetConfig = explorer.models.WidgetConfig;
  var WidgetModel = explorer.models.WidgetModel;
  var WidgetType = explorer.models.WidgetType;
  var svc, rootScope;

  beforeEach(module('explorer'));

  beforeEach(inject(function(widgetFactoryService, $rootScope) {
    svc = widgetFactoryService;
    rootScope = $rootScope;
  }));

  it('should initialize the appropriate objects.', function() {
    expect(svc.widgetsById).toEqual({});
    expect(svc.statesById).toEqual({});
  });

  describe('generateWidgetId', function() {

    it('should generate unique ids for at least 64 widgets.', function() {
      var ids = {}; // Hash table of ids
      var unique = true;

      for (var i = 0; i < 64; i++) {
        var id = svc.generateWidgetId();
        // Check if the id already exist
        if (ids[id]) {
          unique = false;
          break;
        }
        ids[id] = true;
      }

      expect(unique).toBeTruthy();
    });
  });

  describe('createObjectFromJsonModel', function() {

    it('should create a chart widget with the json as model.', function() {
      var json = new ChartWidgetModel();

      var widget = svc.createObjectFromJsonModel(json);

      expect(widget.model.type).toEqual(WidgetType.CHART);
      expect(widget.model).toEqual(json);
    });

    it('should create a container widget with the json as model.', function() {
      var json = new ContainerWidgetModel();

      var widget = svc.createObjectFromJsonModel(json);

      expect(widget.model.type).toEqual(WidgetType.CONTAINER);
      expect(widget.model).toEqual(json);
    });
  });

  describe('toJson', function() {

    it('should return a valid json.', function() {
      var widget = new WidgetConfig(svc);

      var json = svc.toJson(widget);

      var obj = angular.fromJson(json);
      expect(obj).toBeDefined();
      expect(obj).not.toBeNull();
    });

    it('should return a json without model properties.', function() {
      var widget = new WidgetConfig(svc);

      var json = svc.toJson(widget);

      var obj = angular.fromJson(json);
      expect(obj.model).toBeUndefined();
      expect(obj.id).toBeDefined();
      expect(obj.id).not.toBeNull();
    });
  });

  describe('toDashboardConfig', function() {

    it('should return a dashboard config object based on the model given.',
        function() {
          var dashboardModel = new DashboardModel();
          var containerModel = new ContainerWidgetModel();
          containerModel.id = '45678';
          var widgetModel = new ChartWidgetModel();
          widgetModel.id = '124578';
          containerModel.container.children.push(widgetModel);
          dashboardModel.children.push(containerModel);

          var dashboardConfig = svc.toDashboardConfig(dashboardModel);

          var container = dashboardConfig.model.children[0];
          expect(container.model.id).toEqual(containerModel.id);
          var widget = container.model.container.children[0];
          expect(widget.model.id).toEqual(widgetModel.id);
        }
    );
  });

  describe('visit', function() {

    it('should visit all widgets.', function() {
      var visitCount = 0;
      var error = false;

      var container1 = new ContainerWidgetModel();
      container1.container.children.push(new WidgetModel());
      container1.container.children.push(new WidgetModel());
      var container2 = new ContainerWidgetModel();
      container2.container.children.push(new WidgetModel());
      var container3 = new ContainerWidgetModel();

      var visitFn = function(widget) {
        if (widget.visited) {
          error = true;
        }
        widget.visited = true;
        visitCount++;
      };

      svc.visitChildWidgets([container1, container2, container3], visitFn);

      expect(error).toBeFalsy();
      expect(visitCount).toEqual(6);
    });
  });

  describe('patchWidgetWithModel', function() {

    it('should replace the model of a widget config object.', function() {
      var config = new WidgetConfig(svc);
      var model = new WidgetModel();
      // The id of the model has to be the same.
      model.id = config.model.id;
      model.title = 'different title';

      svc.patchWidgetWithModel(model);

      expect(config.model).toEqual(model);
    });
  });

  describe('patchDashboardWithModel', function() {

    it('should replace the model of a widget config object.', function() {
      var dashboardConfig = new DashboardConfig();
      var containerConfig = new ContainerWidgetConfig(svc);
      containerConfig.model.container.children.push(new ChartWidgetConfig(svc));
      containerConfig.model.container.children.push(new ChartWidgetConfig(svc));
      dashboardConfig.model.children.push(containerConfig);

      // Get a copy of the model of the dashboard config.
      var dashboardModel = svc.toModel(dashboardConfig);
      // Do some modifications to the model.
      dashboardModel.title = 'modified dashboard title';
      var containerModel = dashboardModel.children[0];
      containerModel.title = 'modified container title';

      svc.patchDashboardWithModel(dashboardConfig, dashboardModel);

      // Assert that the dashboard model has been replaced with the new one.
      expect(dashboardConfig.model.title).toEqual(dashboardModel.title);

      var container = dashboardConfig.model.children[0];
      // Assert that the container config object reference is the same.
      expect(container).toBe(containerConfig);
      // Assert that its model has been replaced with the new one.
      expect(container.model.title).toEqual(containerModel.title);
    });
  });
});
