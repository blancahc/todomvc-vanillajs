//REMOVE JQUERY
//bindEvents

/*global jQuery, Handlebars, Router */
jQuery(function ($) {
	'use strict';

	Handlebars.registerHelper('eq', function (a, b, options) {
		return a === b ? options.fn(this) : options.inverse(this);
	});

	var ENTER_KEY = 13;
	var ESCAPE_KEY = 27;

	var util = {
		uuid: function () {
			/*jshint bitwise:false */
			var i, random;
			var uuid = '';

			for (i = 0; i < 32; i++) {
				random = Math.random() * 16 | 0;
				if (i === 8 || i === 12 || i === 16 || i === 20) {
					uuid += '-';
				}
				uuid += (i === 12 ? 4 : (i === 16 ? (random & 3 | 8) : random)).toString(16);
			}

			return uuid;
		},
		pluralize: function (count, word) {
			return count === 1 ? word : word + 's';
		},
		store: function (namespace, data) {
			if (arguments.length > 1) {
				return localStorage.setItem(namespace, JSON.stringify(data));
			} else {
				var store = localStorage.getItem(namespace);
				return (store && JSON.parse(store)) || [];
			}
		}
	};

	var App = {
		init: function () {
			this.todos = util.store('todos-jquery');
			// this.todoTemplate = Handlebars.compile($('#todo-template').html());
			var sourceTodoTemplate = document.getElementById('todo-template').innerHTML;
			this.todoTemplate = Handlebars.compile(sourceTodoTemplate);
			// this.footerTemplate = Handlebars.compile($('#footer-template').html());
			var sourcefooterTemplate = document.getElementById('footer-template').innerHTML;
			this.footerTemplate = Handlebars.compile(sourcefooterTemplate);
			this.bindEvents();

      new Router({
				'/:filter': function (filter) {
					this.filter = filter;
					this.render();
				}.bind(this)
			}).init('/all');      
		},
		bindEvents: function () {
			// $('#new-todo').on('keyup', this.create.bind(this));
			document.querySelector('#new-todo').addEventListener('keyup', this.create.bind(this));
			// $('#toggle-all').on('change', this.toggleAll.bind(this));
			document.querySelector('#toggle-all').addEventListener('change', this.toggleAll.bind(this));
			// $('#footer').on('click', '#clear-completed', this.destroyCompleted.bind(this));
			document.querySelector('#footer').addEventListener('click', function(event) {
				if (event.target.id === 'clear-completed') {
					App.destroyCompleted.apply(App);
				}
			});
			$('#todo-list')
				.on('change', '.toggle', this.toggle.bind(this))
				.on('dblclick', 'label', this.edit.bind(this))
				.on('keyup', '.edit', this.editKeyup.bind(this))
				.on('focusout', '.edit', this.update.bind(this))
				.on('click', '.destroy', this.destroy.bind(this));
		},
		render: function () {
			var todos = this.getFilteredTodos();
			// $('#todo-list').html(this.todoTemplate(todos));
			document.querySelector('#todo-list').innerHTML = this.todoTemplate(todos);
			// $('#main').toggle(todos.length > 0);
			var mainElement = document.querySelector('#main')
				if(todos.length > 0){
					mainElement.style.display = 'block';
				} else if (todos.length <= 0){
					mainElement.style.display = 'none';
			}
			// $('#toggle-all').prop('checked', this.getActiveTodos().length === 0);
			var toggleAllElement = document.querySelector('#toggle-all')
				if(this.getActiveTodos().length === 0){
					toggleAllElement.checked = true;
				} else {
					toggleAllElement.checked = false;
				}

			this.renderFooter();
			// $('#new-todo').focus();
			document.querySelector('#new-todo').focus();
			util.store('todos-jquery', this.todos);
		},
		renderFooter: function () {
			var todoCount = this.todos.length;
			var activeTodoCount = this.getActiveTodos().length;
			var template = this.footerTemplate({
				activeTodoCount: activeTodoCount,
				activeTodoWord: util.pluralize(activeTodoCount, 'item'),
				completedTodos: todoCount - activeTodoCount,
				filter: this.filter
			});

			$('#footer').toggle(todoCount > 0).html(template);
			var footer = document.querySelector('#footer')
				if(todoCount > 0){
					footer.style.display = 'block';
				} else {
					footer.style.display = 'none';
			}
			footer.innerHTML = template;
		},
		toggleAll: function (e) {
			var isChecked = $(e.target).prop('checked');

			this.todos.forEach(function (todo) {
				todo.completed = isChecked;
			});

			this.render();
		},
		getActiveTodos: function () {
			return this.todos.filter(function (todo) {
				return !todo.completed;
			});
		},
		getCompletedTodos: function () {
			return this.todos.filter(function (todo) {
				return todo.completed;
			});
		},
		getFilteredTodos: function () {
			if (this.filter === 'active') {
				return this.getActiveTodos();
			}

			if (this.filter === 'completed') {
				return this.getCompletedTodos();
			}

			return this.todos;
		},
		destroyCompleted: function () {
			this.todos = this.getActiveTodos();
			this.filter = 'all';
			this.render();
		},
		// accepts an element from inside the `.item` div and
		// returns the corresponding index in the `todos` array
		indexFromEl: function (el) {
			// var id = $(el).closest('li').data('id');
			var targetLi = el.closest('li');
			var id = targetLi.dataset.id;
			var todos = this.todos;
			var i = todos.length;

			while (i--) {
				if (todos[i].id === id) {
					return i;
				}
			}
		},
		create: function (e) {
      // var $input = $(e.target);
      var input = e.target
			// var val = $input.val().trim();
      var val = input.value.trim()
			if (e.which !== ENTER_KEY || !val) {
				return;
			}

			this.todos.push({
				id: util.uuid(),
				title: val,
				completed: false
			});

      // input.val('');
      input.value = '';

			this.render();
		},
		toggle: function (e) {
      var i = this.indexFromEl(e.target);
			this.todos[i].completed = !this.todos[i].completed;
			this.render();
		},
		edit: function (e) { //puts the view in edit mode for the selected todo
      // var $input = $(e.target).closest('li').addClass('editing').find('.edit');
      var li = e.target.closest('li'); // li = closest parent 'li' element to what was clicked. 
			li.className = 'editing'; // add css ".editing" class to the selected li
			var input = li.querySelector('.edit');//input = within the li defined above, the element with an ".edit" class. 
			// $input.val($input.val()).focus();
			input.focus();// show a clicking cursor on the input
		},
		editKeyup: function (e) { //when in edit mode, when user presses a key...
			if (e.which === ENTER_KEY) { // if the entered key is "Enter", then blur (take the cursor out of the target element) 
				e.target.blur();
			}

			if (e.which === ESCAPE_KEY) { // if the entered key is "Escape", then set the key and value of data to 'abort', true and blur (take the cursor out of the target element) 
				// $(e.target).data('abort', true).blur();
				e.target.dataset.abort = true;
				e.target.blur();
			}
		},
		update: function (e) {
			var el = e.target;
			// var $el = $(el);
			// var val = $el.val().trim();
			var val = el.value
			val.trim();

			if (!val) {
				this.destroy(e);
				return;
			}

			// if ($el.data('abort')) {
				if (el.dataset.abort) {
				// $el.data('abort', false);
				el.dataset.abort = false;
			} else {
				this.todos[this.indexFromEl(el)].title = val;
			}

			this.render();
		},
		destroy: function (e) {
			this.todos.splice(this.indexFromEl(e.target), 1);
			this.render();
		}
	};

	App.init();
});