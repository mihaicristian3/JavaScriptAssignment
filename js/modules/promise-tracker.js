(function () {

angular.module('ajoslin.promise-tracker', [])

.provider('promiseTracker', function() {
  var trackers = {};

  this.$get = ['$q', '$timeout', function($q, $timeout) {
    function cancelTimeout(promise) {
      if (promise) {
        $timeout.cancel(promise);
      }
    }

    return function PromiseTracker(options) {
      if (!(this instanceof PromiseTracker)) {
        return new PromiseTracker(options);
      }

      options = options || {};

      var tracked = [];
      var self = this;
      var minDuration = options.minDuration;
      var activationDelay = options.activationDelay;
      var minDurationPromise;
      var activationDelayPromise;

      self.active = function() {

        if (activationDelayPromise) {
          return false;
        }
        return tracked.length > 0;
      };

      self.tracking = function() {

        return tracked.length > 0;
      };

      self.destroy = self.cancel = function() {
        minDurationPromise = cancelTimeout(minDurationPromise);
        activationDelayPromise = cancelTimeout(activationDelayPromise);
        for (var i=tracked.length-1; i>=0; i--) {
          tracked[i].resolve();
        }
        tracked.length = 0;
      };


      self.createPromise = function() {
        var deferred = $q.defer();
        tracked.push(deferred);

        if (tracked.length === 1) {
          if (activationDelay) {
            activationDelayPromise = $timeout(function() {
              activationDelayPromise = cancelTimeout(activationDelayPromise);
              startMinDuration();
            }, activationDelay);
          } else {
            startMinDuration();
          }
        }

        deferred.promise.then(onDone(false), onDone(true));

        return deferred;

        function startMinDuration() {
          if (minDuration) {
            minDurationPromise = $timeout(angular.noop, minDuration);
          }
        }

        function onDone(isError) {
          return function(value) {
            (minDurationPromise || $q.when()).then(function() {
              var index = tracked.indexOf(deferred);
              tracked.splice(index, 1);


              if (tracked.length === 0) {
                activationDelayPromise = cancelTimeout(activationDelayPromise);
              }
            });
          };
        }
      };

      self.addPromise = function(promise) {
        var then = promise && (promise.then || promise.$then ||
                               (promise.$promise && promise.$promise.then));
        if (!then) {
          throw new Error("promiseTracker#addPromise expects a promise object!");
        }
        var deferred = self.createPromise();


        then(function success(value) {
          deferred.resolve(value);
          return value;
        }, function error(value) {
          deferred.reject(value);
          return $q.reject(value);
        });

        return deferred;
      };
    };
  }];
});

}());