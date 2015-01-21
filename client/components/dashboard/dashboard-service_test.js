/**
 * @copyright Copyright 2014 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @fileoverview Tests for the dashboardService service.
 * @author joemu@google.com (Joe Allan Muharsky)
 */

goog.require('p3rf.perfkit.explorer.application.module');
goog.require('p3rf.perfkit.explorer.components.config.ConfigService');
goog.require('p3rf.perfkit.explorer.components.container.ContainerWidgetConfig');
goog.require('p3rf.perfkit.explorer.components.dashboard.DashboardService');
goog.require('p3rf.perfkit.explorer.components.widget.WidgetFactoryService');
goog.require('p3rf.perfkit.explorer.models.ChartWidgetConfig');
goog.require('p3rf.perfkit.explorer.models.ResultsDataStatus');
goog.require('p3rf.perfkit.explorer.models.WidgetConfig');
goog.require('p3rf.perfkit.explorer.models.WidgetType');
goog.require('p3rf.perfkit.explorer.models.perfkit_simple_builder.QueryBuilderService');


describe('dashboardService', function() {
  var explorer = p3rf.perfkit.explorer;
  var svc, widget, chartWidget, container, configService, widgetFactoryService;
  var WidgetConfig = explorer.models.WidgetConfig;
  var WidgetType = explorer.models.WidgetType;
  var ChartWidgetConfig = explorer.models.ChartWidgetConfig;
  var ContainerWidgetConfig =
      explorer.components.container.ContainerWidgetConfig;
  var QueryBuilderService =
      explorer.models.perfkit_simple_builder.QueryBuilderService;
  var ResultsDataStatus = explorer.models.ResultsDataStatus;

  beforeEach(module('explorer'));

  beforeEach(inject(function(dashboardService,
                             _queryBuilderService_,
                             _configService_,
                             _widgetFactoryService_) {
    svc = dashboardService;
    configService = _configService_;
    queryBuilderService = _queryBuilderService_;
    widgetFactoryService = _widgetFactoryService_;
    widget = new WidgetConfig(widgetFactoryService);
    chartWidget = new ChartWidgetConfig(widgetFactoryService);
    container = new ContainerWidgetConfig(widgetFactoryService);
  }));

  it('should initialize the appropriate objects.', function() {
    expect(svc.widgets).toEqual([]);
    expect(svc.selectedWidget).toBeNull();
    expect(svc.selectedContainer).toBeNull();
    expect(svc.selectWidget).not.toBeNull();
    expect(typeof svc.selectWidget).toBe('function');
    expect(svc.selectContainer).not.toBeNull();
    expect(typeof svc.selectContainer).toBe('function');
    expect(svc.refreshWidget).not.toBeNull();
    expect(typeof svc.refreshWidget).toBe('function');
    expect(svc.addWidget).not.toBeNull();
    expect(typeof svc.addWidget).toBe('function');
    expect(svc.removeWidget).not.toBeNull();
    expect(typeof svc.removeWidget).toBe('function');
  });

  describe('selectWidget', function() {

    it('should update the selectedWidget.', function() {
      svc.selectWidget(widget, container);
      expect(svc.selectedWidget).toBe(widget);
    });

    it('should select the widget\'s container.', function() {
      // Mock the selectContainer function
      svc.selectContainer = jasmine.createSpy();
      svc.selectWidget(widget, container);
      expect(svc.selectContainer).toHaveBeenCalledWith(container);
    });

    it('should update the widget state to selected.', function() {
      expect(widget.state().selected).toBeFalsy();
      svc.selectWidget(widget, container);
      expect(widget.state().selected).toBeTruthy();
    });

    it('should update the previous widget state to unselected.', function() {
      svc.selectWidget(widget, container);
      // Deselect it
      svc.selectWidget(null);
      expect(widget.state().selected).toBeFalsy();
    });
  });

  describe('selectContainer', function() {

    it('should update the selectedContainer.', function() {
      svc.selectContainer(container);
      expect(svc.selectedContainer).toBe(container);
    });

    it('should update the container state to selected.', function() {
      expect(container.state().selected).toBeFalsy();
      svc.selectContainer(container);
      expect(container.state().selected).toBeTruthy();
    });

    it('should update the previous container state to unselected.', function() {
      svc.selectContainer(container);
      // Deselect it
      svc.selectContainer(null);
      expect(container.state().selected).toBeFalsy();
    });
  });

  describe('refreshWidget', function() {

    it('should change the widget datasource status to TOFETCH.', function() {
      chartWidget.state().datasource.status = ResultsDataStatus.FETCHED;
      svc.refreshWidget(chartWidget);
      expect(chartWidget.state().datasource.status).
          toEqual(ResultsDataStatus.TOFETCH);
    });
  });

  describe('addWidget', function() {

    it('should add a new widget in the container.', function() {
      expect(container.model.container.children.length).toEqual(0);
      svc.addWidget(container);
      expect(container.model.container.children.length).toEqual(1);
    });

    it('should select the widget added.', function() {
      expect(svc.selectedWidget).toBeNull();
      svc.addWidget(container);
      expect(svc.selectedWidget).not.toBeNull();
    });

    it('should select the widget\'s container.', function() {
      expect(svc.selectedContainer).toBeNull();
      svc.addWidget(container);
      expect(svc.selectedContainer).not.toBeNull();
    });

    it('should increment the columns if needed.', function() {
      container.model.container.columns = 0;
      svc.addWidget(container);
      expect(container.model.container.columns).toEqual(1);
    });

    it('should not change the columns if not needed.', function() {
      container.model.container.columns = 1;
      svc.addWidget(container);
      expect(container.model.container.columns).toEqual(1);
    });

    it('should set the parent reference.', function() {
      svc.addWidget(container);
      var widgetAdded = container.model.container.children[0];
      expect(widgetAdded.state().parent).toBe(container);
    });
  });

  describe('removeWidget', function() {

    it('should remove the widget from the container.', function() {
      container.model.container.children.push(widget);
      container.model.container.children.push(
          new WidgetConfig(widgetFactoryService));
      expect(container.model.container.children.indexOf(widget)).toEqual(0);

      svc.removeWidget(widget, container);

      expect(container.model.container.children.indexOf(widget)).toEqual(-1);
    });
  });

  describe('addContainer', function() {

    it('should add a new container and add a new widget.', function() {
      spyOn(svc, 'addWidget');

      expect(svc.widgets.length).toEqual(0);
      svc.addContainer();
      expect(svc.widgets.length).toEqual(1);
      var newContainer = svc.widgets[0];
      expect(svc.addWidget).toHaveBeenCalledWith(newContainer);
    });
  });

  describe('removeContainer', function() {

    it('should remove the container from the widgets array.', function() {
      svc.widgets.push(container);
      container.model.container.children.push(
          new ContainerWidgetConfig(widgetFactoryService));
      expect(svc.widgets.indexOf(container)).toEqual(0);

      svc.removeContainer(container);

      expect(svc.widgets.indexOf(container)).toEqual(-1);
    });
  });

  describe('moveWidgetToPrevious', function() {

    it('should swap the widget with the one at the previous position.',
        function() {
          var widget2 = new WidgetConfig(widgetFactoryService);
          container.model.container.children.push(widget);
          container.model.container.children.push(widget2);
          widget2.state().parent = container;

          svc.moveWidgetToPrevious(widget2);

          expect(container.model.container.children.indexOf(widget)).
              toEqual(1);
          expect(container.model.container.children.indexOf(widget2)).
              toEqual(0);
        }
    );
  });

  describe('moveWidgetToNext', function() {

    it('should swap the widget with the one at the next position.',
        function() {
          var widget2 = new WidgetConfig(widgetFactoryService);
          container.model.container.children.push(widget);
          container.model.container.children.push(widget2);
          widget.state().parent = container;

          svc.moveWidgetToNext(widget);

          expect(container.model.container.children.indexOf(widget)).
              toEqual(1);
          expect(container.model.container.children.indexOf(widget2)).
              toEqual(0);
        }
    );
  });

  describe('moveWidgetToFirst', function() {

    it('should move the widget to the beginning of the array.',
        function() {
          var widget2 = new WidgetConfig(widgetFactoryService);
          var widget3 = new WidgetConfig(widgetFactoryService);
          container.model.container.children.push(widget);
          container.model.container.children.push(widget2);
          container.model.container.children.push(widget3);
          widget3.state().parent = container;

          svc.moveWidgetToFirst(widget3);

          expect(container.model.container.children.indexOf(widget)).
              toEqual(1);
          expect(container.model.container.children.indexOf(widget2)).
              toEqual(2);
          expect(container.model.container.children.indexOf(widget3)).
              toEqual(0);
        }
    );
  });

  describe('moveWidgetToLast', function() {

    it('should move the widget to the end of the array.',
        function() {
          var widget2 = new WidgetConfig(widgetFactoryService);
          var widget3 = new WidgetConfig(widgetFactoryService);
          container.model.container.children.push(widget);
          container.model.container.children.push(widget2);
          container.model.container.children.push(widget3);
          widget.state().parent = container;

          svc.moveWidgetToLast(widget);

          expect(container.model.container.children.indexOf(widget)).
              toEqual(2);
          expect(container.model.container.children.indexOf(widget2)).
              toEqual(0);
          expect(container.model.container.children.indexOf(widget3)).
              toEqual(1);
        }
    );
  });

  describe('moveWidgetToPreviousContainer', function() {

    it('should move into a new top-level container if it has siblings.',
        function() {
          svc.widgets.push(container);

          var widget2 = new WidgetConfig(widgetFactoryService);
          container.model.container.children.push(widget);
          container.model.container.children.push(widget2);
          widget.state().parent = container;

          svc.moveWidgetToPreviousContainer(widget);

          newContainer = widget.state().parent;
          expect(newContainer).not.toEqual(container);
          expect(svc.widgets.indexOf(newContainer)).toEqual(0);
          expect(svc.widgets.indexOf(container)).toEqual(1);

          expect(newContainer.model.container.children.indexOf(widget)).
              toEqual(0);
          expect(container.model.container.children.indexOf(widget2)).
              toEqual(0);
        }
    );

    it('should move to the previous container if it is not already first.',
        function() {
          var targetContainer = new ContainerWidgetConfig(widgetFactoryService);
          svc.widgets.push(targetContainer);
          svc.widgets.push(container);

          var widget2 = new WidgetConfig(widgetFactoryService);
          container.model.container.children.push(widget);
          container.model.container.children.push(widget2);
          widget.state().parent = container;

          svc.moveWidgetToPreviousContainer(widget);

          expect(svc.widgets.indexOf(targetContainer)).toEqual(0);
          expect(svc.widgets.indexOf(container)).toEqual(1);

          expect(targetContainer.model.container.children.indexOf(widget)).
              toEqual(0);
          expect(container.model.container.children.indexOf(widget2)).
              toEqual(0);
        }
    );

    it('should clean up a container if left empty after the widget is moved.',
        function() {
          var secondContainer = new ContainerWidgetConfig(widgetFactoryService);
          svc.widgets.push(container);
          svc.widgets.push(secondContainer);

          var widget2 = new WidgetConfig(widgetFactoryService);
          container.model.container.children.push(widget);
          secondContainer.model.container.children.push(widget2);
          widget2.state().parent = secondContainer;

          expect(svc.widgets.length).toEqual(2);
          svc.moveWidgetToPreviousContainer(widget2);

          expect(svc.widgets.indexOf(secondContainer)).toEqual(-1);
          expect(svc.widgets.indexOf(container)).toEqual(0);
          expect(svc.widgets.length).toEqual(1);
          expect(container.model.container.children.indexOf(widget)).
              toEqual(0);
          expect(container.model.container.children.indexOf(widget2)).
              toEqual(1);
        }
    );

    it('should do nothing if it is the only sibling of the first container.',
        function() {
          var secondContainer = new ContainerWidgetConfig(widgetFactoryService);
          svc.widgets.push(container);
          svc.widgets.push(secondContainer);

          var widget2 = new WidgetConfig(widgetFactoryService);
          container.model.container.children.push(widget);
          secondContainer.model.container.children.push(widget2);
          widget.state().parent = container;

          expect(svc.widgets.length).toEqual(2);
          svc.moveWidgetToPreviousContainer(widget);

          expect(svc.widgets.indexOf(container)).toEqual(0);
          expect(svc.widgets.indexOf(secondContainer)).toEqual(1);
          expect(container.model.container.children.indexOf(widget)).
              toEqual(0);
          expect(secondContainer.model.container.children.indexOf(widget2)).
              toEqual(0);
        }
    );
  });

  describe('moveWidgetToNextContainer', function() {

    it('should move into a new bottom-level container if it has siblings.',
        function() {
          svc.widgets.push(container);

          var widget2 = new WidgetConfig(widgetFactoryService);
          container.model.container.children.push(widget2);
          container.model.container.children.push(widget);
          widget.state().parent = container;

          svc.moveWidgetToNextContainer(widget);

          newContainer = widget.state().parent;
          expect(newContainer).not.toEqual(container);
          expect(svc.widgets.indexOf(newContainer)).toEqual(1);
          expect(svc.widgets.indexOf(container)).toEqual(0);

          expect(newContainer.model.container.children.indexOf(widget)).
              toEqual(0);
          expect(container.model.container.children.indexOf(widget2)).
              toEqual(0);
        }
    );

    it('should move to the next container if it is not already last.',
        function() {
          var targetContainer = new ContainerWidgetConfig(widgetFactoryService);
          svc.widgets.push(container);
          svc.widgets.push(targetContainer);

          var widget2 = new WidgetConfig(widgetFactoryService);
          container.model.container.children.push(widget2);
          container.model.container.children.push(widget);
          widget.state().parent = container;

          svc.moveWidgetToNextContainer(widget);

          expect(svc.widgets.indexOf(container)).toEqual(0);
          expect(svc.widgets.indexOf(targetContainer)).toEqual(1);

          expect(targetContainer.model.container.children.indexOf(widget)).
              toEqual(0);
          expect(container.model.container.children.indexOf(widget2)).
              toEqual(0);
        }
    );

    it('should clean up a container if left empty after the widget is moved.',
        function() {
          var secondContainer = new ContainerWidgetConfig(widgetFactoryService);
          svc.widgets.push(secondContainer);
          svc.widgets.push(container);

          var widget2 = new WidgetConfig(widgetFactoryService);
          container.model.container.children.push(widget);
          secondContainer.model.container.children.push(widget2);
          widget2.state().parent = secondContainer;

          expect(svc.widgets.length).toEqual(2);
          svc.moveWidgetToNextContainer(widget2);

          expect(svc.widgets.indexOf(secondContainer)).toEqual(-1);
          expect(svc.widgets.indexOf(container)).toEqual(0);
          expect(svc.widgets.length).toEqual(1);
          expect(container.model.container.children.indexOf(widget)).
              toEqual(0);
          expect(container.model.container.children.indexOf(widget2)).
              toEqual(1);
        }
    );

    it('should do nothing if it is the only sibling of the last container.',
        function() {
          var secondContainer = new ContainerWidgetConfig(widgetFactoryService);
          svc.widgets.push(secondContainer);
          svc.widgets.push(container);

          var widget2 = new WidgetConfig(widgetFactoryService);
          container.model.container.children.push(widget);
          secondContainer.model.container.children.push(widget2);
          widget.state().parent = container;

          expect(svc.widgets.length).toEqual(2);
          svc.moveWidgetToNextContainer(widget);

          expect(svc.widgets.indexOf(container)).toEqual(1);
          expect(svc.widgets.indexOf(secondContainer)).toEqual(0);
          expect(container.model.container.children.indexOf(widget)).
              toEqual(0);
          expect(secondContainer.model.container.children.indexOf(widget2)).
              toEqual(0);
        }
    );
  });

  describe('rewriteQuery()', function() {

    var providedWidget, providedConfig, sampleDashboardValues,
        sampleWidgetValues;

    beforeEach(inject(function() {
      spyOn(queryBuilderService, 'getSql');

      providedWidget = {
        'model': {
          'datasource': {
            'custom_query': false,
            'query': '',
            'config': {
              'results': {
                'project_id': '',
                'dataset_name': '',
                'table_name': '',
                'table_partition': ''
              }
            }
          }
        }
      };

      providedConfig = providedWidget.model.datasource.config;

      configService.populate({
        'default_project': 'CONFIG_PROJECT',
        'default_dataset': 'CONFIG_DATASET',
        'default_table': 'CONFIG_TABLE',
        'table_partition': 'CONFIG_PARTITION'
      });

      sampleDashboardValues = {
        'project_id': 'DASH_PROJECT',
        'dataset_name': 'DASH_DATASET',
        'table_name': 'DASH_TABLE',
        'table_partition': 'DASH_PARTITION'
      };

      sampleWidgetValues = {
        'project_id': 'WIDGET_PROJECT',
        'dataset_name': 'WIDGET_DATASET',
        'table_name': 'WIDGET_TABLE',
        'table_partition': 'WIDGET_PARTITION'
      };
    }));

    it('should use widget values if available.', function() {
      providedConfig.results.project_id = sampleWidgetValues.project_id;
      providedConfig.results.dataset_name = sampleWidgetValues.dataset_name;
      providedConfig.results.table_name = sampleWidgetValues.table_name;
      providedConfig.results.table_partition = (
          sampleWidgetValues.table_partition);

      svc.rewriteQuery(providedWidget);

      expect(queryBuilderService.getSql).toHaveBeenCalledWith(
          providedConfig,
          sampleWidgetValues.project_id,
          sampleWidgetValues.dataset_name,
          sampleWidgetValues.table_name,
          sampleWidgetValues.table_partition);
    });

    it('should use dashboard values if absence of widget values.', function() {
      svc.current.model.project_id = sampleDashboardValues.project_id;
      svc.current.model.dataset_name = sampleDashboardValues.dataset_name;
      svc.current.model.table_name = sampleDashboardValues.table_name;
      svc.current.model.table_partition = (
          sampleDashboardValues.table_partition);

      svc.rewriteQuery(providedWidget);

      expect(queryBuilderService.getSql).toHaveBeenCalledWith(
          providedConfig,
          sampleDashboardValues.project_id,
          sampleDashboardValues.dataset_name,
          sampleDashboardValues.table_name,
          sampleDashboardValues.table_partition);
    });

    it('should use config values if absence of widget and dashboard ' +
       'values.', function() {
      svc.rewriteQuery(providedWidget);

      expect(queryBuilderService.getSql).toHaveBeenCalledWith(
          providedConfig,
          configService.default_project,
          configService.default_dataset,
          configService.default_table,
          svc.DEFAULT_TABLE_PARTITION);
    });

    it('should use a mix of scopes to populate values.', function() {
      svc.current.model.project_id = sampleDashboardValues.project_id;
      providedConfig.results.dataset_name = sampleWidgetValues.dataset_name;

      svc.rewriteQuery(providedWidget);

      expect(queryBuilderService.getSql).toHaveBeenCalledWith(
          providedConfig,
          sampleDashboardValues.project_id,
          sampleWidgetValues.dataset_name,
          configService.default_table,
          svc.DEFAULT_TABLE_PARTITION);
    });
  });
});
