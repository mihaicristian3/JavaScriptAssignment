
angular.module('myApp', ['ajoslin.promise-tracker'])
  .controller('help', function ($scope, $http, $log, promiseTracker, $timeout) {
    $scope.subjectListOptions = {
      'bug': 'Report a Bug',
      'account': 'Account Problems',
      'mobile': 'Mobile',
      'user': 'Report a Malicious User',
      'other': 'Other'
    };
  
    $scope.progress = promiseTracker();

    // Form submit handler.
    $scope.submit = function(form) {
      // Trigger validation flag.
      $scope.submitted = true;

      // If form is invalid, return and let AngularJS show validation errors.
      if (form.$invalid) {
        return;
      }

      // Default values for the request.
      var config = {
        params : {
          'callback' : 'JSON_CALLBACK',
          'firstName' : $scope.firstName,
            'lastName' : $scope.lastName,
          'email' : $scope.email,
          'phoneNumber' : $scope.phoneNumber,
          'comments' : $scope.comments
        },
      };

      // Perform JSONP request.
        
      var $promise = $http.jsonp( "http://private-e2353-js8.apiary-mock.com/posttoform", 'response.json', config)
        .success(function(data, status, headers, config) {
          if (data.status == 'OK') {
            $scope.firstName = null;
            $scope.lastName = null;   
            $scope.email = null;
            $scope.phoneNumber = null;
            $scope.comments = null;
            $scope.messages = 'Your form has been sent!';
            $scope.submitted = false;
          } else {
            $scope.messages = 'Oops, we received your request, but there was an error processing it.';
            $log.error(data);
          }
        })
        .error(function(data, status, headers, config) {
          $scope.progress = data;
          $scope.messages = 'There was a network error. Try again later.';
          $log.error(data);
        })
        .finally(function() {
          // Hide status messages after three seconds.
          $timeout(function() {
            $scope.messages = null;
          }, 3000);
        });

      // Track the request and show its progress to the user.
      $scope.progress.addPromise($promise);
    };
  });
