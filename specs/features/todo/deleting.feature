@feature:todo-deleting
Feature: Deleting a todo

  Deleting removes a todo for good. There is no undo in this version.

  Background:
    Given the app is open

  @rule:delete-removes-only-that-one
  Rule: Deleting removes exactly the todo asked for

    Example: deleting the middle of three
      Given the list reads:
        | Call the bank |
        | Buy milk      |
        | Water plants  |
      When I delete "Buy milk"
      Then the list reads:
        | Call the bank |
        | Water plants  |

  @rule:delete-works-on-done-todos
  Rule: A done todo can be deleted like any other

    Example: clearing something finished
      Given the list reads:
        | Buy milk |
      And I tick "Buy milk"
      When I delete "Buy milk"
      Then the list is empty
