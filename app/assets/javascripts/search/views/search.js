app.views.Search = Backbone.View.extend({

  el: '#search',

  endpoint: 'https://oralhistoryapi.herokuapp.com/search',

  resultTemplate: JST['search_result'],

  initialize: function(params){
    this.params = this.parseParams(params);
    console.log('Initializing search', this.params);

    this.$('.query').text(this.params.q);
    this.search();
    this.loadListeners();
  },

  empty: function(){
    this.showContainer('.empty-result');
    return false;
  },

  error: function(){
    this.showContainer('.error-search');
    return false;
  },

  highlight: function(haystack, needle){
    needle = needle || this.params.q;

    var words = needle.split(/[ ]+/);
    var highlighted = haystack;
    _.each(words, function(word){
      var re = new RegExp('('+word+')','gi');
      highlighted = highlighted.replace(re,'<em>$1</em>')
    });

    return highlighted;
  },

  loading: function(){
    this.showContainer('.loading');
  },

  loadListeners: function(){
    var _this = this;

    // simply submit form when select is changed
    this.$('.search-filter-form select').on('change', function(){
      $(this).closest('form').submit();
    });

    this.$('.query-link').on('click', function(e){
      e.preventDefault();
      _this.populateQuery($(this).text());
    });
  },

  onSearch: function(resp){
    // error
    if (!resp || !resp.hits) return this.error();

    // no results
    if (!resp.hits.total) return this.empty();

    var results = this.parseResults(resp.hits.hits);
    this.render(results);
  },

  parseParams: function(params){
    var defaults = {q: ''};
    params = _.extend({}, defaults, params);
    var validParams = {q: params.q};

    // remove any blank filters
    var validFilters = [];
    if (params.filters) {
      _.each(params.filters, function(value, key){
        if (_.isNumber(value) || value.length) validFilters.push([key, value]);
      });
    }

    // add valid filters to params
    if (validFilters.length) {
      validParams.filters = _.object(validFilters);
    }

    return validParams;
  },

  parseResults: function(hits){
    var _this = this;
    var results = [];

    _.each(hits, function(hit){
      // retrieve item level properties
      var result = { id: hit._id, annotations: [], lines: [] };
      result = _.extend({}, result, hit._source);

      if (result.title) result.title = _this.highlight(result.title);
      if (result.description) {
        if (result.description.length > 1000) {
          result.description = result.description.slice(0, 1000) + "...";
        }
        result.description = _this.highlight(result.description);
      }

      if (hit.inner_hits) {
        // retrieve annotations
        result.annotations = _.map(hit.inner_hits.annotation.hits.hits, function(a){
          return {
            time: a._source.start,
            text: a.highlight.text[0]
          };
        });

        // retrieve lines
        var hlines = _.map(hit.inner_hits.line.hits.hits, function(l){
          return [l._id, {
            label: 'Human-generated transcript text',
            time: l._source.start,
            text: l.highlight.best_text[0]
          }];
        });

        // retrieve original lines
        var olines = _.map(hit.inner_hits.original_line.hits.hits, function(l){
          return [l._id, {
            label: 'Computer-generated transcript text',
            time: l._source.start,
            text: l.highlight.original_text[0]
          }];
        });

        // merge lines and original lines
        hlines = _.object(hlines);
        olines = _.object(olines);
        var lines = _.extend(olines, hlines);
        result.lines = _.map(lines, function(line, id){
          return line;
        });
      }

      results.push(result);
    });

    return results;
  },

  populateQuery: function(q){
    this.$('input[name="q"]').val(q);
  },

  render: function(results){
    var $results = this.$('#search-results');

    $results.empty();
    var $wrapper = $('<div>');
    var template = this.resultTemplate;

    _.each(results, function(result){
      var $result = template({r: result});
      $wrapper.append($result);
    });

    $results.append($wrapper);
    this.showContainer('.results');
  },

  search: function(){
    // empty query
    if (!this.params.q.length) return false;

    // loading
    this.loading();

    // do request
    var _this = this;
    var paramString = $.param(this.params);
    var url = this.endpoint + '?' + paramString;
    console.log('GET '+url);
    $.getJSON(url, function(data) {
      _this.onSearch(data);
    });
  },

  showContainer: function(el){
    this.$('.search-container').removeClass('active');
    this.$(el).addClass('active');
  },

});
