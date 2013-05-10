// Load the application once the DOM is ready, using `jQuery.ready`:
$(function(){

  // Workout Model
  var Workout = Backbone.Model.extend({
    // Default attributes for the workout item.
    defaults: function() {
      return {
        title: "empty workout...",
        sets: 0,
        reps: 0,
        order: Workouts.nextOrder(),
      };
    },
  });

  // Workout Collection
  var WorkoutList = Backbone.Collection.extend({

    // Reference to this collection's model.
    model: Workout,

    // Save all of the workout items under the `"workouts-backbone"` namespace.
    localStorage: new Backbone.LocalStorage("workouts-backbone"),

    // Filter down the list of all workout items that are finished.
    done: function() {
      return this.filter(function(workout){ return workout.get('done'); });
    },

    // Filter down the list to only workout items that are still not finished.
    remaining: function() {
      return this.without.apply(this, this.done());
    },

    // We keep the Workouts in sequential order, despite being saved by unordered
    // GUID in the database. This generates the next order number for new items.
    nextOrder: function() {
      if (!this.length) return 1;
      return this.last().get('order') + 1;
    },

    // Workouts are sorted by their original insertion order.
    comparator: function(workout) {
      return workout.get('order');
    }

  });

  // Create our global collection of **Workouts**.
  var Workouts = new WorkoutList;

  // Workout Item View
  // --------------

  // The DOM element for a workout item...
  var WorkoutView = Backbone.View.extend({

    //... is a list tag.
    tagName:  "li",

    // Cache the template function for a single item.
    template: _.template($('#item-template').html()),

    // The DOM events specific to an item.
    events: {
      "click a.destroy" : "clear",
      "keypress .edit"  : "updateOnEnter",
    },

    // The WorkoutView listens for changes to its model, re-rendering. Since there's
    // a one-to-one correspondence between a **Workout** and a **WorkoutView** in this
    // app, we set a direct reference on the model for convenience.
    initialize: function() {
      this.model.on('destroy', this.remove, this);
    },

    // Re-render the titles of the workout item.
    render: function() {
      this.$el.html(this.template(this.model.toJSON()));
      return this;
    },

    // If you hit `enter`, we're through editing the item.
    updateOnEnter: function(e) {
      if (e.keyCode == 13) this.close();
    },

    // Remove the item, destroy the model.
    clear: function() {
      this.model.destroy();
       redraw(Workouts);
    }

  });

  // The Application
  // ---------------

  // Our overall **AppView** is the top-level piece of UI.
  var AppView = Backbone.View.extend({

    // Instead of generating a new element, bind to the existing skeleton of
    // the App already present in the HTML.
    el: $("#workoutapp"),

    // Our template for the line of statistics at the bottom of the app.
    statsTemplate: _.template($('#stats-template').html()),

    // Delegated events for creating new items, and clearing completed ones.
    events: {
      "keypress #new-weight":  "createOnEnter",
      "keypress #new-sets":  "createOnEnter",
      "keypress #new-reps":  "createOnEnter",
      "click .add":          "addNew"
    },

    // At initialization we bind to the relevant events on the `Workouts`
    // collection, when items are added or changed. Kick things off by
    // loading any preexisting workouts that might be saved in *localStorage*.
    initialize: function() {

      this.inputWeight = this.$("#new-weight");
      this.inputSets = this.$("#new-sets");
      this.inputReps = this.$("#new-reps");

      Workouts.on('add', this.addOne, this);
      Workouts.on('reset', this.addAll, this);
      Workouts.on('all', this.render, this);

      this.footer = this.$('footer');
      this.main = $('#main');

      Workouts.fetch();
      
      chartinit(Workouts);
    },

    // Re-rendering the App just means refreshing the statistics -- the rest
    // of the app doesn't change.
    render: function() {
      var done = Workouts.done().length;
      var remaining = Workouts.remaining().length;

      if (Workouts.length) {
        this.main.show();
        this.footer.show();
        this.footer.html(this.statsTemplate({done: done, remaining: remaining}));
      } else {
        this.main.hide();
        this.footer.hide();
      }


    },

    // Add a single workout item to the list by creating a view for it, and
    // appending its element to the `<ul>`.
    addOne: function(workout) {
      var view = new WorkoutView({model: workout});
      this.$("#workout-list").append(view.render().el);
    },

    // Add all items in the **Workouts** collection at once.
    addAll: function() {
      Workouts.each(this.addOne);
    },
    
    addNew: function(e) {
      if (!this.inputWeight.val()) return;
      if (!this.inputSets.val()) return;
      if (!this.inputReps.val()) return;
      Workouts.create({
        title: this.inputWeight.val(),
        sets: this.inputSets.val(), 
        reps: this.inputReps.val()
      });
      this.inputWeight.val('');
      this.inputSets.val('');
      this.inputReps.val('');
      
      redraw(Workouts);
    },
    
    // If you hit return in the main input field, create new **Workout** model,
    // persisting it to *localStorage*.
    createOnEnter: function(e) {
      if (e.keyCode != 13) return;
      this.addNew(e);
    },
    
      });

  // Finally, we kick things off by creating the **App**.
  var App = new AppView;

});
    
    
    
    var chartinit = function(workouts) {
        
        width = 380;
        height = 200;
        
        data = [];
        for(var i = 0; i < workouts.length; i++) data[i] = 
          workouts.at(i).get("title") 
          * workouts.at(i).get("reps")
          * workouts.at(i).get("sets");
        // Create the initial SVG container for the chart
        chart.svg = d3.select('#chart')
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('id', 'chartSVG');
        
        // Define the X and Y scales
        chart.x = d3.scale.linear()
            .domain([0, data.length])
            .range([0, width]);
        
        chart.y = d3.scale.linear()
            .domain([Math.max.apply(Math, data), 0])
            .range([0,height]);
        
        // Define the line generator
        chart.lineGen = d3.svg.line()
            .x(function(d, i) {
                return chart.x(i);
            })
            .y(function(d) {
                return chart.y(d);
            });
            
        var xAxis = d3.svg.axis()
            .scale(chart.x)
            .orient("bottom")
            .ticks(5);

        var yAxis = d3.svg.axis()
            .scale(chart.y)
            .orient("left")
            .ticks(5);

    
    
      chart.svg.append("g")
      .attr("class", "axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  chart.svg.append("g")
      .attr("class", "axis")
      .call(yAxis)

        
        
        // Generate a line graph in the SVG container,
        // using the initial data
        chart.line = chart.svg
            .append('svg:path')
            .attr('d', chart.lineGen(data));
            
       
      };

      var redraw = function(workouts) {
        width = 380;
        height = 200;
        
        data = [];
        for(var i = 0; i < workouts.length; i++) data[i] =           workouts.at(i).get("title") 
          * workouts.at(i).get("reps")
          * workouts.at(i).get("sets");
        // update the x and y scales with the new data
        chart.x = d3.scale.linear()
            .domain([0, data.length])
            .range([0,width]);
        
        chart.y = d3.scale.linear()
            .domain([Math.max.apply(Math, data) + 1, 0])
            .range([0,height]);
        
               // Define the line generator
        chart.lineGen = d3.svg.line()
            .x(function(d, i) {
                return chart.x(i);
            })
            .y(function(d) {
                return chart.y(d);
            });
        
        // rather than add a new line, we can just use transitions
        // and update the 'd' attribute of the SVG path used to
        // originally generate the line
        chart.line
            .transition()
            .duration(300)
            .attr('d', chart.lineGen(data));
      };


