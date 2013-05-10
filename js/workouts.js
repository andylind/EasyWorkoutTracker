$(function(){

  var Workout = Backbone.Model.extend({
    defaults: function() {
      return {
        weight: 0,
        sets: 0,
        reps: 0,
        order: Workouts.nextOrder(),
      };
    }
  });

  var WorkoutList = Backbone.Collection.extend({
    model: Workout,
    localStorage: new Backbone.LocalStorage("workouts-backbone"),
    nextOrder: function() {
      if (!this.length) return 1;
      return this.last().get('order') + 1;
    }
  });

  var Workouts = new WorkoutList;

  var WorkoutView = Backbone.View.extend({
    tagName:  "li",
    // Cache the template function for a single item.
    template: _.template($('#item-template').html()),
    events: {
      "click a.destroy" : "clear",
      "keypress .edit"  : "updateOnEnter",
    },
    initialize: function() {
      this.model.on('destroy', this.remove, this);
    },
    render: function() {
      this.$el.html(this.template(this.model.toJSON()));
      return this;
    },
    updateOnEnter: function(e) {
      if (e.keyCode == 13) this.close();
    },
    clear: function() {
      this.model.destroy();
       redraw(Workouts);
    }
  });

  var AppView = Backbone.View.extend({
    el: $("#workoutapp"),
    statsTemplate: _.template($('#stats-template').html()),
    events: {
      "keypress #new-weight":  "createOnEnter",
      "keypress #new-sets":  "createOnEnter",
      "keypress #new-reps":  "createOnEnter",
      "click .add":          "addNew"
    },
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
    render: function() {
      if (Workouts.length) {
        this.main.show();
        this.footer.show();
        this.footer.html(this.statsTemplate({total: Workouts.length}));
      } else {
        this.main.hide();
        this.footer.hide();
      }
    },
    addOne: function(workout) {
      var view = new WorkoutView({model: workout});
      this.$("#workout-list").append(view.render().el);
    },
    addAll: function() {
      Workouts.each(this.addOne);
    },
    addNew: function(e) {
      if (!this.inputWeight.val()) return;
      if (!this.inputSets.val()) return;
      if (!this.inputReps.val()) return;
      Workouts.create({
        weight: this.inputWeight.val(),
        sets: this.inputSets.val(), 
        reps: this.inputReps.val()
      });
      this.inputWeight.val('');
      this.inputSets.val('');
      this.inputReps.val('');
      redraw(Workouts);
    },
    createOnEnter: function(e) {
      if (e.keyCode != 13) return;
      this.addNew(e);
    }
  });

  // Finally, we kick things off by creating the **App**.
  var App = new AppView;

});
 

