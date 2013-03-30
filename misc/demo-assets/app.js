
angular.module('bootstrapDemoApp', ['ui.directives', 'ui.bootstrap', 'plunker']);

function MainCtrl($scope, $http, orderByFilter) {
  var url = "http://50.116.42.77:3001";
  $scope.selectedModules = [];
  //iFrame for downloading
  var $iframe = $("<iframe>").css('display','none').appendTo(document.body);

  $scope.showBuildModal = function() {
    $scope.buildModalShown = true;
    //Load modules if they aren't loaded yet
    if (!$scope.modules) {
      $http.get(url + "/api/bootstrap").then(function(response) {
        $scope.modules = response.data.modules;
      }, function() {
        $scope.buildGetErrorText = "Error retrieving build files from server.";
      });
    }
  };

  //Tabs lazily insert code into the dom, so we have to color the javascript
  //code lazily too.
  $scope.onCodeTabSelected = function() {
    Rainbow.color();
  };

  $scope.downloadBuild = function() {
    var downloadUrl = url + "/api/bootstrap/download?";
    angular.forEach($scope.selectedModules, function(module) {
      downloadUrl += "modules=" + module + "&";
    });
    $iframe.attr('src','');
    $iframe.attr('src', downloadUrl);
    $scope.buildModalShown = false;
  };
}
