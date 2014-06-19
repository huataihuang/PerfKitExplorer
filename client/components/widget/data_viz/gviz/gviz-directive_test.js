/**
 * @copyright Copyright 2014 Google Inc. All rights reserved.
 *
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://developers.google.com/open-source/licenses/bsd
 *
 * @fileoverview Tests for the gvizDirective component.
 * @author joemu@google.com (Joe Allan Muharsky)
 */

goog.require('p3rf.dashkit.explorer.application.module');
goog.require('p3rf.dashkit.explorer.components.container.ContainerWidgetConfig');
goog.require('p3rf.dashkit.explorer.components.widget.WidgetFactoryService');
goog.require('p3rf.dashkit.explorer.components.widget.data_viz.gviz.getGvizChartWrapper');
goog.require('p3rf.dashkit.explorer.components.widget.data_viz.gviz.getGvizDataTable');
goog.require('p3rf.dashkit.explorer.components.widget.data_viz.gviz.gvizChart');
goog.require('p3rf.dashkit.explorer.models.ChartType');
goog.require('p3rf.dashkit.explorer.models.ChartWidgetConfig');
goog.require('p3rf.dashkit.explorer.models.ResultsDataStatus');
goog.require('p3rf.dashkit.explorer.models.WidgetType');

describe('gvizDirective', function() {
  var ChartType = p3rf.dashkit.explorer.models.ChartType;
  var ChartWidgetConfig =
      p3rf.dashkit.explorer.models.ChartWidgetConfig;
  var WidgetType = p3rf.dashkit.explorer.models.WidgetType;
  var ContainerWidgetConfig = (
      p3rf.dashkit.explorer.components.container.
      ContainerWidgetConfig);
  var ResultsDataStatus =
      p3rf.dashkit.explorer.models.ResultsDataStatus;
  var compile, rootScope, timeout, chartWrapperMock, gvizChartErrorCallback,
      queryResultDataServiceMock, fetchResultsDeferred, model, state,
      dataViewServiceMock, dataViewsJson, widgetFactoryService;

  function setupData(isFetched) {
    // Default query
    model.datasource.query = 'fake query';
    if (isFetched) {
      state().datasource.status = ResultsDataStatus.FETCHED;
    }
  }

  function setupComponent() {
    var component = compile(
        '<gviz-chart-widget widget-config="widgetConfig"/>')(rootScope);
    rootScope.$apply();
    timeout.flush();

    return {
      component: component,
      chartDiv: angular.element(component[0].children[0]),
      errorDiv: angular.element(component[0].children[1]),
      spinnerDiv: angular.element(component[0].children[2])
    };
  }

  beforeEach(module('explorer'));
  beforeEach(module('googleVisualizationMocks'));

  beforeEach(module(function($provide) {
    var queryResultDataService = function($q) {
      // Mock fetchResults promise
      fetchResultsDeferred = $q.defer();

      queryResultDataServiceMock = {
        fetchResults: jasmine.createSpy().
            andReturn(fetchResultsDeferred.promise)
      };
      return queryResultDataServiceMock;
    };

    $provide.service('queryResultDataService', queryResultDataService);
  }));

  beforeEach(inject(function($templateCache) {
    var template =
        '<div>' +
        '<div class="dashkit-chart"  ng-hide="!isDataFetched()" ng-class=' +
        '"{\'dashkit-chart-hidden\': widgetConfig.state().chart.error}">' +
        '</div>' +
        '<div class="dashkit-chart-error" ng-show="' +
        'widgetConfig.state().chart.error"><div ng-hide="isDataFetching()"' +
        '> {{widgetConfig.state().chart.error}}</div></div>' +
        '<div class="spinner" ng-show="isDataFetching()"></div>' +
        '</div>';

    $templateCache.put(
        '/static/components/widget/data_viz/gviz/gviz-directive.html',
        template);
  }));

  beforeEach(inject(function($compile, $rootScope, $timeout, GvizChartWrapper,
      gvizEvents, _GvizDataTable_, dataViewService, _widgetFactoryService_) {
        compile = $compile;
        rootScope = $rootScope;
        timeout = $timeout;
        widgetFactoryService = _widgetFactoryService_;
        chartWrapperMock = GvizChartWrapper.prototype;
        gvizEventsMock = gvizEvents;
        GvizDataTable = _GvizDataTable_;
        dataViewServiceMock = dataViewService;

        // Return 10 rows by default
        GvizDataTable.prototype.getNumberOfRows.andReturn(10);

        // Setup fake data for component's attributes
        rootScope.widgetConfig =
            new ChartWidgetConfig(widgetFactoryService);
        model = rootScope.widgetConfig.model;
        state = angular.bind(
            rootScope.widgetConfig,
            rootScope.widgetConfig.state);

        state().parent = new ContainerWidgetConfig(widgetFactoryService);
        model.datasource.query = 'fake query';

        gvizEventsMock.addListener.andCallFake(
            function(chartWrapper, eventName, callback) {
              if (eventName === 'error') {
                gvizChartErrorCallback = callback;
              }
            }
        );

        dataViewsJson = {obj: 'fake dataViewsJson'};
        spyOn(dataViewServiceMock, 'create').andReturn(dataViewsJson);
      }));

  it('should update the chartWrapper when the configuration change.',
      function() {
        setupData(true);
        // Setup a configuration
        model.chart.chartType = 'chartType';
        model.chart.options = {obj: 'options'};
        setupComponent();

        expect(chartWrapperMock.setChartType).
            toHaveBeenCalledWith(model.chart.chartType);
        var optionsArg = chartWrapperMock.setOptions.mostRecentCall.args[0];
        expect(optionsArg.obj).toEqual('options');

        // Change the configuration
        model.chart.chartType = 'chartType2';
        model.chart.options = {obj: 'options2'};
        rootScope.$apply();
        timeout.flush();

        expect(chartWrapperMock.setChartType).
            toHaveBeenCalledWith(model.chart.chartType);
        optionsArg = chartWrapperMock.setOptions.mostRecentCall.args[0];
        expect(optionsArg.obj).toEqual('options2');
      }
  );

  it('should preserve the height when options change (with a chart).',
      function() {
        setupData(true);
        model.chart.chartType = ChartType.LINE_CHART;
        state().parent.model.container.height = 123;
        setupComponent();

        // Change options
        model.chart.options.height = 999;
        rootScope.$apply();

        var optionsArg = chartWrapperMock.setOptions.mostRecentCall.args[0];
        expect(optionsArg).not.toBeNull();
        expect(optionsArg.height).toEqual(123);
      }
  );

  it('should prevent overflow for a chart.',
      function() {
        setupData(true);
        model.chart.chartType = ChartType.LINE_CHART;
        setupComponent();

        expect(model.layout.cssClasses).
            toEqual('dashkit-widget-no-overflow');
      }
  );

  it('should not prevent overflow for a table.',
      function() {
        setupData(true);
        model.chart.chartType = ChartType.TABLE;
        setupComponent();

        expect(model.layout.cssClasses).toEqual('');
      }
  );

  describe('template', function() {

    it('should show the spinner when the data are fetching.',
        function() {
          state().datasource.status = ResultsDataStatus.FETCHING;
          var component = setupComponent();

          expect(component.spinnerDiv[0].className.split(' '))
              .not.toContain('ng-hide');
        }
    );

    it('should hide the spinner when the data are not fetching.',
        function() {
          state().datasource.status = ResultsDataStatus.NODATA;
          var component = setupComponent();
          expect(component.spinnerDiv[0].className.split(' '))
              .toContain('ng-hide');

          state().datasource.status = ResultsDataStatus.FETCHED;
          rootScope.$apply();
          expect(component.spinnerDiv[0].className.split(' '))
              .toContain('ng-hide');
        }
    );

    it('should show the chart when there is no error.',
        function() {
          setupData();
          var component = setupComponent();
          expect(component.chartDiv.hasClass('dashkit-chart-hidden')).
              toBeFalsy();
        }
    );

    it('should hide the chart when there is an error.',
        function() {
          setupData();
          var component = setupComponent();
          state().chart.error = 'fake error';
          rootScope.$apply();
          expect(component.chartDiv.hasClass('dashkit-chart-hidden')).
              toBeTruthy();
        }
    );

    it('should show the chart when data are fetched.',
        function() {
          setupData(true);
          var component = setupComponent();
          expect(component.chartDiv[0].className.split(' '))
              .not.toContain('ng-hide');
        }
    );

    it('should hide the chart when data are not fetched.',
        function() {
          state().datasource.status = ResultsDataStatus.FETCHING;
          var component = setupComponent();
          expect(component.chartDiv[0].className.split(' '))
              .toContain('ng-hide');
        }
    );

    it('should show the error when there is one.',
        function() {
          setupData(true);
          var component = setupComponent();
          state().chart.error = 'fake error';
          rootScope.$apply();
          expect(component.errorDiv[0].className.split(' '))
              .not.toContain('ng-hide');
        }
    );

    it('should hide the error when there is none.',
        function() {
          setupData(true);
          var component = setupComponent();
          expect(component.errorDiv[0].className.split(' '))
              .toContain('ng-hide');
        }
    );
  });

  describe('datasource', function() {

    it('should start to fetch data when the datasource status is TOFETCH.',
        function() {
          setupData();
          setupComponent();

          // Should be fetching data
          rootScope.$apply();
          expect(state().datasource.status).
              toEqual(ResultsDataStatus.FETCHING);
          expect(queryResultDataServiceMock.fetchResults).
              toHaveBeenCalledWith(model.datasource);

          // Ask to fetch again
          state().datasource.status = ResultsDataStatus.TOFETCH;
          rootScope.$apply();
          expect(state().datasource.status).
              toEqual(ResultsDataStatus.FETCHING);
          expect(queryResultDataServiceMock.fetchResults).
              toHaveBeenCalledWith(model.datasource);
        }
    );

    it('should update its state to FETCHED when new data have been fetched.',
        function() {
          setupData();
          setupComponent();

          // Simulate new data have been fetched
          fetchResultsDeferred.resolve(new GvizDataTable());
          rootScope.$apply();
          expect(state().datasource.status).
              toEqual(ResultsDataStatus.FETCHED);
        }
    );

    it('should update its state to NODATA when empty data have been fetched.',
        function() {
          GvizDataTable.prototype.getNumberOfRows.andReturn(0);
          setupData();
          setupComponent();

          // Simulate new data have been fetched
          fetchResultsDeferred.resolve(new GvizDataTable());
          rootScope.$apply();
          expect(state().datasource.status).
              toEqual(ResultsDataStatus.NODATA);
        }
    );

    it('should update its error state when there is an error.',
        function() {
          var errorMessage = 'fake error';
          setupData();
          setupComponent();

          // Simulate a fetch error
          fetchResultsDeferred.reject(new Error(errorMessage));
          rootScope.$apply();
          expect(state().datasource.status).
              toEqual(ResultsDataStatus.ERROR);
        }
    );
  });

  describe('chartWrapper', function() {

    it('should be attached to the chart div.',
        function() {
          var component = setupComponent();

          expect(chartWrapperMock.setContainerId).
              toHaveBeenCalledWith(component.chartDiv[0]);
        }
    );

    it('should be drawn only one time with a table.',
        function() {
          // Change chart type
          model.chart.chartType = ChartType.TABLE;
          setupData(true);
          setupComponent();

          rootScope.$apply();
          rootScope.$apply();
          expect(chartWrapperMock.draw.callCount).toEqual(1);
        }
    );

    it('should be drawn only one time with other charts type.',
        function() {
          // Change chart type
          model.chart.chartType = ChartType.LINE_CHART;
          setupData(true);
          setupComponent();

          rootScope.$apply();
          rootScope.$apply();
          expect(chartWrapperMock.draw.callCount).toEqual(1);
        }
    );

    it('should be drawn when new data are fetched.',
        function() {
          setupData(true);
          setupComponent();
          expect(chartWrapperMock.draw.callCount).toEqual(1);

          // Simulate new data have been fetched
          state().datasource.status = ResultsDataStatus.FETCHING;
          rootScope.$apply();
          state().datasource.status = ResultsDataStatus.FETCHED;

          rootScope.$apply();
          timeout.flush();
          expect(chartWrapperMock.draw.callCount).toEqual(2);
        }
    );

    it('should not be drawn if it has no query.',
        function() {
          setupComponent();
          rootScope.$apply();

          expect(chartWrapperMock.draw).not.toHaveBeenCalled();
        }
    );

    it('should not be drawn if it has no data.',
        function() {
          setupData();
          state().datasource.status = ResultsDataStatus.NODATA;
          setupComponent();

          rootScope.$apply();
          expect(chartWrapperMock.draw).not.toHaveBeenCalled();
        }
    );

    it('should not be drawn if it has no configuration.',
        function() {
          setupData();
          model.chart = null;
          setupComponent();

          rootScope.$apply();
          expect(chartWrapperMock.draw).not.toHaveBeenCalled();
        }
    );

    it('should have a new DataTable when new data have been fetched.',
        function() {
          setupData();
          setupComponent();

          // Simulate new data have been fetched
          fetchResultsDeferred.resolve(new GvizDataTable());

          rootScope.$apply();
          expect(chartWrapperMock.setDataTable).toHaveBeenCalled();
        }
    );

    it('should update the chart error state when it has an error.',
        function() {
          var error = new Error({message: 'fake error', id: 'error-1'});
          setupComponent();

          // Raise a fake error
          gvizChartErrorCallback(error);

          rootScope.$apply();
          expect(state().chart.gvizError).toEqual(error);
        }
    );
  });

  describe('datasource.view', function() {

    it('should be applied at construction of the component if there is data.',
        function() {
          setupData(true);
          setupComponent();

          expect(dataViewServiceMock.create).toHaveBeenCalled();
          expect(chartWrapperMock.setView).toHaveBeenCalledWith(dataViewsJson);
        }
    );

    it('should not be applied at construction of the component if there is ' +
        'no data.',
        function() {
          setupData();
          setupComponent();

          expect(dataViewServiceMock.create).not.toHaveBeenCalled();
          expect(chartWrapperMock.setView).not.toHaveBeenCalled();
        }
    );

    it('should be applied when datasource.view changes.', function() {
      setupData(true);
      setupComponent();
      model.datasource.view.columns = [1, 0];
      rootScope.$apply();

      expect(dataViewServiceMock.create.callCount).toEqual(2);
      expect(chartWrapperMock.setView.callCount).toEqual(2);
    });

    it('should be applied when data changes.', function() {
      setupData(true);
      setupComponent();
      // Simulate new data have been fetched
      state().datasource.status = ResultsDataStatus.FETCHING;
      rootScope.$apply();
      state().datasource.status = ResultsDataStatus.FETCHED;
      rootScope.$apply();

      expect(dataViewServiceMock.create.callCount).toEqual(2);
      expect(chartWrapperMock.setView.callCount).toEqual(2);
    });

    it('should not be applied when the DataView has an error.', function() {
      var expectedError = {error: {property: 'sort', message: 'fake message'}};
      dataViewServiceMock.create.andReturn(expectedError);
      setupData(true);
      setupComponent();

      expect(dataViewServiceMock.create).toHaveBeenCalled();
      expect(chartWrapperMock.setView).not.toHaveBeenCalled();
    });

    it('should trigger a draw after being applied.', function() {
      setupData(true);
      setupComponent();
      expect(chartWrapperMock.draw.callCount).toEqual(1);

      // Modify the model to trigger a new dataview apply
      model.datasource.view.columns = [1, 0];
      rootScope.$apply();
      timeout.flush();
      expect(chartWrapperMock.draw.callCount).toEqual(2);
    });
  });
});
