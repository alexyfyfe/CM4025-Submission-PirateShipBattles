angular.module('app.routes', ['ngRoute'])

  .config(function($routeProvider, $locationProvider) {

    $routeProvider

        //PRE-LOGGED IN PAGES
      // route for the home page
      .when('/', {
        templateUrl: 'app/views/pages/home.html'
      })

      // login page
      .when('/login', {
        templateUrl: 'app/views/pages/login.html',
        controller: 'mainController',
        controllerAs: 'login'
      })

        .when('/register', {
            templateUrl: 'app/views/pages/register.html',
            controller: 'userCreateController',
            controllerAs: 'user'
        })

            //LOGGED IN PAGES
        // leaderboard page
        .when('/leaderboard', {
            templateUrl: 'app/views/pages/leaderboard.html',
            controller: 'userController',
            controllerAs: 'user'
        })

        // garage page
        .when('/dockyard/:user_id', {
            templateUrl: 'app/views/pages/dockyard.html',
            controller: 'userEditController',
            controllerAs: 'user'
        })

        // race page
        .when('/battle/:user_id', {
            templateUrl: 'app/views/pages/battle.html',
            controller: 'userEditController',
            controllerAs: 'user'
        })

        // account page
        .when('/account/:user_id', {
            templateUrl: 'app/views/pages/account.html',
            controller: 'userEditController',
            controllerAs: 'user'
        })

            //ADMIN PAGES
        // admin page
        .when('/admin', {
            templateUrl: 'app/views/pages/admin.html',
            controller: 'userController',
            controllerAs: 'user'
        })

      // show all users
      .when('/users', {
        templateUrl: 'app/views/pages/users/all.html',
        controller: 'userController',
        controllerAs: 'user'
      })

      // form to create a new user
      // same view as edit page
      .when('/users/create', {
        templateUrl: 'app/views/pages/users/single.html',
        controller: 'userCreateController',
        controllerAs: 'user'
      })

      // page to edit a user
      .when('/users/:user_id', {
        templateUrl: 'app/views/pages/users/single.html',
        controller: 'userEditController',
        controllerAs: 'user'
      });

    $locationProvider.html5Mode(true);

  });