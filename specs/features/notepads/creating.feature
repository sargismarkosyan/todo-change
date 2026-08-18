@feature:notepad-creating
Feature: Making a new notepad

  A notepad is made by naming it, and it opens straight away — so the reason it
  was made is still in mind when the first todo goes into it.

  Background:
    Given the app is open
    And the open notepad is named "My list"
    And the list reads:
      | Call the bank |

  @rule:create-notepad-opens-it-empty
  Rule: A new notepad opens immediately, with nothing in it

    Example: starting a notepad for things at home
      When I make a notepad called "Home"
      Then the open notepad is named "Home"
      And the list is empty
      And I see the message "Nothing to do yet."

    Example: the notepad it was made from is untouched
      Given I make a notepad called "Home"
      When I open the notepad "My list"
      Then the list reads:
        | Call the bank |

  @rule:notepad-rejects-blank-name
  Rule: A notepad cannot be made without a name

    Example: submitting only spaces
      When I make a notepad called "   "
      Then the notepads are:
        | My list |
      And the open notepad is named "My list"
