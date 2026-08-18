@feature:todo-completing
Feature: Completing a todo

  Ticking a todo records that it is done. Done is a state, not a deletion — the
  todo stays in place, struck through, so a glance down the list separates what
  is left from what is finished.

  Background:
    Given the app is open
    And the list reads:
      | Buy milk |

  @rule:complete-marks-done @planned
  Rule: Ticking a todo marks it done, with a line through the text

    Example: ticking the checkbox
      When I tick "Buy milk"
      Then "Buy milk" is shown as done
      And "Buy milk" has a line through it

  @rule:complete-is-reversible @planned
  Rule: Unticking a todo makes it unfinished again

    Example: changing my mind
      Given I tick "Buy milk"
      When I untick "Buy milk"
      Then "Buy milk" is shown as unfinished
      And "Buy milk" has no line through it

  @rule:complete-keeps-position @planned
  Rule: Completing a todo does not move it

    Example: a done todo stays where it was
      Given the list reads:
        | Call the bank |
        | Buy milk      |
      When I tick "Call the bank"
      Then the list reads:
        | Call the bank |
        | Buy milk      |
