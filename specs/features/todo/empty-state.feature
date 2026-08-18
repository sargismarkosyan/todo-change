@feature:todo-empty-state
Feature: The empty list

  An empty list should say it is empty, rather than showing a blank panel that
  looks like something failed to load.

  Background:
    Given the app is open

  @rule:empty-state-on-first-visit
  Rule: A list with nothing in it explains itself

    Example: opening the app for the first time
      Given the list is empty
      Then I see the message "Nothing to do yet."

  @rule:empty-state-returns
  Rule: The message comes back when the last todo goes

    Example: deleting the only todo
      Given the list reads:
        | Buy milk |
      When I delete "Buy milk"
      Then I see the message "Nothing to do yet."
