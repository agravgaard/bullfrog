/*
 * Copyright 2013-2019 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* global glowroot, $ */

glowroot.controller('JvmCtrl', [
  '$scope',
  '$location',
  '$http',
  '$timeout',
  'queryStrings',
  function ($scope, $location, $http, $timeout, queryStrings) {
    // \u00b7 is &middot;
    document.title = 'JVM \u00b7 BullFrog';
    $scope.$parent.activeNavbarItem = 'jvm';

    $scope.range = {};

    $scope.hideMainContent = function () {
      return $scope.layout.central && !$scope.agentRollupId && !$scope.agentId;
    };

    $scope.currentUrl = function () {
      return $location.path().substring(1);
    };

    function agentRollupUrl(path, agentRollupId) {
      var query = $scope.agentRollupQuery(agentRollupId);
      return path + queryStrings.encodeObject(query);
    }

    $scope.agentRollupUrl = function (agentRollupId) {
      var path = $location.path().substring(1);
      if ($scope.isRollup(agentRollupId)) {
        return agentRollupUrl('jvm/gauges', agentRollupId);
      }
      return agentRollupUrl(path, agentRollupId);
    };

    $scope.gaugeQueryString = function () {
      return $scope.agentQueryString();
    };

    if ($scope.layout.central) {

      $scope.$watch(function () {
        return $location.url();
      }, function (newValue, oldValue) {
        if (newValue !== oldValue) {
          // need to refresh selectpicker in order to update hrefs of the items
          $timeout(function () {
            // timeout is needed so this runs after dom is updated
            $('#topLevelAgentRollupDropdown').selectpicker('refresh');
            $('#childAgentRollupDropdown').selectpicker('refresh');
          });
        }
      }, true);

      var getRefreshArgs = function () {
        if ($location.path().substring(1) === 'jvm/gauges' && $scope.agentRollupId) {
          return {
            from: $scope.range.chartFrom,
            to: $scope.range.chartTo,
            message: 'No active agents in this time period'
          };
        } else {
          var now = new Date().getTime();
          return {
            from: now - 7 * 24 * 60 * 60 * 1000,
            // looking to the future just to be safe
            to: now + 7 * 24 * 60 * 60 * 1000,
            message: 'No active agents in the past 7 days'
          };
        }
      };

      var refreshTopLevelAgentRollups = function () {
        var args = getRefreshArgs();
        $scope.refreshTopLevelAgentRollups(args.from, args.to, args.message);
      };

      var refreshChildAgentRollups = function () {
        var args = getRefreshArgs();
        $scope.refreshChildAgentRollups(args.from, args.to, args.message);
      };

      $('#topLevelAgentRollupDropdown').on('show.bs.select', refreshTopLevelAgentRollups);
      $('#childAgentRollupDropdown').on('show.bs.select', refreshChildAgentRollups);

      if ($scope.topLevelAgentRollups === undefined) {
        // timeout is needed to give gauge controller a chance to set chartFrom/chartTo
        $timeout(function () {
          refreshTopLevelAgentRollups();
          refreshChildAgentRollups();
        });
      }
    }
  }
]);
