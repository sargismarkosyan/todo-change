@feature:storage-persistence
Feature: Todos survive a reload

  There is no server. localStorage is the only copy of the data, so anything the
  screen shows must still be there after a refresh.

  @rule:persist-across-reload
  Rule: The list is restored exactly as it was left

    Example: text, order and done state all come back
      Given the list reads:
        | Call the bank |
        | Buy milk      |
      And I tick "Buy milk"
      When I reload the page
      Then the list reads:
        | Call the bank |
        | Buy milk      |
      And "Buy milk" is shown as done

  @rule:persist-deletions
  Rule: A deleted todo stays deleted

    Example: deleting then reloading
      Given the list reads:
        | Buy milk |
      When I delete "Buy milk"
      And I reload the page
      Then the list is empty

  @planned
  @rule:persist-sub-todos
  Rule: Sub-todos come back with their parent, in order and state

    Example: nesting survives a reload
      Given the list reads:
        | Sort out car insurance |
      And "Sort out car insurance" has the sub-todos:
        | Call current insurer |
        | Compare two quotes   |
      And I tick "Call current insurer"
      When I reload the page
      Then "Sort out car insurance" has the sub-todos:
        | Call current insurer |
        | Compare two quotes   |
      And "Call current insurer" is shown as done
      And "Sort out car insurance" is shown as unfinished
