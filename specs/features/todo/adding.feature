@feature:todo-adding
Feature: Adding a todo

  A todo is created from one line of text typed into the box at the top of the
  list. Nothing else creates todos.

  Background:
    Given the app is open

  @rule:add-goes-to-top @planned
  Rule: A new todo goes to the top of the list

    Example: adding to an empty list
      When I add "Buy milk"
      Then the list reads:
        | Buy milk |

    Example: adding above what is already there
      Given the list reads:
        | Call the bank |
      When I add "Buy milk"
      Then the list reads:
        | Buy milk      |
        | Call the bank |

  @rule:add-clears-the-box @planned
  Rule: The box is emptied once the todo is added

    Example: the box is ready for the next one
      When I add "Buy milk"
      Then the box is empty

  @rule:add-rejects-blank @planned
  Rule: Blank text does not become a todo

    Example: pressing Enter on an empty box
      When I submit ""
      Then the list is empty

    Example: submitting only spaces
      When I submit "   "
      Then the list is empty
