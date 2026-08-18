@feature:storage-books-migration
Feature: Notepads saved before books existed

  Version 0003 saved notepads of todos under "todo-change.notepads". Every one
  of those has to open as a book of recipes: the notepad becomes the book, each
  todo becomes a recipe of the same name, and a todo's sub-todos become that
  recipe's method. Nothing had ingredients, so nothing gets any.

  Done state has nowhere to go. A recipe is not finished, so the ticks are read
  and dropped rather than carried into a field that means nothing. This is the
  first thing a migration in this app throws away, and it is thrown away on
  purpose — see ../../changes/0004-recipe-book.md.

  @planned
  @rule:old-notepads-open-as-books
  Rule: A saved notepad opens as a book, and its todos as recipes

    Example: a notepad of todos, one of them with steps and ticks
      Given "todo-change.books" is not set
      And "todo-change.notepads" holds:
        | {"notepads": [{"id": "n1", "name": "Dinner", "todos": [{"id": "t1", "text": "Roast chicken", "done": true, "subTodos": [{"id": "s1", "text": "Heat the oven to 200C", "done": true}]}]}], "openId": "n1"} |
      When I open the app
      Then the open book is named "Dinner"
      And the contents reads:
        | Roast chicken |
      When I open the recipe "Roast chicken"
      Then "Roast chicken" shows the method:
        | Heat the oven to 200C |
      And "Roast chicken" shows no ingredients
      And nothing on screen offers a tick box

    Example: the notepads key is moved, not copied
      Given "todo-change.books" is not set
      And "todo-change.notepads" holds:
        | {"notepads": [{"id": "n1", "name": "Dinner", "todos": []}], "openId": "n1"} |
      When I open the app
      Then "todo-change.notepads" is not set
      When I reload the page
      Then the open book is named "Dinner"
