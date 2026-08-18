@feature:notepad-switching
Feature: Switching notepads

  Todos live in a notepad, and exactly one notepad is open at a time. The list
  on screen is that notepad's list — the rest are elsewhere, not hidden further
  down.

  Switching is rare and deliberate. Capture is not: the box at the top never
  asks which notepad was meant, because whatever is open is the answer.

  Background:
    Given the app is open
    And the notepads are:
      | My list |
      | Home    |
    And the open notepad is named "My list"

  @rule:switch-shows-only-that-notepad
  Rule: The open notepad's todos are the only ones on screen

    Example: two notepads, one visible at a time
      Given the list reads:
        | Call the bank |
      When I open the notepad "Home"
      Then the list is empty
      When I add "Water plants"
      Then the list reads:
        | Water plants |
      When I open the notepad "My list"
      Then the list reads:
        | Call the bank |
      And the open notepad is named "My list"

  @rule:capture-goes-to-the-open-notepad
  Rule: A new todo lands in the notepad on screen, without being asked

    Example: typing into the box while "Home" is open
      Given I open the notepad "Home"
      When I add "Buy milk"
      Then the list reads:
        | Buy milk |
      When I open the notepad "My list"
      Then the list is empty
