@feature:notepad-renaming
Feature: Renaming a notepad

  A name typed in a hurry is a name typed wrong, and the name is the only thing
  telling one notepad from another. Renaming changes what it is called and
  nothing else — same todos, same order, same ticks.

  Background:
    Given the app is open
    And the open notepad is named "Home"
    And the list reads:
      | Water plants |
      | Buy milk     |

  @planned
  @rule:rename-keeps-the-todos
  Rule: Renaming changes the name and leaves the todos alone

    Example: "Home" turns out to mean "House"
      Given I tick "Buy milk"
      When I rename the open notepad to "House"
      Then the open notepad is named "House"
      And the list reads:
        | Water plants |
        | Buy milk     |
      And "Buy milk" is shown as done

  @planned
  @rule:rename-rejects-blank
  Rule: A blank name is not a rename

    Example: submitting only spaces
      When I rename the open notepad to "   "
      Then the open notepad is named "Home"
