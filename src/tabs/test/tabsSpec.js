describe('tabs', function() {
  beforeEach(module('ui.bootstrap.tabs', 'template/tabs/tabset.html', 'template/tabs/tab.html'));
  
  describe('basics', function() {

    var scope, elm;
    beforeEach(inject(function($compile, $rootScope) {
      scope = $rootScope.$new();
      scope.first = '1';
      scope.second = '2';
      scope.actives = {};
      scope.selectFirst = function() {};
      scope.selectSecond = function() {};
      elm = $compile([
        '<div>',
        '  <tabset>',
        '    <tab heading="First Tab {{first}}" active="actives.one" select="selectFirst()">',
        '      first content is {{first}}',
        '    </tab>',
        '    <tab active="actives.two" select="selectSecond()">',
        '      <tab-heading><b>Second</b> Tab {{second}}</tab-heading>',
        '      second content is {{second}}',
        '    </tab>',
        '  </tabs>',
        '</div>'
      ].join('\n'))(scope);
      scope.$apply();
      return elm;
    }));

    function titles() {
      return elm.find('ul.nav-tabs li');
    }
    function content() {
      return elm.find('div.tab-content div.tab-pane');
    }

    it('should create clickable titles', function() {
      var t = titles();
      expect(t.length).toBe(2);
      expect(t.find('a').eq(0).text()).toBe('First Tab 1');
      //It should put the tab-heading element into the 'a' title
      expect(t.find('a').eq(1).children().is('tab-heading')).toBe(true);
      expect(t.find('a').eq(1).children().html()).toBe('<b>Second</b> Tab 2');
    });

    it('should bind first tab content and set active by default', function() {
      expect(content().length).toBe(1);
      expect(content().text().trim()).toBe('first content is 1');
      expect(titles().eq(0)).toHaveClass('active');
      expect(titles().eq(1)).not.toHaveClass('active');
      expect(scope.actives.one).toBe(true);
      expect(scope.actives.two).toBe(false);
    });

    it('should change active on click', function() {
      titles().eq(1).find('a').click();
      expect(content().text().trim()).toBe('second content is 2');
      expect(titles().eq(0)).not.toHaveClass('active');
      expect(titles().eq(1)).toHaveClass('active');
      expect(scope.actives.one).toBe(false);
      expect(scope.actives.two).toBe(true);
    });

    it('should call select callback on select', function() {
      spyOn(scope, 'selectFirst');
      spyOn(scope, 'selectSecond');
      titles().eq(1).find('a').click();
      expect(scope.selectSecond).toHaveBeenCalled();
      titles().eq(0).find('a').click();
      expect(scope.selectFirst).toHaveBeenCalled();
    });

  });

  describe('ng-repeat', function() {

    var scope, elm;
    beforeEach(inject(function($compile, $rootScope) {
      scope = $rootScope.$new();

      function makeTab() {
        var t = {active: false, select: function() {}};
        t.selectSpy = spyOn(t, 'select');
        return t;
      }
      scope.tabs = [
        makeTab(), makeTab(), makeTab(), makeTab()
      ];
      elm = $compile([
        '<tabset>',
        '  <tab ng-repeat="t in tabs" active="t.active" select="t.select()">',
        '    <tab-heading><b>heading</b> {{index}}</tab-heading>',
        '    content {{$index}}',
        '  </tab>',
        '</tabset>'
      ].join('\n'))(scope);
      scope.$apply();
    }));

    function titles() {
      return elm.find('ul.nav-tabs li');
    }
    function content() {
      return elm.find('div.tab-content div.tab-pane');
    }

    function expectTabActive(activeTab) {
      var _titles = titles();
      angular.forEach(scope.tabs, function(tab, i) {
        if (activeTab === tab) {
          expect(tab.active).toBe(true);
          //It should only call select ONCE for each select
          expect(tab.selectSpy.callCount).toBe(1);
          expect(_titles.eq(i)).toHaveClass('active');
          expect(content().text().trim()).toBe('content ' + i);
        } else {
          expect(tab.active).toBe(false);
          expect(_titles.eq(i)).not.toHaveClass('active');
        }
      });
    }

    it('should make tab titles with first content and first active', function() {
      expect(titles().length).toBe(scope.tabs.length);
      expectTabActive(scope.tabs[0]);
    });

    it('should switch active when clicking', function() {
      titles().eq(3).find('a').click();
      expectTabActive(scope.tabs[3]);
    });

    it('should switch active when setting active=true', function() {
      scope.$apply('tabs[2].active = true');
      expectTabActive(scope.tabs[2]);
    });

    it('should deselect all when no tabs are active', function() {
      angular.forEach(scope.tabs, function(t) { t.active = false; });
      scope.$apply();
      expectTabActive(null);
      expect(content().html().trim()).toBe('');

      scope.tabs[2].active = true;
      scope.$apply();
      expectTabActive(scope.tabs[2]);
    });
  });

  describe('advanced tab-heading element', function() {
    var scope, elm;
    beforeEach(inject(function($compile, $rootScope) {
      scope = $rootScope.$new();
      scope.myHtml = "<b>hello</b>, there!";
      scope.value = true;
      elm = $compile([
        '<tabset>',
        '  <tab>',
        '    <tab-heading ng-bind-html-unsafe="myHtml" ng-show="value">',
        '    </tab-heading>',
        '  </tab>',
        '  <tab><data-tab-heading>1</data-tab-heading></tab>',
        '  <tab><div data-tab-heading>2</div></tab>',
        '  <tab><div tab-heading>3</div></tab>',
        '</tabset>'
      ].join('\n'))(scope);
      scope.$apply();
    }));

    function heading() {
      return elm.find('ul li a').children();
    }

    it('should create a heading bound to myHtml', function() {
      expect(heading().eq(0).html()).toBe("<b>hello</b>, there!");
    });

    it('should hide and show the heading depending on value', function() {
      expect(heading().eq(0).css('display')).not.toBe('none');
      scope.$apply('value = false');
      expect(heading().eq(0).css('display')).toBe('none');
      scope.$apply('value = true');
      expect(heading().eq(0).css('display')).not.toBe('none');
    });

    it('should have a tab-heading no matter what syntax was used', function() {
      expect(heading().eq(1).text()).toBe('1');
      expect(heading().eq(2).text()).toBe('2');
      expect(heading().eq(3).text()).toBe('3');
    });
    
  });

  //Tests that http://git.io/lG6I9Q is fixed
  describe('tab ordering', function() {
    var elm, scope;
    beforeEach(inject(function($compile, $rootScope) {
      scope = $rootScope.$new();
      scope.tabs = [
        { title:"Title 1", available:true },
        { title:"Title 2", available:true },
        { title:"Title 3", available:true }
      ];
      elm = $compile([
        '<tabset>',
        '  <!-- a comment -->',
        '  <div>div that makes troubles</div>',
        '  <tab heading="first">First Static</tab>',
        '  <div>another div that may do evil</div>',
        '  <tab ng-repeat="tab in tabs | filter:tabIsAvailable" active="tab.active" heading="{{tab.title}}">some content</tab>',
        '  <!-- another comment -->',
        '  <tab heading="mid">Mid Static</tab>',
        '  a text node',
        '  <!-- another comment -->',
        '  <span>yet another span that may do evil</span>',
        '  <tab ng-repeat="tab in tabs | filter:tabIsAvailable" active="tab.active" heading="Second {{tab.title}}">some content</tab>',
        '  a text node',
        '  <span>yet another span that may do evil</span>',
        '  <!-- another comment -->',
        '  <tab heading="last">Last Static</tab>',
        '  a text node',
        '  <span>yet another span that may do evil</span>',
        '  <!-- another comment -->',
        '</tabset>'
      ].join('\n'))(scope);

      scope.tabIsAvailable = function(tab) {
        return tab.available;
      };
    }));

    it('should preserve correct ordering', function() {
      function titles() {
        return elm.find('ul.nav-tabs li a');
      }
      scope.$apply();
      expect(titles().length).toBe(9);
      scope.$apply('tabs[1].available=false');
      scope.$digest();
      expect(titles().length).toBe(7);
      scope.$apply('tabs[0].available=false');
      scope.$digest();
      expect(titles().length).toBe(5);
      scope.$apply('tabs[2].available=false');
      scope.$digest();
      expect(titles().length).toBe(3);
      scope.$apply('tabs[0].available=true');
      scope.$digest();
      expect(titles().length).toBe(5);
      scope.$apply('tabs[1].available=true');
      scope.$apply('tabs[2].available=true');
      scope.$digest();
      expect(titles().length).toBe(9);
      expect(titles().eq(0).text().trim()).toBe("first");
      expect(titles().eq(1).text().trim()).toBe("Title 1");
      expect(titles().eq(2).text().trim()).toBe("Title 2");
      expect(titles().eq(3).text().trim()).toBe("Title 3");
      expect(titles().eq(4).text().trim()).toBe("mid");
      expect(titles().eq(5).text().trim()).toBe("Second Title 1");
      expect(titles().eq(6).text().trim()).toBe("Second Title 2");
      expect(titles().eq(7).text().trim()).toBe("Second Title 3");
      expect(titles().eq(8).text().trim()).toBe("last");
    });
  });

  describe('tabset controller', function() {
    function mockTab() {
      return { active: false };
    }

    var scope, ctrl;
    beforeEach(inject(function($controller, $rootScope) {
      scope = $rootScope;
      //instantiate the controller stand-alone, without the directive
      ctrl = $controller('TabsetController', {$scope: scope, $element: null});
    }));


    describe('select', function() {

      it('should mark given tab selected', function() {
        var tab = mockTab();

        ctrl.select(tab);
        expect(tab.active).toBe(true);
      });


      it('should deselect other tabs', function() {
        var tab1 = mockTab(), tab2 = mockTab(), tab3 = mockTab();

        ctrl.addTab(tab1);
        ctrl.addTab(tab2);
        ctrl.addTab(tab3);

        ctrl.select(tab1);
        expect(tab1.active).toBe(true);
        expect(tab2.active).toBe(false);
        expect(tab3.active).toBe(false);

        ctrl.select(tab2);
        expect(tab1.active).toBe(false);
        expect(tab2.active).toBe(true);
        expect(tab3.active).toBe(false);

        ctrl.select(tab3);
        expect(tab1.active).toBe(false);
        expect(tab2.active).toBe(false);
        expect(tab3.active).toBe(true);
      });
    });


    describe('addTab', function() {

      it('should append tab', function() {
        var tab1 = mockTab(), tab2 = mockTab();

        expect(ctrl.tabs).toEqual([]);

        ctrl.addTab(tab1);
        expect(ctrl.tabs).toEqual([tab1]);

        ctrl.addTab(tab2);
        expect(ctrl.tabs).toEqual([tab1, tab2]);
      });


      it('should select the first one', function() {
        var tab1 = mockTab(), tab2 = mockTab();

        ctrl.addTab(tab1);
        expect(tab1.active).toBe(true);

        ctrl.addTab(tab2);
        expect(tab1.active).toBe(true);
      });
    });
  });

  describe('remove', function() {

    it('should remove title tabs when elements are destroyed and change selection', inject(function($controller, $compile, $rootScope) {
      var scope = $rootScope.$new();
      var elm = $compile("<tabset><tab heading='1'>Hello</tab><tab ng-repeat='i in list' heading='tab {{i}}'>content {{i}}</tab></tabset>")(scope);
      scope.$apply();

      function titles() {
        return elm.find('ul.nav-tabs li');
      }
      function content() {
        return elm.find('div.tab-pane');
      }

      expect(titles().length).toBe(1);
      expect(content().length).toBe(1);

      scope.$apply('list = [1,2,3]');
      expect(titles().length).toBe(4);
      titles().find('a').eq(3).click();
      expect(content().text().trim()).toBe('content 3');
      expect(titles().eq(3)).toHaveClass('active');
      expect(titles().eq(3).text().trim()).toBe('tab 3');

      scope.$apply('list = [1,2]');
      expect(titles().length).toBe(3);
      expect(content().text().trim()).toBe('content 2');
      expect(titles().eq(2)).toHaveClass('active');
      expect(titles().eq(2).text().trim()).toBe('tab 2');
    }));
  });

  describe('tab content state', function() {
    var elm;
    beforeEach(inject(function($compile, $rootScope) {
      elm = $compile([
        '<tabset>',
        '  <tab heading="one">',
        '    <input type="text">',
        '  </tab>',
        '  <tab heading="two">',
        '    <input type="text">',
        '  </tab>',
        '</tabset>'
      ].join('\n'))($rootScope);
      $rootScope.$apply();
    }));

    it('should preserve contents when switching tabs', function() {
      var titles = elm.find('ul li a');
      function getInput() { return elm.find('input'); }
      getInput().val("hello!");
      titles.eq(1).click();
      getInput().val("goodbye!");
      titles.eq(0).click();
      expect(getInput().val()).toBe("hello!");
      titles.eq(1).click();
      expect(getInput().val()).toBe("goodbye!");
    });
  });
});
