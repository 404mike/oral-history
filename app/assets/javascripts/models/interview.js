app.models.Interview = Backbone.Model.extend({

  defaults: function() {
    return {
      id: 0,
      slug: '',
      storyteller_name: '',
      searchable: '',
      transcript_url: '',
      annotations: [],
      matched_annotations: [],
      summary: ''
    };
  },

  initialize: function(){},

  url: function() {
    return '/interviews/' + this.get('id') + '.json';
  },

  parse: function(resp, options) {
    // no response means successful update
    if (!resp) {
      console.log('Saved.');
      return false;
    }
    var annotations;
    // if this is a collection, just return the parsed json
    if (options.collection){
      annotations = [];
      if ( resp.annotations && resp.annotations.length ) {
        annotations = $.parseJSON(resp.annotations);
      }
    // otherwise, build the annotations as a backbone collection
    } else {
      annotations = new app.collections.Annotations;
      // convert annotations string to json
      if ( resp.annotations && resp.annotations.length ) {
        _.each( $.parseJSON(resp.annotations), function( m ) {
          annotations.add(new app.models.Annotation(m));
        });
      }
      console.log('Retrieved interview with '+resp.storyteller_name);
    }
    var searchable = [resp.summary, resp.storyteller_name, resp.location, resp.notes, resp.occupations, resp.other_locations, resp.place_of_birth];
    return {
      annotations: annotations,
      id: resp.slug,
      image: resp.image,
      slug: resp.slug,
      storyteller_name: resp.storyteller_name,
      searchable: searchable.join(' '),
      url: resp.url,
      transcript_url: resp.transcript_url,
      branch_id: resp.branch_id,
      branch_name: resp.branch_name,
      summary: resp.summary
    };
  },

  toJSON: function(){
    var valid_attributes = {};
    // convert annotations json to string
    valid_attributes.annotations = JSON.stringify( this.get('annotations').toJSON() );
    return {
      interview: valid_attributes
    }
  },

  toReadOnlyJSON: function(){
    return _.clone( this.attributes );
  }

});
