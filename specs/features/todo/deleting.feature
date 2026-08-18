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

  @planned
  @rule:delete-parent-deletes-sub-todos
  Rule: Deleting a parent takes its sub-todos with it

    Example: the whole group goes at once
      Given the list reads:
        | Sort out car insurance |
      And "Sort out car insurance" has the sub-todos:
        | Call current insurer |
        | Compare two quotes   |
      When I delete "Sort out car insurance"
      Then the list is empty
